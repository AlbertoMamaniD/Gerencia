/**
 * AhorraTech - Calibration History Card
 * Componente modular para el historial de calibraciones ópticas en la nube.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MeterCaptureRecord } from '../../types/energy.types';
import { formatCurrency, formatEnergy, formatSpanishDate } from '../../utils/formatters';
import { scannerStyles } from '../../styles/scanner.styles';
import { colors } from '../../theme/colors';

interface CalibrationHistoryCardProps {
  captures: MeterCaptureRecord[];
}

export function CalibrationHistoryCard({ captures }: CalibrationHistoryCardProps) {
  return (
    <View style={scannerStyles.panelCard}>
      <Text style={scannerStyles.sectionTitle}>HISTORIAL DE CALIBRACIONES EN NUBE</Text>
      {captures.length === 0 ? (
        <Text style={scannerStyles.emptyHistoryText}>Aún no hay calibraciones registradas con foto.</Text>
      ) : (
        captures.slice(0, 5).map((item) => (
          <View key={item.id} style={scannerStyles.historyItem}>
            <View style={scannerStyles.historyLeft}>
              <View style={scannerStyles.historyIconWrap}>
                <Feather name="check" size={16} color={colors.brand.electricBlue} />
              </View>
              <View>
                <Text style={scannerStyles.historyDate}>{formatSpanishDate(new Date(item.timestamp))}</Text>
                <Text style={scannerStyles.historySerial}>{item.meterSerial}</Text>
              </View>
            </View>
            <View>
              <Text style={scannerStyles.historyKWh}>{formatEnergy(item.detectedKWh)}</Text>
              <Text style={scannerStyles.historyCost}>{formatCurrency(item.costBs)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
