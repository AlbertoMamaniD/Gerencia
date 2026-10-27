/**
 * AhorraTech - Control de Presupuesto & Límites Eléctricos
 * Configuración de tope mensual en Bs, conversión automática a kWh y umbrales de seguridad.
 * Estilos completamente desacoplados en src/styles/limits.styles.ts.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Header } from '../../src/components/layout/Header';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useEnergyStore } from '../../src/store/useEnergyStore';
import { budgetBsToKWh } from '../../src/utils/calculations';
import { formatCurrency, formatEnergy } from '../../src/utils/formatters';
import { limitsStyles } from '../../src/styles/limits.styles';
import { colors } from '../../src/theme/colors';

export default function LimitsScreen() {
  const budgetConfig = useEnergyStore((s) => s.budgetConfig);
  const updateBudgetConfig = useEnergyStore((s) => s.updateBudgetConfig);

  const [monthlyBudgetBs, setMonthlyBudgetBs] = useState(String(budgetConfig.monthlyBudgetBs));
  const [warningThresholdPct, setWarningThresholdPct] = useState(budgetConfig.warningThresholdPct);
  const [maxPowerThresholdW, setMaxPowerThresholdW] = useState(String(budgetConfig.maxPowerThresholdW));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const numBudgetBs = parseFloat(monthlyBudgetBs) || 0;
  const numPowerW = parseFloat(maxPowerThresholdW) || 0;
  const equivalentKWh = budgetBsToKWh(numBudgetBs, budgetConfig.ratePerKWh);
  const equivalentAmps = numPowerW > 0 ? (numPowerW / 220).toFixed(1) : '0';

  const presets = [100, 150, 200, 300, 500];
  const warningOptions = [70, 75, 80, 85, 90];

  const handleSave = () => {
    updateBudgetConfig({
      monthlyBudgetBs: numBudgetBs > 0 ? numBudgetBs : budgetConfig.monthlyBudgetBs,
      warningThresholdPct,
      maxPowerThresholdW: numPowerW > 0 ? numPowerW : budgetConfig.maxPowerThresholdW,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <ScreenWrapper
      header={<Header showLogo={false} title="Límites & Presupuesto" subtitle="Control Financiero y Protección Eléctrica" />}
    >
      {/* 1. Panel: Presupuesto Mensual en Bolivianos */}
      <View style={limitsStyles.panel}>
        <View style={limitsStyles.panelHeaderRow}>
          <View style={limitsStyles.panelHeaderLeft}>
            <Feather name="dollar-sign" size={16} color={colors.brand.electricBlue} />
            <Text style={limitsStyles.panelTitle}>PRESUPUESTO MENSUAL MÁXIMO</Text>
          </View>
          <Badge label={`${budgetConfig.ratePerKWh} Bs/kWh`} variant="info" />
        </View>
        <Text style={limitsStyles.panelDesc}>Monto tope en Bolivianos para el ciclo de facturación de 28 días.</Text>

        {/* Presets Rápidos */}
        <View style={limitsStyles.presetRow}>
          {presets.map((val) => {
            const isMatch = numBudgetBs === val;
            return (
              <TouchableOpacity
                key={val}
                style={[limitsStyles.presetBtn, isMatch && limitsStyles.presetBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMonthlyBudgetBs(String(val));
                }}
              >
                <Text style={[limitsStyles.presetText, isMatch && limitsStyles.presetTextActive]}>
                  Bs {val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Monto Personalizado"
          prefix="Bs"
          keyboardType="numeric"
          value={monthlyBudgetBs}
          onChangeText={setMonthlyBudgetBs}
        />

        <View style={limitsStyles.conversionBar}>
          <Text style={limitsStyles.conversionLabel}>Consumo eléctrico estimado:</Text>
          <Text style={limitsStyles.conversionValue}>≈ {formatEnergy(equivalentKWh)}</Text>
        </View>
      </View>

      {/* 2. Panel: Umbral de Alerta Preventiva */}
      <View style={limitsStyles.panel}>
        <View style={limitsStyles.panelHeaderRow}>
          <View style={limitsStyles.panelHeaderLeft}>
            <Feather name="bell" size={16} color={colors.status.warning} />
            <Text style={limitsStyles.panelTitle}>NOTIFICACIÓN PREVENTIVA</Text>
          </View>
          <Badge label={`${warningThresholdPct}% DEL CUPO`} variant="warning" />
        </View>
        <Text style={limitsStyles.panelDesc}>Dispara una alerta anticipada antes de agotar tu saldo mensual.</Text>
        <View style={limitsStyles.thresholdRow}>
          {warningOptions.map((pct) => {
            const isSelected = warningThresholdPct === pct;
            return (
              <TouchableOpacity
                key={pct}
                style={[limitsStyles.thresholdBtn, isSelected && limitsStyles.thresholdBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setWarningThresholdPct(pct);
                }}
              >
                <Text style={[limitsStyles.thresholdText, isSelected && limitsStyles.thresholdTextActive]}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={limitsStyles.thresholdDesc}>
          Se alertará al alcanzar {formatCurrency((numBudgetBs * warningThresholdPct) / 100)} de gasto.
        </Text>
      </View>

      {/* 3. Panel: Límite de Sobrecarga de Potencia */}
      <View style={limitsStyles.panel}>
        <View style={limitsStyles.panelHeaderRow}>
          <View style={limitsStyles.panelHeaderLeft}>
            <MaterialCommunityIcons name="shield-alert" size={18} color={colors.status.danger} />
            <Text style={limitsStyles.panelTitle}>PROTECCIÓN DE SOBRECARGA</Text>
          </View>
          <Badge label={`~${equivalentAmps} Amperios`} variant="danger" />
        </View>
        <Text style={limitsStyles.panelDesc}>Umbral en Watts para evitar saltos del disyuntor térmico domiciliario.</Text>
        <Input
          label="Potencia Máxima Simultánea"
          suffix="W"
          keyboardType="numeric"
          value={maxPowerThresholdW}
          onChangeText={setMaxPowerThresholdW}
          helperText={`A 220V nominal equivale a ~${equivalentAmps} A de carga continua.`}
        />
      </View>

      {saveSuccess && (
        <View style={limitsStyles.successContainer}>
          <Badge label="PARÁMETROS GUARDADOS SATISFACTORIAMENTE" variant="success" />
        </View>
      )}

      <Button label="Guardar Configuración de Límites" iconName="check" onPress={handleSave} style={limitsStyles.saveBtn} />
      <View style={limitsStyles.bottomSpacer} />
    </ScreenWrapper>
  );
}
