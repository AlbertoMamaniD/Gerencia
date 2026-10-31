import {
  parseDecimal,
  validateBudget,
  validateCycleStartDay,
  validateHost,
  validateMaxPower,
  validateMeterReading,
  validateRate,
} from '../validation';

describe('parseDecimal', () => {
  it.each([
    ['0,85', 0.85],
    ['0.85', 0.85],
    [' 180 ', 180],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['12.', 12],
    [',5', 0.5],
    ['-3', -3],
  ])('"%s" → %s', (raw, expected) => {
    expect(parseDecimal(raw)).toBeCloseTo(expected, 6);
  });

  it.each(['', '   ', 'abc', '1,2,3x', '--1', '1e5'])('"%s" es inválido', (raw) => {
    expect(parseDecimal(raw)).toBeNull();
  });

  it('rechaza valores no string', () => {
    expect(parseDecimal(undefined as unknown as string)).toBeNull();
  });
});

describe('validadores de formulario', () => {
  it('presupuesto con mensajes claros', () => {
    expect(validateBudget('250')).toEqual({ ok: true, value: 250 });
    expect(validateBudget('5')).toEqual({ ok: false, error: 'El presupuesto debe estar entre 10 Bs y 100000 Bs.' });
    expect(validateBudget('')).toEqual({ ok: false, error: 'Ingresa el presupuesto con un número válido.' });
  });

  it('tarifa acepta coma decimal (antes se ignoraba en silencio)', () => {
    expect(validateRate('0,92')).toEqual({ ok: true, value: 0.92 });
    expect(validateRate('0').ok).toBe(false);
  });

  it('día de ciclo entero entre 1 y 28', () => {
    expect(validateCycleStartDay('15')).toEqual({ ok: true, value: 15 });
    expect(validateCycleStartDay('29').ok).toBe(false);
    expect(validateCycleStartDay('2,5')).toEqual({ ok: false, error: 'El día de inicio debe ser un número entero.' });
  });

  it('potencia y lectura', () => {
    expect(validateMaxPower('3500').ok).toBe(true);
    expect(validateMaxPower('50').ok).toBe(false);
    expect(validateMeterReading('12345,6')).toEqual({ ok: true, value: 12345.6 });
    expect(validateMeterReading('-1').ok).toBe(false);
  });
});

describe('validateHost', () => {
  it.each([
    ['192.168.4.1', '192.168.4.1'],
    ['http://192.168.4.1/', '192.168.4.1'],
    ['esp32.local', 'esp32.local'],
    ['10.0.0.5:8080', '10.0.0.5:8080'],
  ])('acepta "%s"', (raw, expected) => {
    expect(validateHost(raw)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['', 'Ingresa la dirección IP del ESP32.'],
    ['192.168.4', 'La IP debe tener 4 números separados por puntos (ej. 192.168.4.1).'],
    ['192.168.4.300', 'Cada número de la IP debe estar entre 0 y 255.'],
    ['10.0.0.5:99999', 'El puerto debe estar entre 1 y 65535.'],
    ['a:b:c', 'La dirección tiene un formato inválido.'],
    ['mi esp', 'Ingresa una IP (ej. 192.168.4.1) o un nombre de host válido.'],
  ])('rechaza "%s"', (raw, error) => {
    expect(validateHost(raw)).toEqual({ ok: false, error });
  });
});
