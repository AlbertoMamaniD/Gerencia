/**
 * AhorraTech - BudgetCockpit Component
 * Consola Maestra de Presupuesto & Facturación Residencial en Bolivianos (Bs).
 * Combina en una sola superficie de alta ingeniería el valor actual, meta mensual,
 * micro-gauge SVG de precisión, proyección a fin de ciclo y dock de escaneo de medidor.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FinancialProjection } from '../../types/energy.types';
import { colors } from '../../theme/colors';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { dashboardStyles } from '../../styles/dashboard.styles';

interface BudgetCockpitProps {
  projection: FinancialProjection;
  monthlyBudgetBs: number;
  onOpenScanner: () => void;
}

export const BudgetCockpit: React.FC<BudgetCockpitProps> = ({
  projection,
  monthlyBudgetBs,
  onOpenScanner,
}) => {
  const {
    currentCostBs,
    budgetConsumedPct,
    isOverBudget,
    isWarningBudget,
    projectedCostBs,
    projectedEnergyKWh,
    averageDailyCostBs,
    daysRemainingInCycle,
  } = projection;

  const getStatusColor = (): string => {
    if (isOverBudget) return colors.status.danger;
    if (isWarningBudget) return colors.status.warning;
    return colors.status.success;
  };

  const getStatusBg = (): string => {
    if (isOverBudget) return colors.status.dangerBg;
    if (isWarningBudget) return colors.status.warningBg;
    return colors.status.successBg;
  };

  const getStatusLabel = (): string => {
    if (isOverBudget) return 'EXCEDIDO';
    if (isWarningBudget) return 'ALERTA 80%';
    return 'EN META';
  };

  // Parámetros del Gauge SVG de Precisión
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, budgetConsumedPct));
  const strokeDashoffset = circumference - (circumference * clampedPct) / 100;
  const gaugeColor = getStatusColor();

  const cycleDay = 28 - daysRemainingInCycle;

  return (
    <View style={dashboardStyles.cockpitContainer}>
      <LinearGradient
        colors={['#101A2E', '#080D1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={dashboardStyles.cockpitGradient}
      >
        {/* Barra superior de ciclo y estado */}
        <View style={dashboardStyles.cockpitTopRow}>
          <View style={dashboardStyles.cycleChip}>
            <View style={dashboardStyles.cycleChipDot} />
            <Text style={dashboardStyles.cycleChipText}>
              CICLO ACTIVO · DÍA {cycleDay > 0 ? cycleDay : 1} / 28
            </Text>
          </View>

          <View style={[dashboardStyles.statusBadge, { backgroundColor: getStatusBg() }]}>
            <View style={[dashboardStyles.statusBadgeDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[dashboardStyles.statusBadgeText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Sección Central FinTech: Importe en Bs + Gauge de Precisión */}
        <View style={dashboardStyles.cockpitHeroRow}>
          <View style={dashboardStyles.heroDataColumn}>
            <Text style={dashboardStyles.heroLabel}>Consumo Acumulado del Mes</Text>
            <View style={dashboardStyles.heroAmountRow}>
              <Text style={dashboardStyles.heroCurrency}>Bs</Text>
              <Text style={dashboardStyles.heroAmount}>
                {currentCostBs.toLocaleString('es-BO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <Text style={dashboardStyles.heroBudgetMeta}>
              de {formatCurrency(monthlyBudgetBs)} límite fijado
            </Text>

            <View style={dashboardStyles.heroProjectionTag}>
              <Feather name="trending-up" size={12} color={colors.brand.telemetryCyan} style={{ marginRight: 4 }} />
              <Text style={dashboardStyles.heroProjectionText}>
                Proyección fin de ciclo: {formatCurrency(projectedCostBs)} (~{projectedEnergyKWh.toFixed(0)} kWh)
              </Text>
            </View>
          </View>

          {/* Micro-Gauge Circular SVG */}
          <View style={dashboardStyles.gaugeContainer}>
            <Svg width={96} height={96} viewBox="0 0 96 96">
              {/* Pista de fondo */}
              <Circle
                cx="48"
                cy="48"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Arco dinámico de progreso */}
              <Circle
                cx="48"
                cy="48"
                r={radius}
                stroke={gaugeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
              />
            </Svg>
            <View style={dashboardStyles.gaugeCenterText}>
              <Text style={[dashboardStyles.gaugePctNumber, { color: gaugeColor }]}>
                {formatPercentage(clampedPct)}
              </Text>
              <Text style={dashboardStyles.gaugePctLabel}>CONSUMO</Text>
            </View>
          </View>
        </View>

        {/* Fila de Estadísticas Integradas (Sin cajitas separadas) */}
        <View style={dashboardStyles.cockpitStatsBar}>
          <View style={[dashboardStyles.statCol, dashboardStyles.statColBorder]}>
            <Text style={dashboardStyles.statLabel}>Ritmo Diario</Text>
            <Text style={dashboardStyles.statValue}>
              {formatCurrency(averageDailyCostBs)}/d
            </Text>
          </View>

          <View style={[dashboardStyles.statCol, dashboardStyles.statColBorder]}>
            <Text style={dashboardStyles.statLabel}>Margen Disponible</Text>
            <Text
              style={[
                dashboardStyles.statValue,
                { color: isOverBudget ? colors.status.danger : colors.status.success },
              ]}
            >
              {isOverBudget
                ? `- ${formatCurrency(projection.projectedOverBudgetBs)}`
                : formatCurrency(Math.max(0, monthlyBudgetBs - currentCostBs))}
            </Text>
          </View>

          <View style={dashboardStyles.statCol}>
            <Text style={dashboardStyles.statLabel}>Días Restantes</Text>
            <Text style={dashboardStyles.statValue}>{daysRemainingInCycle} días</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Ribbon de Calibración Óptica con Escaneo de Medidor */}
      <TouchableOpacity
        style={dashboardStyles.scannerDockButton}
        onPress={onOpenScanner}
        activeOpacity={0.8}
        accessibilityLabel="Escanear Medidor con Foto"
      >
        <View style={dashboardStyles.scannerDockLeft}>
          <View style={dashboardStyles.scannerDockIconWrap}>
            <MaterialCommunityIcons name="camera-metering-center" size={18} color={colors.brand.telemetryCyan} />
          </View>
          <View>
            <Text style={dashboardStyles.scannerDockTitle}>Calibrar Medidor Físico con Foto</Text>
            <Text style={dashboardStyles.scannerDockSubtitle}>Lectura óptica de kWh para sincronizar acumulador</Text>
          </View>
        </View>
        <View style={dashboardStyles.scannerDockBadge}>
          <Text style={dashboardStyles.scannerDockBadgeText}>FOTO OCR</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
