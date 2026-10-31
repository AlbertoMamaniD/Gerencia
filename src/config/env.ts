/**
 * Variables de entorno públicas (EXPO_PUBLIC_*).
 * Deben leerse con el nombre literal para que Expo las inserte al compilar.
 * Nota: estas claves viajan dentro de la app; no colocar aquí secretos de servidor.
 */

export const env = {
  geminiApiKey: (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim(),
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, ''),
  supabaseAnonKey: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
};

export function isOcrConfigured(): boolean {
  return env.geminiApiKey.length > 0;
}

export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
}

/** Solo el host (sin claves) para mostrarlo en Ajustes. */
export function getSupabaseHost(): string | null {
  if (!env.supabaseUrl) return null;
  return env.supabaseUrl.replace(/^https?:\/\//i, '').split('/')[0] || null;
}
