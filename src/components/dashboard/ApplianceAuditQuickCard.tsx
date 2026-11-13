import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, Icon, IconCircle } from '@/components/ui';
import { calculateHouseholdSummary } from '@/domain/appliances';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatCurrency } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

export function ApplianceAuditQuickCard() {
  const { colors } = useTheme();
  const styles = useStyles();

  const appliances = useEnergyStore((s) => s.appliances);
  const ratePerKWh = useEnergyStore((s) => s.budget.ratePerKWh);

  const summary = calculateHouseholdSummary(appliances, ratePerKWh);
  const { topConsumer, totalMonthlyCostBs } = summary;

  const handlePress = () => {
    router.push('/(tabs)/appliances' as never);
  };

  return (
    <Card style={styles.card} testID="appliance-audit-quick-card">
      <Pressable
        onPress={handlePress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel="Ir al auditor de electrodomésticos"
      >
        <View style={styles.topRow}>
          <IconCircle
            name="lightning-bolt"
            color={colors.primary}
            background={withAlpha(colors.primary, 0.12)}
            size={36}
          />
          <View style={styles.textContainer}>
            <AppText variant="title">¿Quién se come tu luz?</AppText>
            <AppText variant="caption" tone="secondary">
              Auditor de consumo de tus artefactos
            </AppText>
          </View>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.statItem}>
            <AppText variant="caption" tone="muted">
              Gasto en artefactos
            </AppText>
            <AppText variant="bodyStrong" color={colors.primary} style={styles.boldText}>
              ~{formatCurrency(totalMonthlyCostBs)}/mes
            </AppText>
          </View>

          {topConsumer ? (
            <View style={styles.statItemRight}>
              <AppText variant="caption" tone="muted">
                Mayor consumo ({topConsumer.percentageOfTotal}%)
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.topConsumerText}>
                {topConsumer.item.name.split('(')[0].trim()}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  pressable: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xxs,
  },
  statItem: {
    gap: 2,
  },
  statItemRight: {
    gap: 2,
    alignItems: 'flex-end',
    maxWidth: '55%',
  },
  boldText: {
    fontWeight: '700',
  },
  topConsumerText: {
    fontWeight: '600',
  },
}));
