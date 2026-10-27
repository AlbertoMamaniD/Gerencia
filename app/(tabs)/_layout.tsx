/**
 * AhorraTech - Tabs Layout
 * Barra de navegación inferior en Modo Claro de alto contraste con safe areas
 * dinámicas para Android (sin colisión con barra de 3 botones) e iconos perfectamente visibles.
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
        tabBarActiveTintColor: colors.brand.electricBlue,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 10,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitoreo',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={22}
                color={focused ? colors.brand.electricBlue : colors.text.muted}
              />
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
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <Feather
                name="dollar-sign"
                size={20}
                color={focused ? colors.brand.electricBlue : colors.text.muted}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : styles.iconPill}>
              <Feather
                name="sliders"
                size={20}
                color={focused ? colors.brand.electricBlue : colors.text.muted}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  activeIconPill: {
    backgroundColor: 'rgba(29, 78, 216, 0.10)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.status.danger,
    fontSize: 10,
    fontWeight: '800',
  },
});
