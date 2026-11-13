import { fireEvent, screen } from '@testing-library/react-native';
import { CollapsibleTechnicalDetails } from '@/components/dashboard/CollapsibleTechnicalDetails';
import { EnergySavingCard } from '@/components/dashboard/EnergySavingCard';
import { MeterActionCard } from '@/components/dashboard/MeterActionCard';
import { renderWithProviders } from '@/test-utils/render';

describe('MeterActionCard (MVP)', () => {
  it('muestra la lectura, la tarifa y permite registrar en 1 toque', async () => {
    await renderWithProviders(
      <MeterActionCard
        meterKWh={1452.7}
        lastCalibrationTime={Date.now() - 3600000}
        ratePerKWh={0.74}
      />
    );

    expect(screen.getByText('Tu Medidor de Luz')).toBeOnTheScreen();
    expect(screen.getByText('1.452,7 kWh')).toBeOnTheScreen();
    expect(screen.getByText('Bs 0,74')).toBeOnTheScreen();
    expect(screen.getByTestId('quick-scan-cta')).toBeOnTheScreen();
  });

  it('muestra estado sin datos cuando aún no hay lecturas', async () => {
    await renderWithProviders(
      <MeterActionCard meterKWh={0} lastCalibrationTime={null} ratePerKWh={0.74} />
    );

    expect(screen.getByText('Sin datos')).toBeOnTheScreen();
    expect(screen.getByText('Foto pendiente')).toBeOnTheScreen();
  });
});

describe('CollapsibleTechnicalDetails (MVP)', () => {
  const dummyProps = {
    reading: null,
    powerHistory: [],
    meterKWh: 100,
    cycleKWh: 50,
    maxPowerW: 3000,
    lastSyncTime: null,
  };

  it('inicia colapsado sin saturar de datos técnicos', async () => {
    await renderWithProviders(<CollapsibleTechnicalDetails {...dummyProps} />);

    expect(screen.getByText('Mediciones Técnicas')).toBeOnTheScreen();
    expect(
      screen.getByText('Toca para ver voltios, amperios y potencia en tiempo real')
    ).toBeOnTheScreen();
    // La grilla técnica no está visible
    expect(screen.queryByTestId('telemetry-grid')).toBeNull();
  });

  it('se expande al tocar el gatillo para mostrar sensores a demanda', async () => {
    await renderWithProviders(<CollapsibleTechnicalDetails {...dummyProps} />);

    await fireEvent.press(screen.getByTestId('toggle-technical-details'));
    expect(
      screen.getByText('Tensión (V), corriente (A) y potencia instantánea (W)')
    ).toBeOnTheScreen();
  });
});

describe('EnergySavingCard (MVP)', () => {
  it('muestra consejos de ahorro en dinero (Bs) y permite rotar', async () => {
    await renderWithProviders(<EnergySavingCard />);

    expect(screen.getByText('Tip de Ahorro Familiar')).toBeOnTheScreen();
    expect(screen.getByText(/Ahorro estimado/)).toBeOnTheScreen();

    // Rotar consejo
    fireEvent.press(screen.getByRole('button', { name: 'Ver otro consejo de ahorro' }));
    expect(screen.getByText('Tip de Ahorro Familiar')).toBeOnTheScreen();
  });
});
