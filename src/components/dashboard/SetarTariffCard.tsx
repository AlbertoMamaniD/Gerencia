import { View } from 'react-native';
import { AppText, Card, IconCircle, ProgressBar } from '@/components/ui';
import { getSetarBracketStatus, DIGNIDAD_THRESHOLD_KWH, HIGH_CONSUMPTION_THRESHOLD_KWH } from '@/domain/setarTariff';
import { formatCurrency, formatEnergy } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface SetarTariffCardProps {
  cycleEnergyKWh: number;
  ratePerKWh: number;
}

export function SetarTariffCard({ cycleEnergyKWh, ratePerKWh }: SetarTariffCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const bracket = getSetarBracketStatus(cycleEnergyKWh, ratePerKWh);

  const toneColor = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[bracket.tone];

  const toneBg = withAlpha(toneColor, 0.12);

  // Progreso visual relativo al umbral de 300 kWh
  const progressPct = Math.min(100, Math.round((cycleEnergyKWh / HIGH_CONSUMPTION_THRESHOLD_KWH) * 100));

  return (
    <Card style={styles.card} testID="setar-tariff-card">
      <View style={styles.header}>
        <IconCircle
          name={bracket.hasDignidadSubsidy ? 'shield-star-outline' : 'lightning-bolt-circle'}
          color={toneColor}
          background={toneBg}
          size={38}
        />
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <AppText variant="title">Escalón SETAR Tarija</AppText>
            <View style={[styles.badge, { backgroundColor: toneBg }]}>
              <AppText variant="caption" color={toneColor} style={styles.badgeText}>
                {bracket.hasDignidadSubsidy ? '-25% Subsidio' : bracket.type === 'normal' ? 'Bloque 2' : 'Alto Consumo'}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" tone="secondary">
            {formatEnergy(cycleEnergyKWh)} acumulados en el ciclo
          </AppText>
        </View>
      </View>

      <View style={[styles.messageBox, { backgroundColor: withAlpha(toneColor, 0.08) }]}>
        <AppText variant="bodyStrong" color={toneColor}>
          {bracket.title}
        </AppText>
        <AppText variant="small" tone="default">
          {bracket.description}
        </AppText>
        {bracket.hasDignidadSubsidy && bracket.dignidadDiscountBs > 0 ? (
          <AppText variant="caption" color={colors.success} style={styles.savingsHighlight}>
            Ahorro estimado actual por Tarifa Dignidad: ~{formatCurrency(bracket.dignidadDiscountBs)}
          </AppText>
        ) : null}
      </View>

      <View style={styles.barContainer}>
        <ProgressBar
          value={progressPct}
          color={toneColor}
          trackColor={colors.surfaceMuted}
          height={8}
          accessibilityLabel={`Consumo SETAR: ${cycleEnergyKWh} kWh`}
        />
        <View style={styles.scaleLabels}>
          <AppText variant="caption" tone="muted">
            0 kWh
          </AppText>
          <AppText
            variant="caption"
            color={cycleEnergyKWh <= DIGNIDAD_THRESHOLD_KWH ? colors.success : colors.textMuted}
          >
            {DIGNIDAD_THRESHOLD_KWH} kWh (Dignidad)
          </AppText>
          <AppText variant="caption" tone="muted">
            {HIGH_CONSUMPTION_THRESHOLD_KWH} kWh (Límite)
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.sm,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontWeight: '700',
  },
  messageBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  savingsHighlight: {
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  barContainer: {
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));
