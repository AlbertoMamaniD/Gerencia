import { OcrError, parseGeminiResponse, recognizeMeterReading } from '../ocr/meterOcrService';

const gemini = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });
const response = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as unknown as Response;

describe('parseGeminiResponse', () => {
  it('lee kWh, serie y confianza', () => {
    expect(parseGeminiResponse(gemini('{"is_meter":true,"kwh":12345.67,"serial":" CRE-123 ","confidence":97}'))).toEqual({
      detectedKWh: 12345.67,
      meterSerial: 'CRE-123',
      confidence: 97,
    });
  });

  it('acepta markdown, kWh como texto y confianza 0..1', () => {
    const r = parseGeminiResponse(gemini('```json\n{"is_meter":true,"kwh":"184,6","serial":null,"confidence":0.91}\n```'));
    expect(r).toEqual({ detectedKWh: 184.6, meterSerial: null, confidence: 91 });
  });

  it('rechaza fotos que no son medidores', () => {
    expect(() => parseGeminiResponse(gemini('{"is_meter":false}'))).toThrow(
      expect.objectContaining({ code: 'not_a_meter' })
    );
  });

  it('nunca inventa lecturas', () => {
    expect(() => parseGeminiResponse(gemini('{"is_meter":true,"kwh":null}'))).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseGeminiResponse(gemini('no es json'))).toThrow(expect.objectContaining({ code: 'unreadable' }));
    expect(() => parseGeminiResponse({})).toThrow(expect.objectContaining({ code: 'server' }));
  });
});

describe('recognizeMeterReading', () => {
  const ok = response(gemini('{"is_meter":true,"kwh":100,"confidence":95}'));

  it('sin clave pide lectura manual', async () => {
    await expect(recognizeMeterReading({ base64Image: 'x', apiKey: '' })).rejects.toMatchObject({ code: 'not_configured' });
  });

  it('sin imagen falla con mensaje claro', async () => {
    await expect(recognizeMeterReading({ base64Image: '', apiKey: 'k' })).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('envía la clave en el encabezado y no en la URL', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(ok);
    const r = await recognizeMeterReading({ base64Image: 'img', apiKey: 'SECRET', fetchImpl, models: ['m1'] });
    expect(r).toMatchObject({ detectedKWh: 100, provider: 'gemini', model: 'm1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).not.toContain('SECRET');
    expect(init.headers['x-goog-api-key']).toBe('SECRET');
  });

  it('prueba el siguiente modelo si uno no existe o falla el servidor', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(ok);
    const r = await recognizeMeterReading({ base64Image: 'img', apiKey: 'k', fetchImpl, models: ['a', 'b', 'c'] });
    expect(r.model).toBe('c');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('si todos los modelos fallan devuelve el último error', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({}, 404));
    await expect(recognizeMeterReading({ base64Image: 'img', apiKey: 'k', fetchImpl, models: ['a', 'b'] })).rejects.toBeInstanceOf(OcrError);
  });

  it('cuota agotada, error 400, red y tiempo de espera', async () => {
    const run = (fetchImpl: jest.Mock) => recognizeMeterReading({ base64Image: 'img', apiKey: 'k', fetchImpl, models: ['a'] });
    await expect(run(jest.fn().mockResolvedValue(response({}, 429)))).rejects.toMatchObject({ code: 'quota' });
    await expect(run(jest.fn().mockResolvedValue(response({}, 400)))).rejects.toMatchObject({ code: 'server' });
    await expect(run(jest.fn().mockRejectedValue(new TypeError('net')))).rejects.toMatchObject({ code: 'network' });
    const abort = Object.assign(new Error('a'), { name: 'AbortError' });
    await expect(run(jest.fn().mockRejectedValue(abort))).rejects.toMatchObject({ code: 'timeout' });
  });

  it('una foto que no es medidor se informa sin reintentar', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(gemini('{"is_meter":false}')));
    await expect(
      recognizeMeterReading({ base64Image: 'img', apiKey: 'k', fetchImpl, models: ['a', 'b'] })
    ).rejects.toMatchObject({ code: 'not_a_meter' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
