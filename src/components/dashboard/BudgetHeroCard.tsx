import { useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Icon, IconName, ProgressBar } from '@/components/ui';
import { BudgetStatus, FinancialProjection } from '@/domain/types';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { compactBreakpoint, makeStyles, radius, spacing, useTheme } from '@/theme';

interface BudgetHeroCardProps {
  projection: FinancialProjection;
  monthlyBudgetBs: number;
}

const STATUS_COPY: Record<BudgetStatus, { label: string; icon: IconName }> = {
  ok: { label: 'En meta', icon: 'check-circle-outline' },
  warning: { label: 'Cerca del límite', icon: 'alert-outline' },
  exceeded: { label: 'Excedido', icon: 'alert-octagon-outline' },
};

export function BudgetHeroCard({ projection, monthlyBudgetBs }: BudgetHeroCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const compact = useWindowDimensions().width < compactBreakpoint;
  const { status, cycle } = projection;

  const statusColor = { ok: colors.heroSuccess, warning: colors.heroWarning, exceeded: colors.heroDanger }[status];
  const projectedOver = projection.projectedOverBudgetBs > 0;

  return (
    <LinearGradient
      colors={[colors.heroStart, colors.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      testID="budget-hero"
    >
      <View style={styles.topRow}>
        <AppText variant="overline" tone="heroMuted">
          Gasto del ciclo
        </AppText>
        <View style={styles.statusPill} accessibilityLabel={`Estado: ${STATUS_COPY[status].label}`}>
          <Icon name={STATUS_COPY[status].icon} size={14} color={statusColor} />
          <AppText variant="caption" color={statusColor}>
            {STATUS_COPY[status].label}
          </AppText>
        </View>
      </View>

      <View accessible accessibilityLabel={`Gastaste ${formatCurrency(projection.currentCostBs)} de ${formatCurrency(monthlyBudgetBs)}`}>
        <AppText variant="display" tone="hero" tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatCurrency(projection.currentCostBs)}
        </AppText>
        <AppText variant="small" tone="heroMuted">
          de {formatCurrency(monthlyBudgetBs)} · {formatPercentage(projection.budgetConsumedPct)} usado
        </AppText>
      </View>

      <View style={styles.progress}>
        <ProgressBar
          value={projection.budgetConsumedPct}
          color={statusColor}
          trackColor={colors.heroTrack}
          height={10}
          accessibilityLabel="Presupuesto usado"
        />
        <View style={styles.progressLabels}>
          <AppText variant="caption" tone="heroMuted">
            Día {cycle.dayOfCycle} de {cycle.lengthDays}
          </AppText>
          <AppText variant="caption" tone="heroMuted">
            {cycle.daysRemaining === 0
              ? 'Último día del ciclo'
              : cycle.daysRemaining === 1
                ? 'Queda 1 día'
                : `Quedan ${cycle.daysRemaining} días`}
          </AppText>
        </View>
      </View>

      <View style={[styles.stats, compact && styles.statsCompact]}>
        <HeroStat
          compact={compact}
          label="Proyección"
          value={formatCurrency(projection.projectedCostBs)}
          color={projectedOver ? colors.heroWarning : undefined}
          hint={projectedOver ? `+${formatCurrency(projection.projectedOverBudgetBs)}` : 'al cierre'}
        />
        {compact ? null : <View style={styles.separator} />}
        <HeroStat compact={compact} label="Promedio" value={formatCurrency(projection.averageDailyCostBs)} hint="por día" />
        {compact ? null : <View style={styles.separator} />}
        {status === 'exceeded' ? (
          <HeroStat
            compact={compact}
            label="Excedido"
            value={formatCurrency(projection.overBudgetBs)}
            color={colors.heroDanger}
            hint="sobre el límite"
          />
        ) : (
          <HeroStat compact={compact} label="Disponible" value={formatCurrency(projection.remainingBudgetBs)} hint="este ciclo" />
        )}
      </View>
    </LinearGradient>
  );
}

interface HeroStatProps {
  label: string;
  value: string;
  hint: string;
  color?: string;
  /** En pantallas angostas se muestra como fila: etiqueta a la izquierda, valor a la derecha. */
  compact: boolean;
}

function HeroStat({ label, value, hint, color, compact }: HeroStatProps) {
  const styles = useStyles();
  if (compact) {
    return (
      <View style={styles.statRow} accessible accessibilityLabel={`${label}: ${value}, ${hint}`}>
        <AppText variant="small" tone="heroMuted" style={styles.statRowLabel} numberOfLines={1}>
          {label} · {hint}
        </AppText>
        <AppText variant="bodyStrong" tone="hero" color={color} tabular numberOfLines={1}>
          {value}
        </AppText>
      </View>
    );
  }
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}, ${hint}`}>
      <AppText variant="caption" tone="heroMuted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        variant="bodyStrong"
        tone="hero"
        color={color}
        tabular
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </AppText>
      <AppText variant="caption" tone="heroMuted" numberOfLines={1}>
        {hint}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: theme.mode === 'dark' ? 1 : 0,
    borderColor: theme.colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progress: {
    gap: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  stat: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  statsCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statRowLabel: {
    flexShrink: 1,
  },
  separator: {
    width: 1,
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
}));
