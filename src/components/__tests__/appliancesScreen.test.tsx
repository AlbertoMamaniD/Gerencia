import { cleanup, fireEvent, screen } from '@testing-library/react-native';
import { ApplianceCard } from '../appliances/ApplianceCard';
import { HouseholdHeroCard } from '../appliances/HouseholdHeroCard';
import { ApplianceAuditQuickCard } from '../dashboard/ApplianceAuditQuickCard';
import { SetarTariffCard } from '../dashboard/SetarTariffCard';
import AppliancesScreen from '@/app/(tabs)/appliances';
import { calculateHouseholdSummary, DEFAULT_TARIJA_APPLIANCES } from '@/domain/appliances';
import { createInitialPersistedState } from '@/store/migrations';
import { initialRuntimeState, useEnergyStore } from '@/store/useEnergyStore';
import { renderWithProviders } from '@/test-utils/render';

beforeEach(() => {
  useEnergyStore.setState({ ...createInitialPersistedState(), ...initialRuntimeState, hasHydrated: true });
});

afterEach(() => {
  cleanup();
});

describe('Zero-Hardware UI Components', () => {
  describe('SetarTariffCard', () => {
    it('muestra Tarifa Dignidad cuando el consumo es menor a 70 kWh', async () => {
      await renderWithProviders(<SetarTariffCard cycleEnergyKWh={45} ratePerKWh={0.74} />);
      expect(screen.getByText('Tarifa Dignidad Activa')).toBeOnTheScreen();
      expect(screen.getByText('-25% Subsidio')).toBeOnTheScreen();
      expect(screen.getByText(/45.*kWh.*acumulados/)).toBeOnTheScreen();
    });

    it('muestra Bloque 2 para consumo residencial normal', async () => {
      await renderWithProviders(<SetarTariffCard cycleEnergyKWh={150} ratePerKWh={0.74} />);
      expect(screen.getByText('Bloque 2')).toBeOnTheScreen();
      expect(screen.getByText(/Consumo Residencial Normal/)).toBeOnTheScreen();
    });
  });

  describe('HouseholdHeroCard', () => {
    it('muestra el gasto estimado total y el aparato de mayor consumo', async () => {
      const summary = calculateHouseholdSummary(DEFAULT_TARIJA_APPLIANCES, 0.74);
      await renderWithProviders(<HouseholdHeroCard summary={summary} />);
      expect(screen.getByTestId('household-hero-card')).toBeOnTheScreen();
      expect(screen.getByText(/Auditor de tu Hogar/)).toBeOnTheScreen();
      expect(screen.getByText(/Estimado Mensual/)).toBeOnTheScreen();
    });
  });

  describe('ApplianceCard', () => {
    it('permite cambiar las horas y la cantidad mediante los botones', async () => {
      const onUpdate = jest.fn();
      const consumption = {
        item: DEFAULT_TARIJA_APPLIANCES[0],
        monthlyCostBs: 45.2,
        monthlyKWh: 61.1,
        percentageOfTotal: 38.5,
      };

      await renderWithProviders(<ApplianceCard consumption={consumption} onUpdate={onUpdate} />);
      expect(screen.getByText(DEFAULT_TARIJA_APPLIANCES[0].name)).toBeOnTheScreen();

      const plusButtons = screen.getAllByLabelText(/Aumentar/);
      await fireEvent.press(plusButtons[0]); // Aumentar horas
      expect(onUpdate).toHaveBeenCalled();

      await fireEvent.press(plusButtons[1]); // Aumentar cantidad
      expect(onUpdate).toHaveBeenCalledWith({ quantity: 2 });
    });
  });

  describe('ApplianceAuditQuickCard', () => {
    it('muestra el resumen de gasto en artefactos en el dashboard', async () => {
      await renderWithProviders(<ApplianceAuditQuickCard />);
      expect(screen.getByTestId('appliance-audit-quick-card')).toBeOnTheScreen();
      expect(screen.getByText('¿Quién se come tu luz?')).toBeOnTheScreen();
    });
  });

  describe('AppliancesScreen', () => {
    it('renderiza la lista de artefactos y permite filtrar por categoría', async () => {
      await renderWithProviders(<AppliancesScreen />);
      expect(screen.getByTestId('appliances-screen')).toBeOnTheScreen();
      expect(screen.getByText('Mis Electrodomésticos')).toBeOnTheScreen();

      // Filtrar por Baño
      const banoChip = screen.getByText('Baño');
      await fireEvent.press(banoChip);
      expect(screen.getByText('Ducha Eléctrica (Corona/Lorenzetti)')).toBeOnTheScreen();
    });
  });
});
