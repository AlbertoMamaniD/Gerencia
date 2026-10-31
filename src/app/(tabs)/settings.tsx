import { useState } from 'react';
import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Badge, Banner, Button, Card, ListRow, SectionHeader, SegmentedControl, TextField } from '@/components/ui';
import { getSupabaseHost, isOcrConfigured, isSupabaseConfigured } from '@/config/env';
import { ConnectionMode } from '@/domain/types';
import { validateCycleStartDay, validateHost, validateRate } from '@/domain/validation';
import { notify, vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatRelativeTime, toInputValue } from '@/utils/formatters';
import { makeStyles, spacing, ThemePreference, useTheme } from '@/theme';

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const connection = useEnergyStore((s) => s.connection);
  const status = useEnergyStore((s) => s.status);
  const budget = useEnergyStore((s) => s.budget);
  const themePreference = useEnergyStore((s) => s.themePreference);
  const hasDemoData = useEnergyStore((s) => s.hasDemoData);
  const updateConnection = useEnergyStore((s) => s.updateConnection);
  const updateBudget = useEnergyStore((s) => s.updateBudget);
  const setThemePreference = useEnergyStore((s) => s.setThemePreference);
  const resetCycle = useEnergyStore((s) => s.resetCycle);

  const [hostText, setHostText] = useState(connection.host);
  const [rateText, setRateText] = useState(toInputValue(budget.ratePerKWh));
  const [dayText, setDayText] = useState(String(budget.billingCycleStartDay));
  const [showHostError, setShowHostError] = useState(false);
  const [showTariffErrors, setShowTariffErrors] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hostResult = validateHost(hostText);
  const rateResult = validateRate(rateText);
  const dayResult = validateCycleStartDay(dayText);

  const flash = (text: string) => {
    vibrate('success');
    setMessage(text);
  };

  const changeMode = (mode: ConnectionMode) => {
    if (mode === 'hardware' && hasDemoData) {
      Alert.alert(
        'Conectar medidor real',
        'Se borrarán los datos de demostración para empezar a medir tu consumo real. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => updateConnection({ mode }) },
        ]
      );
      return;
    }
    updateConnection({ mode });
  };

  const saveHost = () => {
    setShowHostError(true);
    if (!hostResult.ok) return;
    setHostText(hostResult.value);
    updateConnection({ host: hostResult.value });
    flash('Dirección del ESP32 guardada.');
  };

  const saveTariff = () => {
    setShowTariffErrors(true);
    if (!rateResult.ok || !dayResult.ok) return;
    updateBudget({ ratePerKWh: rateResult.value, billingCycleStartDay: dayResult.value });
    flash('Tarifa y ciclo guardados.');
  };

  const confirmResetCycle = () => {
    Alert.alert('Reiniciar ciclo', 'El consumo del ciclo volverá a cero. El historial diario se conserva.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          resetCycle();
          flash('Ciclo reiniciado.');
        },
      },
    ]);
  };

  const sendTest = async () => {
    const sent = await notify('Prueba de AhorraTech', 'Las alertas de consumo están funcionando.', 'info');
    setMessage(sent ? 'Notificación enviada.' : 'No se pudo enviar. Revisa el permiso de notificaciones.');
  };

  const supabaseOk = isSupabaseConfigured();
  const ocrOk = isOcrConfigured();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen
      testID="settings-screen"
      header={<ScreenHeader title="Ajustes" subtitle="Medidor, tarifa y apariencia" trailing={<ConnectionPill />} />}
    >
      {message ? <Banner tone="success" title={message} onDismiss={() => setMessage(null)} /> : null}

      <Card style={styles.card}>
        <SectionHeader title="Apariencia" />
        <SegmentedControl<ThemePreference>
          accessibilityLabel="Tema de la aplicación"
          value={themePreference}
          onChange={setThemePreference}
          options={[
            { value: 'system', label: 'Sistema', icon: 'theme-light-dark' },
            { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
            { value: 'dark', label: 'Oscuro', icon: 'weather-night' },
          ]}
        />
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Fuente de datos" description="De dónde vienen las mediciones en vivo." />
        <SegmentedControl<ConnectionMode>
          accessibilityLabel="Fuente de datos"
          value={connection.mode}
          onChange={changeMode}
          options={[
            { value: 'simulation', label: 'Simulación', icon: 'flask-outline' },
            { value: 'hardware', label: 'ESP32', icon: 'chip' },
          ]}
        />
        {connection.mode === 'hardware' ? (
          <View style={styles.group}>
            <TextField
              label="Dirección IP del ESP32"
              prefix="http://"
              placeholder="192.168.4.1"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={hostText}
              onChangeText={setHostText}
              error={showHostError && !hostResult.ok ? hostResult.error : null}
              helperText="El teléfono y el ESP32 deben estar en la misma red Wi-Fi."
              testID="host-input"
            />
            <Button
              label="Guardar dirección"
              variant="secondary"
              icon="content-save-outline"
              onPress={saveHost}
              disabled={hostResult.ok && hostResult.value === connection.host}
            />
            <View style={styles.statusRow}>
              <AppText variant="small" tone="muted">
                Última lectura
              </AppText>
              <AppText variant="small" tone={status.errorMessage ? 'danger' : 'default'}>
                {status.errorMessage ?? (status.lastSyncTime ? formatRelativeTime(status.lastSyncTime) : 'Sin lecturas')}
              </AppText>
            </View>
          </View>
        ) : (
          <AppText variant="small" tone="secondary">
            Datos de ejemplo para probar la app sin hardware.
          </AppText>
        )}
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Tarifa y ciclo" description="Según tu factura de luz." />
        <TextField
          label="Tarifa por kWh"
          prefix="Bs"
          suffix="/ kWh"
          keyboardType="decimal-pad"
          inputMode="decimal"
          value={rateText}
          onChangeText={setRateText}
          error={showTariffErrors && !rateResult.ok ? rateResult.error : null}
          testID="rate-input"
        />
        <TextField
          label="Día de inicio del ciclo"
          suffix="de cada mes"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={2}
          value={dayText}
          onChangeText={setDayText}
          error={showTariffErrors && !dayResult.ok ? dayResult.error : null}
          helperText="Entre 1 y 28."
          testID="cycle-day-input"
        />
        <Button
          label="Guardar tarifa"
          variant="secondary"
          icon="content-save-outline"
          onPress={saveTariff}
          disabled={
            rateResult.ok &&
            dayResult.ok &&
            rateResult.value === budget.ratePerKWh &&
            dayResult.value === budget.billingCycleStartDay
          }
          testID="save-tariff"
        />
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Servicios en la nube" />
        <View>
          <ListRow
            divider
            icon="database-outline"
            iconColor={supabaseOk ? colors.success : colors.textMuted}
            iconBackground={supabaseOk ? colors.successSoft : colors.surfaceMuted}
            title="Respaldo de fotos"
            subtitle={supabaseOk ? (getSupabaseHost() ?? 'Supabase') : 'No configurado'}
            trailing={<Badge label={supabaseOk ? 'Activo' : 'Inactivo'} tone={supabaseOk ? 'success' : 'neutral'} />}
          />
          <ListRow
            icon="text-recognition"
            iconColor={ocrOk ? colors.success : colors.textMuted}
            iconBackground={ocrOk ? colors.successSoft : colors.surfaceMuted}
            title="Lectura automática (OCR)"
            subtitle={ocrOk ? 'En el servidor (Gemini)' : 'No configurado: lectura manual'}
            trailing={<Badge label={ocrOk ? 'Activo' : 'Inactivo'} tone={ocrOk ? 'success' : 'neutral'} />}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Acciones" />
        <Button label="Probar notificación" variant="secondary" icon="bell-outline" onPress={() => void sendTest()} />
        <Button label="Reiniciar ciclo de facturación" variant="danger" icon="restart" onPress={confirmResetCycle} />
      </Card>

      <AppText variant="caption" tone="muted" align="center">
        AhorraTech v{version}
      </AppText>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
}));
