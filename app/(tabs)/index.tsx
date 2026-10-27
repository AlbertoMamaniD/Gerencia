/**
 * AhorraTech - Dashboard Principal
 * Monitoreo de telemetría PZEM-004T en vivo, gasto en Bs, proyección y escáner fotográfico de medidor.
 * Rediseñado con estética de ingeniería industrial y FinTech (sin plantillas genéricas de IA).
 */

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { BudgetCockpit } from '../../src/components/dashboard/BudgetCockpit';
import { TelemetryGrid } from '../../src/components/dashboard/TelemetryGrid';
import { AnalyticsDeck } from '../../src/components/dashboard/AnalyticsDeck';
import { MeterScannerModal } from '../../src/components/scanner/MeterScannerModal';
import { useEnergyStore } from '../../src/store/useEnergyStore';
import { calculateFinancialProjection } from '../../src/utils/calculations';
import { dashboardStyles } from '../../src/styles/dashboard.styles';

export default function DashboardScreen() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Selectores atómicos de Zustand para óptimo rendimiento a 60 FPS
  const liveReading = useEnergyStore((s) => s.liveReading);
  const powerHistory = useEnergyStore((s) => s.powerHistory);
  const dailyHistory = useEnergyStore((s) => s.dailyHistory);
  const budgetConfig = useEnergyStore((s) => s.budgetConfig);
  const activeAlerts = useEnergyStore((s) => s.activeAlerts);
  const dismissAlert = useEnergyStore((s) => s.dismissAlert);

  // Proyección financiera calculada de forma pura
  const projection = useMemo(() => {
    return calculateFinancialProjection(
      liveReading.energy,
      budgetConfig.ratePerKWh,
      budgetConfig.monthlyBudgetBs,
      budgetConfig.billingCycleStartDay,
      budgetConfig.warningThresholdPct
    );
  }, [
    liveReading.energy,
    budgetConfig.ratePerKWh,
    budgetConfig.monthlyBudgetBs,
    budgetConfig.billingCycleStartDay,
    budgetConfig.warningThresholdPct,
  ]);

  const topAlert = activeAlerts[0] ?? null;

  return (
    <ScreenWrapper
      header={
        <Header
          showLogo={true}
          subtitle="Telemetría & Presupuesto en Tiempo Real"
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      }
    >
      {/* Banner de alerta reactivo si se supera el umbral o sobrecarga */}
      {topAlert && (
        <AlertBanner
          visible={true}
          title={topAlert.title}
          message={topAlert.message}
          severity={topAlert.severity}
          onDismiss={() => dismissAlert(topAlert.id)}
        />
      )}

      {/* 1. Consola Maestra de Presupuesto FinTech (Cockpit Unificado) */}
      <BudgetCockpit
        projection={projection}
        monthlyBudgetBs={budgetConfig.monthlyBudgetBs}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* 2. Matriz Integrada de Instrumentación Eléctrica PZEM-004T */}
      <TelemetryGrid
        voltage={liveReading.voltage}
        current={liveReading.current}
        frequency={liveReading.frequency}
        powerFactor={liveReading.powerFactor}
        energy={liveReading.energy}
      />

      {/* 3. Deck de Analíticas Interactivo (Curva en Vivo vs Historial Semanal) */}
      <AnalyticsDeck
        powerHistory={powerHistory}
        dailyHistory={dailyHistory}
        maxPowerThresholdW={budgetConfig.maxPowerThresholdW}
        dailyBudgetBs={budgetConfig.monthlyBudgetBs / 30}
      />

      <View style={dashboardStyles.bottomSpacer} />

      {/* Modal de Escaneo y Calibración Óptica con Cámara */}
      <MeterScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </ScreenWrapper>
  );
}
