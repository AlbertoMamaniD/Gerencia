/**
 * Respaldo en la nube (Supabase): sube la foto al bucket privado `meter-photos`,
 * dentro de la carpeta del usuario, y registra la calibración en `meter_scans`.
 * Las políticas RLS solo permiten a cada usuario escribir y leer lo suyo.
 */

import { env } from '@/config/env';
import { CloudSession, getCloudSession } from './supabaseAuth';

export interface ScanUploadPayload {
  detectedKWh: number;
  previousKWh: number;
  differenceKWh: number;
  meterSerial: string | null;
  confidence: number | null;
}

export type UploadResult = { success: true; photoPath: string } | { success: false; error: string };

interface UploadOptions {
  url?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
  now?: number;
  getSession?: () => Promise<CloudSession>;
}

/** Nombre de archivo seguro: el serial leído por OCR puede traer espacios, barras o tildes. */
export function buildPhotoFileName(serial: string | null, timestamp: number): string {
  const safeSerial = (serial ?? 'scan')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `meter_${safeSerial || 'scan'}_${timestamp}.jpg`;
}

export async function uploadMeterScan(
  imageUri: string,
  payload: ScanUploadPayload,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const baseUrl = (options.url ?? env.supabaseUrl).replace(/\/+$/, '');
  const anonKey = options.anonKey ?? env.supabaseAnonKey;
  const fetchImpl = options.fetchImpl ?? fetch;
  const getSession = options.getSession ?? (() => getCloudSession());

  if (!baseUrl || !anonKey) {
    return { success: false, error: 'El respaldo en la nube no está configurado.' };
  }

  let session: CloudSession;
  try {
    session = await getSession();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo iniciar sesión en la nube.' };
  }

  const photoPath = `${session.userId}/${buildPhotoFileName(payload.meterSerial, options.now ?? Date.now())}`;
  const authHeaders = { apikey: anonKey, Authorization: `Bearer ${session.accessToken}` };

  try {
    const form = new FormData();
    // React Native acepta { uri, name, type } como archivo en FormData.
    form.append('file', { uri: imageUri, name: photoPath.split('/').pop(), type: 'image/jpeg' } as unknown as Blob);

    const storageRes = await fetchImpl(`${baseUrl}/storage/v1/object/meter-photos/${photoPath}`, {
      method: 'POST',
      headers: authHeaders,
      body: form,
    });
    if (!storageRes.ok) {
      return { success: false, error: `No se pudo subir la foto (error ${storageRes.status}).` };
    }

    const dbRes = await fetchImpl(`${baseUrl}/rest/v1/meter_scans`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        owner_id: session.userId,
        photo_url: photoPath,
        detected_kwh: payload.detectedKWh,
        hardware_kwh: payload.previousKWh,
        difference_kwh: payload.differenceKWh,
        meter_serial: payload.meterSerial,
        ocr_confidence: payload.confidence,
        status: 'calibrated',
      }),
    });
    if (!dbRes.ok) {
      return { success: false, error: `La foto se subió, pero no se pudo registrar (error ${dbRes.status}).` };
    }
    return { success: true, photoPath };
  } catch {
    return { success: false, error: 'Sin conexión: la lectura se guardó solo en el teléfono.' };
  }
}
