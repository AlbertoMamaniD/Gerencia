import { useState } from 'react';
import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  AppText,
  Banner,
  Button,
  Card,
  Chip,
  IconCircle,
  SectionHeader,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { ConnectionMode } from '@/domain/types';
import { validateCycleStartDay, validateHost, validateRate } from '@/domain/validation';
import { notify, vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatRelativeTime, toInputValue } from '@/utils/formatters';
import { makeStyles, radius, spacing, ThemePreference, useTheme, withAlpha } from '@/theme';

const TARIFF_PRESETS = [
  { rate: 0.85, label: 'Casa (Bs 0,85)', fullLabel: 'Casa o departamento estándar' },
  { rate: 0.65, label: 'Dignidad (Bs 0,65)', fullLabel: 'Tarifa Dignidad con subsidio' },
  { rate: 1.05, label: 'Negocio (Bs 1,05)', fullLabel: 'Tienda o comercio' },
];

const CYCLE_PRESETS = [
  { day: 1, label: 'Día 1' },
  { day: 15, label: 'Día 15' },
  { day: 20, label: 'Día 20' },
];

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
    setShowTariffErrors(false);
    flash('Tarifa y ciclo guardados.');
  };

  const confirmResetCycle = () => {
    Alert.alert(
      'Reiniciar ciclo de facturación',
      '¿Quieres reiniciar el contador de consumo a cero para empezar un nuevo ciclo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            resetCycle();
            flash('Ciclo reiniciado.');
          },
        },
      ]
    );
  };

  const sendTest = async () => {
    const sent = await notify('Prueba de AhorraTech', 'Las alertas de consumo están funcionando.', 'info');
    setMessage(sent ? 'Notificación enviada.' : 'No se pudo enviar. Revisa el permiso de notificaciones.');
  };

  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen
      testID="settings-screen"
      header={<ScreenHeader title="Ajustes" subtitle="Tarifa de SETAR y preferencias" trailing={<ConnectionPill />} />}
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
        <SectionHeader
          title="Tarifa de SETAR y facturación"
          description="Configura el costo del kWh y el día en que renueva tu factura mensual."
        />

        <View style={styles.helpBox}>
          <IconCircle
            name="lightbulb-on-outline"
            color={colors.primary}
            background={withAlpha(colors.primary, 0.15)}
            size={36}
          />
          <View style={styles.helpBoxText}>
            <AppText variant="bodyStrong">Tarifa residencial en Tarija</AppText>
            <AppText variant="small" tone="secondary">
              El 90% de los hogares pagan la tarifa estándar de Bs 0,85 por kWh. Para consumos menores a 70 kWh (~Bs 50), SETAR aplica Tarifa Dignidad (Bs 0,65).
            </AppText>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <AppText variant="caption" tone="muted">
            Tarifas sugeridas de SETAR
          </AppText>
          <View style={styles.chipsRow} accessibilityRole="radiogroup" accessibilityLabel="Tarifas sugeridas de SETAR">
            {TARIFF_PRESETS.map((preset) => (
              <Chip
                key={preset.rate}
                label={preset.label}
                accessibilityLabel={preset.fullLabel}
                selected={rateResult.ok && rateResult.value === preset.rate}
                onPress={() => {
                  setRateText(toInputValue(preset.rate));
                  setShowTariffErrors(false);
                }}
              />
            ))}
          </View>
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
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionBlock}>
          <AppText variant="caption" tone="muted">
            Día que inicia tu factura (entre 1 y 28)
          </AppText>
          <View style={styles.chipsRow} accessibilityRole="radiogroup" accessibilityLabel="Días sugeridos de ciclo">
            {CYCLE_PRESETS.map((preset) => (
              <Chip
                key={preset.day}
                label={preset.label}
                accessibilityLabel={`Día ${preset.day}`}
                selected={dayResult.ok && dayResult.value === preset.day}
                onPress={() => {
                  setDayText(String(preset.day));
                  setShowTariffErrors(false);
                }}
              />
            ))}
          </View>
          <TextField
            label="Día de inicio del ciclo"
            suffix="de cada mes"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            value={dayText}
            onChangeText={setDayText}
            error={showTariffErrors && !dayResult.ok ? dayResult.error : null}
            helperText="Día del mes (1 al 28) en que se emite o renueva tu factura."
            testID="cycle-day-input"
          />
        </View>

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

const useStyles = makeStyles(({ colors }) => ({
  card: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: withAlpha(colors.border, 0.6),
    marginVertical: spacing.xxs,
  },
  helpBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: withAlpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.22),
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  helpBoxText: {
    flex: 1,
    gap: spacing.xxs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
}));
