import { Pressable, View } from 'react-native';
import { vibrate } from '@/services/notifications';
import { makeStyles, radius, spacing, touchTarget, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected ? colors.text : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              vibrate('selection');
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            {option.icon ? <Icon name={option.icon} size={18} color={selected ? colors.primary : fg} /> : null}
            <AppText variant={selected ? 'bodyStrong' : 'body'} color={fg} numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget - 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
}));
