import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Badge, Banner, Button, Card, Chip, Icon, SectionHeader, TextField } from '@/components/ui';
import { budgetBsToKWh, roundTo } from '@/domain/billing';
import { validateBudget, validateMaxPower } from '@/domain/validation';
import { vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { formatCurrency, formatNumber, toInputValue } from '@/utils/formatters';
import { makeStyles, spacing, useTheme, withAlpha } from '@/theme';

const BUDGET_PRESETS = [100, 150, 200, 300, 500];
const WARNING_OPTIONS = [70, 75, 80, 85, 90];
const POWER_PRESETS = [
  { watts: 2200, label: 'Básico (2.200 W)' },
  { watts: 3500, label: 'Estándar (3.500 W)' },
  { watts: 5500, label: 'Intensivo (5.500 W)' },
];

export default function LimitsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
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
  const isDignidadTarget = budgetValue !== null && budgetBsToKWh(budgetValue, budget.ratePerKWh) <= 70;

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
      header={<ScreenHeader title="Presupuesto" subtitle="Control de gasto y alertas" trailing={<ConnectionPill />} />}
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
      {saved ? <Banner tone="success" title="Cambios guardados" message="Tu meta y alertas ya están activas." /> : null}

      <Card style={styles.card}>
        <SectionHeader
          title="Meta mensual de tu factura"
          description="¿Cuánto quieres pagar como máximo en tu próxima factura de SETAR?"
        />
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
              ? `Meta diaria: ~Bs ${formatNumber(roundTo(budgetValue / 30, 1))} al día para no pasarte.`
              : undefined
          }
          testID="budget-input"
        />

        {budgetValue !== null ? (
          <View style={[styles.infoBanner, isDignidadTarget ? styles.infoBannerSuccess : styles.infoBannerNeutral]}>
            <Icon
              name={isDignidadTarget ? 'star-circle-outline' : 'lightbulb-outline'}
              size={22}
              color={isDignidadTarget ? colors.success : colors.primary}
            />
            <View style={styles.infoBannerText}>
              <AppText variant="bodyStrong">
                {isDignidadTarget
                  ? '¡Excelente meta! Accedes a Tarifa Dignidad'
                  : `Aviso preventivo al alcanzar ${formatCurrency((budgetValue * warningPct) / 100)}`}
              </AppText>
              <AppText variant="small" tone="secondary">
                {isDignidadTarget
                  ? 'Al mantenerte debajo de 70 kWh (~Bs 59), SETAR te descuenta el 25% de tu factura.'
                  : `Te avisaremos al celular al llegar al ${warningPct}% para que cuides la luz y no te pases.`}
              </AppText>
            </View>
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title="Alerta antes de pasarte"
          description="¿A qué porcentaje de tu presupuesto quieres recibir la notificación de advertencia?"
        />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Porcentaje para el aviso">
          {WARNING_OPTIONS.map((pct) => (
            <Chip
              key={pct}
              label={pct === 80 ? '80% (Recomendado)' : `${pct}%`}
              accessibilityLabel={`${pct}%`}
              selected={warningPct === pct}
              onPress={() => setWarningPct(pct)}
            />
          ))}
        </View>
        <AppText variant="small" tone="secondary">
          {budgetValue !== null
            ? `Te avisaremos automáticamente al alcanzar ${formatCurrency((budgetValue * warningPct) / 100)} gastados en el mes.`
            : 'Ingresa un presupuesto válido para ver el momento del aviso.'}
        </AppText>
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title="Protección contra cortes de luz"
          description="Te avisa si enciendes demasiados aparatos a la vez, antes de que salte la palanca eléctrica."
          trailing={<Badge label="Opcional" tone="neutral" />}
        />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Perfiles de potencia sugeridos">
          {POWER_PRESETS.map((preset) => (
            <Chip
              key={preset.watts}
              label={preset.label}
              accessibilityLabel={preset.label}
              selected={powerValue === preset.watts}
              onPress={() => setPowerText(String(preset.watts))}
            />
          ))}
        </View>
        <TextField
          label="Límite en Watts"
          suffix="W"
          keyboardType="number-pad"
          inputMode="numeric"
          value={powerText}
          onChangeText={setPowerText}
          onBlur={() => setShowErrors(true)}
          error={showErrors && !powerResult.ok ? powerResult.error : null}
          helperText={
            powerValue !== null
              ? powerValue <= 2500
                ? 'Ideal para departamentos pequeños o consumo básico (luces, TV y heladera).'
                : powerValue <= 4000
                  ? 'Recomendado para casas con ducha eléctrica o aire acondicionado.'
                  : 'Para casas grandes, múltiples aires acondicionados o talleres.'
              : undefined
          }
          testID="power-input"
        />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoBannerNeutral: {
    backgroundColor: withAlpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  infoBannerSuccess: {
    backgroundColor: withAlpha(colors.success, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.success, 0.2),
  },
  infoBannerText: {
    flex: 1,
    gap: spacing.xs,
  },
}));
