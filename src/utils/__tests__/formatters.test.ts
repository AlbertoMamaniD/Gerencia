import {
  formatCurrency,
  formatCurrent,
  formatDateTime,
  formatEnergy,
  formatFrequency,
  formatLongDate,
  formatNumber,
  formatPercentage,
  formatPower,
  formatPowerFactor,
  formatRelativeTime,
  formatShortTime,
  formatTime,
  formatVoltage,
  toInputValue,
} from '../formatters';

const NBSP = ' ';

describe('formatNumber', () => {
  it('usa punto de miles y coma decimal', () => {
    expect(formatNumber(1234567.891, 2)).toBe('1.234.567,89');
    expect(formatNumber(5, 0)).toBe('5');
    expect(formatNumber(-0.001, 2)).toBe('0,00');
    expect(formatNumber(-12.5, 1)).toBe('-12,5');
    expect(formatNumber(Number.NaN)).toBe('0,00');
  });
});

describe('unidades', () => {
  it('moneda boliviana', () => {
    expect(formatCurrency(1234.5)).toBe(`Bs${NBSP}1.234,50`);
  });

  it('potencia en W y kW', () => {
    expect(formatPower(712.4)).toBe(`712${NBSP}W`);
    expect(formatPower(1250)).toBe(`1,25${NBSP}kW`);
    expect(formatPower(-4)).toBe(`0${NBSP}W`);
  });

  it('energía, tensión, corriente, frecuencia', () => {
    expect(formatEnergy(84.6)).toBe(`84,60${NBSP}kWh`);
    expect(formatEnergy(84.6, 1)).toBe(`84,6${NBSP}kWh`);
    expect(formatVoltage(221.44)).toBe(`221,4${NBSP}V`);
    expect(formatCurrent(3.256)).toBe(`3,26${NBSP}A`);
    expect(formatFrequency(50.06)).toBe(`50,1${NBSP}Hz`);
  });

  it('factor de potencia y porcentaje acotados', () => {
    expect(formatPowerFactor(1.3)).toBe('1,00');
    expect(formatPowerFactor(Number.NaN)).toBe('0,00');
    expect(formatPercentage(39.95)).toBe('40,0%');
    expect(formatPercentage(-5)).toBe('0,0%');
  });
});

describe('fechas', () => {
  const ts = new Date(2026, 9, 27, 14, 5, 9).getTime();

  it('formatea horas y fechas en español', () => {
    expect(formatTime(ts)).toBe('14:05:09');
    expect(formatShortTime(ts)).toBe('14:05');
    expect(formatLongDate(ts)).toBe('27 de octubre');
    expect(formatDateTime(ts)).toBe('27 oct · 14:05');
  });

  it('valores inválidos no rompen', () => {
    expect(formatTime(Number.NaN)).toBe('--:--:--');
    expect(formatShortTime(Number.NaN)).toBe('--:--');
    expect(formatLongDate(Number.NaN)).toBe('');
  });

  it('tiempo relativo', () => {
    const now = ts;
    expect(formatRelativeTime(now - 2000, now)).toBe('ahora');
    expect(formatRelativeTime(now - 30_000, now)).toBe('hace 30 s');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('hace 5 min');
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('hace 3 h');
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe('25 oct · 14:05');
  });
});

describe('toInputValue', () => {
  it('prepara números para campos editables', () => {
    expect(toInputValue(0.85)).toBe('0,85');
    expect(toInputValue(180)).toBe('180');
    expect(toInputValue(3500.4, 0)).toBe('3500');
    expect(toInputValue(Number.NaN)).toBe('');
  });
});
