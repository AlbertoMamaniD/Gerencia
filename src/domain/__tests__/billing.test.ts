import {
  budgetBsToKWh,
  calculateBudgetConsumedPct,
  calculateCostBs,
  calculateFinancialProjection,
  getBillingCycle,
  getBudgetStatus,
  roundTo,
  wattsToAmps,
} from '../billing';

const date = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe('costos básicos', () => {
  it('calcula costo en Bs con 2 decimales', () => {
    expect(calculateCostBs(84.6, 0.85)).toBe(71.91);
    expect(calculateCostBs(0, 0.85)).toBe(0);
    expect(calculateCostBs(-5, 0.85)).toBe(0);
    expect(calculateCostBs(Number.NaN, 0.85)).toBe(0);
  });

  it('convierte presupuesto a kWh', () => {
    expect(budgetBsToKWh(180, 0.85)).toBe(211.76);
    expect(budgetBsToKWh(180, 0)).toBe(0);
    expect(budgetBsToKWh(Number.POSITIVE_INFINITY, 0.85)).toBe(0);
  });

  it('porcentaje consumido nunca negativo ni con presupuesto 0', () => {
    expect(calculateBudgetConsumedPct(90, 180)).toBe(50);
    expect(calculateBudgetConsumedPct(-1, 180)).toBe(0);
    expect(calculateBudgetConsumedPct(50, 0)).toBe(0);
  });

  it('watts a amperios a 220 V', () => {
    expect(wattsToAmps(3500)).toBe(15.9);
    expect(wattsToAmps(0)).toBe(0);
  });

  it('redondea sin errores de coma flotante', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
  });
});

describe('getBillingCycle', () => {
  it('ciclo que empieza el día 1', () => {
    const cycle = getBillingCycle(date(2026, 10, 14), 1);
    expect(cycle.start).toEqual(new Date(2026, 9, 1));
    expect(cycle.end).toEqual(new Date(2026, 10, 1));
    expect(cycle.lengthDays).toBe(31);
    expect(cycle.dayOfCycle).toBe(14);
    expect(cycle.daysRemaining).toBe(17);
  });

  it('corrige el bug anterior: con inicio el 15, el ciclo cruza al mes siguiente', () => {
    // Antes: quedaban 11 días (fin de mes). Correcto: hasta el 14 de noviembre.
    const cycle = getBillingCycle(date(2026, 10, 20), 15);
    expect(cycle.start).toEqual(new Date(2026, 9, 15));
    expect(cycle.end).toEqual(new Date(2026, 10, 15));
    expect(cycle.dayOfCycle).toBe(6);
    expect(cycle.daysRemaining).toBe(25);
  });

  it('si aún no llega el día de inicio, el ciclo empezó el mes anterior', () => {
    const cycle = getBillingCycle(date(2026, 3, 5), 20);
    expect(cycle.start).toEqual(new Date(2026, 1, 20));
    expect(cycle.end).toEqual(new Date(2026, 2, 20));
    expect(cycle.lengthDays).toBe(28);
    expect(cycle.dayOfCycle).toBe(14);
  });

  it('cruza el año correctamente', () => {
    const cycle = getBillingCycle(date(2027, 1, 3), 10);
    expect(cycle.start).toEqual(new Date(2026, 11, 10));
    expect(cycle.end).toEqual(new Date(2027, 0, 10));
  });

  it('último día del ciclo: 0 días restantes', () => {
    const cycle = getBillingCycle(date(2026, 10, 31), 1);
    expect(cycle.dayOfCycle).toBe(31);
    expect(cycle.daysRemaining).toBe(0);
  });

  it('normaliza días de inicio fuera de rango', () => {
    expect(getBillingCycle(date(2026, 10, 14), 0).start).toEqual(new Date(2026, 9, 1));
    expect(getBillingCycle(date(2026, 10, 30), 31).start).toEqual(new Date(2026, 9, 28));
  });
});

describe('calculateFinancialProjection', () => {
  const base = {
    ratePerKWh: 1,
    monthlyBudgetBs: 300,
    cycleStartDay: 1,
    warningThresholdPct: 80,
    referenceDate: date(2026, 10, 10),
  };

  it('proyecta linealmente según el promedio diario', () => {
    const p = calculateFinancialProjection({ ...base, cycleEnergyKWh: 100 });
    expect(p.currentCostBs).toBe(100);
    expect(p.averageDailyCostBs).toBe(10);
    expect(p.projectedCostBs).toBe(310); // 100 + 10 × 21 días restantes
    expect(p.projectedOverBudgetBs).toBe(10);
    expect(p.remainingBudgetBs).toBe(200);
    expect(p.status).toBe('ok');
  });

  it('marca advertencia al superar el umbral', () => {
    expect(calculateFinancialProjection({ ...base, cycleEnergyKWh: 250 }).status).toBe('warning');
  });

  it('marca excedido y calcula el exceso actual', () => {
    const p = calculateFinancialProjection({ ...base, cycleEnergyKWh: 320 });
    expect(p.status).toBe('exceeded');
    expect(p.overBudgetBs).toBe(20);
    expect(p.remainingBudgetBs).toBe(0);
  });

  it('sin presupuesto no hay estado de alerta', () => {
    const p = calculateFinancialProjection({ ...base, monthlyBudgetBs: 0, cycleEnergyKWh: 500 });
    expect(p.status).toBe('ok');
    expect(p.budgetConsumedPct).toBe(0);
  });

  it('tolera energía inválida', () => {
    const p = calculateFinancialProjection({ ...base, cycleEnergyKWh: Number.NaN });
    expect(p.currentCostBs).toBe(0);
    expect(p.projectedCostBs).toBe(0);
  });

  it('usa la fecha actual por defecto', () => {
    const p = calculateFinancialProjection({ ...base, referenceDate: undefined, cycleEnergyKWh: 1 });
    expect(p.cycle.dayOfCycle).toBeGreaterThanOrEqual(1);
  });
});

describe('getBudgetStatus', () => {
  it.each([
    [10, 'ok'],
    [80, 'warning'],
    [99.9, 'warning'],
    [100, 'exceeded'],
  ])('%s%% → %s', (pct, expected) => {
    expect(getBudgetStatus(pct, 80)).toBe(expected);
  });
});
