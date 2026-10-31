import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { AppText, Card, SectionHeader } from '@/components/ui';
import { DailyConsumption } from '@/domain/types';
import { formatCurrency, formatEnergy, formatNumber } from '@/utils/formatters';
import { fontFamily, makeStyles, radius, spacing, useTheme } from '@/theme';

interface WeeklyConsumptionCardProps {
  series: DailyConsumption[];
  dailyTargetBs: number;
}

const CHART_HEIGHT = 140;
const Y_AXIS_WIDTH = 32;

export function WeeklyConsumptionCard({ series, dailyTargetBs }: WeeklyConsumptionCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    if (Math.abs(next - width) > 2) setWidth(next);
  };

  const totalCost = series.reduce((sum, d) => sum + d.costBs, 0);
  const totalEnergy = series.reduce((sum, d) => sum + d.energyKWh, 0);
  const hasData = series.some((d) => d.energyKWh > 0);
  const maxValue = Math.max(...series.map((d) => d.costBs), dailyTargetBs, 1) * 1.25;

  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH - spacing.sm);
  const barWidth = Math.max(14, Math.min(28, Math.floor(plotWidth / series.length) - 12));
  const barSpacing = series.length > 0 ? Math.max(6, (plotWidth - barWidth * series.length) / series.length) : 0;

  const summary = series
    .map((d) => `${d.dayLabel}: ${formatEnergy(d.energyKWh)}, ${formatCurrency(d.costBs)}`)
    .join('; ');

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Últimos 7 días"
        description="Gasto diario en bolivianos"
        trailing={
          <View style={styles.totals}>
            <AppText variant="bodyStrong" tabular>
              {formatCurrency(totalCost)}
            </AppText>
            <AppText variant="caption" tone="muted" tabular>
              {formatEnergy(totalEnergy, 1)}
            </AppText>
          </View>
        }
      />

      <View style={styles.chartBox} onLayout={onLayout} accessible accessibilityLabel={`Consumo diario. ${summary}`}>
        {!hasData ? (
          <View style={styles.placeholder}>
            <AppText variant="small" tone="muted" align="center">
              Todavía no hay consumo registrado esta semana.
            </AppText>
          </View>
        ) : width > 0 ? (
          <BarChart
            data={series.map((d) => ({
              value: d.costBs,
              label: d.dayLabel,
              frontColor: dailyTargetBs > 0 && d.costBs > dailyTargetBs ? colors.warning : colors.primary,
            }))}
            width={plotWidth}
            height={CHART_HEIGHT}
            barWidth={barWidth}
            spacing={barSpacing}
            initialSpacing={barSpacing / 2}
            endSpacing={0}
            barBorderTopLeftRadius={6}
            barBorderTopRightRadius={6}
            maxValue={maxValue}
            noOfSections={3}
            disableScroll
            disablePress
            isAnimated={false}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            yAxisColor="transparent"
            yAxisThickness={0}
            xAxisColor={colors.chartGrid}
            rulesColor={colors.chartGrid}
            rulesType="dashed"
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: fontFamily.medium }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontFamily: fontFamily.medium }}
            formatYLabel={(label) => formatNumber(Number(label), 0)}
            showReferenceLine1={dailyTargetBs > 0}
            referenceLine1Position={dailyTargetBs}
            referenceLine1Config={{ color: colors.warning, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
          />
        ) : null}
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Dentro de la meta" shape="square" />
        <LegendItem color={colors.warning} label="Sobre la meta" shape="square" />
        <LegendItem color={colors.warning} label={`Meta ${formatCurrency(dailyTargetBs)}/día`} shape="line" />
      </View>
    </Card>
  );
}

/** Leyenda con forma + texto (no depende solo del color). */
function LegendItem({ color, label, shape }: { color: string; label: string; shape: 'square' | 'line' }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={shape === 'square' ? [styles.legendSquare, { backgroundColor: color }] : [styles.legendLine, { borderColor: color }]} />
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.md,
  },
  totals: {
    alignItems: 'flex-end',
  },
  chartBox: {
    minHeight: CHART_HEIGHT + 32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: radius.sm / 4,
  },
  legendLine: {
    width: 14,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
}));
