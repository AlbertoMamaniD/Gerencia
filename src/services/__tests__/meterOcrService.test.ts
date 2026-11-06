import { OcrError, parseOcrText, recognizeMeterReading } from '../ocr/meterOcrService';
import { CloudAuthError } from '../cloud/supabaseAuth';

const response = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as unknown as Response;

const session = { accessToken: 'USER_JWT', refreshToken: 'r', expiresAt: 9e9, userId: 'u1' };
const base = {
  base64Image: 'img',
  url: 'https://demo.supabase.co',
  anonKey: 'anon',
  getSession: jest.fn(() => Promise.resolve(session)),
  resetSession: jest.fn(() => Promise.resolve()),
};

describe('parseOcrText', () => {
  it('lee kWh, serie y confianza', () => {
    expect(parseOcrText('{"is_meter":true,"kwh":12345.67,"serial":" CRE-123 ","confidence":97}')).toEqual({
      detectedKWh: 12345.67,
      meterSerial: 'CRE-123',
      confidence: 97,
    });
  });

  it('acepta markdown, kWh como texto y confianza 0..1', () => {
    expect(parseOcrText('```json\n{"is_meter":true,"kwh":"184,6","serial":null,"confidence":0.91}\n```')).toEqual({
      detectedKWh: 184.6,
      meterSerial: null,
      confidence: 91,
    });
  });

  it('procesa tipo de medidor y números con espacios de rodillos', () => {
    expect(
      parseOcrText('{"is_meter":true,"kwh":"01 452.7","serial":"SETAR-99","confidence":95,"meter_type":"analog"}')
    ).toEqual({
      detectedKWh: 1452.7,
      meterSerial: 'SETAR-99',
      confidence: 95,
      meterType: 'analog',
    });
  });

  it('rechaza fotos que no son medidores', () => {
    expect(() => parseOcrText('{"is_meter":false}')).toThrow(expect.objectContaining({ code: 'not_a_meter' }));
  });

  it('nunca inventa lecturas ni acepta valores absurdos', () => {
    expect(() => parseOcrText('{"is_meter":true,"kwh":null}')).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseOcrText('{"is_meter":true,"kwh":1e12}')).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseOcrText('no es json')).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseOcrText('42')).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseOcrText(undefined)).toThrow(expect.objectContaining({ code: 'server' }));
  });
});

describe('recognizeMeterReading (Edge Function)', () => {
  beforeEach(() => {
    base.getSession.mockClear();
    base.resetSession.mockClear();
  });

  it('sin Supabase configurado pide lectura manual', async () => {
    await expect(recognizeMeterReading({ ...base, url: '' })).rejects.toMatchObject({ code: 'not_configured' });
  });

  it('sin imagen falla con mensaje claro', async () => {
    await expect(recognizeMeterReading({ ...base, base64Image: '' })).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('usa el token del usuario (no la anon key) y no envía claves de Gemini', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ model: 'm1', text: '{"is_meter":true,"kwh":100,"confidence":95}' }));
    const r = await recognizeMeterReading({ ...base, fetchImpl });
    expect(r).toMatchObject({ detectedKWh: 100, model: 'm1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://demo.supabase.co/functions/v1/ocr-meter');
    expect(init.headers.Authorization).toBe('Bearer USER_JWT');
    expect(init.body).not.toMatch(/AIza|key/i);
  });

  it('usa el nombre de función configurado (el slug de Supabase no se puede renombrar)', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ text: '{"is_meter":true,"kwh":7}' }));
    await recognizeMeterReading({ ...base, fetchImpl, functionName: 'hyper-endpoint' });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://demo.supabase.co/functions/v1/hyper-endpoint');
  });

  it('reintenta una vez con sesión nueva si el token fue rechazado', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ text: '{"is_meter":true,"kwh":5}' }));
    const r = await recognizeMeterReading({ ...base, fetchImpl });
    expect(r.detectedKWh).toBe(5);
    expect(base.resetSession).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([
    [404, 'not_configured'],
    [503, 'not_configured'],
    [413, 'too_large'],
    [429, 'quota'],
    [500, 'server'],
  ])('HTTP %s → %s', async (status, code) => {
    const fetchImpl = jest.fn().mockResolvedValue(response({}, status));
    await expect(recognizeMeterReading({ ...base, fetchImpl })).rejects.toMatchObject({ code });
  });

  it('red caída, tiempo agotado y fallo de sesión', async () => {
    await expect(
      recognizeMeterReading({ ...base, fetchImpl: jest.fn().mockRejectedValue(new TypeError('net')) })
    ).rejects.toMatchObject({ code: 'network' });

    const abort = Object.assign(new Error('a'), { name: 'AbortError' });
    await expect(recognizeMeterReading({ ...base, fetchImpl: jest.fn().mockRejectedValue(abort) })).rejects.toMatchObject({
      code: 'timeout',
    });

    const offline = jest.fn(() => Promise.reject(new CloudAuthError('x', 'network')));
    await expect(recognizeMeterReading({ ...base, getSession: offline, fetchImpl: jest.fn() })).rejects.toMatchObject({
      code: 'network',
    });

    const disabled = jest.fn(() => Promise.reject(new CloudAuthError('x', 'anonymous_disabled')));
    await expect(recognizeMeterReading({ ...base, getSession: disabled, fetchImpl: jest.fn() })).rejects.toBeInstanceOf(
      OcrError
    );
  });

  it('una foto que no es medidor se informa', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ text: '{"is_meter":false}' }));
    await expect(recognizeMeterReading({ ...base, fetchImpl })).rejects.toMatchObject({ code: 'not_a_meter' });
  });
});

describe('normalizeFunctionSlug', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { normalizeFunctionSlug, DEFAULT_OCR_FUNCTION } = require('@/config/env');
  it.each([
    [undefined, DEFAULT_OCR_FUNCTION],
    ['', DEFAULT_OCR_FUNCTION],
    [' hyper-endpoint ', 'hyper-endpoint'],
    ['../../otra', DEFAULT_OCR_FUNCTION],
    ['ocr meter', DEFAULT_OCR_FUNCTION],
  ])('%s → %s', (input, expected) => {
    expect(normalizeFunctionSlug(input)).toBe(expected);
  });
});
