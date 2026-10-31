import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { vibrate } from '@/services/notifications';
import { makeStyles, radius, spacing, touchTarget, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Texto adicional para lectores de pantalla. */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; pressed: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, pressed: colors.surfaceMuted, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.dangerSoft, pressed: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  };
  const tone = palette[variant];

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        vibrate('light');
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? tone.pressed : tone.bg, borderColor: tone.border },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={tone.fg} />
        ) : icon ? (
          <Icon name={icon} size={20} color={tone.fg} />
        ) : null}
        <AppText variant="bodyStrong" color={tone.fg} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  base: {
    minHeight: touchTarget + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
}));
