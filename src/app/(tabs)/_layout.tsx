import { ColorValue, Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, IconName } from '@/components/ui';
import { useEnergyStore } from '@/store/useEnergyStore';
import { compactBreakpoint, fontFamily, useTheme } from '@/theme';

function tabIcon(active: IconName, inactive: IconName) {
  function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Icon name={focused ? active : inactive} size={24} color={String(color)} />;
  }
  return TabBarIcon;
}

export default function TabLayout() {
  const { colors } = useTheme();
  const alertsCount = useEnergyStore((s) => s.alerts.length);
  const compact = useWindowDimensions().width < compactBreakpoint;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 60,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: compact ? 10.5 : 12 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home-lightning-bolt', 'home-lightning-bolt-outline'),
          tabBarBadge: alertsCount > 0 ? alertsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.onDanger, fontFamily: fontFamily.semibold },
          tabBarAccessibilityLabel: alertsCount > 0 ? `Inicio, ${alertsCount} alertas` : 'Inicio',
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{ title: 'Escanear', tabBarIcon: tabIcon('camera', 'camera-outline') }}
      />
      <Tabs.Screen
        name="limits"
        options={{ title: 'Presupuesto', tabBarIcon: tabIcon('wallet', 'wallet-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ajustes', tabBarIcon: tabIcon('cog', 'cog-outline') }}
      />
    </Tabs>
  );
}
