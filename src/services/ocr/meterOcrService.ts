/**
 * Lectura óptica (OCR) del medidor.
 * La app envía la foto a la Edge Function "ocr-meter" de Supabase, que llama a Gemini con una
 * clave guardada solo en el servidor. Nunca se inventan valores: si no hay lectura, lanza OcrError.
 */

import { env } from '@/config/env';
import { clearCloudSession, CloudAuthError, CloudSession, getCloudSession } from '@/services/cloud/supabaseAuth';

export type OcrErrorCode =
  | 'not_configured'
  | 'not_a_meter'
  | 'unreadable'
  | 'quota'
  | 'too_large'
  | 'timeout'
  | 'network'
  | 'server';

export class OcrError extends Error {
  constructor(message: string, readonly code: OcrErrorCode) {
    super(message);
    this.name = 'OcrError';
  }
}

export interface OcrScanResult {
  detectedKWh: number;
  meterSerial: string | null;
  confidence: number | null;
  meterType?: 'analog' | 'digital';
  model: string;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 40000;
const MANUAL_HINT = 'Puedes ingresar la lectura manualmente.';

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const pct = value <= 1 ? value * 100 : value;
  return Math.round(Math.min(100, pct) * 10) / 10;
}

/** Interpreta el JSON que devuelve el modelo. Exportada para pruebas. */
export function parseOcrText(text: unknown): Omit<OcrScanResult, 'model' | 'durationMs'> {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new OcrError('El servicio de lectura no devolvió resultados. Intenta otra vez.', 'server');
  }

  let parsed: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
    if (!value || typeof value !== 'object') throw new Error('not an object');
    parsed = value as Record<string, unknown>;
  } catch {
    throw new OcrError('No se pudo interpretar la lectura. Toma otra foto más nítida.', 'unreadable');
  }

  if (parsed.is_meter === false) {
    throw new OcrError('La foto no parece un medidor de luz. Enfoca el display del medidor.', 'not_a_meter');
  }

  const kwhRaw =
    typeof parsed.kwh === 'string'
      ? parsed.kwh.replace(/\s+/g, '').replace(',', '.')
      : parsed.kwh;
  const kwh = typeof kwhRaw === 'string' ? Number(kwhRaw) : kwhRaw;
  if (typeof kwh !== 'number' || !Number.isFinite(kwh) || kwh <= 0 || kwh >= 100_000_000) {
    throw new OcrError('No se pudieron leer los números del medidor. Acércate y evita reflejos.', 'unreadable');
  }

  const serial =
    typeof parsed.serial === 'string' && parsed.serial.trim() !== '' ? parsed.serial.trim().slice(0, 50) : null;

  const meterType =
    parsed.meter_type === 'analog' || parsed.meter_type === 'digital'
      ? (parsed.meter_type as 'analog' | 'digital')
      : undefined;

  return {
    detectedKWh: Math.round(kwh * 100) / 100,
    meterSerial: serial,
    confidence: normalizeConfidence(parsed.confidence),
    ...(meterType ? { meterType } : {}),
  };
}

interface RecognizeOptions {
  base64Image: string;
  mimeType?: string;
  url?: string;
  anonKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Slug de la Edge Function (por defecto EXPO_PUBLIC_OCR_FUNCTION u "ocr-meter"). */
  functionName?: string;
  getSession?: () => Promise<CloudSession>;
  resetSession?: () => Promise<void>;
}

function errorForStatus(status: number, errorKey?: string): OcrError {
  switch (status) {
    case 404:
    case 503:
      return new OcrError(`La lectura automática aún no está activada en el servidor. ${MANUAL_HINT}`, 'not_configured');
    case 413:
      return new OcrError('La foto es demasiado pesada. Intenta con otra.', 'too_large');
    case 429:
      if (errorKey === 'provider_quota') {
        return new OcrError(`El servicio de IA está con alta demanda temporalmente. Espera unos segundos o ${MANUAL_HINT.toLowerCase()}`, 'quota');
      }
      return new OcrError(`Alcanzaste el límite de lecturas automáticas por hoy. ${MANUAL_HINT}`, 'quota');
    default:
      return new OcrError(`El servicio de lectura respondió con error ${status}. ${MANUAL_HINT}`, 'server');
  }
}

export async function recognizeMeterReading(options: RecognizeOptions): Promise<OcrScanResult> {
  const {
    base64Image,
    mimeType = 'image/jpeg',
    url = env.supabaseUrl,
    anonKey = env.supabaseAnonKey,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    functionName = env.ocrFunction,
    getSession = () => getCloudSession(),
    resetSession = () => clearCloudSession(),
  } = options;

  if (!url || !anonKey) {
    throw new OcrError(`La lectura automática no está configurada. ${MANUAL_HINT}`, 'not_configured');
  }
  if (!base64Image) {
    throw new OcrError('No se pudo leer la imagen seleccionada.', 'unreadable');
  }

  const startedAt = Date.now();

  const call = async (): Promise<Response> => {
    let session: CloudSession;
    try {
      session = await getSession();
    } catch (err) {
      if (err instanceof CloudAuthError && err.code === 'network') {
        throw new OcrError('Sin conexión a internet. Revisa tus datos o Wi-Fi.', 'network');
      }
      throw new OcrError(`No se pudo conectar con el servicio de lectura. ${MANUAL_HINT}`, 'not_configured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(`${url}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image, mimeType }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new OcrError('La lectura tardó demasiado. Revisa tu conexión e intenta otra vez.', 'timeout');
      }
      throw new OcrError('Sin conexión a internet. Revisa tus datos o Wi-Fi.', 'network');
    } finally {
      clearTimeout(timer);
    }
  };

  let response = await call();
  if (response.status === 401) {
    // Sesión revocada o vencida: se reintenta una vez con una sesión nueva.
    await resetSession();
    response = await call();
  }
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw errorForStatus(response.status, errorBody?.error);
  }

  const body = (await response.json().catch(() => null)) as { text?: unknown; model?: unknown } | null;
  const result = parseOcrText(body?.text);
  return {
    ...result,
    model: typeof body?.model === 'string' ? body.model : 'desconocido',
    durationMs: Date.now() - startedAt,
  };
}
