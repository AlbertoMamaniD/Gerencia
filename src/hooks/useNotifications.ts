/**
 * AhorraTech - Notification & Alert Hook
 * Configura canales Android de alta prioridad, gestiona permisos y emite notificaciones
 * con motor de Cooldown anti-spam y feedback háptico.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useEnergyStore } from '../store/useEnergyStore';
import { calculateCostBs, calculateBudgetConsumedPct } from '../utils/calculations';
import { formatCurrency, formatPower } from '../utils/formatters';

// Configurar comportamiento de la notificación en primer plano
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // Ignorar en entornos de desarrollo donde el handler no está disponible
}

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos de cooldown por tipo de alerta

export function useNotifications() {
  const lastAlertTimes = useRef<{ [key: string]: number }>({});

  const power = useEnergyStore((s) => s.liveReading.power);
  const energy = useEnergyStore((s) => s.liveReading.energy);
  const maxPowerThresholdW = useEnergyStore((s) => s.budgetConfig.maxPowerThresholdW);
  const monthlyBudgetBs = useEnergyStore((s) => s.budgetConfig.monthlyBudgetBs);
  const ratePerKWh = useEnergyStore((s) => s.budgetConfig.ratePerKWh);
  const warningThresholdPct = useEnergyStore((s) => s.budgetConfig.warningThresholdPct);

  // Inicializar canales de Android y solicitar permisos (protegido contra limitaciones de Expo Go)
  useEffect(() => {
    async function configureNotifications() {
      try {
        if (Platform.OS === 'android') {
          // Intentar configurar canal nativo de forma segura
          try {
            await Notifications.setNotificationChannelAsync('energy-alerts', {
              name: 'Alertas Eléctricas y Presupuesto',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#2563EB',
              sound: 'default',
            });
          } catch {
            // Silencioso en Expo Go (los canales nativos requieren Development Build / APK nativa)
          }
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync().catch(() => ({ status: 'undetermined' }));
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync().catch(() => {});
        }
      } catch {
        // Ignorar de forma segura en entornos de desarrollo cliente
      }
    }

    configureNotifications();
  }, []);

  const triggerAlert = async (
    type: 'overload' | 'budget_warning' | 'budget_exceeded',
    title: string,
    body: string,
    severity: 'warning' | 'critical'
  ) => {
    const now = Date.now();
    const lastTime = lastAlertTimes.current[type] || 0;

    if (now - lastTime < COOLDOWN_MS) {
      return; // Dentro del cooldown anti-spam
    }

    lastAlertTimes.current[type] = now;

    // Feedback háptico inmediato
    try {
      if (severity === 'critical') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Haptics no soportado en algunas plataformas de emulación
    }

    // Disparar notificación local del sistema
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { type, severity },
        },
        trigger: null, // Inmediata
      });
    } catch (e) {
      console.warn('Error al programar notificación:', e);
    }
  };

  // Monitoreo reactivo de sobrecarga
  useEffect(() => {
    if (power > maxPowerThresholdW && maxPowerThresholdW > 0) {
      triggerAlert(
        'overload',
        '⚠️ ¡ALERTA DE SOBRECARGA!',
        `Potencia de ${formatPower(power)} excede el límite fijado (${formatPower(maxPowerThresholdW)}). Riesgo de salto de térmica.`,
        'critical'
      );
    }
  }, [power, maxPowerThresholdW]);

  // Monitoreo reactivo de presupuesto
  useEffect(() => {
    const currentCostBs = calculateCostBs(energy, ratePerKWh);
    const consumedPct = calculateBudgetConsumedPct(currentCostBs, monthlyBudgetBs);

    if (consumedPct >= 100) {
      triggerAlert(
        'budget_exceeded',
        '🚨 Presupuesto Mensual Agotado',
        `Has alcanzado ${formatCurrency(currentCostBs)} de tu límite de ${formatCurrency(monthlyBudgetBs)} (${consumedPct}%).`,
        'critical'
      );
    } else if (consumedPct >= warningThresholdPct) {
      triggerAlert(
        'budget_warning',
        '⚡ Advertencia de Presupuesto',
        `Has consumido el ${consumedPct}% de tu presupuesto mensual (${formatCurrency(currentCostBs)} / ${formatCurrency(monthlyBudgetBs)}).`,
        'warning'
      );
    }
  }, [energy, ratePerKWh, monthlyBudgetBs, warningThresholdPct]);

  // Función para disparo manual de prueba (usada en Configuración)
  const sendTestNotification = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Prueba de Notificación AhorraTech',
        body: 'El sistema de alertas y el canal de alta prioridad están operativos.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  return { sendTestNotification };
}
