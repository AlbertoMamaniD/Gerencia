/**
 * AhorraTech - ConsumptionLineChart Component
 * Gráfico de área en tiempo real (últimas 20 lecturas en Watts del ESP32)
 * con gradiente de alta tecnología y optimización para gama media (sin lag en re-renders).
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
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ConsumptionLineChart: React.FC<ConsumptionLineChartProps> = ({
  data,
  maxPowerThresholdW,
}) => {
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
  const strokeColor = isOverload ? colors.status.danger : colors.brand.telemetryCyan;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>Potencia en Vivo (Watts)</Text>
          <Text style={styles.chartSubtitle}>Últimas 20 lecturas continuas</Text>
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
          height={160}
          width={SCREEN_WIDTH - 64}
          color={strokeColor}
          thickness={2.5}
          startFillColor={strokeColor}
          endFillColor={colors.background.card}
          startOpacity={0.35}
          endOpacity={0.02}
          initialSpacing={10}
          endSpacing={10}
          noOfSections={3}
          maxValue={Math.ceil(maxPower * 1.15)}
          yAxisColor="transparent"
          xAxisColor={colors.border.subtle}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          rulesColor={colors.border.subtle}
          rulesType="dashed"
          hideDataPoints
          isAnimated={false} // Evitar re-animaciones bruscas en polling cada 2s
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    height: 160,
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
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  statsColumn: {
    alignItems: 'flex-end',
  },
  currentPowerText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  minMaxText: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  axisText: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '500',
  },
});
