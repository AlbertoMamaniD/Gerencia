import React from 'react';
import { Platform, StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { makeStyles, radius, spacing } from '@/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padded = true, style, ...rest }: CardProps) {
  const styles = useStyles();
  return (
    <View {...rest} style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0B1F33',
        shadowOpacity: theme.mode === 'light' ? 0.06 : 0,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: theme.mode === 'light' ? 1 : 0 },
      default: {},
    }),
  },
  padded: {
    padding: spacing.lg,
  },
}));
