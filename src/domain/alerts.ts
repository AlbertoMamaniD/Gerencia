/**
 * Motor de alertas: evalúa las condiciones (sobrecarga, presupuesto) y reconcilia
 * la lista activa conservando ids, sin repetir alertas que el usuario ya descartó
 * mientras la condición siga vigente.
 */

import { formatCurrency, formatPercentage, formatPower } from '@/utils/formatters';
import { ActiveAlert, AlertSeverity, AlertType } from './types';

export interface AlertConditionInput {
  powerW: number;
  maxPowerW: number;
  consumedPct: number;
  warningThresholdPct: number;
  currentCostBs: number;
  monthlyBudgetBs: number;
}

export interface AlertCondition {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}

export function evaluateAlertConditions(input: AlertConditionInput): AlertCondition[] {
  const conditions: AlertCondition[] = [];

  if (input.maxPowerW > 0 && input.powerW > input.maxPowerW) {
    conditions.push({
      type: 'overload',
      severity: 'critical',
      title: 'Sobrecarga eléctrica',
      message: `La potencia actual (${formatPower(input.powerW)}) supera tu límite de ${formatPower(input.maxPowerW)}. Desconecta algún equipo para evitar que salte la térmica.`,
    });
  }

  if (input.monthlyBudgetBs > 0) {
    if (input.consumedPct >= 100) {
      conditions.push({
        type: 'budget_exceeded',
        severity: 'critical',
        title: 'Presupuesto agotado',
        message: `Llevas ${formatCurrency(input.currentCostBs)} de un presupuesto de ${formatCurrency(input.monthlyBudgetBs)}.`,
      });
    } else if (input.consumedPct >= input.warningThresholdPct) {
      conditions.push({
        type: 'budget_warning',
        severity: 'warning',
        title: 'Cerca de tu límite',
        message: `Ya usaste el ${formatPercentage(input.consumedPct)} de tu presupuesto (${formatCurrency(input.currentCostBs)} de ${formatCurrency(input.monthlyBudgetBs)}).`,
      });
    }
  }

  return conditions;
}

export interface ReconcileResult {
  alerts: ActiveAlert[];
  dismissed: AlertType[];
  /** Alertas que aparecieron en esta evaluación (para notificar). */
  added: ActiveAlert[];
}

export function reconcileAlerts(
  current: ActiveAlert[],
  conditions: AlertCondition[],
  dismissed: AlertType[],
  now: number
): ReconcileResult {
  const activeTypes = new Set(conditions.map((c) => c.type));
  // Un descarte deja de aplicar cuando la condición desaparece.
  const stillDismissed = dismissed.filter((type) => activeTypes.has(type));
  const added: ActiveAlert[] = [];

  const alerts = conditions
    .filter((c) => !stillDismissed.includes(c.type))
    .map((condition) => {
      const existing = current.find((a) => a.type === condition.type);
      if (existing) {
        return { ...existing, title: condition.title, message: condition.message, severity: condition.severity };
      }
      const alert: ActiveAlert = { id: `${condition.type}-${now}`, timestamp: now, ...condition };
      added.push(alert);
      return alert;
    })
    // Primero las críticas.
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));

  return { alerts, dismissed: stillDismissed, added };
}

/** Evita re-renderizar si nada cambió realmente. */
export function alertsEqual(a: ActiveAlert[], b: ActiveAlert[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((alert, i) => alert.id === b[i].id && alert.message === b[i].message);
}
