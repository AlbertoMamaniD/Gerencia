import { buildTelemetryUrl, Esp32Error, fetchEsp32Reading, parseEsp32Payload } from '../telemetry/esp32Client';
import { simulateReading } from '../telemetry/simulator';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as unknown as Response;

describe('parseEsp32Payload', () => {
  it('mapea el JSON del firmware (pf como alias)', () => {
    const r = parseEsp32Payload({ voltage: '221.5', current: 3, power: 700, energy: 12.5, frequency: 50, pf: 1.2 }, 1);
    expect(r).toEqual({ voltage: 221.5, current: 3, power: 700, energy: 12.5, frequency: 50, powerFactor: 1, timestamp: 1 });
  });

  it('rechaza datos sin potencia o energía', () => {
    expect(() => parseEsp32Payload({ power: 1 }, 1)).toThrow(Esp32Error);
    expect(() => parseEsp32Payload(null, 1)).toThrow('datos inválidos');
    expect(() => parseEsp32Payload({ power: -5, energy: 1 }, 1)).toThrow(Esp32Error);
  });
});

describe('fetchEsp32Reading', () => {
  it('normaliza la URL', () => {
    expect(buildTelemetryUrl(' http://192.168.4.1/ ')).toBe('http://192.168.4.1/api/telemetry');
  });

  it('devuelve la lectura', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ power: 100, energy: 2 }));
    const r = await fetchEsp32Reading('10.0.0.2', { fetchImpl, now: () => 5 });
    expect(r.power).toBe(100);
    expect(fetchImpl).toHaveBeenCalledWith('http://10.0.0.2/api/telemetry', expect.objectContaining({ method: 'GET' }));
  });

  it('errores HTTP, de red y de tiempo de espera', async () => {
    await expect(fetchEsp32Reading('h', { fetchImpl: jest.fn().mockResolvedValue(jsonResponse({}, 500)) })).rejects.toMatchObject({
      code: 'http',
    });
    await expect(fetchEsp32Reading('h', { fetchImpl: jest.fn().mockRejectedValue(new TypeError('fail')) })).rejects.toMatchObject({
      code: 'network',
    });
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    await expect(fetchEsp32Reading('h', { fetchImpl: jest.fn().mockRejectedValue(abort) })).rejects.toMatchObject({
      code: 'timeout',
    });
  });

  it('JSON ilegible se reporta como payload inválido', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error('x')) });
    await expect(fetchEsp32Reading('h', { fetchImpl })).rejects.toMatchObject({ code: 'payload' });
  });
});

describe('simulateReading', () => {
  const fixedRandom = () => 0.5;

  it('integra energía según potencia e intervalo', () => {
    const r = simulateReading(1, 10, 3_600_000, 0, fixedRandom);
    // 1 hora a r.power W → r.power / 1000 kWh
    expect(r.energy).toBeCloseTo(10 + r.power / 1000, 4);
  });

  it('genera valores eléctricos plausibles y coherentes', () => {
    for (let tick = 0; tick < 60; tick++) {
      const r = simulateReading(tick, 0, 2000, 0, Math.random);
      expect(r.voltage).toBeGreaterThan(215);
      expect(r.voltage).toBeLessThan(225);
      expect(r.powerFactor).toBeGreaterThan(0.9);
      expect(r.powerFactor).toBeLessThanOrEqual(1);
      expect(r.current).toBeCloseTo(r.power / (r.voltage * r.powerFactor), 1);
    }
  });

  it('incluye picos de consumo (microondas)', () => {
    expect(simulateReading(12, 0, 2000, 0, fixedRandom).power).toBeGreaterThan(1000);
    expect(simulateReading(2, 0, 2000, 0, fixedRandom).power).toBeLessThan(500);
  });
});
