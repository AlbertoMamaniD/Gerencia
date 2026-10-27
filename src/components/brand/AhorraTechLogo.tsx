/**
 * AhorraTech - Brand Logo Component
 * Logotipo oficial de alta fidelidad: Emblema circular de energía de neón + tipografía FinTech.
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface AhorraTechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  style?: ViewStyle;
}

export const AhorraTechLogo: React.FC<AhorraTechLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  style,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 28, titleSize: 16, subSize: 9 };
      case 'lg':
        return { iconSize: 52, titleSize: 26, subSize: 12 };
      case 'md':
      default:
        return { iconSize: 38, titleSize: 20, subSize: 10 };
    }
  };

  const dim = getDimensions();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/logo.png')}
        style={[styles.logoImage, { width: dim.iconSize, height: dim.iconSize }]}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleWhite, { fontSize: dim.titleSize }]}>Ahorra</Text>
          <Text style={[styles.titleCyan, { fontSize: dim.titleSize }]}>Tech</Text>
        </View>
        {showSubtitle && (
          <Text style={[styles.subtitle, { fontSize: dim.subSize }]}>
            SMART GRID & FINTECH
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    borderRadius: 8,
  },
  textContainer: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWhite: {
    fontWeight: '800',
    color: colors.text.white,
    letterSpacing: -0.3,
  },
  titleCyan: {
    fontWeight: '900',
    color: colors.brand.telemetryCyan,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.text.muted,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -2,
  },
});
