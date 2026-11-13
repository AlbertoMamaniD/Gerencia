import { fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DashboardScreen from '@/app/(tabs)/index';
import LimitsScreen from '@/app/(tabs)/limits';
import ScannerScreen from '@/app/(tabs)/scanner';
import SettingsScreen from '@/app/(tabs)/settings';
import { createInitialPersistedState } from '@/store/migrations';
import { initialRuntimeState, useEnergyStore } from '@/store/useEnergyStore';
import { renderWithProviders } from '@/test-utils/render';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false, canAskAgain: false })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
}));

jest.mock('@/config/env', () => ({
  env: { geminiApiKey: '', supabaseUrl: '', supabaseAnonKey: '' },
  isOcrConfigured: () => false,
  isSupabaseConfigured: () => false,
  getSupabaseHost: () => null,
}));

beforeEach(() => {
  useEnergyStore.setState({ ...createInitialPersistedState(), ...initialRuntimeState, hasHydrated: true });
});

describe('Inicio', () => {
  it('muestra el resumen y las alertas activas', async () => {
    useEnergyStore.getState().updateBudget({ monthlyBudgetBs: 10 });
    await renderWithProviders(<DashboardScreen />);
    expect(screen.getByText('Gasto del ciclo')).toBeOnTheScreen();
    expect(screen.getByText('Presupuesto agotado')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar aviso: Presupuesto agotado' }));
    expect(screen.queryByText('Presupuesto agotado')).toBeNull();
  });

  it('avisa si el sensor no responde', async () => {
    useEnergyStore.setState({ connection: { mode: 'hardware', host: '1.2.3.4', pollingIntervalMs: 2000 } });
    useEnergyStore.getState().reportConnectionError('El sensor no respondió en 3 s.');
    await renderWithProviders(<DashboardScreen />, 'dark');
    expect(screen.getByText('Sin conexión con el medidor')).toBeOnTheScreen();
    expect(screen.getByText('Sin conexión')).toBeOnTheScreen();
  });
});

describe('Presupuesto', () => {
  it('valida y guarda los límites', async () => {
    await renderWithProviders(<LimitsScreen />);
    const save = screen.getByTestId('save-limits');
    expect(save).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('budget-input'), '5');
    await fireEvent.press(screen.getByTestId('save-limits'));
    expect(screen.getByText('El presupuesto debe estar entre 10 Bs y 100000 Bs.')).toBeOnTheScreen();
    expect(useEnergyStore.getState().budget.monthlyBudgetBs).toBe(180);

    await fireEvent.press(screen.getByRole('radio', { name: '300 bolivianos' }));
    await fireEvent.press(screen.getByRole('radio', { name: '90%' }));
    await fireEvent.changeText(screen.getByTestId('power-input'), '4000');
    await fireEvent.press(screen.getByTestId('save-limits'));

    expect(useEnergyStore.getState().budget).toMatchObject({ monthlyBudgetBs: 300, warningThresholdPct: 90, maxPowerThresholdW: 4000 });
    expect(screen.getByText('Cambios guardados')).toBeOnTheScreen();
  });
});

describe('Escanear', () => {
  it('lectura manual: valida y calibra el medidor', async () => {
    await renderWithProviders(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('manual-entry'));
    await fireEvent.changeText(screen.getByTestId('reading-input'), 'abc');
    await fireEvent.press(screen.getByTestId('confirm-reading'));
    expect(screen.getByText('Ingresa la lectura con un número válido.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('reading-input'), '12345,6');
    await fireEvent.press(screen.getByTestId('confirm-reading'));

    expect(await screen.findByText('Medidor calibrado')).toBeOnTheScreen();
    const state = useEnergyStore.getState();
    expect(state.ledger.meterKWh).toBeCloseTo(12345.6, 3);
    expect(state.captures[0]).toMatchObject({ detectedKWh: 12345.6, source: 'manual', cloudSynced: false });
    expect(screen.getByText('Ingresada a mano', { exact: false })).toBeOnTheScreen();
  });

  it('permiso de cámara denegado ofrece abrir ajustes', async () => {
    await renderWithProviders(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('take-photo'));
    expect(await screen.findByText('Permiso de cámara necesario')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Abrir ajustes del teléfono' })).toBeOnTheScreen();
  });

  it('descartar vuelve al estado inicial', async () => {
    await renderWithProviders(<ScannerScreen />);
    await fireEvent.press(screen.getByTestId('manual-entry'));
    await fireEvent.press(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.queryByTestId('reading-review')).toBeNull();
  });
});

describe('Ajustes', () => {
  it('cambia el tema y valida la tarifa con coma decimal', async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(useEnergyStore.getState().themePreference).toBe('dark');

    await fireEvent.changeText(screen.getByTestId('rate-input'), '0,92');
    await fireEvent.changeText(screen.getByTestId('cycle-day-input'), '40');
    await fireEvent.press(screen.getByTestId('save-tariff'));
    expect(screen.getByText('El día de inicio debe estar entre 1 y 28.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('cycle-day-input'), '15');
    await fireEvent.press(screen.getByTestId('save-tariff'));
    expect(useEnergyStore.getState().budget).toMatchObject({ ratePerKWh: 0.92, billingCycleStartDay: 15 });
    expect(screen.getByText('Tarifa y ciclo guardados.')).toBeOnTheScreen();
  });

  it('pide confirmación antes de borrar los datos de demostración', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Sensor Wi-Fi' }));
    expect(alertSpy).toHaveBeenCalled();
    expect(useEnergyStore.getState().connection.mode).toBe('simulation');

    const buttons = alertSpy.mock.calls[0][2] ?? [];
    buttons.find((b) => b.text === 'Continuar')?.onPress?.();
    expect(useEnergyStore.getState().connection.mode).toBe('hardware');
    expect(useEnergyStore.getState().hasDemoData).toBe(false);
  });

  it('valida la IP del sensor antes de guardarla', async () => {
    useEnergyStore.setState({ hasDemoData: false, connection: { mode: 'hardware', host: '192.168.4.1', pollingIntervalMs: 2000 } });
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.changeText(screen.getByTestId('host-input'), '192.168.4');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar dirección' }));
    expect(screen.getByText('La IP debe tener 4 números separados por puntos (ej. 192.168.4.1).')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('host-input'), 'http://10.0.0.7/');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar dirección' }));
    expect(useEnergyStore.getState().connection.host).toBe('10.0.0.7');
  });

  it('reiniciar el ciclo pide confirmación', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Reiniciar ciclo de facturación' }));
    const buttons = alertSpy.mock.calls.at(-1)?.[2] ?? [];
    buttons.find((b) => b.text === 'Reiniciar')?.onPress?.();
    const { ledger } = useEnergyStore.getState();
    expect(ledger.meterKWh - ledger.cycleStartKWh).toBe(0);
  });
});
