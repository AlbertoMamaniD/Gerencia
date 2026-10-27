/**
 * AhorraTech - AlertBanner UI Component
 * Banner superior reactivo y animado (Reanimated v3) para alertas de sobrecarga o presupuesto.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface AlertBannerProps {
  visible: boolean;
  title: string;
  message: string;
  severity?: 'warning' | 'critical' | 'info';
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  visible,
  title,
  message,
  severity = 'warning',
  onDismiss,
}) => {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(-80, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isCritical = severity === 'critical';
  const bannerColor = isCritical ? colors.status.danger : colors.status.warning;
  const bannerBg = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const iconName = isCritical ? 'alert-octagon' : 'alert-triangle';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bannerBg, borderColor: bannerColor },
        animatedStyle,
      ]}
    >
      <View style={styles.contentRow}>
        <Feather name={iconName} size={22} color={bannerColor} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: bannerColor }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Cerrar alerta"
          >
            <Feather name="x" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 12,
    color: colors.text.primary,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
