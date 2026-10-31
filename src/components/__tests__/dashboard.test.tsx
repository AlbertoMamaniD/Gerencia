import { screen } from '@testing-library/react-native';
import { BudgetHeroCard } from '@/components/dashboard/BudgetHeroCard';
import { LivePowerCard } from '@/components/dashboard/LivePowerCard';
import { TelemetryGrid } from '@/components/dashboard/TelemetryGrid';
import { WeeklyConsumptionCard } from '@/components/dashboard/WeeklyConsumptionCard';
import { calculateFinancialProjection } from '@/domain/billing';
import { buildWeeklySeries } from '@/domain/meter';
import { renderWithProviders } from '@/test-utils/render';

const projectionFor = (kWh: number) =>
  calculateFinancialProjection({
    cycleEnergyKWh: kWh,
    ratePerKWh: 1,
    monthlyBudgetBs: 100,
    cycleStartDay: 1,
    warningThresholdPct: 80,
    referenceDate: new Date(2026, 9, 10),
  });

describe('BudgetHeroCard', () => {
  it.each([
    [20, 'En meta', 'Disponible'],
    [85, 'Cerca del límite', 'Disponible'],
    [120, 'Excedido', 'Excedido'],
  ])('%s kWh → %s', async (kWh, status, statLabel) => {
    await renderWithProviders(<BudgetHeroCard projection={projectionFor(kWh)} monthlyBudgetBs={100} />);
    expect(screen.getByLabelText(`Estado: ${status}`)).toBeOnTheScreen();
    expect(screen.getByLabelText(new RegExp(`^${statLabel}:`))).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });
});

describe('LivePowerCard', () => {
  it('sin datos muestra un estado de espera', async () => {
    await renderWithProviders(<LivePowerCard history={[]} currentPowerW={null} maxPowerW={3500} />);
    expect(screen.getByText('Esperando lecturas del sensor…')).toBeOnTheScreen();
    expect(screen.getByText('—')).toBeOnTheScreen();
  });

  it('marca sobrecarga cuando se supera el límite', async () => {
    const history = [1, 2, 3].map((i) => ({ timestamp: i, power: 4000 }));
    await renderWithProviders(<LivePowerCard history={history} currentPowerW={4000} maxPowerW={3500} />);
    expect(screen.getByText('Sobrecarga')).toBeOnTheScreen();
  });
});

describe('TelemetryGrid', () => {
  it('muestra valores y descripciones accesibles', async () => {
    await renderWithProviders(
      <TelemetryGrid
        reading={{ voltage: 190, current: 3.2, power: 700, energy: 1, frequency: 50, powerFactor: 0.8, timestamp: 0 }}
        meterKWh={12345.6}
        cycleKWh={84.6}
        lastSyncTime={Date.now()}
      />
    );
    expect(screen.getByText('Tensión baja')).toBeOnTheScreen();
    expect(screen.getByText('Bajo (carga inductiva)')).toBeOnTheScreen();
    expect(screen.getByText('12.345,6 kWh')).toBeOnTheScreen();
  });

  it('sin lectura usa guiones', async () => {
    await renderWithProviders(<TelemetryGrid reading={null} meterKWh={0} cycleKWh={0} lastSyncTime={null} />);
    expect(screen.getByText('Sin lecturas todavía')).toBeOnTheScreen();
  });
});

describe('WeeklyConsumptionCard', () => {
  it('estado vacío cuando no hay consumo', async () => {
    await renderWithProviders(<WeeklyConsumptionCard series={buildWeeklySeries({}, 0.85)} dailyTargetBs={6} />);
    expect(screen.getByText('Todavía no hay consumo registrado esta semana.')).toBeOnTheScreen();
  });

  it('describe el gráfico para lectores de pantalla', async () => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await renderWithProviders(<WeeklyConsumptionCard series={buildWeeklySeries({ [key]: 4 }, 1)} dailyTargetBs={3} />);
    expect(screen.getByLabelText(/Hoy: 4,00/)).toBeOnTheScreen();
  });
});
