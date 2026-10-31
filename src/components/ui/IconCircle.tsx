import { View } from 'react-native';
import { radius } from '@/theme';
import { Icon, IconName } from './Icon';

interface IconCircleProps {
  name: IconName;
  color: string;
  background: string;
  size?: number;
}

export function IconCircle({ name, color, background, size = 40 }: IconCircleProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}
