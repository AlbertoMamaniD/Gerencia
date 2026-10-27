/**
 * AhorraTech - Card UI Component
 * Contenedor estilizado con elevación sutil y variantes de borde según estado.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

export type CardVariant = 'default' | 'warning' | 'critical' | 'tech';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  contentStyle,
}) => {
  const getBorderColor = (): string => {
    switch (variant) {
      case 'warning':
        return colors.border.warning;
      case 'critical':
        return colors.border.danger;
      case 'tech':
        return colors.border.accent;
      default:
        return colors.border.subtle;
    }
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'warning':
        return 'rgba(245, 158, 11, 0.05)';
      case 'critical':
        return 'rgba(239, 68, 68, 0.05)';
      case 'tech':
        return 'rgba(0, 240, 255, 0.04)';
      default:
        return colors.background.card;
    }
  };

  return (
    <View
      style={[
        styles.baseCard,
        {
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    overflow: 'hidden',
  },
  innerContent: {
    padding: 16,
  },
});
