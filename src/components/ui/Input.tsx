/**
 * AhorraTech - Input UI Component
 * Campo de texto/numérico optimizado con soporte para unidades prefijo/sufijo (Bs, kWh, W, IP).
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  prefix?: string;
  suffix?: string;
  error?: string | null;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  prefix,
  suffix,
  error,
  helperText,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return colors.status.danger;
    if (isFocused) return colors.brand.telemetryCyan;
    return colors.border.subtle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.inputFocused,
        ]}
      >
        {prefix && <Text style={styles.affixText}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.brand.telemetryCyan}
          {...props}
        />
        {suffix && <Text style={styles.affixText}>{suffix}</Text>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.subtle,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputFocused: {
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
  },
  affixText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.telemetryCyan,
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    height: '100%',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    marginTop: 4,
    marginLeft: 2,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
    marginLeft: 2,
  },
});
