import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { createInitialPersistedState } from '@/store/migrations';
import { initialRuntimeState, useEnergyStore } from '@/store/useEnergyStore';
import { fetchEsp32Reading } from '@/services/telemetry/esp32Client';
import { useAlertNotifications } from '../useAlertNotifications';
import { useDayRollover } from '../useDayRollover';
import { useMeterScan } from '../useMeterScan';
import { useTelemetryPolling } from '../useTelemetryPolling';

jest.mock('@/services/telemetry/esp32Client', () => ({
  fetchEsp32Reading: jest.fn(),
}));

const mockedFetch = fetchEsp32Reading as jest.MockedFunction<typeof fetchEsp32Reading>;

let appStateListener: ((s: AppStateStatus) => void) | null = null;
beforeEach(() => {
  jest.useFakeTimers();
  useEnergyStore.setState({ ...createInitialPersistedState(), ...initialRuntimeState, hasHydrated: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (s: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  mockedFetch.mockReset();
  (Notifications.scheduleNotificationAsync as jest.Mock).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useTelemetryPolling', () => {
  it('no lee nada hasta que el estado guardado se haya cargado', async () => {
    useEnergyStore.setState({ hasHydrated: false });
    await renderHook(() => useTelemetryPolling());
    expect(useEnergyStore.getState().liveReading).toBeNull();
  });

  it('en simulación genera una lectura por intervalo', async () => {
    const { unmount } = await renderHook(() => useTelemetryPolling());
    expect(useEnergyStore.getState().powerHistory).toHaveLength(1);
    await act(async () => {
      jest.advanceTimersByTime(2000 * 3);
    });
    expect(useEnergyStore.getState().powerHistory).toHaveLength(4);
    await unmount();
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(useEnergyStore.getState().powerHistory).toHaveLength(4);
  });

  it('se pausa en segundo plano y se reanuda al volver', async () => {
    await renderHook(() => useTelemetryPolling());
    await act(async () => appStateListener?.('background'));
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(useEnergyStore.getState().powerHistory).toHaveLength(1);
    await act(async () => appStateListener?.('active'));
    expect(useEnergyStore.getState().powerHistory).toHaveLength(2);
  });

  it('con ESP32 registra lecturas y errores de conexión', async () => {
    useEnergyStore.setState({ connection: { mode: 'hardware', host: '10.0.0.2', pollingIntervalMs: 2000 } });
    mockedFetch.mockResolvedValueOnce({
      voltage: 220,
      current: 1,
      power: 220,
      energy: 3,
      frequency: 50,
      powerFactor: 1,
      timestamp: 1,
    });
    mockedFetch.mockRejectedValueOnce(new Error('El ESP32 no respondió en 3 s.'));

    await renderHook(() => useTelemetryPolling());
    await act(async () => {});
    expect(useEnergyStore.getState().status.isConnected).toBe(true);
    expect(mockedFetch).toHaveBeenCalledWith('10.0.0.2');

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(useEnergyStore.getState().status).toMatchObject({
      isConnected: false,
      errorMessage: 'El ESP32 no respondió en 3 s.',
    });
  });
});

describe('useAlertNotifications', () => {
  it('notifica cada alerta nueva una sola vez y respeta la espera por tipo', async () => {
    await renderHook(() => useAlertNotifications(60_000));
    const store = useEnergyStore.getState();
    const power = (w: number, t: number) =>
      act(() =>
        store.ingestReading({ voltage: 220, current: 1, power: w, energy: 1, frequency: 50, powerFactor: 1, timestamp: t })
      );

    await power(5000, 1_000);
    await power(5000, 3_000); // misma alerta: no se repite
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    await power(300, 5_000); // se resuelve
    await power(5000, 7_000); // reaparece dentro de la espera de 60 s: sin notificación
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    await power(300, 70_000);
    await power(5000, 80_000); // pasada la espera: se notifica otra vez
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });
});

describe('useAlertNotifications al reabrir la app', () => {
  it('el aviso de presupuesto no se repite en cada apertura dentro del mismo ciclo', async () => {
    useEnergyStore.getState().refreshAlerts();
    const first = await renderHook(() => useAlertNotifications());
    await act(async () => useEnergyStore.getState().updateBudget({ monthlyBudgetBs: 10 }));
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    await first.unmount();

    // Simula un reinicio: se pierden las alertas en memoria, se conserva lo guardado.
    useEnergyStore.setState({ alerts: [] });
    await renderHook(() => useAlertNotifications());
    await act(async () => useEnergyStore.getState().refreshAlerts());
    expect(useEnergyStore.getState().alerts.length).toBeGreaterThan(0);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});

describe('useDayRollover', () => {
  it('actualiza "hoy" al pasar la medianoche aunque no lleguen lecturas', async () => {
    useEnergyStore.setState({ today: '2000-01-01' });
    await renderHook(() => useDayRollover());
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(useEnergyStore.getState().today).not.toBe('2000-01-01');
  });

  it('también revisa al volver a la app', async () => {
    await renderHook(() => useDayRollover());
    useEnergyStore.setState({ today: '2000-01-01' });
    await act(async () => appStateListener?.('active'));
    expect(useEnergyStore.getState().today).not.toBe('2000-01-01');
  });
});

describe('useMeterScan', () => {
  it('confirmar dos veces seguidas calibra y guarda una sola vez', async () => {
    const { result } = await renderHook(() => useMeterScan());
    await act(async () => result.current.startManualEntry());
    await act(async () => {
      const first = result.current.confirm(500);
      const second = result.current.confirm(500);
      await Promise.all([first, second]);
    });
    expect(useEnergyStore.getState().captures).toHaveLength(1);
    expect(useEnergyStore.getState().ledger.meterKWh).toBe(500);
    expect(result.current.state.feedback?.title).toBe('Medidor calibrado');
  });
});
