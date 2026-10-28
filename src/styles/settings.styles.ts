/**
 * AhorraTech - Settings Styles
 * Hoja de estilos desacoplada para la pantalla de configuración técnica en Modo Claro.
 */

import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export const settingsStyles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
    marginVertical: 7,
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
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  panelDesc: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 12,
    lineHeight: 16,
  },
  hardwareInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.electricBlue,
    fontVariant: ['tabular-nums'],
  },
  statusMsgContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  cloudStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  cloudStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cloudEndpointText: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  actionBtn: {
    marginVertical: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
