/**
 * AhorraTech - Dashboard Screen Styles
 * Hoja de estilos desacoplada para la Consola Maestra de Presupuesto,
 * Matriz de Telemetría PZEM-004T y Deck de Analíticas.
 */

import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export const dashboardStyles = StyleSheet.create({
  // Consola Maestra de Presupuesto (Cockpit)
  cockpitContainer: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    backgroundColor: '#0A101D',
    overflow: 'hidden',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cockpitGradient: {
    padding: 18,
  },
  cockpitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cycleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cycleChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.telemetryCyan,
    marginRight: 6,
  },
  cycleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Sección Central de la Consola: Valor FinTech + Gauge
  cockpitHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDataColumn: {
    flex: 1,
    marginRight: 12,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    marginBottom: 4,
  },
  heroCurrency: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.telemetryCyan,
    marginRight: 4,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text.white,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroBudgetMeta: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  heroProjectionTag: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  heroProjectionText: {
    fontSize: 11,
    color: colors.brand.telemetryCyan,
    fontWeight: '600',
  },

  // Gauge circular miniatura integrado
  gaugeContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePctNumber: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  gaugePctLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Fila inferior de métricas integradas (Sin cajitas separadas)
  cockpitStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // Botón dockeado de Escaneo Fotográfico de Medidor
  scannerDockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 240, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scannerDockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scannerDockIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerDockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: -0.1,
  },
  scannerDockSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  scannerDockBadge: {
    backgroundColor: colors.brand.telemetryCyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  scannerDockBadgeText: {
    color: '#070B14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Matriz de Telemetría Eléctrica (TelemetryConsole)
  telemetryDeckContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#090F1C',
    overflow: 'hidden',
    marginVertical: 8,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  telemetryLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.success,
  },
  livePulseText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.success,
    letterSpacing: 0.3,
  },

  // Celdas de la Matriz 2x2
  matrixRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    flex: 1,
    padding: 14,
  },
  matrixCellRightBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  matrixCellBottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  cellLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  cellSubtext: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Fila horizontal de Energía Total Acumulada
  energyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 102, 255, 0.05)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  energyTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  energyTotalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  energyTotalSubtitle: {
    fontSize: 9,
    color: colors.text.muted,
  },
  energyTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.brand.telemetryCyan,
    fontVariant: ['tabular-nums'],
  },

  // Deck de Analíticas (Segmented Charts)
  analyticsDeckContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#090F1C',
    overflow: 'hidden',
    marginVertical: 8,
    padding: 16,
  },
  segmentedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  segmentedTitleCol: {
    flex: 1,
  },
  segmentedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.white,
    letterSpacing: -0.2,
  },
  segmentedSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tabSwitchBtnActive: {
    backgroundColor: colors.brand.electricBlue,
  },
  tabSwitchText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  tabSwitchTextActive: {
    color: colors.text.white,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  bottomSpacer: {
    height: 16,
  },
});
