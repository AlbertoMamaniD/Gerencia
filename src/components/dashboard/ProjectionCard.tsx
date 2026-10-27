/**
 * AhorraTech - ProjectionCard Component
 * Tarjeta de estimación financiera de factura en Bolivianos (Bs) a fin de ciclo.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FinancialProjection } from '../../types/energy.types';
import { colors } from '../../theme/colors';
import { formatCurrency, formatEnergy } from '../../utils/formatters';

interface ProjectionCardProps {
  projection: FinancialProjection;
  monthlyBudgetBs: number;
}

export const ProjectionCard: React.FC<ProjectionCardProps> = ({
  projection,
  monthlyBudgetBs,
}) => {
  const isOver = projection.projectedCostBs > monthlyBudgetBs && monthlyBudgetBs > 0;
  const cardVariant = isOver ? 'warning' : 'default';

  return (
    <Card variant={cardVariant} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>Proyección de Factura Fin de Mes</Text>
          <Text style={styles.subtitle}>
            Estimación basada en el ritmo de consumo actual
          </Text>
        </View>
        <Badge
          label={isOver ? 'RIESGO DE EXCESO' : 'PROYECCIÓN ÓPTIMA'}
          variant={isOver ? 'warning' : 'success'}
        />
      </View>

      <View style={styles.mainProjectionRow}>
        <View>
          <Text style={styles.amountLabel}>Total Estimado a Pagar</Text>
          <Text style={[styles.projectedAmount, isOver && styles.projectedWarning]}>
            {formatCurrency(projection.projectedCostBs)}
          </Text>
          <Text style={styles.energyProjected}>
            ~ {formatEnergy(projection.projectedEnergyKWh)} estimados
          </Text>
        </View>

        <View style={styles.daysBadge}>
          <Feather name="calendar" size={16} color={colors.brand.telemetryCyan} />
          <Text style={styles.daysText}>{projection.daysRemainingInCycle} días</Text>
          <Text style={styles.daysSub}>para fin de ciclo</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsFooter}>
        <View style={styles.metricItem}>
          <Text style={styles.metricSub}>Ritmo Diario Promedio</Text>
          <Text style={styles.metricVal}>
            {formatCurrency(projection.averageDailyCostBs)} / día
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricSub}>
            {isOver ? 'Exceso Estimado' : 'Margen Disponible'}
          </Text>
          <Text
            style={[
              styles.metricVal,
              { color: isOver ? colors.status.warning : colors.status.success },
            ]}
          >
            {isOver
              ? `+ ${formatCurrency(projection.projectedOverBudgetBs)}`
              : formatCurrency(Math.max(0, monthlyBudgetBs - projection.projectedCostBs))}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  mainProjectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  projectedAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.brand.telemetryCyan,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  projectedWarning: {
    color: colors.status.warning,
  },
  energyProjected: {
    fontSize: 12,
    color: colors.text.muted,
  },
  daysBadge: {
    backgroundColor: colors.background.subtle,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minWidth: 90,
  },
  daysText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  daysSub: {
    fontSize: 9,
    color: colors.text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 12,
  },
  metricsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricSub: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
});
