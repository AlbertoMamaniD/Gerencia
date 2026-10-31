import { BudgetHeroCard } from '@/components/dashboard/BudgetHeroCard';
import { LivePowerCard } from '@/components/dashboard/LivePowerCard';
import { TelemetryGrid } from '@/components/dashboard/TelemetryGrid';
import { WeeklyConsumptionCard } from '@/components/dashboard/WeeklyConsumptionCard';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Banner } from '@/components/ui';
import { roundTo } from '@/domain/billing';
import { useProjection, useWeeklySeries } from '@/hooks/useEnergyInsights';
import { useEnergyStore } from '@/store/useEnergyStore';

export default function DashboardScreen() {
  const liveReading = useEnergyStore((s) => s.liveReading);
  const powerHistory = useEnergyStore((s) => s.powerHistory);
  const meterKWh = useEnergyStore((s) => s.ledger.meterKWh);
  const budget = useEnergyStore((s) => s.budget);
  const alerts = useEnergyStore((s) => s.alerts);
  const status = useEnergyStore((s) => s.status);
  const mode = useEnergyStore((s) => s.connection.mode);
  const dismissAlert = useEnergyStore((s) => s.dismissAlert);

  const projection = useProjection();
  const weekly = useWeeklySeries();
  const dailyTargetBs = roundTo(budget.monthlyBudgetBs / projection.cycle.lengthDays);

  return (
    <Screen
      testID="dashboard-screen"
      header={<ScreenHeader showBrand title="AhorraTech" subtitle="Tu energía hoy" trailing={<ConnectionPill />} />}
    >
      {mode === 'hardware' && status.errorMessage ? (
        <Banner tone="warning" title="Sin conexión con el medidor" message={status.errorMessage} />
      ) : null}

      {alerts.map((alert) => (
        <Banner
          key={alert.id}
          tone={alert.severity === 'critical' ? 'danger' : 'warning'}
          title={alert.title}
          message={alert.message}
          onDismiss={() => dismissAlert(alert.id)}
          testID={`alert-${alert.type}`}
        />
      ))}

      <BudgetHeroCard projection={projection} monthlyBudgetBs={budget.monthlyBudgetBs} />

      <LivePowerCard
        history={powerHistory}
        currentPowerW={liveReading?.power ?? null}
        maxPowerW={budget.maxPowerThresholdW}
      />

      <TelemetryGrid
        reading={liveReading}
        meterKWh={meterKWh}
        cycleKWh={projection.cycleEnergyKWh}
        lastSyncTime={status.lastSyncTime}
      />

      <WeeklyConsumptionCard series={weekly} dailyTargetBs={dailyTargetBs} />
    </Screen>
  );
}
