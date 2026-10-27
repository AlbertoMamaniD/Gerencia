/**
 * AhorraTech - Tabs Layout
 * Barra de navegación inferior con indicador de píldora activa,
 * soporte para Safe Area (sin colisión con botones de Android) y diseño Smart Grid.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEnergyStore } from '../../src/store/useEnergyStore';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  const alertsCount = useEnergyStore((s) => s.activeAlerts.length);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.telemetryCyan,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitoreo',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <MaterialCommunityIcons name="lightning-bolt" size={size + 1} color={color as string} />
            </View>
          ),
          tabBarBadge: alertsCount > 0 ? alertsCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="limits"
        options={{
          title: 'Presupuesto',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <Feather name="dollar-sign" size={size} color={color as string} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <Feather name="sliders" size={size} color={color as string} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#080E1B',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIconPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.status.danger,
    fontSize: 10,
    fontWeight: '800',
  },
});
