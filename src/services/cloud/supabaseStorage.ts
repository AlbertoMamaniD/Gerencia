/**
 * Respaldo en la nube (Supabase): sube la foto al bucket `meter-photos`
 * y registra la calibración en la tabla `meter_scans`.
 */

import { env } from '@/config/env';

export interface ScanUploadPayload {
  detectedKWh: number;
  previousKWh: number;
  differenceKWh: number;
  meterSerial: string | null;
  confidence: number | null;
}

export type UploadResult = { success: true; photoUrl: string; recordId?: string } | { success: false; error: string };

interface UploadOptions {
  url?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
  now?: number;
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

  if (!baseUrl || !anonKey) {
    return { success: false, error: 'El respaldo en la nube no está configurado.' };
  }

  const fileName = buildPhotoFileName(payload.meterSerial, options.now ?? Date.now());
  const authHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  try {
    const form = new FormData();
    // React Native acepta { uri, name, type } como archivo en FormData.
    form.append('file', { uri: imageUri, name: fileName, type: 'image/jpeg' } as unknown as Blob);

    const storageRes = await fetchImpl(`${baseUrl}/storage/v1/object/meter-photos/${fileName}`, {
      method: 'POST',
      headers: authHeaders,
      body: form,
    });
    if (!storageRes.ok) {
      return { success: false, error: `No se pudo subir la foto (error ${storageRes.status}).` };
    }

    const photoUrl = `${baseUrl}/storage/v1/object/public/meter-photos/${fileName}`;
    const dbRes = await fetchImpl(`${baseUrl}/rest/v1/meter_scans`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        photo_url: photoUrl,
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

    const rows: unknown = await dbRes.json().catch(() => null);
    const recordId = Array.isArray(rows) && rows[0] && typeof rows[0].id === 'string' ? rows[0].id : undefined;
    return { success: true, photoUrl, recordId };
  } catch {
    return { success: false, error: 'Sin conexión: la lectura se guardó solo en el teléfono.' };
  }
}
