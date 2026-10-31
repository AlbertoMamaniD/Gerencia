import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { AppText, Button, Icon } from '@/components/ui';
import { lightTheme, spacing } from '@/theme';

/**
 * Pantalla de error amigable (reemplaza la pantalla roja) con opción de reintentar.
 * Usa el tema claro fijo: puede mostrarse fuera del ThemeProvider.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { colors } = lightTheme;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        padding: spacing.xxl,
        backgroundColor: colors.background,
      }}
    >
      <Icon name="alert-circle-outline" size={48} color={colors.danger} />
      <AppText variant="h2" align="center" color={colors.text} accessibilityRole="header">
        Algo salió mal
      </AppText>
      <AppText variant="body" align="center" color={colors.textSecondary}>
        Ocurrió un error inesperado. Tus datos están a salvo.
      </AppText>
      {__DEV__ ? (
        <AppText variant="caption" align="center" color={colors.textMuted}>
          {error.message}
        </AppText>
      ) : null}
      <Button label="Reintentar" icon="refresh" onPress={() => void retry()} />
    </View>
  );
}
