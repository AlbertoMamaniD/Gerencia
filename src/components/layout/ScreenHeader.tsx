import React from 'react';
import { Image, useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/ui';
import { compactBreakpoint, makeStyles, radius, spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  /** Muestra el logotipo de marca (pantalla de inicio). */
  showBrand?: boolean;
}

export function ScreenHeader({ title, subtitle, trailing, showBrand }: ScreenHeaderProps) {
  const styles = useStyles();
  // En pantallas angostas (≤ 360 dp) el indicador de estado pasa a su propia línea.
  const compact = useWindowDimensions().width < compactBreakpoint;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBrand ? (
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            accessibilityIgnoresInvertColors
            accessible={false}
          />
        ) : null}
        <View style={styles.text}>
          {subtitle ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          <AppText variant="h1" accessibilityRole="header" numberOfLines={2}>
            {title}
          </AppText>
        </View>
        {compact ? null : trailing}
      </View>
      {compact && trailing ? <View style={styles.compactTrailing}>{trailing}</View> : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  compactTrailing: {
    flexDirection: 'row',
  },
}));
