import { View } from 'react-native';
import { AppText, Card, IconCircle, IconName, ListRow, SectionHeader } from '@/components/ui';
import { PZEMReading } from '@/domain/types';
import {
  formatCurrent,
  formatEnergy,
  formatFrequency,
  formatPowerFactor,
  formatRelativeTime,
  formatVoltage,
} from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface TelemetryGridProps {
  reading: PZEMReading | null;
  meterKWh: number;
  cycleKWh: number;
  lastSyncTime: number | null;
}

interface TileProps {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  hint: string;
}

function Tile({ icon, color, label, value, hint }: TileProps) {
  const styles = useStyles();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}. ${hint}`}>
      <IconCircle name={icon} color={color} background={withAlpha(color, 0.12)} size={36} />
      <AppText variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </AppText>
      <AppText variant="metric" tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary" numberOfLines={1}>
        {hint}
      </AppText>
    </View>
  );
}

function powerFactorHint(pf: number): string {
  if (pf >= 0.95) return 'Excelente';
  if (pf >= 0.85) return 'Aceptable';
  return 'Bajo (carga inductiva)';
}

function voltageHint(v: number): string {
  if (v === 0) return 'Sin dato';
  // Tolerancia típica de ±10% sobre 220 V.
  if (v < 198) return 'Tensión baja';
  if (v > 242) return 'Tensión alta';
  return 'Normal (220 V)';
}

export function TelemetryGrid({ reading, meterKWh, cycleKWh, lastSyncTime }: TelemetryGridProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const empty = '—';

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Mediciones"
        description={lastSyncTime ? `Actualizado ${formatRelativeTime(lastSyncTime)}` : 'Sin lecturas todavía'}
      />
      <View style={styles.grid}>
        <View style={styles.row}>
          <Tile
            icon="sine-wave"
            color={colors.voltage}
            label="Tensión"
            value={reading ? formatVoltage(reading.voltage) : empty}
            hint={reading ? voltageHint(reading.voltage) : 'Sin dato'}
          />
          <Tile
            icon="current-ac"
            color={colors.current}
            label="Corriente"
            value={reading ? formatCurrent(reading.current) : empty}
            hint="Carga actual"
          />
        </View>
        <View style={styles.row}>
          <Tile
            icon="pulse"
            color={colors.frequency}
            label="Frecuencia"
            value={reading ? formatFrequency(reading.frequency) : empty}
            hint="Red de 50 Hz"
          />
          <Tile
            icon="cosine-wave"
            color={colors.powerFactor}
            label="Factor de potencia"
            value={reading ? formatPowerFactor(reading.powerFactor) : empty}
            hint={reading ? powerFactorHint(reading.powerFactor) : 'Sin dato'}
          />
        </View>
      </View>
      <ListRow
        icon="counter"
        iconColor={colors.primary}
        iconBackground={colors.primarySoft}
        title="Lectura del medidor"
        subtitle={`Consumo del ciclo: ${formatEnergy(cycleKWh)}`}
        trailing={
          <AppText variant="bodyStrong" tabular>
            {formatEnergy(meterKWh, 1)}
          </AppText>
        }
      />
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    gap: spacing.md,
  },
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
}));
