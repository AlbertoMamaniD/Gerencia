import {
  applySensorReading,
  buildWeeklySeries,
  calibrateLedger,
  createDemoDaily,
  createLedger,
  DAILY_RETENTION_DAYS,
  detachSensor,
  getCycleEnergyKWh,
  MAX_PLAUSIBLE_DELTA_KWH,
  MeterLedger,
  resetLedgerCycle,
  toLocalDateKey,
} from '../meter';

const at = (d: number, h = 12) => new Date(2026, 9, d, h, 0, 0);

describe('toLocalDateKey', () => {
  it('usa la fecha local (no UTC)', () => {
    // 21:30 en Bolivia (UTC-4) ya es el día siguiente en UTC; la clave debe ser la local.
    expect(toLocalDateKey(new Date(2026, 9, 31, 21, 30))).toBe('2026-10-31');
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('applySensorReading', () => {
  it('la primera lectura solo fija la base, sin sumar consumo', () => {
    const ledger = applySensorReading(createLedger(100), 5000, at(1));
    expect(ledger.meterKWh).toBe(100);
    expect(ledger.sensorKWh).toBe(5000);
    expect(ledger.daily).toEqual({});
  });

  it('suma la diferencia al medidor y al día', () => {
    let ledger = applySensorReading(createLedger(100), 10, at(1));
    ledger = applySensorReading(ledger, 10.5, at(1));
    ledger = applySensorReading(ledger, 11, at(2));
    expect(ledger.meterKWh).toBe(101);
    expect(ledger.daily['2026-10-01']).toBe(0.5);
    expect(ledger.daily['2026-10-02']).toBe(0.5);
  });

  it('un reinicio del contador del sensor no resta consumo', () => {
    let ledger = applySensorReading(createLedger(100), 50, at(1));
    ledger = applySensorReading(ledger, 2, at(1));
    expect(ledger.meterKWh).toBe(100);
    ledger = applySensorReading(ledger, 3, at(1));
    expect(ledger.meterKWh).toBe(101);
  });

  it('ignora saltos imposibles y lecturas inválidas', () => {
    let ledger = applySensorReading(createLedger(100), 1, at(1));
    ledger = applySensorReading(ledger, 1 + MAX_PLAUSIBLE_DELTA_KWH + 1, at(1));
    expect(ledger.meterKWh).toBe(100);
    const same = applySensorReading(ledger, Number.NaN, at(1));
    expect(same).toBe(ledger);
    expect(applySensorReading(ledger, -3, at(1))).toBe(ledger);
  });

  it('descarta días más antiguos que la retención', () => {
    let ledger: MeterLedger = { ...createLedger(0), sensorKWh: 0, daily: { '2026-08-01': 3 } };
    ledger = applySensorReading(ledger, 1, at(20));
    expect(ledger.daily['2026-08-01']).toBeUndefined();
    expect(Object.keys(ledger.daily).length).toBeLessThanOrEqual(DAILY_RETENTION_DAYS);
  });
});

describe('calibración', () => {
  it('corrige el bug anterior: la calibración sobrevive a las lecturas siguientes', () => {
    let ledger = applySensorReading(createLedger(84.6), 0, at(1));
    ledger = calibrateLedger(ledger, 12345.6);
    ledger = applySensorReading(ledger, 0.2, at(1));
    expect(ledger.meterKWh).toBeCloseTo(12345.8, 4);
  });

  it('conserva el consumo del ciclo al calibrar', () => {
    const ledger = { ...createLedger(0), meterKWh: 84.6, cycleStartKWh: 0 };
    const calibrated = calibrateLedger(ledger, 12345.6);
    expect(getCycleEnergyKWh(calibrated)).toBeCloseTo(84.6, 3);
  });

  it('ignora lecturas inválidas', () => {
    const ledger = createLedger(10);
    expect(calibrateLedger(ledger, -1)).toBe(ledger);
    expect(calibrateLedger(ledger, Number.NaN)).toBe(ledger);
  });
});

describe('ciclo y fuente', () => {
  it('reiniciar el ciclo deja el consumo en cero', () => {
    const ledger = { ...createLedger(0), meterKWh: 50 };
    expect(getCycleEnergyKWh(resetLedgerCycle(ledger))).toBe(0);
  });

  it('el consumo del ciclo nunca es negativo', () => {
    expect(getCycleEnergyKWh({ ...createLedger(0), meterKWh: 5, cycleStartKWh: 10 })).toBe(0);
  });

  it('desconectar el sensor fuerza una nueva base', () => {
    const ledger = detachSensor({ ...createLedger(0), sensorKWh: 99 });
    expect(ledger.sensorKWh).toBeNull();
  });
});

describe('buildWeeklySeries', () => {
  it('genera 7 días terminando en "Hoy" con costo', () => {
    const today = at(31);
    const series = buildWeeklySeries({ '2026-10-31': 2, '2026-10-25': 4 }, 0.85, today);
    expect(series).toHaveLength(7);
    expect(series[6]).toMatchObject({ dayLabel: 'Hoy', energyKWh: 2, costBs: 1.7, isToday: true });
    expect(series[0]).toMatchObject({ date: '2026-10-25', dayLabel: 'Dom', energyKWh: 4 });
    expect(series[1].energyKWh).toBe(0);
  });
});

describe('createDemoDaily', () => {
  it('genera 6 días previos sin incluir hoy, siempre positivos', () => {
    const daily = createDemoDaily(at(31));
    expect(Object.keys(daily)).toHaveLength(6);
    expect(daily['2026-10-31']).toBeUndefined();
    expect(Object.values(daily).every((v) => v > 0)).toBe(true);
  });
});
