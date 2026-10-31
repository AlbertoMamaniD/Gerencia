import { Badge } from '@/components/ui';
import { useEnergyStore } from '@/store/useEnergyStore';

/** Estado de la fuente de datos, visible en todas las pantallas. */
export function ConnectionPill() {
  const mode = useEnergyStore((s) => s.connection.mode);
  const isConnected = useEnergyStore((s) => s.status.isConnected);
  const hasError = useEnergyStore((s) => s.status.errorMessage !== null);

  if (mode === 'simulation') return <Badge label="Simulación" tone="primary" icon="flask-outline" />;
  if (isConnected) return <Badge label="En línea" tone="success" icon="wifi" />;
  if (hasError) return <Badge label="Sin conexión" tone="danger" icon="wifi-off" />;
  return <Badge label="Conectando…" tone="neutral" icon="wifi-sync" />;
}
