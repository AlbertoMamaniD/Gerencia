/**
 * AhorraTech - Button UI Component
 * Botón con variantes, microinteracción táctil mediante expo-haptics y estados de carga.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  iconName?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  iconName,
  loading = false,
  disabled = false,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getBackgroundColor = (): string => {
    if (disabled) return 'rgba(30, 45, 74, 0.5)';
    switch (variant) {
      case 'primary':
        return colors.brand.electricBlue;
      case 'secondary':
        return colors.background.subtle;
      case 'danger':
        return colors.status.danger;
      case 'outline':
        return 'transparent';
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return colors.border.subtle;
    switch (variant) {
      case 'outline':
        return colors.border.highlight;
      case 'secondary':
        return colors.border.subtle;
      default:
        return 'transparent';
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.text.muted;
    switch (variant) {
      case 'outline':
        return colors.brand.electricBlue;
      case 'secondary':
        return colors.text.secondary;
      default:
        return colors.text.white;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {iconName && (
            <Feather
              name={iconName}
              size={18}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text style={[styles.labelText, { color: getTextColor() }, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  icon: {
    marginRight: 8,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
