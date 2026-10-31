import { Pressable, View } from 'react-native';
import { makeStyles, radius, spacing, touchTarget, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

interface BannerProps {
  tone: BannerTone;
  title: string;
  message?: string;
  onDismiss?: () => void;
  testID?: string;
}

const ICONS: Record<BannerTone, IconName> = {
  info: 'information-outline',
  success: 'check-circle-outline',
  warning: 'alert-outline',
  danger: 'alert-octagon-outline',
};

export function Banner({ tone, title, message, onDismiss, testID }: BannerProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const map: Record<BannerTone, { bg: string; fg: string }> = {
    info: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const { bg, fg } = map[tone];
  const urgent = tone === 'danger' || tone === 'warning';

  return (
    <View
      testID={testID}
      style={[styles.banner, { backgroundColor: bg, borderColor: fg }]}
      accessibilityRole={urgent ? 'alert' : 'summary'}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
    >
      <Icon name={ICONS[tone]} size={22} color={fg} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={fg}>
          {title}
        </AppText>
        {message ? (
          <AppText variant="small" tone="default">
            {message}
          </AppText>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={`Cerrar aviso: ${title}`}
          hitSlop={8}
          style={styles.close}
        >
          <Icon name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  close: {
    width: touchTarget - 8,
    height: touchTarget - 8,
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
