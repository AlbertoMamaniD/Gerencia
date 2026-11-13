import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, IconCircle } from '@/components/ui';
import { HouseholdAppliancesSummary } from '@/domain/appliances';
import { formatCurrency, formatEnergy } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface HouseholdHeroCardProps {
  summary: HouseholdAppliancesSummary;
}

export function HouseholdHeroCard({ summary }: HouseholdHeroCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const { totalMonthlyCostBs, totalMonthlyKWh, topConsumer, recommendedSavingsBs } = summary;

  return (
    <LinearGradient
      colors={[colors.heroStart, colors.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      testID="household-hero-card"
    >
      <View style={styles.topRow}>
        <AppText variant="overline" tone="heroMuted">
          Auditor de tu Hogar (Sin Sensores)
        </AppText>
        <View style={styles.tagPill}>
          <AppText variant="caption" color={colors.heroSuccess} style={styles.tagText}>
            Estimado Mensual
          </AppText>
        </View>
      </View>

      <View style={styles.mainCostRow}>
        <AppText variant="display" tone="hero" tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatCurrency(totalMonthlyCostBs)}
        </AppText>
        <AppText variant="small" tone="heroMuted">
          al mes en electrodomésticos · ~{formatEnergy(totalMonthlyKWh, 0)}
        </AppText>
      </View>

      {topConsumer ? (
        <View style={styles.topConsumerBox}>
          <IconCircle
            name={topConsumer.item.icon}
            color={colors.warning}
            background={withAlpha(colors.warning, 0.15)}
            size={32}
          />
          <View style={styles.topConsumerText}>
            <AppText variant="caption" tone="heroMuted">
              Mayor consumo de tu casa ({topConsumer.percentageOfTotal}%)
            </AppText>
            <AppText variant="bodyStrong" tone="hero" numberOfLines={1}>
              {topConsumer.item.name} · {formatCurrency(topConsumer.monthlyCostBs)}/mes
            </AppText>
          </View>
        </View>
      ) : null}

      {recommendedSavingsBs > 0 ? (
        <View style={styles.tipBox}>
          <AppText variant="caption" color={colors.heroSuccess}>
            💡 Consejo: Si cuidas el uso de {topConsumer?.item.name.toLowerCase()}, puedes ahorrar cerca de{' '}
            <AppText variant="caption" color={colors.heroSuccess} style={styles.boldText}>
              {formatCurrency(recommendedSavingsBs)} al mes
            </AppText>
            .
          </AppText>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    backgroundColor: withAlpha(theme.colors.heroSuccess, 0.15),
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: {
    fontWeight: '700',
  },
  mainCostRow: {
    gap: 2,
  },
  topConsumerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: withAlpha(theme.colors.surface, 0.1),
    borderRadius: radius.md,
    padding: spacing.md,
  },
  topConsumerText: {
    flex: 1,
    gap: 2,
  },
  tipBox: {
    backgroundColor: withAlpha(theme.colors.heroSuccess, 0.1),
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  boldText: {
    fontWeight: '700',
  },
}));
