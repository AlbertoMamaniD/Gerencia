/**
 * Envía una notificación local cuando aparece una alerta nueva,
 * con un tiempo de espera por tipo para no saturar al usuario.
 */

import { useEffect, useRef } from 'react';
import { notify } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';

export const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export function useAlertNotifications(cooldownMs: number = ALERT_COOLDOWN_MS): void {
  const alerts = useEnergyStore((s) => s.alerts);
  const seenIds = useRef(new Set<string>());
  const lastNotifiedByType = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const alert of alerts) {
      if (seenIds.current.has(alert.id)) continue;
      const last = lastNotifiedByType.current[alert.type] ?? -Infinity;
      if (alert.timestamp - last >= cooldownMs) {
        lastNotifiedByType.current[alert.type] = alert.timestamp;
        void notify(alert.title, alert.message, alert.severity);
      }
    }
    // Solo se recuerdan las alertas vigentes.
    seenIds.current = new Set(alerts.map((a) => a.id));
  }, [alerts, cooldownMs]);
}
