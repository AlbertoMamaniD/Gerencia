/**
 * AhorraTech - AnalyticsDeck Component
 * Panel interactivo de analíticas eléctricas con conmutador segmentado
 * entre Potencia en Tiempo Real (Watts) e Historial Semanal (Bs),
 * adaptado responsivamente a cualquier resolución y densidad de pantalla.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ConsumptionLineChart } from '../charts/ConsumptionLineChart';
import { WeeklyBarChart } from '../charts/WeeklyBarChart';
import { LivePowerPoint, DailyConsumption } from '../../types/energy.types';
import { dashboardStyles } from '../../styles/dashboard.styles';

interface AnalyticsDeckProps {
  powerHistory: LivePowerPoint[];
  dailyHistory: DailyConsumption[];
  maxPowerThresholdW: number;
  dailyBudgetBs: number;
}

export const AnalyticsDeck: React.FC<AnalyticsDeckProps> = ({
  powerHistory,
  dailyHistory,
  maxPowerThresholdW,
  dailyBudgetBs,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'weekly'>('live');
  const [deckWidth, setDeckWidth] = useState<number>(0);

  const handleTabChange = (tab: 'live' | 'weekly') => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - deckWidth) > 5) {
      setDeckWidth(width);
    }
  };

  const calculatedChartWidth = deckWidth > 64 ? deckWidth - 36 : undefined;

  return (
    <View style={dashboardStyles.analyticsDeckContainer} onLayout={handleLayout}>
      <View style={dashboardStyles.segmentedHeader}>
        <View style={dashboardStyles.segmentedTitleCol}>
          <Text style={dashboardStyles.segmentedTitle}>
            {activeTab === 'live' ? 'Curva de Potencia Activa' : 'Consumo Diario Semanal'}
          </Text>
          <Text style={dashboardStyles.segmentedSubtitle}>
            {activeTab === 'live'
              ? 'Últimas 20 muestras continuas (W)'
              : 'Gasto acumulado por jornada en Bs'}
          </Text>
        </View>

        {/* Conmutador Segmentado de Alta Precisión */}
        <View style={dashboardStyles.tabSwitcher}>
          <TouchableOpacity
            style={[
              dashboardStyles.tabSwitchBtn,
              activeTab === 'live' && dashboardStyles.tabSwitchBtnActive,
            ]}
            onPress={() => handleTabChange('live')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                dashboardStyles.tabSwitchText,
                activeTab === 'live' && dashboardStyles.tabSwitchTextActive,
              ]}
            >
              EN VIVO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dashboardStyles.tabSwitchBtn,
              activeTab === 'weekly' && dashboardStyles.tabSwitchBtnActive,
            ]}
            onPress={() => handleTabChange('weekly')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                dashboardStyles.tabSwitchText,
                activeTab === 'weekly' && dashboardStyles.tabSwitchTextActive,
              ]}
            >
              7 DÍAS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={dashboardStyles.chartContainer}>
        {activeTab === 'live' ? (
          <ConsumptionLineChart
            data={powerHistory}
            maxPowerThresholdW={maxPowerThresholdW}
            chartWidth={calculatedChartWidth}
          />
        ) : (
          <WeeklyBarChart
            data={dailyHistory}
            dailyBudgetBs={dailyBudgetBs}
            chartWidth={calculatedChartWidth}
          />
        )}
      </View>
    </View>
  );
};
