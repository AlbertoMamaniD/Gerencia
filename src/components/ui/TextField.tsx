import { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { fontFamily, makeStyles, maxFontScale, radius, spacing, touchTarget, useTheme } from '@/theme';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  prefix?: string;
  suffix?: string;
  error?: string | null;
  helperText?: string;
}

/** Campo de texto con etiqueta visible, ayuda y error anunciados al lector de pantalla. */
export function TextField({ label, prefix, suffix, error, helperText, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const description = error ?? helperText;

  return (
    <View style={styles.container}>
      <AppText variant="caption" tone="secondary" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.field, { borderColor }, focused && styles.fieldFocused]}>
        {prefix ? (
          <AppText variant="bodyStrong" tone="muted">
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={description ?? undefined}
          aria-invalid={!!error}
          maxFontSizeMultiplier={maxFontScale}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {suffix ? (
          <AppText variant="small" tone="muted">
            {suffix}
          </AppText>
        ) : null}
      </View>
      {description ? (
        <AppText
          variant="small"
          tone={error ? 'danger' : 'muted'}
          style={styles.description}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
        >
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    gap: spacing.xs + 2,
  },
  label: {
    marginLeft: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surfaceMuted,
  },
  fieldFocused: {
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: theme.colors.text,
  },
  description: {
    marginLeft: 2,
  },
}));
