/**
 * Simulador de cargas residenciales (red boliviana 220 V / 50 Hz).
 * Función pura: recibe el tick, la energía previa y un generador aleatorio inyectable.
 */

import { roundTo } from '@/domain/billing';
import { PZEMReading } from '@/domain/types';

export const SIMULATION_START_KWH = 84.6;

export function simulateReading(
  tick: number,
  previousEnergyKWh: number,
  intervalMs: number,
  now: number,
  random: () => number = Math.random
): PZEMReading {
  const voltage = roundTo(220 + Math.sin(tick * 0.3) * 2.5 + (random() - 0.5), 1);
  const frequency = roundTo(50 + (random() - 0.5) * 0.15, 1);

  // Carga base: refrigerador + iluminación LED + equipos en espera.
  let watts = 280 + Math.sin(tick * 0.15) * 60 + random() * 30;
  const cycle = tick % 30;
  if (cycle >= 10 && cycle <= 16) watts += 1150; // microondas
  else if (cycle >= 24 && cycle <= 27) watts += 850; // plancha / licuadora

  const power = roundTo(watts, 1);
  const powerFactor = roundTo(0.96 + (random() - 0.5) * 0.03, 2);
  const current = roundTo(power / (voltage * powerFactor), 2);

  const hours = Math.max(0, intervalMs) / 3_600_000;
  const energy = roundTo(Math.max(0, previousEnergyKWh) + (power * hours) / 1000, 5);

  return { voltage, current, power, energy, frequency, powerFactor, timestamp: now };
}
