import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LivePowerCard } from '@/components/dashboard/LivePowerCard';
import { TelemetryGrid } from '@/components/dashboard/TelemetryGrid';
import { AppText, Badge, Card, Icon, IconCircle } from '@/components/ui';
import { LivePowerPoint, PZEMReading } from '@/domain/types';
import { makeStyles, spacing, useTheme, withAlpha } from '@/theme';

interface CollapsibleTechnicalDetailsProps {
  reading: PZEMReading | null;
  powerHistory: LivePowerPoint[];
  meterKWh: number;
  cycleKWh: number;
  maxPowerW: number;
  lastSyncTime: number | null;
}

export function CollapsibleTechnicalDetails({
  reading,
  powerHistory,
  meterKWh,
  cycleKWh,
  maxPowerW,
  lastSyncTime,
}: CollapsibleTechnicalDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container} testID="technical-details-section">
      <Card style={styles.triggerCard}>
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.triggerPressable}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? 'Ocultar mediciones técnicas de sensores' : 'Ver mediciones técnicas de sensores'
          }
          accessibilityState={{ expanded }}
          testID="toggle-technical-details"
        >
          <IconCircle
            name="tune-vertical"
            color={colors.textSecondary}
            background={withAlpha(colors.textSecondary, 0.1)}
            size={38}
          />
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <AppText variant="title">Mediciones Técnicas</AppText>
              <Badge label="Sensores" tone="neutral" />
            </View>
            <AppText variant="caption" tone="muted">
              {expanded
                ? 'Tensión (V), corriente (A) y potencia instantánea (W)'
                : 'Toca para ver voltios, amperios y potencia en tiempo real'}
            </AppText>
          </View>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      </Card>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.technicalNotice}>
            <Icon name="information-outline" size={18} color={colors.primary} />
            <AppText variant="caption" tone="secondary" style={styles.technicalNoticeText}>
              Telemetría en tiempo real del sensor PZEM-004T. Monitorea la calidad de la red de SETAR y evita sobrecargas.
            </AppText>
          </View>
          <LivePowerCard
            history={powerHistory}
            currentPowerW={reading?.power ?? null}
            maxPowerW={maxPowerW}
          />
          <TelemetryGrid
            reading={reading}
            meterKWh={meterKWh}
            cycleKWh={cycleKWh}
            lastSyncTime={lastSyncTime}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    gap: spacing.md,
  },
  triggerCard: {
    padding: 0,
    overflow: 'hidden',
  },
  triggerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 64,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expandedContent: {
    gap: spacing.md,
  },
  technicalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: withAlpha(colors.primary, 0.08),
    padding: spacing.md,
    borderRadius: 12,
  },
  technicalNoticeText: {
    flex: 1,
  },
}));
