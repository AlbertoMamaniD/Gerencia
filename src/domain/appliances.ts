/**
 * Dominio de Artefactos Eléctricos del Hogar.
 * Permite a la familia auditar su consumo sin necesidad de sensores físicos:
 * calcula el gasto mensual en kWh y en Bolivianos (Bs) de cada electrodoméstico,
 * identifica qué aparato consume más y genera recomendaciones directas de ahorro.
 */

import { IconName } from '@/components/ui';
import { roundTo } from './billing';

export type ApplianceCategory = 'clima' | 'cocina' | 'bano' | 'entretenimiento' | 'iluminacion' | 'otros';

export interface ApplianceItem {
  id: string;
  name: string;
  category: ApplianceCategory;
  icon: IconName;
  powerWatts: number;
  quantity: number;
  /** Horas de uso por día promedio (ej. 0.33 para 20 minutos). */
  hoursPerDay: number;
  daysPerMonth?: number;
}

export interface ApplianceConsumption {
  item: ApplianceItem;
  monthlyKWh: number;
  monthlyCostBs: number;
  percentageOfTotal: number;
}

export interface HouseholdAppliancesSummary {
  totalMonthlyKWh: number;
  totalMonthlyCostBs: number;
  items: ApplianceConsumption[];
  topConsumer: ApplianceConsumption | null;
  recommendedSavingsBs: number;
}

export const CATEGORY_LABELS: Record<ApplianceCategory, string> = {
  bano: 'Baño y Agua',
  clima: 'Clima y Ventilación',
  cocina: 'Cocina y Alimentos',
  entretenimiento: 'Entretenimiento y Trabajo',
  iluminacion: 'Iluminación',
  otros: 'Otros',
};

/**
 * Catálogo predeterminado adaptado a los hogares de Tarija y Bolivia.
 */
export const DEFAULT_TARIJA_APPLIANCES: ApplianceItem[] = [
  {
    id: 'ducha-electrica',
    name: 'Ducha Eléctrica (Corona/Lorenzetti)',
    category: 'bano',
    icon: 'shower-head',
    powerWatts: 4500,
    quantity: 1,
    hoursPerDay: 0.35, // ~21 min al día acumulado de la familia
    daysPerMonth: 30,
  },
  {
    id: 'heladera',
    name: 'Heladera con Freezer',
    category: 'cocina',
    icon: 'fridge-outline',
    powerWatts: 180, // promedio ponderado cíclico
    quantity: 1,
    hoursPerDay: 12, // tiempo efectivo del compresor
    daysPerMonth: 30,
  },
  {
    id: 'pava-electrica',
    name: 'Jarra / Pava Eléctrica',
    category: 'cocina',
    icon: 'kettle-outline',
    powerWatts: 1800,
    quantity: 1,
    hoursPerDay: 0.25, // ~15 min al día
    daysPerMonth: 30,
  },
  {
    id: 'tv-led',
    name: 'Televisor Smart LED',
    category: 'entretenimiento',
    icon: 'television',
    powerWatts: 90,
    quantity: 1,
    hoursPerDay: 4.5,
    daysPerMonth: 30,
  },
  {
    id: 'focos-led',
    name: 'Focos LED (Económicos)',
    category: 'iluminacion',
    icon: 'lightbulb-outline',
    powerWatts: 10,
    quantity: 6,
    hoursPerDay: 5,
    daysPerMonth: 30,
  },
  {
    id: 'lavadora',
    name: 'Lavadora Automática',
    category: 'otros',
    icon: 'washing-machine',
    powerWatts: 450,
    quantity: 1,
    hoursPerDay: 0.5, // 3 lavados semanales de 1h
    daysPerMonth: 30,
  },
  {
    id: 'microondas',
    name: 'Horno Microondas',
    category: 'cocina',
    icon: 'microwave',
    powerWatts: 1200,
    quantity: 1,
    hoursPerDay: 0.15, // ~9 min al día
    daysPerMonth: 30,
  },
];

/**
 * Calcula el consumo mensual en kWh de un artefacto.
 */
export function calculateApplianceMonthlyKWh(item: ApplianceItem): number {
  if (item.powerWatts <= 0 || item.quantity <= 0 || item.hoursPerDay <= 0) return 0;
  const days = item.daysPerMonth && item.daysPerMonth > 0 ? item.daysPerMonth : 30;
  const rawKWh = (item.powerWatts * item.quantity * item.hoursPerDay * days) / 1000;
  return roundTo(rawKWh, 2);
}

/**
 * Calcula el resumen completo de electrodomésticos del hogar.
 */
export function calculateHouseholdSummary(
  appliances: ApplianceItem[],
  ratePerKWh: number
): HouseholdAppliancesSummary {
  const safeRate = Number.isFinite(ratePerKWh) && ratePerKWh > 0 ? ratePerKWh : 0.74;

  let totalKWh = 0;
  const computedList: { item: ApplianceItem; monthlyKWh: number; monthlyCostBs: number }[] = [];

  for (const app of appliances) {
    const monthlyKWh = calculateApplianceMonthlyKWh(app);
    const monthlyCostBs = roundTo(monthlyKWh * safeRate, 2);
    totalKWh += monthlyKWh;
    computedList.push({ item: app, monthlyKWh, monthlyCostBs });
  }

  totalKWh = roundTo(totalKWh, 2);
  const totalCostBs = roundTo(totalKWh * safeRate, 2);

  // Ordenar de mayor a menor consumo
  computedList.sort((a, b) => b.monthlyCostBs - a.monthlyCostBs);

  const items: ApplianceConsumption[] = computedList.map((entry) => ({
    ...entry,
    percentageOfTotal: totalCostBs > 0 ? roundTo((entry.monthlyCostBs / totalCostBs) * 100, 1) : 0,
  }));

  const topConsumer = items.length > 0 && items[0].monthlyCostBs > 0 ? items[0] : null;

  // Ahorro recomendado: si reduce 20% el consumo del mayor aparato
  const recommendedSavingsBs = topConsumer ? roundTo(topConsumer.monthlyCostBs * 0.2, 2) : 0;

  return {
    totalMonthlyKWh: totalKWh,
    totalMonthlyCostBs: totalCostBs,
    items,
    topConsumer,
    recommendedSavingsBs,
  };
}
