import { Text, TextProps, TextStyle } from 'react-native';
import { maxFontScale, TextVariant, typography, useTheme } from '@/theme';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onPrimary'
  | 'hero'
  | 'heroMuted'
  | 'heroAccent';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  /** Números de ancho fijo: evita que los valores en vivo "bailen". */
  tabular?: boolean;
  color?: string;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  tabular,
  color,
  style,
  maxFontSizeMultiplier = maxFontScale,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const toneColor: Record<TextTone, string> = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
    hero: colors.heroText,
    heroMuted: colors.heroMuted,
    heroAccent: colors.heroAccent,
  };

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        typography[variant],
        { color: color ?? toneColor[tone] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
