/**
 * AhorraTech - Limits & Budget Styles
 * Hoja de estilos desacoplada para la pantalla de control presupuestario y sobrecarga.
 */

import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const limitsStyles = StyleSheet.create({
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
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: colors.brand.telemetryCyan,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  presetTextActive: {
    color: colors.brand.telemetryCyan,
    fontWeight: '800',
  },
  conversionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  conversionLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  conversionValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.telemetryCyan,
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  thresholdBtnActive: {
    borderColor: colors.brand.telemetryCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  thresholdTextActive: {
    color: colors.brand.telemetryCyan,
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
