/**
 * AhorraTech - LiveGaugeChart Component
 * Medidor circular tipo Donut (Gifted Charts) para visualizar el consumo de presupuesto en Bolivianos (Bs).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { colors } from '../../theme/colors';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface LiveGaugeChartProps {
  currentCostBs: number;
  monthlyBudgetBs: number;
  consumedPct: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

export const LiveGaugeChart: React.FC<LiveGaugeChartProps> = ({
  currentCostBs,
  monthlyBudgetBs,
  consumedPct,
  isOverBudget,
  isWarning,
}) => {
  const getGaugeColor = (): string => {
    if (isOverBudget) return colors.status.danger;
    if (isWarning) return colors.status.warning;
    return colors.brand.telemetryCyan;
  };

  const getStatusText = (): string => {
    if (isOverBudget) return 'PRESUPUESTO EXCEDIDO';
    if (isWarning) return 'CERCA DEL LÍMITE (80%)';
    return 'DENTRO DEL PRESUPUESTO';
  };

  const clampedPct = Math.min(100, Math.max(0, consumedPct));
  const remainingPct = Math.max(0, 100 - clampedPct);

  const pieData = [
    {
      value: clampedPct,
      color: getGaugeColor(),
      focused: true,
    },
    {
      value: remainingPct,
      color: 'rgba(30, 45, 74, 0.45)',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <PieChart
          donut
          data={pieData}
          radius={88}
          innerRadius={68}
          backgroundColor={colors.background.card}
          centerLabelComponent={() => (
            <View style={styles.centerLabelContainer}>
              <Text style={[styles.percentageText, { color: getGaugeColor() }]}>
                {formatPercentage(consumedPct)}
              </Text>
              <Text style={styles.spentLabel}>Gastado</Text>
              <Text style={styles.amountText}>{formatCurrency(currentCostBs)}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: getGaugeColor() }]} />
          <Text style={[styles.statusText, { color: getGaugeColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        <Text style={styles.budgetLimitText}>
          Límite: <Text style={styles.budgetHighlight}>{formatCurrency(monthlyBudgetBs)}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  spentLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  budgetLimitText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  budgetHighlight: {
    fontWeight: '700',
    color: colors.text.primary,
  },
});
