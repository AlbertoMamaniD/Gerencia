/**
 * AhorraTech - Badge UI Component
 * Píldoras de estado para telemetría ("CONECTADO", "SIMULACIÓN", "SOBRECARGA", etc.)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  showDot = true,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.status.successBg,
          text: colors.status.success,
          dot: colors.status.success,
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'warning':
        return {
          bg: colors.status.warningBg,
          text: colors.status.warning,
          dot: colors.status.warning,
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 'danger':
        return {
          bg: colors.status.dangerBg,
          text: colors.status.danger,
          dot: colors.status.danger,
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'neutral':
        return {
          bg: 'rgba(148, 163, 184, 0.1)',
          text: colors.text.secondary,
          dot: colors.text.muted,
          border: colors.border.subtle,
        };
      case 'info':
      default:
        return {
          bg: colors.status.infoBg,
          text: colors.brand.telemetryCyan,
          dot: colors.brand.telemetryCyan,
          border: 'rgba(0, 240, 255, 0.3)',
        };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
        },
        style,
      ]}
    >
      {showDot && <View style={[styles.dot, { backgroundColor: scheme.dot }]} />}
      <Text style={[styles.badgeText, { color: scheme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
