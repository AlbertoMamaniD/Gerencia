/**
 * AhorraTech - Settings Styles
 * Hoja de estilos desacoplada para la pantalla de configuración técnica de hardware ESP32 y tarifas.
 */

import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const settingsStyles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#090F1C',
    overflow: 'hidden',
    marginVertical: 7,
    padding: 16,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.white,
    letterSpacing: -0.2,
  },
  panelDesc: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 12,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  modeBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  hardwareInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.telemetryCyan,
    fontVariant: ['tabular-nums'],
  },
  statusMsgContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  actionBtn: {
    marginVertical: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
