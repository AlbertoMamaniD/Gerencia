import AsyncStorage from '@react-native-async-storage/async-storage';
import { PZEMReading } from '@/domain/types';
import { createDemoLedger, createInitialPersistedState, DEFAULT_BUDGET, migratePersistedState, STORE_VERSION } from '../migrations';
import { flushStorage, throttledStorage } from '../throttledStorage';
import { initialRuntimeState, STORAGE_KEY, useEnergyStore } from '../useEnergyStore';

const reading = (energy: number, power = 500, timestamp = Date.now()): PZEMReading => ({
  voltage: 220,
  current: 2,
  power,
  energy,
  frequency: 50,
  powerFactor: 0.97,
  timestamp,
});

beforeEach(async () => {
  useEnergyStore.setState({ ...createInitialPersistedState(), ...initialRuntimeState, hasHydrated: true });
  await AsyncStorage.clear();
});

describe('useEnergyStore', () => {
  it('ingesta lecturas: historial limitado y consumo acumulado', () => {
    const { ingestReading } = useEnergyStore.getState();
    const start = useEnergyStore.getState().ledger.meterKWh;
    for (let i = 0; i <= 40; i++) ingestReading(reading(10 + i * 0.01));
    const s = useEnergyStore.getState();
    expect(s.powerHistory).toHaveLength(30);
    expect(s.ledger.meterKWh).toBeCloseTo(start + 0.4, 4);
    expect(s.status.isConnected).toBe(true);
  });

  it('crea y retira la alerta de sobrecarga automáticamente', () => {
    const { ingestReading } = useEnergyStore.getState();
    ingestReading(reading(1, 5000));
    expect(useEnergyStore.getState().alerts.map((a) => a.type)).toContain('overload');
    ingestReading(reading(1.001, 300));
    expect(useEnergyStore.getState().alerts.map((a) => a.type)).not.toContain('overload');
  });

  it('una alerta descartada no vuelve hasta que la condición se resuelve', () => {
    const store = useEnergyStore.getState();
    store.ingestReading(reading(1, 5000));
    const id = useEnergyStore.getState().alerts[0].id;
    store.dismissAlert(id);
    store.ingestReading(reading(1.001, 5000));
    expect(useEnergyStore.getState().alerts).toHaveLength(0);
    store.ingestReading(reading(1.002, 300));
    store.ingestReading(reading(1.003, 5000));
    expect(useEnergyStore.getState().alerts).toHaveLength(1);
    store.dismissAlert('no-existe');
  });

  it('alerta de presupuesto al cambiar el límite', () => {
    useEnergyStore.getState().updateBudget({ monthlyBudgetBs: 10 });
    expect(useEnergyStore.getState().alerts.map((a) => a.type)).toContain('budget_exceeded');
    useEnergyStore.getState().resetCycle();
    expect(useEnergyStore.getState().alerts).toHaveLength(0);
  });

  it('calibrar conserva el consumo del ciclo y sobrevive a la siguiente lectura', () => {
    const store = useEnergyStore.getState();
    store.ingestReading(reading(5));
    const cycleBefore = useEnergyStore.getState().ledger.meterKWh - useEnergyStore.getState().ledger.cycleStartKWh;
    store.calibrateMeter(12345.6);
    store.ingestReading(reading(5.1));
    const s = useEnergyStore.getState();
    expect(s.ledger.meterKWh).toBeCloseTo(12345.7, 4);
    expect(s.ledger.meterKWh - s.ledger.cycleStartKWh).toBeCloseTo(cycleBefore + 0.1, 4);
  });

  it('pasar a ESP32 descarta los datos de demostración', () => {
    useEnergyStore.getState().ingestReading(reading(5));
    useEnergyStore.getState().updateConnection({ mode: 'hardware' });
    const s = useEnergyStore.getState();
    expect(s.hasDemoData).toBe(false);
    expect(s.ledger).toEqual({ meterKWh: 0, sensorKWh: null, cycleStartKWh: 0, daily: {} });
    expect(s.liveReading).toBeNull();
  });

  it('cambiar de IP mantiene el medidor pero toma una nueva base del sensor', () => {
    useEnergyStore.setState({ hasDemoData: false });
    useEnergyStore.getState().ingestReading(reading(5));
    const meter = useEnergyStore.getState().ledger.meterKWh;
    useEnergyStore.getState().updateConnection({ host: '10.0.0.9' });
    expect(useEnergyStore.getState().ledger).toMatchObject({ meterKWh: meter, sensorKWh: null });
    useEnergyStore.getState().updateConnection({ pollingIntervalMs: 3000 });
    expect(useEnergyStore.getState().connection.pollingIntervalMs).toBe(3000);
  });

  it('errores de conexión y capturas (máximo 50)', () => {
    const store = useEnergyStore.getState();
    store.reportConnectionError('sin red');
    expect(useEnergyStore.getState().status).toMatchObject({ isConnected: false, errorMessage: 'sin red' });
    for (let i = 0; i < 55; i++) {
      store.addCapture({
        id: String(i),
        imageUri: null,
        detectedKWh: i,
        costBs: 0,
        timestamp: i,
        meterSerial: null,
        confidence: null,
        source: 'manual',
        cloudSynced: false,
      });
    }
    expect(useEnergyStore.getState().captures).toHaveLength(50);
    expect(useEnergyStore.getState().captures[0].id).toBe('54');
  });

  it('gestiona la lista de artefactos auditados del hogar', () => {
    const store = useEnergyStore.getState();
    expect(store.appliances.length).toBeGreaterThan(0);

    store.addAppliance({
      id: 'aire-nuevo',
      name: 'Aire Acondicionado 12000 BTU',
      category: 'clima',
      icon: 'air-conditioner',
      powerWatts: 1200,
      quantity: 1,
      hoursPerDay: 4,
    });
    expect(useEnergyStore.getState().appliances.some((a) => a.id === 'aire-nuevo')).toBe(true);

    store.updateAppliance('aire-nuevo', { hoursPerDay: 6 });
    expect(useEnergyStore.getState().appliances.find((a) => a.id === 'aire-nuevo')?.hoursPerDay).toBe(6);

    store.removeAppliance('aire-nuevo');
    expect(useEnergyStore.getState().appliances.some((a) => a.id === 'aire-nuevo')).toBe(false);

    store.resetAppliances();
    expect(useEnergyStore.getState().appliances.length).toBeGreaterThan(0);
  });

  it('los cambios del usuario se guardan en disco de inmediato', async () => {
    useEnergyStore.getState().setThemePreference('dark');
    await flushStorage();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ state: { themePreference: 'dark' }, version: STORE_VERSION });
    // Solo se persiste la configuración, no la telemetría en vivo.
    expect(JSON.parse(raw ?? '{}').state.liveReading).toBeUndefined();
  });
});

describe('throttledStorage', () => {
  it('agrupa escrituras y lee el valor pendiente', async () => {
    jest.useFakeTimers();
    throttledStorage.setItem('k', '1');
    throttledStorage.setItem('k', '2');
    expect(await throttledStorage.getItem('k')).toBe('2');
    expect(await AsyncStorage.getItem('k')).toBeNull();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    await flushStorage();
    expect(await AsyncStorage.getItem('k')).toBe('2');
    await throttledStorage.removeItem('k');
    expect(await AsyncStorage.getItem('k')).toBeNull();
  });
});

describe('migratePersistedState', () => {
  const now = new Date(2026, 9, 31);

  it('migra el formato de la v1.0 conservando presupuesto, IP y capturas', () => {
    const legacy = {
      budgetConfig: { ratePerKWh: 0.9, monthlyBudgetBs: 250, billingCycleStartDay: 31, warningThresholdPct: 75, maxPowerThresholdW: 4000 },
      connection: { mode: 'hardware', ipAddress: '192.168.1.50', pollingIntervalMs: 2000 },
      meterCaptures: [
        { id: 'c1', imageUri: 'https://x/p.jpg', detectedKWh: 100, costBs: 85, timestamp: 1, meterSerial: 'A', confidence: 99 },
        { bad: true },
      ],
    };
    const s = migratePersistedState(legacy, 0, now);
    expect(s.budget).toEqual({ ratePerKWh: 0.9, monthlyBudgetBs: 250, billingCycleStartDay: 28, warningThresholdPct: 75, maxPowerThresholdW: 4000 });
    expect(s.connection).toEqual({ mode: 'hardware', host: '192.168.1.50', pollingIntervalMs: 2000 });
    expect(s.hasDemoData).toBe(false);
    expect(s.ledger.meterKWh).toBe(0);
    expect(s.captures).toHaveLength(1);
    expect(s.captures[0]).toMatchObject({ source: 'ocr', cloudSynced: true });
  });

  it('estado vacío o corrupto vuelve a los valores por defecto', () => {
    expect(migratePersistedState(null, 0, now).budget).toEqual(DEFAULT_BUDGET);
    const s = migratePersistedState({ budgetConfig: { monthlyBudgetBs: 'x' } }, 0, now);
    expect(s.budget.monthlyBudgetBs).toBe(DEFAULT_BUDGET.monthlyBudgetBs);
    expect(s.ledger).toEqual(createDemoLedger(now));
  });

  it('versiones actuales se combinan con los valores por defecto', () => {
    const s = migratePersistedState({ themePreference: 'dark' }, STORE_VERSION, now);
    expect(s.themePreference).toBe('dark');
    expect(s.budget).toEqual(DEFAULT_BUDGET);
  });
});

describe('correcciones de la revisión de bugs', () => {
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

  it('el ciclo se reinicia solo al empezar el siguiente mes', () => {
    const store = useEnergyStore.getState();
    store.refreshAlerts(at(2026, 10, 20));
    store.ingestReading(reading(1, 500, at(2026, 10, 20)));
    store.ingestReading(reading(151, 500, at(2026, 10, 30)));
    const before = useEnergyStore.getState().ledger;
    expect(before.meterKWh - before.cycleStartKWh).toBeGreaterThan(150);

    useEnergyStore.getState().refreshAlerts(at(2026, 11, 1));
    const s = useEnergyStore.getState();
    expect(s.cycleKey).toBe('2026-11-01');
    expect(s.ledger.meterKWh - s.ledger.cycleStartKWh).toBe(0);
    expect(s.ledger.meterKWh).toBe(before.meterKWh); // la lectura del medidor no cambia
  });

  it('cambiar el día de inicio no borra el consumo medido', () => {
    const store = useEnergyStore.getState();
    store.refreshAlerts();
    const consumed = useEnergyStore.getState().ledger.meterKWh - useEnergyStore.getState().ledger.cycleStartKWh;
    store.updateBudget({ billingCycleStartDay: 15 });
    const s = useEnergyStore.getState();
    expect(s.ledger.meterKWh - s.ledger.cycleStartKWh).toBe(consumed);
    expect(s.budget.billingCycleStartDay).toBe(15);
  });

  it('si el ESP32 deja de responder, la potencia vieja deja de mostrarse y la sobrecarga se retira', () => {
    const t = Date.now();
    const store = useEnergyStore.getState();
    store.ingestReading(reading(1, 5000, t));
    expect(useEnergyStore.getState().alerts.map((a) => a.type)).toContain('overload');

    store.reportConnectionError('sin red', t + 2000); // fallo puntual: se conserva
    expect(useEnergyStore.getState().liveReading).not.toBeNull();

    store.reportConnectionError('sin red', t + 20_000); // datos viejos
    const s = useEnergyStore.getState();
    expect(s.liveReading).toBeNull();
    expect(s.alerts.map((a) => a.type)).not.toContain('overload');
  });

  it('las alertas cerradas y las notificaciones enviadas se guardan en disco', async () => {
    const store = useEnergyStore.getState();
    store.ingestReading(reading(1, 5000));
    store.dismissAlert(useEnergyStore.getState().alerts[0].id);
    store.markAlertNotified('budget_warning', 123);
    await flushStorage();
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '{}').state;
    expect(saved.dismissedAlertTypes).toEqual(['overload']);
    expect(saved.alertNotifications.budget_warning).toMatchObject({ at: 123 });
  });

  it('migra datos v3 agregando los campos nuevos', () => {
    const s = migratePersistedState({ themePreference: 'dark', budget: DEFAULT_BUDGET }, 3);
    expect(s).toMatchObject({ themePreference: 'dark', cycleKey: null, dismissedAlertTypes: [], alertNotifications: {} });
  });
});
