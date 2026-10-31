import { alertsEqual, evaluateAlertConditions, reconcileAlerts } from '../alerts';

const base = {
  powerW: 500,
  maxPowerW: 3500,
  consumedPct: 10,
  warningThresholdPct: 80,
  currentCostBs: 18,
  monthlyBudgetBs: 180,
};

describe('evaluateAlertConditions', () => {
  it('sin condiciones no hay alertas', () => {
    expect(evaluateAlertConditions(base)).toEqual([]);
  });

  it('detecta sobrecarga', () => {
    const [alert] = evaluateAlertConditions({ ...base, powerW: 4000 });
    expect(alert.type).toBe('overload');
    expect(alert.severity).toBe('critical');
    expect(alert.message).toContain('4,00');
  });

  it('advertencia y excedido son excluyentes', () => {
    expect(evaluateAlertConditions({ ...base, consumedPct: 85 }).map((a) => a.type)).toEqual(['budget_warning']);
    expect(evaluateAlertConditions({ ...base, consumedPct: 100 }).map((a) => a.type)).toEqual(['budget_exceeded']);
  });

  it('sin presupuesto ni límite no alerta', () => {
    expect(evaluateAlertConditions({ ...base, monthlyBudgetBs: 0, maxPowerW: 0, consumedPct: 500, powerW: 9e9 })).toEqual([]);
  });
});

describe('reconcileAlerts', () => {
  const overload = evaluateAlertConditions({ ...base, powerW: 4000 });
  const both = evaluateAlertConditions({ ...base, powerW: 4000, consumedPct: 85 });

  it('crea alertas nuevas y las reporta como agregadas', () => {
    const r = reconcileAlerts([], overload, [], 1000);
    expect(r.alerts).toHaveLength(1);
    expect(r.added).toHaveLength(1);
    expect(r.alerts[0].id).toBe('overload-1000');
  });

  it('conserva el id de una alerta existente (no notifica dos veces)', () => {
    const first = reconcileAlerts([], overload, [], 1000);
    const second = reconcileAlerts(first.alerts, overload, [], 2000);
    expect(second.alerts[0].id).toBe('overload-1000');
    expect(second.added).toHaveLength(0);
  });

  it('una alerta descartada no reaparece mientras siga la condición', () => {
    const r = reconcileAlerts([], overload, ['overload'], 1000);
    expect(r.alerts).toHaveLength(0);
    expect(r.dismissed).toEqual(['overload']);
  });

  it('el descarte se olvida cuando la condición desaparece', () => {
    const r = reconcileAlerts([], [], ['overload'], 1000);
    expect(r.dismissed).toEqual([]);
  });

  it('ordena las críticas primero', () => {
    const r = reconcileAlerts([], [...both].reverse(), [], 1000);
    expect(r.alerts[0].severity).toBe('critical');
  });

  it('alertsEqual compara ids y mensajes', () => {
    const a = reconcileAlerts([], overload, [], 1).alerts;
    expect(alertsEqual(a, a)).toBe(true);
    expect(alertsEqual(a, [])).toBe(false);
    expect(alertsEqual(a, [{ ...a[0], message: 'otro' }])).toBe(false);
  });
});
