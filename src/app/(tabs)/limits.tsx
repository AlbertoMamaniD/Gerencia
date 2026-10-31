import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Banner, Button, Card, Chip, SectionHeader, TextField } from '@/components/ui';
import { budgetBsToKWh, wattsToAmps } from '@/domain/billing';
import { validateBudget, validateMaxPower } from '@/domain/validation';
import { vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatCurrency, formatEnergy, formatNumber, toInputValue } from '@/utils/formatters';
import { makeStyles, spacing } from '@/theme';

const BUDGET_PRESETS = [100, 150, 200, 300, 500];
const WARNING_OPTIONS = [70, 75, 80, 85, 90];

export default function LimitsScreen() {
  const styles = useStyles();
  const budget = useEnergyStore((s) => s.budget);
  const updateBudget = useEnergyStore((s) => s.updateBudget);

  const [budgetText, setBudgetText] = useState(toInputValue(budget.monthlyBudgetBs));
  const [warningPct, setWarningPct] = useState(budget.warningThresholdPct);
  const [powerText, setPowerText] = useState(toInputValue(budget.maxPowerThresholdW, 0));
  const [showErrors, setShowErrors] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  const budgetResult = validateBudget(budgetText);
  const powerResult = validateMaxPower(powerText);
  const budgetValue = budgetResult.ok ? budgetResult.value : null;
  const powerValue = powerResult.ok ? powerResult.value : null;

  const isDirty =
    budgetValue !== budget.monthlyBudgetBs ||
    warningPct !== budget.warningThresholdPct ||
    powerValue !== budget.maxPowerThresholdW;

  const handleSave = () => {
    setShowErrors(true);
    if (budgetValue === null || powerValue === null) {
      vibrate('warning');
      return;
    }
    updateBudget({ monthlyBudgetBs: budgetValue, warningThresholdPct: warningPct, maxPowerThresholdW: powerValue });
    vibrate('success');
    setShowErrors(false);
    setSaved(true);
  };

  return (
    <Screen
      testID="limits-screen"
      header={<ScreenHeader title="Presupuesto" subtitle="Límites y alertas" trailing={<ConnectionPill />} />}
      footer={
        <Button
          label={isDirty ? 'Guardar cambios' : 'Sin cambios'}
          icon="content-save-outline"
          onPress={handleSave}
          disabled={!isDirty}
          testID="save-limits"
        />
      }
    >
      {saved ? <Banner tone="success" title="Cambios guardados" message="Tus límites ya están activos." /> : null}

      <Card style={styles.card}>
        <SectionHeader title="Presupuesto mensual" description="Cuánto quieres gastar como máximo en cada ciclo." />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Montos sugeridos">
          {BUDGET_PRESETS.map((value) => (
            <Chip
              key={value}
              label={`Bs ${value}`}
              accessibilityLabel={`${value} bolivianos`}
              selected={budgetValue === value}
              onPress={() => setBudgetText(String(value))}
            />
          ))}
        </View>
        <TextField
          label="Otro monto"
          prefix="Bs"
          keyboardType="decimal-pad"
          inputMode="decimal"
          value={budgetText}
          onChangeText={setBudgetText}
          onBlur={() => setShowErrors(true)}
          error={showErrors && !budgetResult.ok ? budgetResult.error : null}
          helperText={
            budgetValue !== null
              ? `Equivale a ${formatEnergy(budgetBsToKWh(budgetValue, budget.ratePerKWh), 0)} a ${formatNumber(budget.ratePerKWh)} Bs/kWh.`
              : undefined
          }
          testID="budget-input"
        />
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Aviso anticipado" description="Te avisamos cuando llegues a este porcentaje del presupuesto." />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Porcentaje para el aviso">
          {WARNING_OPTIONS.map((pct) => (
            <Chip key={pct} label={`${pct}%`} selected={warningPct === pct} onPress={() => setWarningPct(pct)} />
          ))}
        </View>
        <AppText variant="small" tone="secondary">
          {budgetValue !== null
            ? `Recibirás el aviso al llegar a ${formatCurrency((budgetValue * warningPct) / 100)}.`
            : 'Ingresa un presupuesto válido para ver el monto del aviso.'}
        </AppText>
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title="Protección de sobrecarga"
          description="Alerta cuando la potencia supere este valor, antes de que salte la térmica."
        />
        <TextField
          label="Potencia máxima"
          suffix="W"
          keyboardType="number-pad"
          inputMode="numeric"
          value={powerText}
          onChangeText={setPowerText}
          onBlur={() => setShowErrors(true)}
          error={showErrors && !powerResult.ok ? powerResult.error : null}
          helperText={powerValue !== null ? `≈ ${formatNumber(wattsToAmps(powerValue), 1)} A a 220 V.` : undefined}
          testID="power-input"
        />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
}));
