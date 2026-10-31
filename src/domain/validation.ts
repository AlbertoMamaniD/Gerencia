/**
 * Validación y normalización de entradas del usuario.
 * Acepta coma o punto decimal (teclados en español escriben "0,85").
 */

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Convierte "1.234,56", "1234.56", "0,85" o " 12 " en número. Devuelve null si no es válido. */
export function parseDecimal(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  let text = raw.trim().replace(/\s/g, '');
  if (text === '') return null;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma && hasDot) {
    // El último separador es el decimal; el otro es de miles.
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (hasComma) {
    text = text.replace(',', '.');
  }

  if (!/^-?\d+(\.\d+)?$/.test(text) && !/^-?\d+\.$/.test(text) && !/^-?\.\d+$/.test(text)) {
    return null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

interface RangeOptions {
  label: string;
  min: number;
  max: number;
  integer?: boolean;
  unit?: string;
}

export function validateNumberInRange(raw: string, options: RangeOptions): ValidationResult<number> {
  const { label, min, max, integer, unit } = options;
  const value = parseDecimal(raw);
  if (value === null) {
    return { ok: false, error: `Ingresa ${label} con un número válido.` };
  }
  if (integer && !Number.isInteger(value)) {
    return { ok: false, error: `${capitalize(label)} debe ser un número entero.` };
  }
  if (value < min || value > max) {
    const suffix = unit ? ` ${unit}` : '';
    return { ok: false, error: `${capitalize(label)} debe estar entre ${min}${suffix} y ${max}${suffix}.` };
  }
  return { ok: true, value };
}

export const LIMITS = {
  monthlyBudgetBs: { min: 10, max: 100000 },
  maxPowerThresholdW: { min: 100, max: 30000 },
  ratePerKWh: { min: 0.01, max: 20 },
  billingCycleStartDay: { min: 1, max: 28 },
  meterReadingKWh: { min: 0, max: 9999999 },
} as const;

export function validateBudget(raw: string) {
  return validateNumberInRange(raw, { label: 'el presupuesto', unit: 'Bs', ...LIMITS.monthlyBudgetBs });
}

export function validateMaxPower(raw: string) {
  return validateNumberInRange(raw, { label: 'la potencia máxima', unit: 'W', ...LIMITS.maxPowerThresholdW });
}

export function validateRate(raw: string) {
  return validateNumberInRange(raw, { label: 'la tarifa', unit: 'Bs/kWh', ...LIMITS.ratePerKWh });
}

export function validateCycleStartDay(raw: string) {
  return validateNumberInRange(raw, { label: 'el día de inicio', integer: true, ...LIMITS.billingCycleStartDay });
}

export function validateMeterReading(raw: string) {
  return validateNumberInRange(raw, { label: 'la lectura', unit: 'kWh', ...LIMITS.meterReadingKWh });
}

/** Rangos de red local (RFC 1918 + enlace local). */
function isPrivateIPv4(octets: number[]): boolean {
  const [a, b] = octets;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

export const LOCAL_ONLY_ERROR =
  'Por seguridad solo se permiten direcciones de tu red local (192.168.x.x, 10.x.x.x o 172.16–31.x.x).';

/**
 * Valida la dirección del ESP32: IPv4 de red local o nombre de host local (ej. esp32.local),
 * con puerto opcional. La conexión es HTTP sin cifrar, por eso no se permite salir a internet.
 * Quita el esquema http:// y barras finales.
 */
export function validateHost(raw: string): ValidationResult<string> {
  const host = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (host === '') return { ok: false, error: 'Ingresa la dirección IP del ESP32.' };

  const [name, port, ...rest] = host.split(':');
  if (rest.length > 0) return { ok: false, error: 'La dirección tiene un formato inválido.' };
  if (port !== undefined) {
    const portNumber = Number(port);
    if (!/^\d+$/.test(port) || portNumber < 1 || portNumber > 65535) {
      return { ok: false, error: 'El puerto debe estar entre 1 y 65535.' };
    }
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(name);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (!octets.every((octet) => octet <= 255)) {
      return { ok: false, error: 'Cada número de la IP debe estar entre 0 y 255.' };
    }
    return isPrivateIPv4(octets) ? { ok: true, value: host } : { ok: false, error: LOCAL_ONLY_ERROR };
  }

  // Si son solo dígitos y puntos pero no es una IPv4 completa, es una IP incompleta.
  if (/^[\d.]+$/.test(name)) {
    return { ok: false, error: 'La IP debe tener 4 números separados por puntos (ej. 192.168.4.1).' };
  }

  const hostname = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  if (!hostname.test(name)) {
    return { ok: false, error: 'Ingresa una IP (ej. 192.168.4.1) o un nombre de host válido.' };
  }
  // Nombres de red local: "esp32.local" (mDNS) o de una sola palabra ("medidor").
  const isLocalName = /\.local$/i.test(name) || !name.includes('.');
  return isLocalName ? { ok: true, value: host } : { ok: false, error: LOCAL_ONLY_ERROR };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
