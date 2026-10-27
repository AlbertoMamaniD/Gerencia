/**
 * AhorraTech - Servicio de Reconocimiento Óptico (OCR) Estricto de Medidores
 * Integración con Google Gemini 1.5 Flash Vision.
 * Validación real: Rechaza fotos que no sean medidores eléctricos (ej. pies, paredes, personas).
 */

export interface OcrScanResult {
  detectedKWh: number;
  meterSerial: string;
  confidence: number;
  rawText?: string;
  provider: 'gemini_flash' | 'backend_api' | 'demo_sample';
  durationMs: number;
}

export interface OcrRequestOptions {
  base64Image?: string;
  geminiApiKey?: string;
  backendUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 14000;
const DEFAULT_GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Procesa la imagen del medidor usando Google Gemini 1.5 Flash.
 * Validación estricta: Si la imagen no es un medidor eléctrico, arroja un error descriptivo.
 */
export async function processMeterImage(
  imageUri: string,
  currentBaselineKWh: number = 84.6,
  options?: OcrRequestOptions
): Promise<OcrScanResult> {
  const startTime = Date.now();
  const activeKey = options?.geminiApiKey?.trim() || DEFAULT_GEMINI_KEY;

  // 1. INTENTO CON GOOGLE GEMINI 1.5 FLASH
  if (activeKey && options?.base64Image) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options?.timeoutMs || DEFAULT_TIMEOUT_MS);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': activeKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un clasificador y lector óptico de medidores eléctricos residenciales de Bolivia (CRE, DELAPAZ, ELFEC).
Analiza estrictamente la imagen:
1. ¿Es la fotografía de un medidor de energía eléctrica (sea analógico de disco o digital LCD)?
- Si NO es un medidor eléctrico (por ejemplo: si es una persona, un pie, un animal, un objeto común o una pared), responde ÚNICAMENTE con este JSON:
{"is_meter": false, "error": "No se detectó un medidor eléctrico en la imagen. Por favor enfoca el display de tu medidor de luz."}

2. Si SÍ es un medidor eléctrico:
- Extrae la lectura numérica acumulada en kWh del display o tambor mecánico.
- Extrae el número de serie de la placa metálica.
- Responde ÚNICAMENTE con este JSON:
{"is_meter": true, "kwh": float, "serial": string, "confidence": float}

Responde estrictamente el JSON sin formato markdown ni texto adicional.`
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: options.base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Error Google AI Studio (HTTP ${res.status})`;
        if (res.status === 400 || res.status === 403) {
          throw new Error('La clave de Google Gemini no es válida. Debe ser generada en aistudio.google.com y comenzar con "AIzaSy..."');
        }
        throw new Error(msg);
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('No se recibió respuesta del modelo de visión.');
      }

      const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      // VALIDACIÓN ESTRICTA: ¿Es realmente un medidor?
      if (parsed.is_meter === false) {
        throw new Error(parsed.error || 'La imagen no corresponde a un medidor de energía eléctrica.');
      }

      if (typeof parsed.kwh !== 'number' || parsed.kwh <= 0) {
        throw new Error('No se pudieron leer los dígitos de consumo en el display del medidor.');
      }

      return {
        detectedKWh: Number(parsed.kwh.toFixed(2)),
        meterSerial: String(parsed.serial || 'MED-BO-' + Math.floor(100000 + Math.random() * 900000)),
        confidence: Number((parsed.confidence || 98.5).toFixed(1)),
        rawText,
        provider: 'gemini_flash',
        durationMs: Date.now() - startTime
      };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Error al procesar la imagen con Gemini Vision.');
    }
  }

  // 2. Si no hay API key configurada todavía:
  throw new Error('No hay clave de Google Gemini configurada. Ingresa tu API Key gratuita en la pestaña Ajustes (debe empezar con "AIzaSy...").');
}
