/**
 * AhorraTech - Limits & Budget Styles
 * Hoja de estilos desacoplada para la pantalla de control presupuestario y sobrecarga en Modo Claro.
 */

import { StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export const limitsStyles = StyleSheet.create({
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
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.subtle,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    borderColor: colors.brand.electricBlue,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  presetTextActive: {
    color: colors.brand.electricBlue,
    fontWeight: '800',
  },
  conversionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  conversionLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  conversionValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.electricBlue,
    fontVariant: ['tabular-nums'],
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  thresholdBtn: {
    flex: 1,
    paddingVertical: 9,
    marginHorizontal: 3,
    backgroundColor: colors.background.subtle,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  thresholdBtnActive: {
    borderColor: colors.brand.electricBlue,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  thresholdTextActive: {
    color: colors.brand.electricBlue,
    fontWeight: '800',
  },
  thresholdDesc: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 6,
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  saveBtn: {
    marginTop: 12,
  },
  bottomSpacer: {
    height: 24,
  },
});
