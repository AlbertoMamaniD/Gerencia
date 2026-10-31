/**
 * Datos derivados para la interfaz: proyección financiera y serie semanal.
 */

import { useMemo } from 'react';
import { calculateFinancialProjection } from '@/domain/billing';
import { buildWeeklySeries, getCycleEnergyKWh } from '@/domain/meter';
import { DailyConsumption, FinancialProjection } from '@/domain/types';
import { useEnergyStore } from '@/store/useEnergyStore';

export function useProjection(): FinancialProjection {
  const meterKWh = useEnergyStore((s) => s.ledger.meterKWh);
  const cycleStartKWh = useEnergyStore((s) => s.ledger.cycleStartKWh);
  const budget = useEnergyStore((s) => s.budget);

  return useMemo(
    () =>
      calculateFinancialProjection({
        cycleEnergyKWh: getCycleEnergyKWh({ meterKWh, cycleStartKWh, sensorKWh: null, daily: {} }),
        ratePerKWh: budget.ratePerKWh,
        monthlyBudgetBs: budget.monthlyBudgetBs,
        cycleStartDay: budget.billingCycleStartDay,
        warningThresholdPct: budget.warningThresholdPct,
      }),
    [meterKWh, cycleStartKWh, budget]
  );
}

export function useWeeklySeries(): DailyConsumption[] {
  const daily = useEnergyStore((s) => s.ledger.daily);
  const rate = useEnergyStore((s) => s.budget.ratePerKWh);
  return useMemo(() => buildWeeklySeries(daily, rate), [daily, rate]);
}
