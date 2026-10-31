/**
 * Cliente HTTP del firmware ESP32 + PZEM-004T.
 * Endpoint esperado: GET http://<host>/api/telemetry → JSON con voltage, current, power,
 * energy, frequency y powerFactor (o pf).
 */

import { PZEMReading } from '@/domain/types';

export class Esp32Error extends Error {
  constructor(message: string, readonly code: 'timeout' | 'http' | 'network' | 'payload') {
    super(message);
    this.name = 'Esp32Error';
  }
}

export const ESP32_TIMEOUT_MS = 3000;

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Valida el JSON del ESP32. Los campos obligatorios son potencia y energía. */
export function parseEsp32Payload(data: unknown, now: number): PZEMReading {
  if (!data || typeof data !== 'object') {
    throw new Esp32Error('El ESP32 respondió con datos inválidos.', 'payload');
  }
  const raw = data as Record<string, unknown>;
  const power = toFiniteNumber(raw.power);
  const energy = toFiniteNumber(raw.energy);
  if (power === null || energy === null || power < 0 || energy < 0) {
    throw new Esp32Error('El ESP32 no envió potencia o energía válidas.', 'payload');
  }

  const pf = toFiniteNumber(raw.powerFactor) ?? toFiniteNumber(raw.pf);
  return {
    voltage: toFiniteNumber(raw.voltage) ?? 0,
    current: toFiniteNumber(raw.current) ?? 0,
    power,
    energy,
    frequency: toFiniteNumber(raw.frequency) ?? 0,
    powerFactor: pf === null ? 0 : Math.min(1, Math.max(0, pf)),
    timestamp: now,
  };
}

export function buildTelemetryUrl(host: string): string {
  const clean = host.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return `http://${clean}/api/telemetry`;
}

export async function fetchEsp32Reading(
  host: string,
  options: { timeoutMs?: number; fetchImpl?: typeof fetch; now?: () => number } = {}
): Promise<PZEMReading> {
  const { timeoutMs = ESP32_TIMEOUT_MS, fetchImpl = fetch, now = Date.now } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildTelemetryUrl(host), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Esp32Error(`El ESP32 respondió con error ${response.status}.`, 'http');
    }
    const data: unknown = await response.json().catch(() => null);
    return parseEsp32Payload(data, now());
  } catch (err) {
    if (err instanceof Esp32Error) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Esp32Error(`El ESP32 no respondió en ${Math.round(timeoutMs / 1000)} s.`, 'timeout');
    }
    throw new Esp32Error('No se pudo conectar con el ESP32. Verifica la IP y la red Wi-Fi.', 'network');
  } finally {
    clearTimeout(timer);
  }
}
