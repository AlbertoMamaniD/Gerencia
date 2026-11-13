import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Icon, IconCircle, SectionHeader } from '@/components/ui';
import { MeterCaptureRecord } from '@/domain/types';
import { formatDateTime, formatEnergy } from '@/utils/formatters';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface CaptureHistoryProps {
  captures: MeterCaptureRecord[];
  limit?: number;
}

export function CaptureHistory({ captures, limit = 5 }: CaptureHistoryProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [selectedCapture, setSelectedCapture] = useState<MeterCaptureRecord | null>(null);
  const visible = captures.slice(0, limit);

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Historial de Respaldo"
        description="Lecturas certificadas para control y reclamos ante SETAR"
      />

      {selectedCapture ? (
        <View style={styles.odecoModal}>
          <View style={styles.odecoHeader}>
            <IconCircle
              name="shield-check"
              color={colors.success}
              background={withAlpha(colors.success, 0.15)}
              size={32}
            />
            <View style={styles.odecoHeaderText}>
              <AppText variant="bodyStrong" color={colors.success}>
                Comprobante de Respaldo ODECO
              </AppText>
              <AppText variant="caption" tone="muted">
                Válido como prueba de lectura real
              </AppText>
            </View>
            <Pressable
              onPress={() => setSelectedCapture(null)}
              style={styles.closeOdeco}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar comprobante"
            >
              <Icon name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.odecoBody}>
            <View style={styles.odecoRow}>
              <AppText variant="small" tone="secondary">Lectura registrada:</AppText>
              <AppText variant="bodyStrong" tabular>{formatEnergy(selectedCapture.detectedKWh, 2)}</AppText>
            </View>
            <View style={styles.odecoRow}>
              <AppText variant="small" tone="secondary">Fecha y hora:</AppText>
              <AppText variant="small">{formatDateTime(selectedCapture.timestamp)}</AppText>
            </View>
            <View style={styles.odecoRow}>
              <AppText variant="small" tone="secondary">Nº Serie medidor:</AppText>
              <AppText variant="small">{selectedCapture.meterSerial ?? 'No especificado'}</AppText>
            </View>
            <View style={styles.odecoRow}>
              <AppText variant="small" tone="secondary">Método de captura:</AppText>
              <AppText variant="small">
                {selectedCapture.source === 'ocr' ? 'Foto con IA (Gemini)' : 'Ingreso manual'}
              </AppText>
            </View>
            {selectedCapture.confidence ? (
              <View style={styles.odecoRow}>
                <AppText variant="small" tone="secondary">Certeza óptica:</AppText>
                <AppText variant="small">{selectedCapture.confidence}%</AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.odecoFooterNote}>
            <AppText variant="caption" tone="secondary">
              🛡️ Si la factura de SETAR presenta un cobro excesivo o lectura estimada, presenta esta fecha y lectura en las oficinas de ODECO Tarija.
            </AppText>
          </View>
        </View>
      ) : null}

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <IconCircle name="history" color={colors.textMuted} background={colors.surfaceMuted} />
          <AppText variant="small" tone="muted" style={styles.emptyText}>
            Aún no tienes lecturas registradas. Toma una foto a tu medidor para crear tu primer respaldo.
          </AppText>
        </View>
      ) : (
        visible.map((capture, index) => {
          const source = capture.source === 'ocr' ? 'Leída por foto' : 'Ingresada a mano';
          const isSelected = selectedCapture?.id === capture.id;
          return (
            <Pressable
              key={capture.id}
              onPress={() => setSelectedCapture(isSelected ? null : capture)}
              style={[
                styles.row,
                index < visible.length - 1 && styles.divider,
                isSelected && styles.selectedRow,
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Lectura ${formatEnergy(capture.detectedKWh, 1)} del ${formatDateTime(capture.timestamp)}. Toca para ver comprobante de reclamo.`}
            >
              <IconCircle
                name={capture.cloudSynced ? 'cloud-check-outline' : 'cellphone-check'}
                color={capture.cloudSynced ? colors.success : colors.primary}
                background={capture.cloudSynced ? colors.successSoft : colors.primarySoft}
              />
              <View style={styles.text}>
                <AppText variant="bodyStrong" tabular>
                  {formatEnergy(capture.detectedKWh, 1)}
                </AppText>
                <AppText variant="small" tone="muted" numberOfLines={1}>
                  {formatDateTime(capture.timestamp)} · {source}
                </AppText>
              </View>
              <View style={styles.rowTrailing}>
                <AppText variant="caption" color={colors.primary}>
                  Ver respaldo
                </AppText>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </Pressable>
          );
        })
      )}
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    gap: spacing.xs,
  },
  odecoModal: {
    backgroundColor: withAlpha(theme.colors.success, 0.08),
    borderColor: withAlpha(theme.colors.success, 0.3),
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  odecoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  odecoHeaderText: {
    flex: 1,
  },
  closeOdeco: {
    padding: spacing.xs,
  },
  odecoBody: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  odecoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  odecoFooterNote: {
    borderTopWidth: 1,
    borderTopColor: withAlpha(theme.colors.success, 0.2),
    paddingTop: spacing.xs,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  selectedRow: {
    backgroundColor: withAlpha(theme.colors.primary, 0.06),
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
}));
