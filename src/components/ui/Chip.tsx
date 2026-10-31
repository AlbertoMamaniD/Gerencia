import { Pressable } from 'react-native';
import { vibrate } from '@/services/notifications';
import { makeStyles, radius, spacing, touchTarget, useTheme } from '@/theme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Opción seleccionable (presets). El estado se comunica con color, borde y accessibilityState. */
export function Chip({ label, selected, onPress, accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => {
        vibrate('selection');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && !selected && styles.pressed]}
    >
      <AppText variant={selected ? 'bodyStrong' : 'body'} color={selected ? colors.onPrimary : colors.text} tabular>
        {label}
      </AppText>
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => ({
  chip: {
    minHeight: touchTarget - 4,
    minWidth: touchTarget + 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
}));
