import { CloudAuthError, getCloudSession } from '../cloud/supabaseAuth';

const res = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: () => Promise.resolve(body) }) as unknown as Response;

function memoryStore(initial: string | null = null) {
  let value = initial;
  return {
    get: jest.fn(async () => value),
    set: jest.fn(async (v: string) => {
      value = v;
    }),
    remove: jest.fn(async () => {
      value = null;
    }),
    peek: () => value,
  };
}

const NOW = 1_800_000_000;
const tokens = (id: string, exp = NOW + 3600) => ({
  access_token: `jwt-${id}`,
  refresh_token: `rt-${id}`,
  expires_at: exp,
  user: { id },
});
const opts = (fetchImpl: jest.Mock, store: ReturnType<typeof memoryStore>) => ({
  url: 'https://demo.supabase.co/',
  anonKey: 'anon',
  fetchImpl,
  store,
  nowSeconds: () => NOW,
});

describe('getCloudSession', () => {
  it('sin configuración no hace llamadas', async () => {
    const fetchImpl = jest.fn();
    await expect(getCloudSession({ ...opts(fetchImpl, memoryStore()), url: '' })).rejects.toMatchObject({
      code: 'not_configured',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('crea una sesión anónima y la guarda', async () => {
    const store = memoryStore();
    const fetchImpl = jest.fn().mockResolvedValue(res(200, tokens('u1')));
    const s = await getCloudSession(opts(fetchImpl, store));
    expect(s).toEqual({ accessToken: 'jwt-u1', refreshToken: 'rt-u1', expiresAt: NOW + 3600, userId: 'u1' });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://demo.supabase.co/auth/v1/signup');
    expect(JSON.parse(store.peek() ?? '{}').userId).toBe('u1');
  });

  it('reutiliza la sesión vigente sin llamar al servidor', async () => {
    const store = memoryStore(JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: NOW + 3600, userId: 'u1' }));
    const fetchImpl = jest.fn();
    expect((await getCloudSession(opts(fetchImpl, store))).accessToken).toBe('a');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('renueva el token cuando está por vencer', async () => {
    const store = memoryStore(JSON.stringify({ accessToken: 'a', refreshToken: 'r-old', expiresAt: NOW + 10, userId: 'u1' }));
    const fetchImpl = jest.fn().mockResolvedValue(res(200, tokens('u1')));
    const s = await getCloudSession(opts(fetchImpl, store));
    expect(fetchImpl.mock.calls[0][0]).toContain('grant_type=refresh_token');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ refresh_token: 'r-old' });
    expect(s.accessToken).toBe('jwt-u1');
  });

  it('si el refresh token fue revocado crea una identidad nueva', async () => {
    const store = memoryStore(JSON.stringify({ accessToken: 'a', refreshToken: 'bad', expiresAt: NOW - 5, userId: 'u1' }));
    const fetchImpl = jest.fn().mockResolvedValueOnce(res(400, {})).mockResolvedValueOnce(res(200, tokens('u2')));
    expect((await getCloudSession(opts(fetchImpl, store))).userId).toBe('u2');
  });

  it('servidor caído al renovar: error sin borrar la sesión', async () => {
    const store = memoryStore(JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: NOW - 5, userId: 'u1' }));
    const fetchImpl = jest.fn().mockResolvedValue(res(503, {}));
    await expect(getCloudSession(opts(fetchImpl, store))).rejects.toMatchObject({ code: 'server' });
    expect(store.remove).not.toHaveBeenCalled();
  });

  it('acceso anónimo deshabilitado en el proyecto', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(422, { error_code: 'anonymous_provider_disabled' }));
    await expect(getCloudSession(opts(fetchImpl, memoryStore()))).rejects.toMatchObject({ code: 'anonymous_disabled' });
  });

  it('sin red y respuestas inválidas', async () => {
    await expect(
      getCloudSession(opts(jest.fn().mockRejectedValue(new TypeError('x')), memoryStore()))
    ).rejects.toBeInstanceOf(CloudAuthError);
    await expect(getCloudSession(opts(jest.fn().mockResolvedValue(res(200, { nope: 1 })), memoryStore()))).rejects.toMatchObject({
      code: 'server',
    });
  });

  it('las llamadas simultáneas comparten una sola solicitud', async () => {
    const store = memoryStore();
    const fetchImpl = jest.fn().mockResolvedValue(res(200, tokens('u1')));
    const [a, b] = await Promise.all([getCloudSession(opts(fetchImpl, store)), getCloudSession(opts(fetchImpl, store))]);
    expect(a).toEqual(b);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('almacenamiento corrupto se trata como sin sesión', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(200, { ...tokens('u3'), expires_at: undefined, expires_in: 3600 }));
    const s = await getCloudSession(opts(fetchImpl, memoryStore('{no json')));
    expect(s.userId).toBe('u3');
    expect(s.expiresAt).toBeGreaterThan(0);
  });
});
