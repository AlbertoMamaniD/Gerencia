/**
 * Sincronización de configuraciones del hogar con Supabase.
 * Permite respaldar y recuperar el presupuesto, tarifa, día de corte y potencia límite
 * en la nube para que no se pierdan si el usuario reinstala o cambia de celular.
 */

import { env } from '@/config/env';
import { CloudSession, getCloudSession } from './supabaseAuth';

export interface HouseholdSettingsPayload {
  monthlyBudgetBs: number;
  ratePerKWh: number;
  billingCycleStartDay: number;
  maxPowerThresholdW: number;
  lastMeterKWh?: number;
}

export type CloudSyncResult = { success: true } | { success: false; error: string };

export interface SyncOptions {
  url?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
  getSession?: () => Promise<CloudSession>;
}

export async function syncHouseholdSettingsToCloud(
  payload: HouseholdSettingsPayload,
  options: SyncOptions = {}
): Promise<CloudSyncResult> {
  const baseUrl = (options.url ?? env.supabaseUrl).replace(/\/+$/, '');
  const anonKey = options.anonKey ?? env.supabaseAnonKey;
  const fetchImpl = options.fetchImpl ?? fetch;
  const getSession = options.getSession ?? (() => getCloudSession());

  if (!baseUrl || !anonKey) {
    return { success: false, error: 'Servicios en la nube no configurados.' };
  }

  let session: CloudSession;
  try {
    session = await getSession();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo autenticar en la nube.' };
  }

  const authHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };

  try {
    const res = await fetchImpl(`${baseUrl}/rest/v1/household_settings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        user_id: session.userId,
        monthly_budget_bs: payload.monthlyBudgetBs,
        cost_per_kwh: payload.ratePerKWh,
        billing_cycle_start_day: payload.billingCycleStartDay,
        cut_protection_watts: payload.maxPowerThresholdW,
        last_meter_kwh: payload.lastMeterKWh ?? 0,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Error del servidor (${res.status}).` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Sin conexión a internet. Los datos se guardaron localmente.' };
  }
}

export async function fetchHouseholdSettingsFromCloud(
  options: SyncOptions = {}
): Promise<HouseholdSettingsPayload | null> {
  const baseUrl = (options.url ?? env.supabaseUrl).replace(/\/+$/, '');
  const anonKey = options.anonKey ?? env.supabaseAnonKey;
  const fetchImpl = options.fetchImpl ?? fetch;
  const getSession = options.getSession ?? (() => getCloudSession());

  if (!baseUrl || !anonKey) return null;

  let session: CloudSession;
  try {
    session = await getSession();
  } catch {
    return null;
  }

  try {
    const res = await fetchImpl(
      `${baseUrl}/rest/v1/household_settings?user_id=eq.${session.userId}&select=monthly_budget_bs,cost_per_kwh,billing_cycle_start_day,cut_protection_watts,last_meter_kwh`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!res.ok) return null;
    const data = (await res.json()) as {
      monthly_budget_bs: number | string;
      cost_per_kwh: number | string;
      billing_cycle_start_day: number;
      cut_protection_watts: number;
      last_meter_kwh: number | string;
    }[];

    if (!Array.isArray(data) || data.length === 0) return null;
    const row = data[0];

    return {
      monthlyBudgetBs: Number(row.monthly_budget_bs),
      ratePerKWh: Number(row.cost_per_kwh),
      billingCycleStartDay: Number(row.billing_cycle_start_day),
      maxPowerThresholdW: Number(row.cut_protection_watts),
      lastMeterKWh: Number(row.last_meter_kwh),
    };
  } catch {
    return null;
  }
}
