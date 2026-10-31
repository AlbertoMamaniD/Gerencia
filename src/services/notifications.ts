/**
 * Notificaciones locales (expo-notifications) y vibración (expo-haptics).
 * Todas las llamadas son tolerantes a fallos: en Expo Go o web algunas APIs no existen.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { AlertSeverity } from '@/domain/types';

export const ALERT_CHANNEL_ID = 'energy-alerts';

let handlerConfigured = false;

export async function configureNotifications(accentColor: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerConfigured = true;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
        name: 'Alertas de consumo y presupuesto',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: accentColor,
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (err) {
    console.warn('[notificaciones] configuración no disponible:', err);
  }
}

export async function notify(title: string, body: string, severity: AlertSeverity | 'info' = 'info'): Promise<boolean> {
  vibrate(severity);
  if (Platform.OS === 'web') return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', data: { severity } },
      trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNEL_ID } : null,
    });
    return true;
  } catch (err) {
    console.warn('[notificaciones] no se pudo enviar:', err);
    return false;
  }
}

export function vibrate(kind: AlertSeverity | 'info' | 'success' | 'selection' | 'light'): void {
  const run = (): Promise<void> => {
    switch (kind) {
      case 'critical':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'selection':
        return Haptics.selectionAsync();
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  if (Platform.OS === 'web') return;
  run().catch(() => undefined);
}
