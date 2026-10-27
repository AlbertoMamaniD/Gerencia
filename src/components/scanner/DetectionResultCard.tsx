import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { OcrScanResult } from '../../services/meterOcrService';
import { calculateCostBs } from '../../utils/calculations';
import { formatCurrency, formatEnergy } from '../../utils/formatters';
import { scannerStyles } from '../../styles/scanner.styles';
import { colors } from '../../theme/colors';

interface DetectionResultCardProps {
  scanResult: OcrScanResult;
  diffKWh: number;
  ratePerKWh: number;
  isSyncing: boolean;
  onSync: () => void;
}

export function DetectionResultCard({
  scanResult,
  diffKWh,
  ratePerKWh,
  isSyncing,
  onSync,
}: DetectionResultCardProps) {
  return (
    <View style={scannerStyles.detectionCard}>
      <View style={scannerStyles.detectionHeader}>
        <Text style={scannerStyles.detectionTitle}>LECTURA RECONOCIDA</Text>
        <Badge label={`CONFIANZA ${scanResult.confidence}%`} variant="success" />
      </View>
      <View style={scannerStyles.mainKWhRow}>
        <Text style={scannerStyles.kwhNumber}>{formatEnergy(scanResult.detectedKWh)}</Text>
        <Text style={scannerStyles.costText}>
          {formatCurrency(calculateCostBs(scanResult.detectedKWh, ratePerKWh))}
        </Text>
      </View>
      <View style={scannerStyles.metaGrid}>
        <View>
          <Text style={scannerStyles.metaLabel}>Nº Serie</Text>
          <Text style={scannerStyles.metaVal}>{scanResult.meterSerial}</Text>
        </View>
        <View>
          <Text style={scannerStyles.metaLabel}>Diferencia</Text>
          <Text style={[scannerStyles.metaVal, { color: colors.brand.electricBlue }]}>
            {diffKWh >= 0 ? `+${diffKWh} kWh` : `${diffKWh} kWh`}
          </Text>
        </View>
      </View>
      <Button
        label={isSyncing ? 'Subiendo a Supabase...' : 'Sincronizar y Calibrar en Nube'}
        iconName="check-circle"
        onPress={onSync}
        disabled={isSyncing}
        style={scannerStyles.syncBtn}
      />
    </View>
  );
}
