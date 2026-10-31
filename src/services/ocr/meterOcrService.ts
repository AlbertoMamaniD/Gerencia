/**
 * Lectura óptica (OCR) del medidor con Google Gemini Vision.
 * Rechaza fotos que no son medidores y nunca inventa valores: si no hay lectura, lanza OcrError.
 */

import { env } from '@/config/env';

export type OcrErrorCode =
  | 'not_configured'
  | 'not_a_meter'
  | 'unreadable'
  | 'quota'
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
  provider: 'gemini';
  model: string;
  durationMs: number;
}

export const OCR_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const DEFAULT_TIMEOUT_MS = 25000;

export const OCR_PROMPT = `Eres un lector óptico estricto de medidores eléctricos residenciales de Bolivia (CRE, DELAPAZ, ELFEC, SETAR).
Analiza la imagen:
1. Si NO es un medidor de energía eléctrica (persona, ropa, pantalla, pared, documento, etc.), responde solo:
{"is_meter": false}
2. Si SÍ es un medidor (analógico de tambor o digital LCD), responde solo:
{"is_meter": true, "kwh": number, "serial": string | null, "confidence": number}
- "kwh": lectura acumulada en kWh tal como aparece en el display (sin inventar dígitos).
- "serial": número de serie de la placa o null si no es legible.
- "confidence": tu confianza de 0 a 100.
Si es un medidor pero los dígitos no se leen, usa "kwh": null.
Responde únicamente el JSON, sin markdown.`;

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const pct = value <= 1 ? value * 100 : value;
  return Math.round(Math.min(100, pct) * 10) / 10;
}

/** Interpreta la respuesta de Gemini. Exportada para pruebas. */
export function parseGeminiResponse(json: unknown): Omit<OcrScanResult, 'provider' | 'model' | 'durationMs'> {
  const text = (json as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content
    ?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.trim() === '') {
    throw new OcrError('El servicio de lectura no devolvió resultados. Intenta otra vez.', 'server');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
  } catch {
    throw new OcrError('No se pudo interpretar la lectura. Toma otra foto más nítida.', 'unreadable');
  }

  if (parsed.is_meter === false) {
    throw new OcrError('La foto no parece un medidor de luz. Enfoca el display del medidor.', 'not_a_meter');
  }

  const kwh = typeof parsed.kwh === 'string' ? Number(parsed.kwh.replace(',', '.')) : parsed.kwh;
  if (typeof kwh !== 'number' || !Number.isFinite(kwh) || kwh <= 0) {
    throw new OcrError('No se pudieron leer los números del medidor. Acércate y evita reflejos.', 'unreadable');
  }

  const serial = typeof parsed.serial === 'string' && parsed.serial.trim() !== '' ? parsed.serial.trim() : null;

  return {
    detectedKWh: Math.round(kwh * 100) / 100,
    meterSerial: serial,
    confidence: normalizeConfidence(parsed.confidence),
  };
}

interface RecognizeOptions {
  base64Image: string;
  mimeType?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  models?: string[];
}

export async function recognizeMeterReading(options: RecognizeOptions): Promise<OcrScanResult> {
  const {
    base64Image,
    mimeType = 'image/jpeg',
    apiKey = env.geminiApiKey,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    models = OCR_MODELS,
  } = options;

  if (!apiKey) {
    throw new OcrError('La lectura automática no está configurada. Ingresa la lectura manualmente.', 'not_configured');
  }
  if (!base64Image) {
    throw new OcrError('No se pudo leer la imagen seleccionada.', 'unreadable');
  }

  const startedAt = Date.now();
  let lastError: OcrError | null = null;

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // La clave va en el encabezado, nunca en la URL (evita que quede en logs/proxies).
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: OCR_PROMPT }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
            generationConfig: { temperature: 0, response_mime_type: 'application/json' },
          }),
          signal: controller.signal,
        }
      );

      if (response.status === 404) {
        lastError = new OcrError('El modelo de lectura no está disponible.', 'server');
        continue; // probar el siguiente modelo
      }
      if (response.status === 429 || response.status === 403) {
        throw new OcrError('Se alcanzó el límite del servicio de lectura. Intenta más tarde o ingresa la lectura manualmente.', 'quota');
      }
      if (!response.ok) {
        lastError = new OcrError(`El servicio de lectura respondió con error ${response.status}.`, 'server');
        if (response.status >= 500) continue;
        throw lastError;
      }

      const json: unknown = await response.json().catch(() => null);
      const result = parseGeminiResponse(json);
      return { ...result, provider: 'gemini', model, durationMs: Date.now() - startedAt };
    } catch (err) {
      if (err instanceof OcrError) {
        if (err.code === 'server') {
          lastError = err;
          continue;
        }
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new OcrError('La lectura tardó demasiado. Revisa tu conexión e intenta otra vez.', 'timeout');
      }
      throw new OcrError('Sin conexión a internet. Revisa tus datos o Wi-Fi.', 'network');
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new OcrError('No se pudo procesar la imagen.', 'server');
}
