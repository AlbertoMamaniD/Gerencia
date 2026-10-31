/**
 * Almacenamiento con escritura agrupada (throttle) sobre AsyncStorage.
 * La telemetría actualiza el estado cada 2 s; sin esto se escribiría a disco en cada lectura.
 * `flushStorage()` se llama al pasar la app a segundo plano para no perder datos.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

export const STORAGE_WRITE_INTERVAL_MS = 10_000;

async function writePending(): Promise<void> {
  timer = null;
  const entries = Array.from(pending.entries());
  pending.clear();
  await Promise.all(
    entries.map(([key, value]) =>
      AsyncStorage.setItem(key, value).catch((err) => console.warn('[storage] error al guardar:', err))
    )
  );
}

export function flushStorage(): Promise<void> {
  if (timer) clearTimeout(timer);
  return writePending();
}

export const throttledStorage: StateStorage = {
  getItem: async (key) => pending.get(key) ?? (await AsyncStorage.getItem(key)),
  setItem: (key, value) => {
    pending.set(key, value);
    if (!timer) timer = setTimeout(writePending, STORAGE_WRITE_INTERVAL_MS);
  },
  removeItem: async (key) => {
    pending.delete(key);
    await AsyncStorage.removeItem(key);
  },
};
