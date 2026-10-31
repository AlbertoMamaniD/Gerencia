/**
 * Flujo del escáner de medidor:
 *   foto → (OCR si está configurado) → revisión por el usuario → calibración + respaldo en la nube.
 * La lectura siempre se confirma (y puede corregirse) antes de calibrar.
 */

import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { isOcrConfigured, isSupabaseConfigured } from '@/config/env';
import { calculateCostBs, roundTo } from '@/domain/billing';
import { OcrError, OcrScanResult, recognizeMeterReading } from '@/services/ocr/meterOcrService';
import { prepareImageForOcr } from '@/services/ocr/prepareImage';
import { uploadMeterScan } from '@/services/cloud/supabaseStorage';
import { vibrate } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';

export type ScanPhase = 'idle' | 'processing' | 'review' | 'saving';

export interface ScanFeedback {
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message?: string;
  /** Permite abrir los ajustes del sistema (permiso denegado). */
  action?: 'open-settings';
}

export interface MeterScanState {
  phase: ScanPhase;
  imageUri: string | null;
  result: OcrScanResult | null;
  feedback: ScanFeedback | null;
}

const INITIAL: MeterScanState = { phase: 'idle', imageUri: null, result: null, feedback: null };

export function useMeterScan() {
  const [state, setState] = useState<MeterScanState>(INITIAL);
  // Ignora resultados de un análisis anterior si el usuario ya empezó otro.
  const requestId = useRef(0);

  const analyze = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    const id = ++requestId.current;
    setState({ phase: 'processing', imageUri: asset.uri, result: null, feedback: null });

    if (!isOcrConfigured()) {
      setState({
        phase: 'review',
        imageUri: asset.uri,
        result: null,
        feedback: {
          tone: 'info',
          title: 'Ingresa la lectura manualmente',
          message: 'La lectura automática no está configurada en esta instalación.',
        },
      });
      return;
    }

    try {
      const prepared = await prepareImageForOcr(asset.uri, asset.width);
      const result = await recognizeMeterReading({ base64Image: prepared.base64 });
      if (id !== requestId.current) return;
      vibrate('success');
      setState({ phase: 'review', imageUri: prepared.uri, result, feedback: null });
    } catch (err) {
      if (id !== requestId.current) return;
      vibrate('warning');
      const message = err instanceof Error ? err.message : 'No se pudo procesar la imagen.';
      const title = err instanceof OcrError && err.code === 'not_a_meter' ? 'No es un medidor' : 'No se pudo leer el medidor';
      setState({ phase: 'idle', imageUri: asset.uri, result: null, feedback: { tone: 'danger', title, message } });
    }
  }, []);

  const pick = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setState((s) => ({
            ...s,
            feedback: {
              tone: 'warning',
              title: source === 'camera' ? 'Permiso de cámara necesario' : 'Permiso de fotos necesario',
              message: 'Actívalo en los ajustes del teléfono para fotografiar el medidor.',
              action: permission.canAskAgain ? undefined : 'open-settings',
            },
          }));
          return;
        }

        const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: true };
        const picked =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);
        const asset = picked.canceled ? undefined : picked.assets[0];
        if (asset?.uri) await analyze(asset);
      } catch {
        setState((s) => ({
          ...s,
          phase: 'idle',
          feedback: { tone: 'danger', title: 'No se pudo abrir la cámara o la galería.' },
        }));
      }
    },
    [analyze]
  );

  const startManualEntry = useCallback(() => {
    requestId.current++;
    setState((s) => ({ ...s, phase: 'review', result: null, feedback: null }));
  }, []);

  const discard = useCallback(() => {
    requestId.current++;
    setState(INITIAL);
  }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const confirm = useCallback(
    async (readingKWh: number) => {
      const store = useEnergyStore.getState();
      const previousKWh = store.ledger.meterKWh;
      const { imageUri, result } = state;
      setState((s) => ({ ...s, phase: 'saving' }));

      store.calibrateMeter(readingKWh);

      let cloudSynced = false;
      let cloudError: string | null = null;
      if (imageUri && isSupabaseConfigured()) {
        const upload = await uploadMeterScan(imageUri, {
          detectedKWh: readingKWh,
          previousKWh: roundTo(previousKWh, 2),
          differenceKWh: roundTo(readingKWh - previousKWh, 2),
          meterSerial: result?.meterSerial ?? null,
          confidence: result?.confidence ?? null,
        });
        cloudSynced = upload.success;
        cloudError = upload.success ? null : upload.error;
      }

      store.addCapture({
        id: `capture-${Date.now()}`,
        imageUri,
        detectedKWh: readingKWh,
        costBs: calculateCostBs(readingKWh, store.budget.ratePerKWh),
        timestamp: Date.now(),
        meterSerial: result?.meterSerial ?? null,
        confidence: result?.confidence ?? null,
        source: result && Math.abs(result.detectedKWh - readingKWh) < 0.005 ? 'ocr' : 'manual',
        cloudSynced,
      });

      vibrate('success');
      setState({
        ...INITIAL,
        feedback: cloudError
          ? { tone: 'warning', title: 'Medidor calibrado', message: `Guardado en el teléfono. ${cloudError}` }
          : {
              tone: 'success',
              title: 'Medidor calibrado',
              message: cloudSynced ? 'La lectura y la foto se respaldaron en la nube.' : 'La lectura se guardó en el teléfono.',
            },
      });
    },
    [state]
  );

  const clearFeedback = useCallback(() => setState((s) => ({ ...s, feedback: null })), []);

  return { state, pick, startManualEntry, discard, confirm, openSettings, clearFeedback };
}
