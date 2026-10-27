/**
 * AhorraTech - Tabs Layout
 * Barra de navegación inferior en Modo Claro de alto contraste con safe areas
 * dinámicas para Android, iconos Ionicons nítidos y efecto de toque (ripple) suave.
 */

import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
        // Sombreado de toque suave y sutil (reemplaza el sombreado oscuro brusco de Android)
        tabBarButton: ({ ref, ...rest }) => (
          <Pressable
            {...rest}
            android_ripple={{
              color: 'rgba(29, 78, 216, 0.08)',
              borderless: true,
            }}
          />
        ),
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitoreo',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'flash' : 'flash-outline'}
              size={size || 24}
              color={focused ? colors.brand.electricBlue : colors.text.muted}
            />
          ),
          tabBarBadge: alertsCount > 0 ? alertsCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="limits"
        options={{
          title: 'Presupuesto',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size || 24}
              color={focused ? colors.brand.electricBlue : colors.text.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'settings-sharp' : 'settings-outline'}
              size={size || 24}
              color={focused ? colors.brand.electricBlue : colors.text.muted}
            />
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
    elevation: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabIcon: {
    marginBottom: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.status.danger,
    fontSize: 10,
    fontWeight: '800',
  },
});
