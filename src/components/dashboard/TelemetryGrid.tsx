/**
 * AhorraTech - TelemetryGrid Component
 * Consola de Instrumentación Eléctrica PZEM-004T de Alta Fidelidad.
 * Presenta una matriz integrada de 2x2 + franja de energía acumulada con bordes hairline,
 * tipografía tabular y telemetría de grado industrial sin cajitas genéricas flotantes.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  formatVoltage,
  formatCurrent,
  formatFrequency,
  formatPowerFactor,
  formatEnergy,
} from '../../utils/formatters';
import { dashboardStyles } from '../../styles/dashboard.styles';

interface TelemetryGridProps {
  voltage: number;
  current: number;
  frequency: number;
  powerFactor: number;
  energy: number;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  voltage,
  current,
  frequency,
  powerFactor,
  energy,
}) => {
  return (
    <View style={dashboardStyles.telemetryDeckContainer}>
      {/* Cabecera Técnica de Instrumentación */}
      <View style={dashboardStyles.telemetryHeader}>
        <View style={dashboardStyles.telemetryHeaderLeft}>
          <MaterialCommunityIcons name="chip" size={16} color={colors.brand.telemetryCyan} />
          <Text style={dashboardStyles.telemetryHeaderTitle}>
            TELEMETRÍA EN VIVO · PZEM-004T
          </Text>
        </View>
        <View style={dashboardStyles.telemetryLiveBadge}>
          <View style={dashboardStyles.livePulseDot} />
          <Text style={dashboardStyles.livePulseText}>SYNC 1000ms</Text>
        </View>
      </View>

      {/* Matriz 2x2 de Parámetros de Red */}
      <View style={dashboardStyles.matrixRow}>
        {/* Tensión */}
        <View style={[dashboardStyles.matrixCell, dashboardStyles.matrixCellRightBorder, dashboardStyles.matrixCellBottomBorder]}>
          <View style={dashboardStyles.cellLabelRow}>
            <Text style={dashboardStyles.cellLabel}>TENSIÓN</Text>
            <MaterialCommunityIcons name="sine-wave" size={16} color={colors.telemetry.voltage} />
          </View>
          <Text style={[dashboardStyles.cellValue, { color: colors.telemetry.voltage }]}>
            {formatVoltage(voltage)}
          </Text>
          <Text style={dashboardStyles.cellSubtext}>Nominal 220 V</Text>
        </View>

        {/* Corriente */}
        <View style={[dashboardStyles.matrixCell, dashboardStyles.matrixCellBottomBorder]}>
          <View style={dashboardStyles.cellLabelRow}>
            <Text style={dashboardStyles.cellLabel}>CORRIENTE</Text>
            <MaterialCommunityIcons name="current-ac" size={16} color={colors.telemetry.amp} />
          </View>
          <Text style={[dashboardStyles.cellValue, { color: colors.telemetry.amp }]}>
            {formatCurrent(current)}
          </Text>
          <Text style={dashboardStyles.cellSubtext}>Carga instantánea</Text>
        </View>
      </View>

      <View style={dashboardStyles.matrixRow}>
        {/* Frecuencia */}
        <View style={[dashboardStyles.matrixCell, dashboardStyles.matrixCellRightBorder]}>
          <View style={dashboardStyles.cellLabelRow}>
            <Text style={dashboardStyles.cellLabel}>FRECUENCIA</Text>
            <MaterialCommunityIcons name="pulse" size={16} color={colors.telemetry.hz} />
          </View>
          <Text style={[dashboardStyles.cellValue, { color: colors.telemetry.hz }]}>
            {formatFrequency(frequency)}
          </Text>
          <Text style={dashboardStyles.cellSubtext}>Estabilidad 50 Hz</Text>
        </View>

        {/* Factor de Potencia */}
        <View style={dashboardStyles.matrixCell}>
          <View style={dashboardStyles.cellLabelRow}>
            <Text style={dashboardStyles.cellLabel}>FACTOR COS φ</Text>
            <MaterialCommunityIcons name="cosine-wave" size={16} color={colors.telemetry.pf} />
          </View>
          <Text style={[dashboardStyles.cellValue, { color: colors.telemetry.pf }]}>
            {formatPowerFactor(powerFactor)}
          </Text>
          <Text style={dashboardStyles.cellSubtext}>
            {powerFactor >= 0.95 ? 'Excelente (≥0.95)' : 'Inductivo (<0.95)'}
          </Text>
        </View>
      </View>

      {/* Franja de Energía Activa Acumulada */}
      <View style={dashboardStyles.energyTotalRow}>
        <View style={dashboardStyles.energyTotalLeft}>
          <MaterialCommunityIcons name="lightning-bolt-circle" size={20} color={colors.brand.telemetryCyan} />
          <View>
            <Text style={dashboardStyles.energyTotalTitle}>ENERGÍA ACTIVA ACUMULADA</Text>
            <Text style={dashboardStyles.energyTotalSubtitle}>Lectura acumulada del sensor de red</Text>
          </View>
        </View>
        <Text style={dashboardStyles.energyTotalValue}>{formatEnergy(energy)}</Text>
      </View>
    </View>
  );
};
