/**
 * AhorraTech - Pestaña de Escáner Óptico & Calibración de Medidor (OCR)
 * Integrado con servicio de visión computacional y sincronización con ESP32.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useEnergyStore } from '../../src/store/useEnergyStore';
import { processMeterImage, OcrScanResult } from '../../src/services/meterOcrService';
import { calculateCostBs } from '../../src/utils/calculations';
import { formatCurrency, formatEnergy, formatSpanishDate } from '../../src/utils/formatters';
import { scannerStyles } from '../../src/styles/scanner.styles';
import { colors } from '../../src/theme/colors';

export default function ScannerScreen() {
  const ratePerKWh = useEnergyStore((s) => s.budgetConfig.ratePerKWh);
  const currentEnergy = useEnergyStore((s) => s.liveReading.energy);
  const meterCaptures = useEnergyStore((s) => s.meterCaptures);
  const addMeterCapture = useEnergyStore((s) => s.addMeterCapture);
  const calibrateEnergyFromMeter = useEnergyStore((s) => s.calibrateEnergyFromMeter);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<OcrScanResult | null>(null);

  const laserY = useSharedValue(0);
  useEffect(() => {
    laserY.value = isScanning
      ? withRepeat(withTiming(190, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true)
      : 0;
  }, [isScanning]);
  const laserStyle = useAnimatedStyle(() => ({ transform: [{ translateY: laserY.value }] }));

  const runOcrAnalysis = async (uri: string) => {
    setSelectedImage(uri);
    setIsScanning(true);
    setScanResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const result = await processMeterImage(uri, currentEnergy);
      setScanResult(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error OCR', 'No se pudo procesar la imagen del medidor.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTakePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert('Permiso', 'Se necesita acceso a la cámara para escanear.');
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, aspect: [4, 3] });
    if (!res.canceled && res.assets[0]?.uri) runOcrAnalysis(res.assets[0].uri);
  };

  const handlePickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
    if (!res.canceled && res.assets[0]?.uri) runOcrAnalysis(res.assets[0].uri);
  };

  const handleSyncData = () => {
    if (!scanResult) return;
    const costBs = calculateCostBs(scanResult.detectedKWh, ratePerKWh);
    addMeterCapture({
      id: `capture-${Date.now()}`,
      imageUri: selectedImage || '',
      detectedKWh: scanResult.detectedKWh,
      costBs,
      timestamp: Date.now(),
      meterSerial: scanResult.meterSerial,
      confidence: scanResult.confidence,
      status: 'calibrated',
    });
    calibrateEnergyFromMeter(scanResult.detectedKWh);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('✅ Medidor Calibrado', `Lectura: ${formatEnergy(scanResult.detectedKWh)} (${formatCurrency(costBs)}).`);
  };

  const diffKWh = scanResult ? Number((scanResult.detectedKWh - currentEnergy).toFixed(2)) : 0;

  return (
    <ScreenWrapper header={<Header showLogo={false} title="Escáner de Medidor" subtitle="Calibración Óptica con Foto (OCR)" />}>
      <View style={scannerStyles.panelCard}>
        <View style={scannerStyles.sectionTitleRow}>
          <Text style={scannerStyles.sectionTitle}>VISOR DE CAPTURA</Text>
          <Badge label="RECONOCIMIENTO ÓPTICO" variant="info" />
        </View>
        <Text style={scannerStyles.sectionDesc}>Fotografía el display numérico de tu medidor de luz para sincronizar.</Text>

        <View style={scannerStyles.viewfinderBox}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={scannerStyles.previewImage} />
          ) : (
            <View style={scannerStyles.viewfinderPlaceholder}>
              <MaterialCommunityIcons name="camera-metering-center" size={48} color={colors.brand.electricBlue} />
              <Text style={scannerStyles.placeholderText}>Enfoca los dígitos del medidor CRE / DELAPAZ / ELFEC</Text>
            </View>
          )}
          <View style={scannerStyles.cornerTopLeft} /><View style={scannerStyles.cornerTopRight} />
          <View style={scannerStyles.cornerBottomLeft} /><View style={scannerStyles.cornerBottomRight} />
          {isScanning && <Animated.View style={[scannerStyles.laserLine, laserStyle]} />}
        </View>

        {isScanning && (
          <View style={scannerStyles.detectionCard}>
            <Text style={scannerStyles.detectionTitle}>PROCESANDO RED NEURONAL OCR...</Text>
            <Text style={scannerStyles.placeholderText}>Aislando display LCD y reconociendo dígitos de consumo...</Text>
          </View>
        )}

        {scanResult && !isScanning && (
          <View style={scannerStyles.detectionCard}>
            <View style={scannerStyles.detectionHeader}>
              <Text style={scannerStyles.detectionTitle}>LECTURA RECONOCIDA</Text>
              <Badge label={`CONFIANZA ${scanResult.confidence}%`} variant="success" />
            </View>
            <View style={scannerStyles.mainKWhRow}>
              <Text style={scannerStyles.kwhNumber}>{formatEnergy(scanResult.detectedKWh)}</Text>
              <Text style={scannerStyles.costText}>{formatCurrency(calculateCostBs(scanResult.detectedKWh, ratePerKWh))}</Text>
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
            <Button label="Sincronizar y Calibrar App" iconName="check-circle" onPress={handleSyncData} style={scannerStyles.syncBtn} />
          </View>
        )}

        <View style={scannerStyles.buttonsRow}>
          <Button label="Tomar Foto" iconName="camera" onPress={handleTakePhoto} style={scannerStyles.actionBtnHalf} />
          <Button label="Galería" iconName="image" variant="secondary" onPress={handlePickGallery} style={scannerStyles.actionBtnHalf} />
        </View>
      </View>

      <View style={scannerStyles.panelCard}>
        <Text style={scannerStyles.sectionTitle}>HISTORIAL DE CALIBRACIONES</Text>
        {meterCaptures.length === 0 ? (
          <Text style={scannerStyles.emptyHistoryText}>Aún no hay calibraciones registradas con foto.</Text>
        ) : (
          meterCaptures.slice(0, 5).map((item) => (
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
      <View style={scannerStyles.bottomSpacer} />
    </ScreenWrapper>
  );
}
