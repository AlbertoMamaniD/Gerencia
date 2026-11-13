import {
  fetchHouseholdSettingsFromCloud,
  HouseholdSettingsPayload,
  syncHouseholdSettingsToCloud,
} from '../cloud/cloudSync';
import { CloudAuthError, CloudSession } from '../cloud/supabaseAuth';

const mockSession: CloudSession = {
  accessToken: 'valid-token',
  refreshToken: 'refresh-token',
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  userId: 'user-1234',
};

const payload: HouseholdSettingsPayload = {
  monthlyBudgetBs: 180,
  ratePerKWh: 0.85,
  billingCycleStartDay: 1,
  maxPowerThresholdW: 3500,
  lastMeterKWh: 84.8,
};

describe('cloudSync', () => {
  describe('syncHouseholdSettingsToCloud', () => {
    it('falla amigablemente si no hay url o anonKey', async () => {
      const res = await syncHouseholdSettingsToCloud(payload, { url: '', anonKey: '' });
      expect(res.success).toBe(false);
      expect(res).toEqual(expect.objectContaining({ error: expect.stringMatching(/no configurados/i) }));
    });

    it('maneja error de autenticación', async () => {
      const res = await syncHouseholdSettingsToCloud(payload, {
        url: 'https://demo.supabase.co',
        anonKey: 'anon',
        getSession: () => Promise.reject(new CloudAuthError('Credenciales inválidas', 'server')),
      });
      expect(res.success).toBe(false);
      expect(res).toEqual(expect.objectContaining({ error: 'Credenciales inválidas' }));
    });

    it('envía UPSERT correctamente con encabezado Prefer y cuerpo en JSON', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
      });

      const res = await syncHouseholdSettingsToCloud(payload, {
        url: 'https://demo.supabase.co',
        anonKey: 'anon-key-xyz',
        getSession: () => Promise.resolve(mockSession),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://demo.supabase.co/rest/v1/household_settings');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual(
        expect.objectContaining({
          apikey: 'anon-key-xyz',
          Authorization: 'Bearer valid-token',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        })
      );
      const parsedBody = JSON.parse(init.body);
      expect(parsedBody.user_id).toBe('user-1234');
      expect(parsedBody.monthly_budget_bs).toBe(180);
      expect(parsedBody.cost_per_kwh).toBe(0.85);
      expect(parsedBody.billing_cycle_start_day).toBe(1);
      expect(parsedBody.cut_protection_watts).toBe(3500);
      expect(parsedBody.last_meter_kwh).toBe(84.8);
    });

    it('captura errores de red sin lanzar excepción', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const res = await syncHouseholdSettingsToCloud(payload, {
        url: 'https://demo.supabase.co',
        anonKey: 'anon',
        getSession: () => Promise.resolve(mockSession),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      expect(res.success).toBe(false);
      expect(res).toEqual(expect.objectContaining({ error: expect.stringMatching(/conexión/i) }));
    });
  });

  describe('fetchHouseholdSettingsFromCloud', () => {
    it('retorna null si falla autenticación o no está configurado', async () => {
      const res = await fetchHouseholdSettingsFromCloud({ url: '', anonKey: '' });
      expect(res).toBeNull();
    });

    it('recupera y convierte a números la fila devuelta por Supabase', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              monthly_budget_bs: '220.50',
              cost_per_kwh: '0.8500',
              billing_cycle_start_day: 15,
              cut_protection_watts: 5500,
              last_meter_kwh: '142.30',
            },
          ]),
      });

      const result = await fetchHouseholdSettingsFromCloud({
        url: 'https://demo.supabase.co',
        anonKey: 'anon',
        getSession: () => Promise.resolve(mockSession),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result).toEqual({
        monthlyBudgetBs: 220.5,
        ratePerKWh: 0.85,
        billingCycleStartDay: 15,
        maxPowerThresholdW: 5500,
        lastMeterKWh: 142.3,
      });
    });

    it('retorna null si la tabla está vacía para ese usuario', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await fetchHouseholdSettingsFromCloud({
        url: 'https://demo.supabase.co',
        anonKey: 'anon',
        getSession: () => Promise.resolve(mockSession),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result).toBeNull();
    });
  });
});
