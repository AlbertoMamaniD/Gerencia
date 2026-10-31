/**
 * Variables de entorno públicas (EXPO_PUBLIC_*).
 * Deben leerse con el nombre literal para que Expo las inserte al compilar.
 *
 * IMPORTANTE: todo lo que esté aquí viaja dentro de la app y puede extraerse.
 * Solo se usan la URL y la anon key de Supabase (públicas por diseño, protegidas por RLS).
 * La clave de Gemini vive únicamente como secreto de la Edge Function "ocr-meter".
 */

export const DEFAULT_OCR_FUNCTION = 'ocr-meter';

/** Acepta solo slugs válidos (letras, números, guiones); si no, usa el valor por defecto. */
export function normalizeFunctionSlug(value: string | undefined): string {
  const slug = (value ?? '').trim();
  return /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(slug) ? slug : DEFAULT_OCR_FUNCTION;
}

export const env = {
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, ''),
  supabaseAnonKey: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  /** Nombre (slug) de la Edge Function de OCR. Supabase no permite renombrarlo después de crearla. */
  ocrFunction: normalizeFunctionSlug(process.env.EXPO_PUBLIC_OCR_FUNCTION),
};

export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
}

/** El OCR se hace en el servidor (Edge Function), así que depende de Supabase. */
export function isOcrConfigured(): boolean {
  return isSupabaseConfigured();
}

/** Solo el host (sin claves) para mostrarlo en Ajustes. */
export function getSupabaseHost(): string | null {
  if (!env.supabaseUrl) return null;
  return env.supabaseUrl.replace(/^https?:\/\//i, '').split('/')[0] || null;
}
