import { useState } from 'react';
import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Banner, Button, Card, SectionHeader, SegmentedControl, TextField } from '@/components/ui';
import { ConnectionMode } from '@/domain/types';
import { validateCycleStartDay, validateHost, validateRate } from '@/domain/validation';
import { notify, vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatRelativeTime, toInputValue } from '@/utils/formatters';
import { makeStyles, spacing, ThemePreference } from '@/theme';

export default function SettingsScreen() {
  const styles = useStyles();

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
        'Conectar sensor Wi-Fi',
        'Se empezará a medir con tu sensor en tiempo real. ¿Continuar?',
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
    flash('Dirección del sensor guardada.');
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
        <SectionHeader title="Fuente de datos" description="Cómo mide el consumo la aplicación." />
        <SegmentedControl<ConnectionMode>
          accessibilityLabel="Fuente de datos"
          value={connection.mode}
          onChange={changeMode}
          options={[
            { value: 'simulation', label: 'Lectura por foto', icon: 'camera-outline' },
            { value: 'hardware', label: 'Sensor Wi-Fi', icon: 'wifi' },
          ]}
        />
        {connection.mode === 'hardware' ? (
          <View style={styles.group}>
            <TextField
              label="Dirección IP del sensor"
              prefix="http://"
              placeholder="192.168.4.1"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={hostText}
              onChangeText={setHostText}
              error={showHostError && !hostResult.ok ? hostResult.error : null}
              helperText="El teléfono y el sensor deben estar conectados a la misma red Wi-Fi."
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
            Modo sin sensor: toma la foto de tu medidor cada mes para controlar tu consumo de SETAR.
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
