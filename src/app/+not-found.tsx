import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Icon } from '@/components/ui';
import { makeStyles, spacing, useTheme } from '@/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Icon name="map-marker-question-outline" size={48} color={colors.textMuted} />
      <AppText variant="h2" align="center" accessibilityRole="header">
        Pantalla no encontrada
      </AppText>
      <AppText variant="body" tone="secondary" align="center">
        La pantalla que buscas no existe o fue movida.
      </AppText>
      <Button label="Ir al inicio" icon="home-outline" onPress={() => router.replace('/')} />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
    backgroundColor: theme.colors.background,
  },
}));
