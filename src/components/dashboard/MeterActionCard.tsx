import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, IconCircle } from '@/components/ui';
import { formatEnergy, formatNumber, formatRelativeTime } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface MeterActionCardProps {
  meterKWh: number;
  lastCalibrationTime: number | null;
  ratePerKWh: number;
}

export function MeterActionCard({ meterKWh, lastCalibrationTime, ratePerKWh }: MeterActionCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const hasReading = meterKWh > 0;
  const timeLabel = lastCalibrationTime ? formatRelativeTime(lastCalibrationTime) : 'Sin registrar este mes';

  return (
    <Card style={styles.card} testID="meter-action-card">
      <View style={styles.header}>
        <IconCircle
          name="counter"
          color={colors.primary}
          background={withAlpha(colors.primary, 0.12)}
          size={42}
        />
        <View style={styles.headerText}>
          <AppText variant="title">Tu Medidor de Luz</AppText>
          <AppText variant="caption" tone="secondary">
            Carga tu lectura mensual para proyectar tu cobro exacto de SETAR.
          </AppText>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoCol}>
          <AppText variant="caption" tone="muted">
            Última lectura
          </AppText>
          <AppText variant="bodyStrong" tabular>
            {hasReading ? formatEnergy(meterKWh, 1) : 'Sin datos'}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoCol}>
          <AppText variant="caption" tone="muted">
            Actualización
          </AppText>
          <AppText variant="bodyStrong" tone={lastCalibrationTime ? 'default' : 'secondary'} numberOfLines={1}>
            {timeLabel}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoCol}>
          <AppText variant="caption" tone="muted">
            Tarifa SETAR
          </AppText>
          <AppText variant="bodyStrong" tone="primary" tabular>
            Bs {formatNumber(ratePerKWh, 2)}
          </AppText>
        </View>
      </View>

      <Button
        label="Cargar lectura del medidor"
        icon="camera-outline"
        variant="primary"
        onPress={() => router.push('/(tabs)/scanner')}
        testID="quick-scan-cta"
      />
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
}));
