/**
 * Sesión anónima de Supabase por dispositivo.
 *
 * La anon key es pública (viaja en la app), así que no sirve para identificar a nadie.
 * Cada teléfono obtiene su propio usuario anónimo; las políticas RLS usan ese id para que
 * cada uno vea solo sus lecturas y fotos. Los tokens se guardan cifrados (SecureStore).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch en segundos. */
  expiresAt: number;
  userId: string;
}

export type CloudAuthErrorCode = 'not_configured' | 'anonymous_disabled' | 'network' | 'server';

export class CloudAuthError extends Error {
  constructor(message: string, readonly code: CloudAuthErrorCode) {
    super(message);
    this.name = 'CloudAuthError';
  }
}

export const SESSION_STORAGE_KEY = 'ahorratech.cloud-session';
/** Se renueva el token si vence en menos de este margen. */
const REFRESH_MARGIN_SECONDS = 60;

interface SessionStore {
  get: () => Promise<string | null>;
  set: (value: string) => Promise<void>;
  remove: () => Promise<void>;
}

/** SecureStore en el teléfono; en la vista web (solo desarrollo) no existe. */
const defaultStore: SessionStore =
  Platform.OS === 'web'
    ? {
        get: () => AsyncStorage.getItem(SESSION_STORAGE_KEY),
        set: (v) => AsyncStorage.setItem(SESSION_STORAGE_KEY, v),
        remove: () => AsyncStorage.removeItem(SESSION_STORAGE_KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(SESSION_STORAGE_KEY),
        set: (v) => SecureStore.setItemAsync(SESSION_STORAGE_KEY, v),
        remove: () => SecureStore.deleteItemAsync(SESSION_STORAGE_KEY),
      };

export interface AuthOptions {
  url?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
  store?: SessionStore;
  nowSeconds?: () => number;
}

function parseSession(raw: unknown): CloudSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const accessToken = r.access_token ?? r.accessToken;
  const refreshToken = r.refresh_token ?? r.refreshToken;
  const user = r.user as Record<string, unknown> | undefined;
  const userId = user?.id ?? r.userId;
  let expiresAt = r.expires_at ?? r.expiresAt;
  if (typeof expiresAt !== 'number' && typeof r.expires_in === 'number') {
    expiresAt = Math.floor(Date.now() / 1000) + r.expires_in;
  }
  if (
    typeof accessToken !== 'string' ||
    typeof refreshToken !== 'string' ||
    typeof userId !== 'string' ||
    typeof expiresAt !== 'number'
  ) {
    return null;
  }
  return { accessToken, refreshToken, userId, expiresAt };
}

async function readStored(store: SessionStore): Promise<CloudSession | null> {
  try {
    const raw = await store.get();
    return raw ? parseSession(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function authRequest(path: string, body: object, opts: Required<Pick<AuthOptions, 'url' | 'anonKey' | 'fetchImpl'>>) {
  let response: Response;
  try {
    response = await opts.fetchImpl(`${opts.url}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: opts.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CloudAuthError('Sin conexión con el servidor.', 'network');
  }
  const data: unknown = await response.json().catch(() => null);
  return { response, data };
}

let inFlight: Promise<CloudSession> | null = null;

/**
 * Devuelve una sesión válida: la guardada, una renovada o una nueva sesión anónima.
 * Las llamadas simultáneas comparten la misma solicitud.
 */
export function getCloudSession(options: AuthOptions = {}): Promise<CloudSession> {
  if (!inFlight) {
    inFlight = resolveSession(options).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function resolveSession(options: AuthOptions): Promise<CloudSession> {
  const url = (options.url ?? env.supabaseUrl).replace(/\/+$/, '');
  const anonKey = options.anonKey ?? env.supabaseAnonKey;
  const fetchImpl = options.fetchImpl ?? fetch;
  const store = options.store ?? defaultStore;
  const now = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));

  if (!url || !anonKey) {
    throw new CloudAuthError('Los servicios en la nube no están configurados.', 'not_configured');
  }
  const req = { url, anonKey, fetchImpl };

  const stored = await readStored(store);
  if (stored && stored.expiresAt - now() > REFRESH_MARGIN_SECONDS) {
    return stored;
  }

  if (stored) {
    const { response, data } = await authRequest('token?grant_type=refresh_token', { refresh_token: stored.refreshToken }, req);
    const refreshed = response.ok ? parseSession(data) : null;
    if (refreshed) {
      await store.set(JSON.stringify(refreshed));
      return refreshed;
    }
    if (response.status >= 500) throw new CloudAuthError('El servidor no responde. Intenta más tarde.', 'server');
    // Token revocado o vencido: se crea una nueva identidad anónima.
    await store.remove().catch(() => undefined);
  }

  const { response, data } = await authRequest('signup', { data: {} }, req);
  const created = response.ok ? parseSession(data) : null;
  if (created) {
    await store.set(JSON.stringify(created));
    return created;
  }
  const errorCode = (data as { error_code?: string; code?: string } | null)?.error_code;
  if (response.status === 422 || errorCode === 'anonymous_provider_disabled') {
    throw new CloudAuthError('El servidor no tiene habilitado el acceso anónimo.', 'anonymous_disabled');
  }
  throw new CloudAuthError(`No se pudo iniciar sesión en la nube (error ${response.status}).`, 'server');
}

/** Descarta la sesión guardada (ej. tras un 401) para forzar una nueva. */
export async function clearCloudSession(store: SessionStore = defaultStore): Promise<void> {
  await store.remove().catch(() => undefined);
}
