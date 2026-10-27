/**
 * AhorraTech - Configuración Técnica & Hardware ESP32
 * Gestión de IP, enlace con microcontrolador PZEM-004T, tarifa en Bolivia y diagnóstico.
 * Modo Claro limpio sin referencias a simulador. Estilos en src/styles/settings.styles.ts.
 */

import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useEnergyStore } from '../../src/store/useEnergyStore';
import { useNotifications } from '../../src/hooks/useNotifications';
import { formatTime } from '../../src/utils/formatters';
import { settingsStyles } from '../../src/styles/settings.styles';
import { colors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const connection = useEnergyStore((s) => s.connection);
  const budgetConfig = useEnergyStore((s) => s.budgetConfig);
  const updateConnection = useEnergyStore((s) => s.updateConnection);
  const updateBudgetConfig = useEnergyStore((s) => s.updateBudgetConfig);
  const resetBillingCycle = useEnergyStore((s) => s.resetBillingCycle);
  const { sendTestNotification } = useNotifications();

  const [ipAddress, setIpAddress] = useState(connection.ipAddress);
  const [geminiApiKey, setGeminiApiKey] = useState(connection.geminiApiKey || '');
  const [ratePerKWh, setRatePerKWh] = useState(String(budgetConfig.ratePerKWh));
  const [cycleStartDay, setCycleStartDay] = useState(String(budgetConfig.billingCycleStartDay));
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveNetwork = () => {
    const numRate = parseFloat(ratePerKWh) || budgetConfig.ratePerKWh;
    const numDay = parseInt(cycleStartDay, 10) || budgetConfig.billingCycleStartDay;
    updateConnection({ ipAddress: ipAddress.trim(), geminiApiKey: geminiApiKey.trim() });
    updateBudgetConfig({ ratePerKWh: numRate, billingCycleStartDay: Math.min(28, Math.max(1, numDay)) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStatusMsg('Configuración técnica guardada');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleResetCycle = () => {
    Alert.alert(
      'Reiniciar Ciclo de Facturación',
      '¿Deseas reiniciar los acumuladores de energía para el nuevo mes? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            resetBillingCycle();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            setStatusMsg('Ciclo reiniciado con éxito');
            setTimeout(() => setStatusMsg(null), 3000);
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      header={<Header showLogo={false} title="Ajustes Técnicos" subtitle="Hardware ESP32 & Parámetros Eléctricos" />}
    >
      {/* 1. Panel de Estado de Enlace Hardware */}
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="chip" size={16} color={colors.brand.electricBlue} />
            <Text style={settingsStyles.panelTitle}>SISTEMA DE TELEMETRÍA IOT</Text>
          </View>
          <Badge label={connection.isConnected ? 'EN LÍNEA' : 'STANDBY'} variant={connection.isConnected ? 'success' : 'warning'} />
        </View>
        <Text style={settingsStyles.panelDesc}>
          Recepción activa de mediciones PZEM-004T con muestreo continuo a 1 Hz.
        </Text>
        <Input
          label="Dirección IP del Microcontrolador"
          prefix="http://"
          placeholder="192.168.4.1"
          value={ipAddress}
          onChangeText={setIpAddress}
          helperText="Ruta REST: /api/telemetry (Polling cada 2000 ms)"
        />
        <Input
          label="Google Gemini Vision API Key (Gratis)"
          placeholder="AIzaSy..."
          secureTextEntry
          value={geminiApiKey}
          onChangeText={setGeminiApiKey}
          helperText="Clave gratuita de aistudio.google.com para escaneo con IA"
        />
        <View style={settingsStyles.hardwareInfoRow}>
          <Text style={settingsStyles.infoLabel}>Última Sincronización:</Text>
          <Text style={settingsStyles.infoVal}>{connection.lastSyncTime ? formatTime(connection.lastSyncTime) : 'Sincronizado'}</Text>
        </View>
        {connection.rssi && (
          <View style={settingsStyles.hardwareInfoRow}>
            <Text style={settingsStyles.infoLabel}>Intensidad de Señal WiFi (RSSI):</Text>
            <Text style={settingsStyles.infoVal}>{connection.rssi} dBm</Text>
          </View>
        )}
      </View>

      {/* 2. Panel Parámetros de Facturación Regulada en Bolivia */}
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <Feather name="file-text" size={16} color={colors.status.warning} />
            <Text style={settingsStyles.panelTitle}>PARÁMETROS DE FACTURACIÓN (BOLIVIA)</Text>
          </View>
        </View>
        <Input
          label="Tarifa Residencial Regulada"
          prefix="Bs"
          suffix="/ kWh"
          keyboardType="numeric"
          value={ratePerKWh}
          onChangeText={setRatePerKWh}
          helperText="Tarifa base de distribuidora (ej. 0.85 Bs/kWh)"
        />
        <Input
          label="Día de Inicio de Ciclo"
          suffix="de cada mes"
          keyboardType="numeric"
          value={cycleStartDay}
          onChangeText={setCycleStartDay}
          helperText="Día en que la empresa distribuidora realiza el corte tarifario"
        />
      </View>

      {statusMsg && (
        <View style={settingsStyles.statusMsgContainer}>
          <Badge label={statusMsg.toUpperCase()} variant="success" />
        </View>
      )}

      <Button label="Guardar Parámetros Técnicos" iconName="save" onPress={handleSaveNetwork} style={settingsStyles.actionBtn} />
      <Button label="Probar Notificación de Alerta" iconName="bell" variant="outline" onPress={sendTestNotification} style={settingsStyles.actionBtn} />
      <Button label="Reiniciar Ciclo de Facturación" iconName="refresh-cw" variant="danger" onPress={handleResetCycle} style={settingsStyles.actionBtn} />
      <View style={settingsStyles.bottomSpacer} />
    </ScreenWrapper>
  );
}
