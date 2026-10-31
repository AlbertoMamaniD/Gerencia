import { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText, Icon } from '@/components/ui';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

interface ViewfinderProps {
  imageUri: string | null;
  processing: boolean;
}

export function Viewfinder({ imageUri, processing }: ViewfinderProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (processing && !reduceMotion) {
      progress.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }
  }, [processing, reduceMotion, progress]);

  const laserStyle = useAnimatedStyle(() => ({ top: `${8 + progress.value * 84}%` }));

  return (
    <View
      style={styles.box}
      accessible
      accessibilityLabel={processing ? 'Analizando la foto del medidor' : imageUri ? 'Foto del medidor seleccionada' : 'Aún no hay foto'}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="camera-outline" size={40} color={colors.primary} />
          <AppText variant="small" tone="secondary" align="center">
            Fotografía los números del display de tu medidor
          </AppText>
        </View>
      )}

      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      {processing ? (
        <View style={styles.overlay}>
          {reduceMotion ? null : <Animated.View style={[styles.laser, laserStyle]} />}
          <View style={styles.processingPill}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <AppText variant="caption" color="#FFFFFF">
              Leyendo el medidor…
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const CORNER = 22;

const useStyles = makeStyles((theme) => ({
  box: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: theme.colors.primary,
  },
  topLeft: { top: spacing.md, left: spacing.md, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  topRight: { top: spacing.md, right: spacing.md, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bottomLeft: { bottom: spacing.md, left: spacing.md, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: spacing.md, right: spacing.md, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  overlay: {
    ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const),
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  laser: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.heroAccent,
  },
  processingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
}));
