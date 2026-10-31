import React from 'react';
import { View } from 'react-native';
import { makeStyles, spacing } from '@/theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  description?: string;
  trailing?: React.ReactNode;
}

export function SectionHeader({ title, description, trailing }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="h2" accessibilityRole="header">
          {title}
        </AppText>
        {description ? (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
}));
