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

import { createClient } from 'npm:@supabase/supabase-js@2';

const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];
const MAX_BASE64_CHARS = 4_000_000; // ≈ 3 MB de imagen
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);
const DAILY_LIMIT = Number(Deno.env.get('OCR_DAILY_LIMIT') ?? '30');
const GEMINI_TIMEOUT_MS = 25_000;

const PROMPT = `Eres un lector óptico experto de máxima precisión especializado en medidores de energía eléctrica residenciales e industriales de Bolivia (SETAR Tarija, CRE Santa Cruz, DELAPAZ La Paz, ELFEC Cochabamba, CESSA Sucre, SEPSA Potosí).

OBJETIVO:
Extraer con exactitud matemática la lectura acumulada en kWh (kilovatios-hora) y el número de serie del medidor.

---
REGLAS CRÍTICAS DE INTERPRETACIÓN:

1. ¿ES UN MEDIDOR DE LUZ?
- Si la imagen NO muestra ningún medidor eléctrico (persona, documento, pared lisa, vehículo, mascota, comida, pantalla de celular, etc.):
  Responde ÚNICAMENTE: {"is_meter": false}
- TOLERANCIA DE GABINETE / NICHO: En Bolivia (especialmente en Tarija), los medidores suelen estar empotrados en la fachada de la calle, dentro de nichos de cemento, cajas metálicas o gabinetes plásticos con visores de acrílico o vidrio que pueden tener rayones, polvo, reflejos de luz o sombras. Si el gabinete o cuerpo del medidor es visible detrás del visor, SÍ es un medidor (is_meter: true). No lo descartes por estar dentro de una caja o nicho.

2. MEDIDORES ANALÓGICOS ELECTROMECÁNICOS (RUEDAS / TAMBORES GIRATORIOS):
- Están compuestos por rodillos numéricos horizontales tipo odómetro (generalmente 5 o 6 rodillos).
- REGLA DEL DÍGITO ROJO (DECIMAL):
  * Si el último rodillo de la derecha (o los últimos rodillos) tiene COLOR ROJO, FONDO ROJO, MARCO ROJO, o está precedido por una coma/punto decimal: ESE DÍGITO ES LA FRACCIÓN DECIMAL (0.1 kWh).
    Ejemplo: rodillos negros "0 1 4 5 2" seguidos de un rodillo rojo "7" = 1452.7 kWh (NUNCA 14527).
  * Si TODOS los rodillos son del mismo color (típicamente todos negros con números blancos, o todos blancos con números negros) sin coma ni marco rojo, todos los dígitos son enteros.
- RODILLOS A MEDIO GIRAR: Si un rodillo se encuentra entre dos dígitos (por ejemplo, el 4 está terminando de pasar y el 5 está empezando a asomar), toma SIEMPRE el número menor que ya completó la transición (el 4).
- Ceros a la izquierda: Ignora ceros no significativos para el valor aritmético (ej. "00342" = 342).

3. MEDIDORES ELECTRÓNICOS / DIGITALES (PANTALLA LCD O LED):
- Las pantallas digitales alternan pantallas cíclicamente. Busca EXCLUSIVAMENTE la que represente la energía activa acumulada con la unidad "kWh", "Total kWh" o código OBIS "1.8.0" o "01".
- Si la pantalla incluye coma o punto decimal visible (ej. "001234.5 kWh"), consérvalo como decimal (1234.5).
- NUNCA confundas la lectura de kWh con:
  * Horas (formato HH:MM:SS) o fechas (DD.MM.AA).
  * Voltajes ("220V"), amperajes ("A"), frecuencia ("Hz") o potencia reactiva ("kVARh").
  * Pantalla de encendido de todos los segmentos de prueba (ej. "888888").

4. NÚMEROS A IGNORAR EN LA CARÁTULA:
- Constantes de calibración: "1200 r/kWh", "600 rev/kWh", "1600 imp/kWh", "800 imp/kWh".
- Datos de placa: "220V", "230V", "10(40)A", "5(60)A", "50Hz", "Clase 1", "Clase 2", "Monofásico", "Trifásico".
- Normas: "NB", "IEC".

5. NÚMERO DE SERIE DEL MEDIDOR:
- Busca el número de identificación o serie impreso en la placa metálica o plástico del medidor (suele estar junto a un código de barras o precedido de "N°", "No.", "Serie", "SETAR", o grabado).
- Si no es 100% legible, usa null.

---
FORMATO DE SALIDA (ESTRICTAMENTE JSON VÁLIDO, SIN MARKDOWN NI TEXTO EXTRA):
Si NO es un medidor:
{"is_meter": false}

Si SÍ es un medidor:
{
  "is_meter": true,
  "kwh": number | null,
  "serial": string | null,
  "confidence": number,
  "meter_type": "analog" | "digital" | "unknown"
}
* "kwh": número flotante o entero con la lectura real acumulada en kWh. Si la imagen es un medidor pero los dígitos están completamente ilegibles (por ejemplo por reflejo total directo o desenfoque extremo), usa null.
* "serial": string con el número de serie o null.
* "confidence": número entero de 0 a 100 indicando tu certeza sobre los dígitos de kWh leídos.
* "meter_type": "analog" si es de tambores/rodillos mecánicos, "digital" si es pantalla LCD/LED, o "unknown".`;

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
  let lastQuotaError = false;
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
      if (res.status === 429) {
        lastQuotaError = true;
        continue;
      }
      if (res.status === 403) return json(429, { error: 'provider_quota' });
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
  if (lastQuotaError) return json(429, { error: 'provider_quota' });
  return json(502, { error: 'provider_unavailable' });
});
