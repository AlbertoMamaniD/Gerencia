/**
 * AhorraTech - Configuración Técnica & Hardware ESP32
 * Gestión de IP, alternancia Simulación vs Hardware, tarifa Bs/kWh y test de notificaciones.
 * Estilos desacoplados en src/styles/settings.styles.ts.
 */

import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
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
  const [ratePerKWh, setRatePerKWh] = useState(String(budgetConfig.ratePerKWh));
  const [cycleStartDay, setCycleStartDay] = useState(String(budgetConfig.billingCycleStartDay));
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isSim = connection.mode === 'simulation';

  const handleToggleMode = (val: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    updateConnection({ mode: val ? 'simulation' : 'hardware' });
  };

  const handleSaveNetwork = () => {
    const numRate = parseFloat(ratePerKWh) || budgetConfig.ratePerKWh;
    const numDay = parseInt(cycleStartDay, 10) || budgetConfig.billingCycleStartDay;
    updateConnection({ ipAddress: ipAddress.trim() });
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
      {/* 1. Panel de Modo de Operación */}
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.switchRow}>
          <View style={settingsStyles.switchLabelCol}>
            <Text style={settingsStyles.panelTitle}>MODO DE TELEMETRÍA</Text>
            <Text style={settingsStyles.panelDesc}>
              {isSim ? 'Simulador físico residencial activo' : 'Conectando a microcontrolador ESP32'}
            </Text>
          </View>
          <Switch
            value={isSim}
            onValueChange={handleToggleMode}
            trackColor={{ false: colors.brand.electricBlue, true: colors.brand.telemetryCyan }}
            thumbColor={colors.text.white}
          />
        </View>
        <Badge
          label={isSim ? 'MODO SIMULACIÓN ACTIVO' : 'MODO HARDWARE REAL'}
          variant={isSim ? 'info' : 'success'}
          style={settingsStyles.modeBadge}
        />
      </View>

      {/* 2. Panel Conexión ESP32 */}
      <View style={settingsStyles.panel}>
        <View style={settingsStyles.panelHeaderRow}>
          <View style={settingsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="chip" size={16} color={colors.brand.telemetryCyan} />
            <Text style={settingsStyles.panelTitle}>MICROCONTROLADOR ESP32 + PZEM-004T</Text>
          </View>
        </View>
        <Input
          label="Dirección IP de Enlace"
          prefix="http://"
          placeholder="192.168.4.1"
          value={ipAddress}
          onChangeText={setIpAddress}
          editable={!isSim}
          helperText="Endpoint: /api/telemetry (Polling cada 2000 ms)"
        />
        <View style={settingsStyles.hardwareInfoRow}>
          <Text style={settingsStyles.infoLabel}>Última Sincronización:</Text>
          <Text style={settingsStyles.infoVal}>{connection.lastSyncTime ? formatTime(connection.lastSyncTime) : 'Sin enlace'}</Text>
        </View>
        {connection.rssi && (
          <View style={settingsStyles.hardwareInfoRow}>
            <Text style={settingsStyles.infoLabel}>Intensidad de Señal WiFi (RSSI):</Text>
            <Text style={settingsStyles.infoVal}>{connection.rssi} dBm</Text>
          </View>
        )}
      </View>

      {/* 3. Panel Parámetros de Facturación Regulada */}
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
          helperText="Tarifa promedio CRE / DELAPAZ (ej. 0.85 Bs/kWh)"
        />
        <Input
          label="Día de Inicio de Ciclo"
          suffix="de cada mes"
          keyboardType="numeric"
          value={cycleStartDay}
          onChangeText={setCycleStartDay}
          helperText="Fecha en que la empresa distribuidora toma la lectura oficial"
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
