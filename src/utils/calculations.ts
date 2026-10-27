/**
 * AhorraTech - Pure Mathematical, Electrical and FinTech Calculations
 * Fórmulas sin efectos secundarios, tipado estricto.
 */

import { FinancialProjection } from '../types/energy.types';

/**
 * Convierte potencia en Watts a energía consumida en kWh durante un período en horas.
 */
export function wattsToKWh(watts: number, hours: number): number {
  if (watts <= 0 || hours <= 0) return 0;
  return (watts * hours) / 1000;
}

/**
 * Calcula el costo monetario en Bolivianos (Bs) dado un consumo en kWh y una tarifa en Bs/kWh.
 */
export function calculateCostBs(energyKWh: number, ratePerKWh: number): number {
  if (energyKWh <= 0 || ratePerKWh <= 0) return 0;
  return Number((energyKWh * ratePerKWh).toFixed(2));
}

/**
 * Convierte un monto presupuestado en Bolivianos (Bs) a su equivalente en kWh.
 */
export function budgetBsToKWh(budgetBs: number, ratePerKWh: number): number {
  if (budgetBs <= 0 || ratePerKWh <= 0) return 0;
  return Number((budgetBs / ratePerKWh).toFixed(2));
}

/**
 * Calcula el porcentaje consumido del presupuesto mensual (0% - 100%+).
 */
export function calculateBudgetConsumedPct(costBs: number, budgetBs: number): number {
  if (budgetBs <= 0) return 0;
  return Number(((costBs / budgetBs) * 100).toFixed(1));
}

/**
 * Determina si la potencia actual supera el umbral seguro de sobrecarga del hogar.
 */
export function isPowerOverload(currentWatts: number, maxThresholdW: number): boolean {
  return currentWatts > maxThresholdW && maxThresholdW > 0;
}

/**
 * Realiza la proyección financiera lineal a fin de ciclo de facturación.
 * Considera el día de inicio del ciclo, días transcurridos y tasa de consumo diario.
 */
export function calculateFinancialProjection(
  currentEnergyKWh: number,
  ratePerKWh: number,
  monthlyBudgetBs: number,
  cycleStartDay: number = 1,
  warningThresholdPct: number = 80,
  referenceDate: Date = new Date()
): FinancialProjection {
  const currentCostBs = calculateCostBs(currentEnergyKWh, ratePerKWh);
  const now = referenceDate;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Total de días en el mes actual
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();

  // Días transcurridos dentro del ciclo de facturación
  let daysElapsed = 1;
  let daysRemaining = 29;

  if (currentDay >= cycleStartDay) {
    daysElapsed = Math.max(1, currentDay - cycleStartDay + 1);
    daysRemaining = Math.max(0, daysInMonth - currentDay);
  } else {
    // Si estamos antes del día de inicio, el ciclo inició el mes anterior
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    daysElapsed = Math.max(1, (prevMonthDays - cycleStartDay + 1) + currentDay);
    daysRemaining = Math.max(0, cycleStartDay - currentDay);
  }

  const averageDailyCostBs = Number((currentCostBs / daysElapsed).toFixed(2));
  const projectedRemainingCostBs = averageDailyCostBs * daysRemaining;
  const projectedCostBs = Number((currentCostBs + projectedRemainingCostBs).toFixed(2));
  const projectedEnergyKWh = ratePerKWh > 0 ? Number((projectedCostBs / ratePerKWh).toFixed(2)) : 0;
  const budgetConsumedPct = calculateBudgetConsumedPct(currentCostBs, monthlyBudgetBs);
  const projectedOverBudgetBs = Math.max(0, Number((projectedCostBs - monthlyBudgetBs).toFixed(2)));

  const isOverBudget = currentCostBs >= monthlyBudgetBs && monthlyBudgetBs > 0;
  const isWarningBudget =
    !isOverBudget &&
    monthlyBudgetBs > 0 &&
    budgetConsumedPct >= warningThresholdPct;

  return {
    currentCostBs,
    currentEnergyKWh,
    projectedCostBs,
    projectedEnergyKWh,
    budgetConsumedPct,
    projectedOverBudgetBs,
    daysRemainingInCycle: daysRemaining,
    averageDailyCostBs,
    isOverBudget,
    isWarningBudget,
  };
}
