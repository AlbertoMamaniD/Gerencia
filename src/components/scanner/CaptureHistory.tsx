import { View } from 'react-native';
import { AppText, Card, IconCircle, SectionHeader } from '@/components/ui';
import { MeterCaptureRecord } from '@/domain/types';
import { formatDateTime, formatEnergy } from '@/utils/formatters';
import { makeStyles, spacing, useTheme } from '@/theme';

interface CaptureHistoryProps {
  captures: MeterCaptureRecord[];
  limit?: number;
}

export function CaptureHistory({ captures, limit = 5 }: CaptureHistoryProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const visible = captures.slice(0, limit);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Calibraciones" description="Últimas lecturas confirmadas" />
      {visible.length === 0 ? (
        <View style={styles.empty}>
          <IconCircle name="history" color={colors.textMuted} background={colors.surfaceMuted} />
          <AppText variant="small" tone="muted" style={styles.emptyText}>
            Aún no calibraste el medidor. Toma una foto para empezar.
          </AppText>
        </View>
      ) : (
        visible.map((capture, index) => {
          const source = capture.source === 'ocr' ? 'Leída por foto' : 'Ingresada a mano';
          const cloud = capture.cloudSynced ? 'en la nube' : 'solo en el teléfono';
          return (
            <View
              key={capture.id}
              style={[styles.row, index < visible.length - 1 && styles.divider]}
              accessible
              accessibilityLabel={`${formatEnergy(capture.detectedKWh, 1)}, ${formatDateTime(capture.timestamp)}. ${source}, guardada ${cloud}.`}
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
              <AppText variant="caption" tone={capture.cloudSynced ? 'success' : 'muted'}>
                {capture.cloudSynced ? 'Nube' : 'Local'}
              </AppText>
            </View>
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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
}));
