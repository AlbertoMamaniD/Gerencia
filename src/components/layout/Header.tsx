/**
 * AhorraTech - Header Component
 * Barra superior con logotipo oficial e indicador de enlace ESP32 + PZEM-004T en línea.
 * Diseño limpio en Modo Claro profesional.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { AhorraTechLogo } from '../brand/AhorraTechLogo';
import { useEnergyStore } from '../../store/useEnergyStore';
import { headerStyles } from '../../styles/header.styles';
import { colors } from '../../theme/colors';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightAction?: {
    iconName: keyof typeof Feather.glyphMap;
    onPress: () => void;
    accessibilityLabel?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
  rightAction,
}) => {
  const isConnected = useEnergyStore((s) => s.connection.isConnected);
  const isPolling = useEnergyStore((s) => s.connection.isPolling);

  // Animación de pulso LED con Reanimated
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const ledAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isConnected && isPolling ? pulseOpacity.value : 1,
  }));

  const getLedColor = () => {
    return isConnected ? colors.status.success : colors.status.danger;
  };

  const getStatusLabel = () => {
    return isConnected ? 'ESP32 EN LÍNEA' : 'DESCONECTADO';
  };

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.leftSection}>
        {showLogo ? (
          <AhorraTechLogo size="md" showSubtitle={!!subtitle} />
        ) : (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text.primary }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 11, color: colors.text.secondary, marginTop: 1 }}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={headerStyles.rightSection}>
        <View style={headerStyles.statusPill}>
          <Animated.View
            style={[
              headerStyles.ledDot,
              { backgroundColor: getLedColor() },
              ledAnimatedStyle,
            ]}
          />
          <Text style={[headerStyles.statusText, { color: getLedColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>

        {rightAction && (
          <TouchableOpacity
            style={headerStyles.actionButton}
            onPress={rightAction.onPress}
            activeOpacity={0.88}
            accessibilityLabel={rightAction.accessibilityLabel || 'Acción'}
          >
            <Feather name={rightAction.iconName} size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
