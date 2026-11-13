import { useState } from 'react';
import { View } from 'react-native';
import { ApplianceCard } from '@/components/appliances/ApplianceCard';
import { HouseholdHeroCard } from '@/components/appliances/HouseholdHeroCard';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Button, Card, Chip, SectionHeader } from '@/components/ui';
import { ApplianceCategory, calculateHouseholdSummary } from '@/domain/appliances';
import { vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatNumber } from '@/utils/formatters';
import { makeStyles, spacing } from '@/theme';

type FilterTab = 'todos' | ApplianceCategory;

const FILTER_OPTIONS: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'bano', label: 'Baño' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'clima', label: 'Clima' },
  { id: 'iluminacion', label: 'Luz' },
  { id: 'entretenimiento', label: 'TV / PC' },
  { id: 'otros', label: 'Otros' },
];

export default function AppliancesScreen() {
  const styles = useStyles();
  const appliances = useEnergyStore((s) => s.appliances);
  const ratePerKWh = useEnergyStore((s) => s.budget.ratePerKWh);
  const updateAppliance = useEnergyStore((s) => s.updateAppliance);
  const resetAppliances = useEnergyStore((s) => s.resetAppliances);

  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');

  const summary = calculateHouseholdSummary(appliances, ratePerKWh);

  const filteredItems = activeFilter === 'todos'
    ? summary.items
    : summary.items.filter((item) => item.item.category === activeFilter);

  const handleReset = () => {
    resetAppliances();
    vibrate('success');
  };

  return (
    <Screen
      testID="appliances-screen"
      header={
        <ScreenHeader
          title="Artefactos"
          subtitle="Auditor del Hogar"
          trailing={<ConnectionPill />}
        />
      }
    >
      <HouseholdHeroCard summary={summary} />

      <Card style={styles.infoCard}>
        <AppText variant="caption" tone="secondary">
          💡 Esta calculadora no necesita sensores: estima con precisión matemática cuánto dinero gasta cada electrodoméstico según su potencia y horas de uso con la tarifa oficial de SETAR (~{formatNumber(ratePerKWh)} Bs/kWh).
        </AppText>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <SectionHeader
          title="Mis Electrodomésticos"
          description="Ajusta las horas de uso diario para ver el impacto en tu factura."
        />
      </View>

      <View style={styles.filtersScroll} accessibilityRole="tablist" accessibilityLabel="Filtrar por categoría">
        {FILTER_OPTIONS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            selected={activeFilter === f.id}
            onPress={() => setActiveFilter(f.id)}
          />
        ))}
      </View>

      <View style={styles.cardsList}>
        {filteredItems.map((consumption) => (
          <ApplianceCard
            key={consumption.item.id}
            consumption={consumption}
            onUpdate={(changes) => updateAppliance(consumption.item.id, changes)}
          />
        ))}
      </View>

      <View style={styles.footerActions}>
        <Button
          label="Restablecer artefactos sugeridos"
          variant="secondary"
          icon="refresh"
          onPress={handleReset}
          testID="reset-appliances-button"
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  infoCard: {
    backgroundColor: theme.colors.surfaceMuted,
    padding: spacing.md,
  },
  sectionHeaderRow: {
    marginTop: spacing.xs,
  },
  filtersScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardsList: {
    gap: spacing.md,
  },
  footerActions: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
}));
