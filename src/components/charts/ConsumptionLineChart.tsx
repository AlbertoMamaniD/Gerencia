/**
 * AhorraTech - ConsumptionLineChart Component
 * Gráfico de área en tiempo real (últimas 20 lecturas en Watts del ESP32)
 * optimizado para Modo Claro, responsivo y de alto rendimiento.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { LivePowerPoint } from '../../types/energy.types';
import { colors } from '../../theme/colors';
import { formatPower } from '../../utils/formatters';

interface ConsumptionLineChartProps {
  data: LivePowerPoint[];
  maxPowerThresholdW: number;
  chartWidth?: number;
}

const DEFAULT_WIDTH = Dimensions.get('window').width - 64;

export const ConsumptionLineChart: React.FC<ConsumptionLineChartProps> = ({
  data,
  maxPowerThresholdW,
  chartWidth,
}) => {
  const actualWidth = chartWidth && chartWidth > 100 ? chartWidth : DEFAULT_WIDTH;

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Esperando telemetría del sensor...</Text>
      </View>
    );
  }

  // Mapear puntos para gifted-charts
  const chartData = data.map((item, idx) => ({
    value: Math.round(item.power),
    label: idx % 5 === 0 ? item.timeLabel : '',
  }));

  const powerValues = data.map((d) => d.power);
  const currentPower = powerValues[powerValues.length - 1] || 0;
  const maxPower = Math.max(...powerValues, maxPowerThresholdW > 0 ? maxPowerThresholdW * 0.8 : 1000);
  const minPower = Math.min(...powerValues);

  const isOverload = currentPower > maxPowerThresholdW && maxPowerThresholdW > 0;
  const strokeColor = isOverload ? colors.status.danger : colors.brand.electricBlue;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>Potencia en Tiempo Real</Text>
          <Text style={styles.chartSubtitle}>Últimas 20 lecturas continuas (Watts)</Text>
        </View>
        <View style={styles.statsColumn}>
          <Text style={[styles.currentPowerText, { color: strokeColor }]}>
            {formatPower(currentPower)}
          </Text>
          <Text style={styles.minMaxText}>
            Mín: {formatPower(minPower)} | Máx: {formatPower(Math.max(...powerValues))}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          areaChart
          curved
          data={chartData}
          height={150}
          width={actualWidth}
          color={strokeColor}
          thickness={2.5}
          startFillColor={strokeColor}
          endFillColor={colors.background.card}
          startOpacity={0.20}
          endOpacity={0.01}
          initialSpacing={8}
          endSpacing={8}
          noOfSections={3}
          maxValue={Math.ceil(maxPower * 1.15)}
          yAxisColor="transparent"
          xAxisColor={colors.border.subtle}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          rulesColor={colors.border.subtle}
          rulesType="dashed"
          hideDataPoints
          isAnimated={false}
        />
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
    height: 150,
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
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  statsColumn: {
    alignItems: 'flex-end',
  },
  currentPowerText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  minMaxText: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  axisText: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '600',
  },
});
