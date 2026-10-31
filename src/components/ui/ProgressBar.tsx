import { View } from 'react-native';
import { radius } from '@/theme';

interface ProgressBarProps {
  /** 0 a 100 (se limita automáticamente). */
  value: number;
  color: string;
  trackColor: string;
  height?: number;
  accessibilityLabel: string;
}

export function ProgressBar({ value, color, trackColor, height = 8, accessibilityLabel }: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={{ height, borderRadius: radius.pill, backgroundColor: trackColor, overflow: 'hidden' }}
    >
      <View style={{ width: `${clamped}%`, height: '100%', borderRadius: radius.pill, backgroundColor: color }} />
    </View>
  );
}
