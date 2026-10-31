// AhorraTech · Edge Function "ocr-meter"
// Lee la foto de un medidor con Google Gemini SIN exponer la clave en la app.
//
// Seguridad:
//   * Exige una sesión de usuario de Supabase (anónima o normal); la anon key sola no basta.
//   * Cuota diaria por usuario (public.consume_ocr_quota).
//   * Límite de tamaño y tipo de imagen.
//   * GEMINI_API_KEY vive solo como secreto del servidor.
//
// Despliegue:
//   supabase secrets set GEMINI_API_KEY=<clave>
//   supabase functions deploy ocr-meter

import { createClient } from '@supabase/supabase-js';

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const MAX_BASE64_CHARS = 4_000_000; // ≈ 3 MB de imagen
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);
const DAILY_LIMIT = Number(Deno.env.get('OCR_DAILY_LIMIT') ?? '30');
const GEMINI_TIMEOUT_MS = 25_000;

const PROMPT = `Eres un lector óptico estricto de medidores eléctricos residenciales de Bolivia (CRE, DELAPAZ, ELFEC, SETAR).
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

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) return json(503, { error: 'not_configured' });

  // 1. Usuario autenticado (no basta con la anon key pública).
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'unauthorized' });

  // 2. Validación de la entrada.
  let body: { image?: unknown; mimeType?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_body' });
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg';
  if (!image || !/^[A-Za-z0-9+/=\r\n]+$/.test(image)) return json(400, { error: 'invalid_image' });
  if (image.length > MAX_BASE64_CHARS) return json(413, { error: 'image_too_large' });
  if (!ALLOWED_MIME.has(mimeType)) return json(415, { error: 'unsupported_type' });

  // 3. Cuota diaria por usuario.
  const { data: allowed, error: quotaError } = await supabase.rpc('consume_ocr_quota', { p_daily_limit: DAILY_LIMIT });
  if (quotaError) return json(500, { error: 'quota_check_failed' });
  if (allowed !== true) return json(429, { error: 'quota_exceeded' });

  // 4. Gemini (con modelos alternativos si uno no está disponible).
  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image } }] }],
          generationConfig: { temperature: 0, response_mime_type: 'application/json' },
        }),
        signal: controller.signal,
      });
      if (res.status === 404 || res.status >= 500) continue;
      if (res.status === 429 || res.status === 403) return json(429, { error: 'provider_quota' });
      if (!res.ok) return json(502, { error: 'provider_error' });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string') return json(502, { error: 'empty_response' });
      return json(200, { model, text });
    } catch {
      // timeout o red: probar el siguiente modelo
    } finally {
      clearTimeout(timer);
    }
  }
  return json(502, { error: 'provider_unavailable' });
});
