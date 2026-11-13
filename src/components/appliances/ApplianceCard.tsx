import { Pressable, View } from 'react-native';
import { AppText, Card, Icon, IconCircle } from '@/components/ui';
import { ApplianceConsumption, ApplianceItem } from '@/domain/appliances';
import { formatCurrency } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface ApplianceCardProps {
  consumption: ApplianceConsumption;
  onUpdate: (changes: Partial<ApplianceItem>) => void;
  onRemove?: () => void;
}

function formatHours(hours: number): string {
  if (hours <= 0) return '0 min/día';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} min/día`;
  }
  if (hours === 1) return '1 hora/día';
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h/día`;
}

export function ApplianceCard({ consumption, onUpdate, onRemove }: ApplianceCardProps) {
  const { item, monthlyCostBs, percentageOfTotal } = consumption;
  const { colors } = useTheme();
  const styles = useStyles();

  const handleDecreaseHours = () => {
    let next: number;
    if (item.hoursPerDay <= 0.25) {
      next = 0;
    } else if (item.hoursPerDay <= 1) {
      next = Math.max(0, Math.round((item.hoursPerDay - 0.25) * 100) / 100);
    } else {
      next = Math.max(0, Math.round((item.hoursPerDay - 0.5) * 10) / 10);
    }
    onUpdate({ hoursPerDay: next });
  };

  const handleIncreaseHours = () => {
    let next: number;
    if (item.hoursPerDay < 1) {
      next = Math.round((item.hoursPerDay + 0.25) * 100) / 100;
    } else {
      next = Math.min(24, Math.round((item.hoursPerDay + 0.5) * 10) / 10);
    }
    onUpdate({ hoursPerDay: next });
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity <= 1) return;
    onUpdate({ quantity: item.quantity - 1 });
  };

  const handleIncreaseQuantity = () => {
    onUpdate({ quantity: item.quantity + 1 });
  };

  return (
    <Card style={styles.card} testID={`appliance-card-${item.id}`}>
      <View style={styles.header}>
        <IconCircle
          name={item.icon}
          color={colors.primary}
          background={withAlpha(colors.primary, 0.12)}
          size={38}
        />
        <View style={styles.headerInfo}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {item.name}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {item.powerWatts} W · {item.quantity > 1 ? `${item.quantity} unidades` : '1 unidad'}
          </AppText>
        </View>

        <View style={styles.costBadge}>
          <AppText variant="bodyStrong" color={colors.primary} style={styles.costText}>
            {formatCurrency(monthlyCostBs)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {percentageOfTotal}% del total
          </AppText>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.controlGroup}>
          <AppText variant="caption" tone="secondary">
            Uso diario
          </AppText>
          <View style={styles.stepper}>
            <Pressable
              onPress={handleDecreaseHours}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityLabel={`Disminuir horas de ${item.name}`}
              hitSlop={6}
            >
              <Icon name="minus" size={16} color={colors.text} />
            </Pressable>
            <AppText variant="small" style={styles.stepperValue}>
              {formatHours(item.hoursPerDay)}
            </AppText>
            <Pressable
              onPress={handleIncreaseHours}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar horas de ${item.name}`}
              hitSlop={6}
            >
              <Icon name="plus" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <AppText variant="caption" tone="secondary">
            Cantidad
          </AppText>
          <View style={styles.stepper}>
            <Pressable
              onPress={handleDecreaseQuantity}
              style={[styles.stepperButton, item.quantity <= 1 && styles.disabledButton]}
              disabled={item.quantity <= 1}
              accessibilityRole="button"
              accessibilityLabel={`Disminuir cantidad de ${item.name}`}
              hitSlop={6}
            >
              <Icon name="minus" size={16} color={item.quantity <= 1 ? colors.textMuted : colors.text} />
            </Pressable>
            <AppText variant="small" style={styles.stepperValue}>
              {item.quantity}
            </AppText>
            <Pressable
              onPress={handleIncreaseQuantity}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar cantidad de ${item.name}`}
              hitSlop={6}
            >
              <Icon name="plus" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${item.name}`}
            hitSlop={8}
          >
            <Icon name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
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
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  costBadge: {
    alignItems: 'flex-end',
    gap: 2,
  },
  costText: {
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  controlGroup: {
    gap: spacing.xxs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 2,
    gap: spacing.xs,
  },
  stepperButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  stepperValue: {
    minWidth: 70,
    textAlign: 'center',
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.sm,
    alignSelf: 'flex-end',
  },
}));
