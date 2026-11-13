/**
 * Estructura Tarifaria de SETAR (Servicios Eléctricos de Tarija).
 * Modela los bloques de consumo residencial en Bolivia:
 *  - Bloque 1 (Tarifa Dignidad): <= 70 kWh/mes (descuento social del 25% estatal).
 *  - Bloque 2 (Consumo Normal): 71 a 300 kWh/mes (tarifa base domiciliaria).
 *  - Bloque 3 (Alto Consumo): > 300 kWh/mes (aplica recargo por penalización de derroche).
 *
 * También calcula los cargos municipales oficiales que componen la factura:
 *  - Tasa de Alumbrado Público municipal (~8% sobre la energía).
 *  - Aseo Urbano EMAT Tarija (cuota fija según zona, promedio Bs 15).
 */

import { roundTo } from './billing';

export const DIGNIDAD_THRESHOLD_KWH = 70;
export const HIGH_CONSUMPTION_THRESHOLD_KWH = 300;
export const DIGNIDAD_DISCOUNT_PCT = 25;
export const HIGH_SURCHARGE_PCT = 20;

export type SetarBracketType = 'dignidad' | 'normal' | 'alto_consumo';

export interface SetarBracketStatus {
  type: SetarBracketType;
  title: string;
  description: string;
  tone: 'success' | 'warning' | 'danger';
  kwhRemainingToNextBracket: number | null;
  hasDignidadSubsidy: boolean;
  dignidadDiscountBs: number;
}

export interface DetailedSetarBill {
  energyKWh: number;
  ratePerKWh: number;
  rawEnergyCostBs: number;
  dignidadDiscountBs: number;
  netEnergyCostBs: number;
  publicLightingBs: number;
  ematSanitationBs: number;
  totalBillBs: number;
  bracket: SetarBracketStatus;
}

/**
 * Evalúa el escalón tarifario según los kWh consumidos en el ciclo.
 */
export function getSetarBracketStatus(cycleEnergyKWh: number, ratePerKWh: number): SetarBracketStatus {
  const kwh = Math.max(0, Number.isFinite(cycleEnergyKWh) ? cycleEnergyKWh : 0);
  const rate = Math.max(0, Number.isFinite(ratePerKWh) ? ratePerKWh : 0.74);

  if (kwh <= DIGNIDAD_THRESHOLD_KWH) {
    const rawCost = kwh * rate;
    const discount = roundTo(rawCost * (DIGNIDAD_DISCOUNT_PCT / 100), 2);
    const remaining = roundTo(DIGNIDAD_THRESHOLD_KWH - kwh, 1);
    return {
      type: 'dignidad',
      title: 'Tarifa Dignidad Activa',
      description: `Tienes 25% de subsidio estatal. Te quedan ${remaining} kWh antes de perder el beneficio.`,
      tone: 'success',
      kwhRemainingToNextBracket: remaining,
      hasDignidadSubsidy: true,
      dignidadDiscountBs: discount,
    };
  }

  if (kwh <= HIGH_CONSUMPTION_THRESHOLD_KWH) {
    const remaining = roundTo(HIGH_CONSUMPTION_THRESHOLD_KWH - kwh, 1);
    const warning = remaining <= 30;
    return {
      type: 'normal',
      title: warning ? 'Cerca de Alto Consumo' : 'Consumo Residencial Normal',
      description: warning
        ? `¡Atención! A solo ${remaining} kWh de entrar a penalidad por alto consumo (>300 kWh).`
        : `Consumo estándar de Bloque 2. Te quedan ${remaining} kWh dentro de la tarifa normal.`,
      tone: warning ? 'warning' : 'success',
      kwhRemainingToNextBracket: remaining,
      hasDignidadSubsidy: false,
      dignidadDiscountBs: 0,
    };
  }

  return {
    type: 'alto_consumo',
    title: 'Tarifa de Alto Consumo (>300 kWh)',
    description: 'Has superado los 300 kWh. Aplica tarifa con penalización por alto consumo en SETAR.',
    tone: 'danger',
    kwhRemainingToNextBracket: null,
    hasDignidadSubsidy: false,
    dignidadDiscountBs: 0,
  };
}

export interface BillSimulationOptions {
  energyKWh: number;
  ratePerKWh?: number;
  publicLightingPct?: number; // ej. 8%
  ematSanitationBs?: number; // ej. Bs 15
}

/**
 * Calcula la factura total oficial proyectada de SETAR Tarija.
 */
export function calculateDetailedSetarBill(options: BillSimulationOptions): DetailedSetarBill {
  const {
    energyKWh,
    ratePerKWh = 0.74,
    publicLightingPct = 8,
    ematSanitationBs = 15,
  } = options;

  const safeKWh = Math.max(0, Number.isFinite(energyKWh) ? energyKWh : 0);
  const safeRate = Math.max(0, Number.isFinite(ratePerKWh) ? ratePerKWh : 0.74);
  const safeLightingPct = Math.max(0, Number.isFinite(publicLightingPct) ? publicLightingPct : 8);
  const safeEmat = Math.max(0, Number.isFinite(ematSanitationBs) ? ematSanitationBs : 15);

  let rawEnergyCostBs: number;
  if (safeKWh <= HIGH_CONSUMPTION_THRESHOLD_KWH) {
    rawEnergyCostBs = roundTo(safeKWh * safeRate, 2);
  } else {
    // Los primeros 300 a tarifa regular, el excedente con 20% de recargo
    const basePart = 300 * safeRate;
    const excessPart = (safeKWh - 300) * (safeRate * (1 + HIGH_SURCHARGE_PCT / 100));
    rawEnergyCostBs = roundTo(basePart + excessPart, 2);
  }

  const bracket = getSetarBracketStatus(safeKWh, safeRate);
  const netEnergyCostBs = roundTo(Math.max(0, rawEnergyCostBs - bracket.dignidadDiscountBs), 2);

  // Alumbrado público sobre el costo neto de energía
  const publicLightingBs = roundTo((netEnergyCostBs * safeLightingPct) / 100, 2);
  const totalBillBs = roundTo(netEnergyCostBs + publicLightingBs + safeEmat, 2);

  return {
    energyKWh: safeKWh,
    ratePerKWh: safeRate,
    rawEnergyCostBs,
    dignidadDiscountBs: bracket.dignidadDiscountBs,
    netEnergyCostBs,
    publicLightingBs,
    ematSanitationBs: safeEmat,
    totalBillBs,
    bracket,
  };
}
