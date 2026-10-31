/**
 * Envía una notificación local cuando aparece una alerta nueva.
 * - Sobrecarga: como máximo una vez cada 5 minutos.
 * - Presupuesto: una sola vez por ciclo de facturación.
 * El registro se guarda en disco, así abrir la app varias veces no repite el aviso.
 */

import { useEffect, useRef } from 'react';
import { shouldNotifyAlert } from '@/domain/alerts';
import { notify } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';

export const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export function useAlertNotifications(overloadCooldownMs: number = ALERT_COOLDOWN_MS): void {
  const alerts = useEnergyStore((s) => s.alerts);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    for (const alert of alerts) {
      if (seenIds.current.has(alert.id)) continue;
      const store = useEnergyStore.getState();
      if (shouldNotifyAlert(alert, store.alertNotifications[alert.type], store.cycleKey, overloadCooldownMs)) {
        store.markAlertNotified(alert.type, alert.timestamp);
        void notify(alert.title, alert.message, alert.severity);
      }
    }
    // Solo se recuerdan las alertas vigentes.
    seenIds.current = new Set(alerts.map((a) => a.id));
  }, [alerts, overloadCooldownMs]);
}
