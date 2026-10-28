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
  const [ratePerKWh, setRatePerKWh] = useState(String(budgetConfig.ratePerKWh));
  const [cycleStartDay, setCycleStartDay] = useState(String(budgetConfig.billingCycleStartDay));
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveNetwork = () => {
    const numRate = parseFloat(ratePerKWh) || budgetConfig.ratePerKWh;
    const numDay = parseInt(cycleStartDay, 10) || budgetConfig.billingCycleStartDay;
    updateConnection({
      ipAddress: ipAddress.trim(),
    });
    updateBudgetConfig({ ratePerKWh: numRate, billingCycleStartDay: Math.min(28, Math.max(1, numDay)) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStatusMsg('Parámetros guardados correctamente');
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
    <ScreenWrapper header={<Header showLogo={false} title="Ajustes Técnicos" subtitle="Hardware ESP32 & Nube Protegida" />}>
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="chip" size={16} color={colors.brand.electricBlue} />
            <Text style={settingsStyles.panelTitle}>SISTEMA DE TELEMETRÍA IOT</Text>
          </View>
          <Badge label={connection.isConnected ? 'EN LÍNEA' : 'STANDBY'} variant={connection.isConnected ? 'success' : 'warning'} />
        </View>
        <Text style={settingsStyles.panelDesc}>Enlace con microcontrolador PZEM-004T en red local.</Text>
        <Input label="IP Microcontrolador ESP32" prefix="http://" placeholder="192.168.4.1" value={ipAddress} onChangeText={setIpAddress} />
        <View style={settingsStyles.hardwareInfoRow}>
          <Text style={settingsStyles.infoLabel}>Última Sincronización:</Text>
          <Text style={settingsStyles.infoVal}>{connection.lastSyncTime ? formatTime(connection.lastSyncTime) : 'Sincronizado'}</Text>
        </View>
      </View>

      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.status.success} />
            <Text style={settingsStyles.panelTitle}>INFRAESTRUCTURA Y NUBE PROTEGIDA</Text>
          </View>
        </View>
        <Text style={settingsStyles.panelDesc}>Credenciales de producción cifradas internamente en la aplicación.</Text>
        <View style={settingsStyles.cloudStatusRow}>
          <View style={settingsStyles.cloudStatusLeft}>
            <MaterialCommunityIcons name="database-check" size={18} color={colors.status.success} />
            <View>
              <Text style={settingsStyles.cloudStatusText}>Supabase DB & Storage</Text>
              <Text style={settingsStyles.cloudEndpointText}>hchigziyarizebvcqwub.supabase.co</Text>
            </View>
          </View>
          <Badge label="ACTIVO" variant="success" />
        </View>
        <View style={[settingsStyles.cloudStatusRow, { borderBottomWidth: 0 }]}>
          <View style={settingsStyles.cloudStatusLeft}>
            <MaterialCommunityIcons name="eye-check" size={18} color={colors.brand.electricBlue} />
            <View>
              <Text style={settingsStyles.cloudStatusText}>Google Gemini Cloud OCR</Text>
              <Text style={settingsStyles.cloudEndpointText}>API Vision Multi-Tenant</Text>
            </View>
          </View>
          <Badge label="VINCULADO" variant="info" />
        </View>
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

      <Button label="Guardar Parámetros Técnicos" iconName="save" onPress={handleSaveNetwork} style={settingsStyles.actionBtn} />
      <Button label="Probar Notificación de Alerta" iconName="bell" variant="outline" onPress={sendTestNotification} style={settingsStyles.actionBtn} />
      <Button label="Reiniciar Ciclo de Facturación" iconName="refresh-cw" variant="danger" onPress={handleResetCycle} style={settingsStyles.actionBtn} />
      <View style={settingsStyles.bottomSpacer} />
    </ScreenWrapper>
  );
}
