import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { AppText, Badge, Card } from '@/components/ui';
import { LivePowerPoint } from '@/domain/types';
import { formatPower } from '@/utils/formatters';
import { fontFamily, makeStyles, spacing, useTheme } from '@/theme';

interface LivePowerCardProps {
  history: LivePowerPoint[];
  currentPowerW: number | null;
  maxPowerW: number;
}

const CHART_HEIGHT = 120;

export function LivePowerCard({ history, currentPowerW, maxPowerW }: LivePowerCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    if (Math.abs(next - width) > 2) setWidth(next);
  };

  const isOverload = currentPowerW !== null && maxPowerW > 0 && currentPowerW > maxPowerW;
  const lineColor = isOverload ? colors.danger : colors.chartLine;
  const values = history.map((p) => p.power);
  const peak = values.length ? Math.max(...values) : 0;
  const low = values.length ? Math.min(...values) : 0;
  // Escala según los datos (no según el límite) para que la curva sea legible.
  const maxValue = Math.max(peak * 1.25, 500);

  // Ancho disponible para el trazo (descontando las etiquetas del eje Y).
  const yAxisWidth = 40;
  const plotWidth = Math.max(0, width - yAxisWidth - spacing.sm);
  const pointSpacing = history.length > 1 ? plotWidth / (history.length - 1) : plotWidth;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title" accessibilityRole="header">
            Potencia ahora
          </AppText>
          <AppText variant="small" tone="muted">
            Últimos {history.length} registros
          </AppText>
        </View>
        {currentPowerW === null ? null : isOverload ? (
          <Badge label="Sobrecarga" tone="danger" icon="alert-octagon-outline" />
        ) : (
          <Badge label="Normal" tone="success" icon="check-circle-outline" />
        )}
      </View>

      <View style={styles.valueRow} accessible accessibilityLabel={`Potencia actual ${currentPowerW === null ? 'sin datos' : formatPower(currentPowerW)}`}>
        <AppText variant="display" color={isOverload ? colors.danger : colors.text} tabular>
          {currentPowerW === null ? '—' : formatPower(currentPowerW)}
        </AppText>
        <AppText variant="small" tone="muted">
          Límite {formatPower(maxPowerW)}
        </AppText>
      </View>

      <View
        style={styles.chartBox}
        onLayout={onLayout}
        accessible
        accessibilityLabel={
          values.length
            ? `Gráfico de potencia. Mínimo ${formatPower(low)}, máximo ${formatPower(peak)}.`
            : 'Gráfico de potencia sin datos todavía.'
        }
      >
        {history.length < 2 || width === 0 ? (
          <View style={styles.placeholder}>
            <AppText variant="small" tone="muted">
              Esperando lecturas del sensor…
            </AppText>
          </View>
        ) : (
          <LineChart
            data={values.map((value) => ({ value: Math.round(value) }))}
            areaChart
            curved
            height={CHART_HEIGHT}
            width={plotWidth}
            spacing={pointSpacing}
            initialSpacing={0}
            endSpacing={0}
            maxValue={maxValue}
            noOfSections={3}
            color={lineColor}
            thickness={2.5}
            startFillColor={lineColor}
            endFillColor={lineColor}
            startOpacity={0.22}
            endOpacity={0.02}
            hideDataPoints
            disableScroll
            isAnimated={false}
            yAxisLabelWidth={yAxisWidth}
            yAxisColor="transparent"
            yAxisThickness={0}
            xAxisColor={colors.chartGrid}
            rulesColor={colors.chartGrid}
            rulesType="dashed"
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: fontFamily.medium }}
            formatYLabel={(label) => (Number(label) >= 1000 ? `${(Number(label) / 1000).toFixed(1)}k` : String(Math.round(Number(label))))}
          />
        )}
      </View>

      {values.length ? (
        <View style={styles.footer}>
          <AppText variant="caption" tone="muted" tabular>
            Mín. {formatPower(low)}
          </AppText>
          <AppText variant="caption" tone="muted" tabular>
            Máx. {formatPower(peak)}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  valueRow: {
    gap: spacing.xxs,
  },
  chartBox: {
    minHeight: CHART_HEIGHT + 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));
