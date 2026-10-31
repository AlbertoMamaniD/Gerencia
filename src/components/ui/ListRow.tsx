import React from 'react';
import { View } from 'react-native';
import { makeStyles, spacing } from '@/theme';
import { AppText } from './AppText';
import { IconCircle } from './IconCircle';
import { IconName } from './Icon';

interface ListRowProps {
  icon: IconName;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  divider?: boolean;
}

export function ListRow({ icon, iconColor, iconBackground, title, subtitle, trailing, divider }: ListRowProps) {
  const styles = useStyles();
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <IconCircle name={icon} color={iconColor} background={iconBackground} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
}));
