import { View } from 'react-native';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

/** Etiqueta de estado: siempre combina texto + color (nunca solo color). */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const { bg, fg } = map[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : <View style={[styles.dot, { backgroundColor: fg }]} />}
      <AppText variant="caption" color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    flexShrink: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
}));
