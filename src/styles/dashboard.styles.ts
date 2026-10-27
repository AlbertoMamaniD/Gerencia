/**
 * AhorraTech - Dashboard Screen Styles
 * Hoja de estilos desacoplada para la Consola Maestra, Matriz de Telemetría
 * y Deck de Analíticas en Modo Claro Profesional (FinTech Light Theme).
 */

import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export const dashboardStyles = StyleSheet.create({
  // Consola Maestra de Presupuesto (Cockpit Light)
  cockpitContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cockpitGradient: {
    padding: 18,
    backgroundColor: colors.background.card,
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
    backgroundColor: colors.background.subtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cycleChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.electricBlue,
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
    color: colors.brand.electricBlue,
    marginRight: 4,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroBudgetMeta: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  heroProjectionTag: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  heroProjectionText: {
    fontSize: 11,
    color: colors.brand.electricBlue,
    fontWeight: '600',
  },

  // Gauge circular de precisión
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
    fontSize: 17,
    fontWeight: '900',
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

  // Fila inferior de métricas integradas
  cockpitStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border.subtle,
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
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerDockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  scannerDockSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  scannerDockBadge: {
    backgroundColor: colors.brand.electricBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  scannerDockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Matriz de Telemetría Eléctrica (TelemetryConsole)
  telemetryDeckContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
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
    borderRightColor: colors.border.subtle,
  },
  matrixCellBottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
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
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
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
    color: colors.brand.electricBlue,
    fontVariant: ['tabular-nums'],
  },

  // Deck de Analíticas (Segmented Charts)
  analyticsDeckContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
    marginVertical: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  segmentedSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.background.subtle,
    borderRadius: 10,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
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
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },
  bottomSpacer: {
    height: 16,
  },
});
