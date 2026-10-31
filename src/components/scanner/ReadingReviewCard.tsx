import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, SectionHeader, TextField } from '@/components/ui';
import { calculateCostBs } from '@/domain/billing';
import { validateMeterReading } from '@/domain/validation';
import { OcrScanResult } from '@/services/ocr/meterOcrService';
import { formatEnergy, formatNumber, toInputValue } from '@/utils/formatters';
import { makeStyles, radius, spacing } from '@/theme';

interface ReadingReviewCardProps {
  result: OcrScanResult | null;
  currentMeterKWh: number;
  ratePerKWh: number;
  saving: boolean;
  onConfirm: (readingKWh: number) => void;
  onDiscard: () => void;
}

export const LOW_CONFIDENCE_PCT = 80;

/** El usuario revisa (y puede corregir) la lectura antes de calibrar. */
export function ReadingReviewCard({ result, currentMeterKWh, ratePerKWh, saving, onConfirm, onDiscard }: ReadingReviewCardProps) {
  const styles = useStyles();
  const [text, setText] = useState(result ? toInputValue(result.detectedKWh) : '');
  const [touched, setTouched] = useState(false);

  const validation = validateMeterReading(text);
  const value = validation.ok ? validation.value : null;
  const difference = value === null ? null : value - currentMeterKWh;
  const lowConfidence = result?.confidence !== null && result?.confidence !== undefined && result.confidence < LOW_CONFIDENCE_PCT;

  const handleConfirm = () => {
    if (saving) return;
    setTouched(true);
    if (value !== null) onConfirm(value);
  };

  return (
    <Card style={styles.card} testID="reading-review">
      <SectionHeader
        title={result ? 'Confirma la lectura' : 'Lectura manual'}
        description={result ? 'Compara con el display y corrige si hace falta.' : 'Escribe los números que muestra el medidor.'}
        trailing={
          result?.confidence != null ? (
            <Badge
              label={`Confianza ${formatNumber(result.confidence, 0)}%`}
              tone={lowConfidence ? 'warning' : 'success'}
            />
          ) : null
        }
      />

      {lowConfidence ? (
        <AppText variant="small" tone="warning">
          La foto no se leyó con claridad. Verifica cada dígito antes de confirmar.
        </AppText>
      ) : null}

      <TextField
        label="Lectura del medidor"
        suffix="kWh"
        keyboardType="decimal-pad"
        inputMode="decimal"
        value={text}
        onChangeText={setText}
        onBlur={() => setTouched(true)}
        returnKeyType="done"
        editable={!saving}
        onSubmitEditing={handleConfirm}
        error={touched && !validation.ok ? validation.error : null}
        testID="reading-input"
      />

      <View style={styles.summary}>
        <SummaryItem label="Lectura actual en la app" value={formatEnergy(currentMeterKWh, 1)} />
        <SummaryItem
          label="Diferencia"
          value={difference === null ? '—' : `${difference >= 0 ? '+' : '−'}${formatEnergy(Math.abs(difference), 1)}`}
        />
        {result?.meterSerial ? <SummaryItem label="N.º de serie" value={result.meterSerial} /> : null}
        <SummaryItem label="Valor a tarifa actual" value={value === null ? '—' : `Bs ${formatNumber(calculateCostBs(value, ratePerKWh))}`} />
      </View>

      <AppText variant="caption" tone="muted">
        Al confirmar, la app ajusta su lectura a la del medidor. El consumo ya medido en este ciclo no cambia.
      </AppText>

      <View style={styles.actions}>
        <Button label="Confirmar y calibrar" icon="check" onPress={handleConfirm} loading={saving} disabled={saving} testID="confirm-reading" />
        <Button label="Descartar" variant="ghost" onPress={onDiscard} disabled={saving} />
      </View>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.summaryItem}>
      <AppText variant="small" tone="muted" style={styles.summaryLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" tabular numberOfLines={1} style={styles.summaryValue}>
        {value}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    gap: spacing.md,
  },
  summary: {
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    flexShrink: 1,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
}));
