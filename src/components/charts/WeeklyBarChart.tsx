/**
 * AhorraTech - WeeklyBarChart Component
 * Gráfico de barras comparativo de los últimos 7 días mostrando consumo en Bolivianos (Bs) y kWh.
 * Optimizado para Modo Claro, responsivo y de alto contraste.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { DailyConsumption } from '../../types/energy.types';
import { colors } from '../../theme/colors';
import { formatCurrency, formatEnergy } from '../../utils/formatters';

interface WeeklyBarChartProps {
  data: DailyConsumption[];
  dailyBudgetBs: number;
  chartWidth?: number;
}

const DEFAULT_WIDTH = Dimensions.get('window').width - 64;

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  data,
  dailyBudgetBs,
  chartWidth,
}) => {
  const actualWidth = chartWidth && chartWidth > 100 ? chartWidth : DEFAULT_WIDTH;

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sin registros históricos de los últimos 7 días.</Text>
      </View>
    );
  }

  const totalCost = data.reduce((acc, curr) => acc + curr.costBs, 0);
  const totalEnergy = data.reduce((acc, curr) => acc + curr.energyKWh, 0);

  const barData = data.map((item) => {
    const isAboveTarget = dailyBudgetBs > 0 && item.costBs > dailyBudgetBs;
    return {
      value: item.costBs,
      label: item.dayLabel,
      frontColor: isAboveTarget ? colors.status.warning : colors.brand.electricBlue,
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{item.costBs.toFixed(1)}</Text>
      ),
    };
  });

  const maxVal = Math.max(...data.map((d) => d.costBs), dailyBudgetBs || 10);
  const barSpacing = Math.max(10, Math.floor((actualWidth - 7 * 22) / 8));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Historial Semanal (7 Días)</Text>
          <Text style={styles.subtitle}>Gasto acumulado por jornada en Bs</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryTotalText}>{formatCurrency(totalCost)}</Text>
          <Text style={styles.summaryKWhText}>{formatEnergy(totalEnergy)}</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <BarChart
          data={barData}
          width={actualWidth}
          height={140}
          barWidth={22}
          spacing={barSpacing}
          roundedTop
          roundedBottom={false}
          hideRules={false}
          rulesColor={colors.border.subtle}
          rulesType="dashed"
          xAxisColor={colors.border.subtle}
          yAxisColor="transparent"
          yAxisTextStyle={styles.axisLabel}
          xAxisLabelTextStyle={styles.axisLabel}
          maxValue={Math.ceil(maxVal * 1.25)}
          noOfSections={3}
          showReferenceLine1={dailyBudgetBs > 0}
          referenceLine1Position={dailyBudgetBs}
          referenceLine1Config={{
            color: colors.status.warning,
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
            labelText: 'Meta diaria',
            labelTextStyle: styles.refLineText,
          }}
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.brand.electricBlue }]} />
          <Text style={styles.legendText}>En meta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.status.warning }]} />
          <Text style={styles.legendText}>Mayor a meta diaria</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    width: '100%',
  },
  emptyContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    width: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  summaryBadge: {
    alignItems: 'flex-end',
  },
  summaryTotalText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.brand.electricBlue,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  summaryKWhText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  barTopLabel: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  axisLabel: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  refLineText: {
    color: colors.status.warning,
    fontSize: 9,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
