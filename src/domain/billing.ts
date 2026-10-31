/**
 * Cálculos de facturación: ciclo, costos y proyección a fin de ciclo.
 * Funciones puras (sin efectos secundarios) para poder probarlas con fechas fijas.
 */

import { BillingCycle, BudgetStatus, FinancialProjection } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateCostBs(energyKWh: number, ratePerKWh: number): number {
  if (!Number.isFinite(energyKWh) || !Number.isFinite(ratePerKWh)) return 0;
  if (energyKWh <= 0 || ratePerKWh <= 0) return 0;
  return roundTo(energyKWh * ratePerKWh);
}

export function budgetBsToKWh(budgetBs: number, ratePerKWh: number): number {
  if (!Number.isFinite(budgetBs) || !Number.isFinite(ratePerKWh)) return 0;
  if (budgetBs <= 0 || ratePerKWh <= 0) return 0;
  return roundTo(budgetBs / ratePerKWh);
}

export function calculateBudgetConsumedPct(costBs: number, budgetBs: number): number {
  if (!Number.isFinite(costBs) || !Number.isFinite(budgetBs) || budgetBs <= 0) return 0;
  return roundTo((Math.max(0, costBs) / budgetBs) * 100, 1);
}

/** Amperios aproximados para una potencia dada a tensión nominal. */
export function wattsToAmps(watts: number, voltage = 220): number {
  if (!Number.isFinite(watts) || watts <= 0 || voltage <= 0) return 0;
  return roundTo(watts / voltage, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Fecha local a medianoche con el día limitado al largo del mes. */
function cycleAnchor(year: number, month: number, startDay: number): Date {
  const normalized = new Date(year, month, 1);
  const day = Math.min(startDay, daysInMonth(normalized.getFullYear(), normalized.getMonth()));
  return new Date(normalized.getFullYear(), normalized.getMonth(), day);
}

/** Diferencia en días calendario (robusta ante cambios de horario). */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Calcula el ciclo de facturación que contiene `referenceDate`.
 * Un ciclo empieza el día `startDay` de un mes y termina el día anterior al mismo día del mes siguiente.
 */
export function getBillingCycle(referenceDate: Date, startDay: number): BillingCycle {
  const safeStartDay = Math.min(28, Math.max(1, Math.round(startDay) || 1));
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let start = cycleAnchor(year, month, safeStartDay);
  if (calendarDaysBetween(start, referenceDate) < 0) {
    start = cycleAnchor(year, month - 1, safeStartDay);
  }
  const end = cycleAnchor(start.getFullYear(), start.getMonth() + 1, safeStartDay);

  const lengthDays = calendarDaysBetween(start, end);
  const dayOfCycle = calendarDaysBetween(start, referenceDate) + 1;

  return {
    start,
    end,
    lengthDays,
    dayOfCycle,
    daysRemaining: Math.max(0, lengthDays - dayOfCycle),
  };
}

export function getBudgetStatus(consumedPct: number, warningThresholdPct: number): BudgetStatus {
  if (consumedPct >= 100) return 'exceeded';
  if (consumedPct >= warningThresholdPct) return 'warning';
  return 'ok';
}

export interface ProjectionInput {
  cycleEnergyKWh: number;
  ratePerKWh: number;
  monthlyBudgetBs: number;
  cycleStartDay: number;
  warningThresholdPct: number;
  referenceDate?: Date;
}

/**
 * Proyección lineal a fin de ciclo según el ritmo diario promedio.
 */
export function calculateFinancialProjection(input: ProjectionInput): FinancialProjection {
  const {
    cycleEnergyKWh,
    ratePerKWh,
    monthlyBudgetBs,
    cycleStartDay,
    warningThresholdPct,
    referenceDate = new Date(),
  } = input;

  const energy = Number.isFinite(cycleEnergyKWh) ? Math.max(0, cycleEnergyKWh) : 0;
  const cycle = getBillingCycle(referenceDate, cycleStartDay);
  const currentCostBs = calculateCostBs(energy, ratePerKWh);

  const averageDailyCostBs = roundTo(currentCostBs / cycle.dayOfCycle);
  const projectedCostBs = roundTo(currentCostBs + averageDailyCostBs * cycle.daysRemaining);
  const projectedEnergyKWh = ratePerKWh > 0 ? roundTo(projectedCostBs / ratePerKWh) : 0;
  const budgetConsumedPct = calculateBudgetConsumedPct(currentCostBs, monthlyBudgetBs);
  const hasBudget = monthlyBudgetBs > 0;

  return {
    cycleEnergyKWh: roundTo(energy, 3),
    currentCostBs,
    projectedCostBs,
    projectedEnergyKWh,
    budgetConsumedPct,
    remainingBudgetBs: hasBudget ? roundTo(Math.max(0, monthlyBudgetBs - currentCostBs)) : 0,
    overBudgetBs: hasBudget ? roundTo(Math.max(0, currentCostBs - monthlyBudgetBs)) : 0,
    projectedOverBudgetBs: hasBudget ? roundTo(Math.max(0, projectedCostBs - monthlyBudgetBs)) : 0,
    averageDailyCostBs,
    status: hasBudget ? getBudgetStatus(budgetConsumedPct, warningThresholdPct) : 'ok',
    cycle,
  };
}
