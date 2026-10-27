/**
 * AhorraTech - Card UI Component
 * Contenedor estilizado con elevación sutil y variantes de borde en Modo Claro.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
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
        return colors.brand.electricBlue;
      default:
        return colors.border.subtle;
    }
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'warning':
        return 'rgba(217, 119, 6, 0.04)';
      case 'critical':
        return 'rgba(220, 38, 38, 0.04)';
      case 'tech':
        return 'rgba(37, 99, 235, 0.03)';
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
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  innerContent: {
    padding: 16,
  },
});
