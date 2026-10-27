/**
 * AhorraTech - Configuración Técnica, Hardware ESP32 & Nube Supabase
 * Gestión de IP, Gemini AI, Supabase Storage, tarifas en Bolivia y diagnóstico.
 * Líneas estrictamente < 180.
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
  const { updateConnection, updateBudgetConfig, resetBillingCycle } = useEnergyStore();
  const { sendTestNotification } = useNotifications();

  const [ipAddress, setIpAddress] = useState(connection.ipAddress);
  const [geminiApiKey, setGeminiApiKey] = useState(connection.geminiApiKey || '');
  const [supabaseUrl, setSupabaseUrl] = useState(connection.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(connection.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '');
  const [ratePerKWh, setRatePerKWh] = useState(String(budgetConfig.ratePerKWh));
  const [cycleStartDay, setCycleStartDay] = useState(String(budgetConfig.billingCycleStartDay));
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveNetwork = () => {
    const numRate = parseFloat(ratePerKWh) || budgetConfig.ratePerKWh;
    const numDay = parseInt(cycleStartDay, 10) || budgetConfig.billingCycleStartDay;
    updateConnection({
      ipAddress: ipAddress.trim(),
      geminiApiKey: geminiApiKey.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    updateBudgetConfig({ ratePerKWh: numRate, billingCycleStartDay: Math.min(28, Math.max(1, numDay)) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStatusMsg('Configuración técnica y nube guardadas');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleResetCycle = () => {
    Alert.alert(
      'Reiniciar Ciclo de Facturación',
      '¿Deseas reiniciar los acumuladores de energía para el nuevo mes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            resetBillingCycle();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            setStatusMsg('Ciclo reiniciado');
            setTimeout(() => setStatusMsg(null), 3000);
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper header={<Header showLogo={false} title="Ajustes Técnicos" subtitle="Hardware ESP32 & Nube Supabase" />}>
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="chip" size={16} color={colors.brand.electricBlue} />
            <Text style={settingsStyles.panelTitle}>SISTEMA DE TELEMETRÍA IOT</Text>
          </View>
          <Badge label={connection.isConnected ? 'EN LÍNEA' : 'STANDBY'} variant={connection.isConnected ? 'success' : 'warning'} />
        </View>
        <Text style={settingsStyles.panelDesc}>Enlace con microcontrolador PZEM-004T y Google Gemini Vision AI.</Text>
        <Input label="IP Microcontrolador" prefix="http://" placeholder="192.168.4.1" value={ipAddress} onChangeText={setIpAddress} />
        <Input label="Google Gemini API Key (Gratis)" placeholder="AIzaSy..." secureTextEntry value={geminiApiKey} onChangeText={setGeminiApiKey} />
        <View style={settingsStyles.hardwareInfoRow}>
          <Text style={settingsStyles.infoLabel}>Última Sincronización:</Text>
          <Text style={settingsStyles.infoVal}>{connection.lastSyncTime ? formatTime(connection.lastSyncTime) : 'Sincronizado'}</Text>
        </View>
      </View>

      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="cloud-upload" size={16} color={colors.brand.electricBlue} />
            <Text style={settingsStyles.panelTitle}>SUPABASE CLOUD (STORAGE & DB)</Text>
          </View>
        </View>
        <Text style={settingsStyles.panelDesc}>Subida de fotografías al bucket 'meter-photos' y tabla 'meter_scans'.</Text>
        <Input label="Supabase Project URL" placeholder="https://xyz.supabase.co" value={supabaseUrl} onChangeText={setSupabaseUrl} />
        <Input label="Supabase Anon Key" placeholder="eyJhbGciOi..." secureTextEntry value={supabaseAnonKey} onChangeText={setSupabaseAnonKey} />
      </View>

      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <Feather name="file-text" size={16} color={colors.status.warning} />
            <Text style={settingsStyles.panelTitle}>PARÁMETROS REGULADOS (BOLIVIA)</Text>
          </View>
        </View>
        <Input label="Tarifa Base Residencial" prefix="Bs" suffix="/ kWh" keyboardType="numeric" value={ratePerKWh} onChangeText={setRatePerKWh} />
        <Input label="Día Inicio de Ciclo" suffix="de cada mes" keyboardType="numeric" value={cycleStartDay} onChangeText={setCycleStartDay} />
      </View>

      {statusMsg && (
        <View style={settingsStyles.statusMsgContainer}>
          <Badge label={statusMsg.toUpperCase()} variant="success" />
        </View>
      )}

      <Button label="Guardar Parámetros y Nube" iconName="save" onPress={handleSaveNetwork} style={settingsStyles.actionBtn} />
      <Button label="Probar Notificación de Alerta" iconName="bell" variant="outline" onPress={sendTestNotification} style={settingsStyles.actionBtn} />
      <Button label="Reiniciar Ciclo de Facturación" iconName="refresh-cw" variant="danger" onPress={handleResetCycle} style={settingsStyles.actionBtn} />
      <View style={settingsStyles.bottomSpacer} />
    </ScreenWrapper>
  );
}
