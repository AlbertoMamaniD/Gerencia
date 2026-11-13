-- =====================================================================
-- AhorraTech · Tabla de configuración del hogar (household_settings)
-- ---------------------------------------------------------------------
-- Guarda el presupuesto mensual, la tarifa por kWh, el día de inicio de ciclo,
-- la protección de corte y la última lectura del medidor de cada usuario.
-- Vinculado directamente al auth.uid() de Supabase.
-- Idempotente: puede ejecutarse varias veces sin error.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.household_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_budget_bs NUMERIC(10, 2) NOT NULL DEFAULT 180.00,
    cost_per_kwh NUMERIC(10, 4) NOT NULL DEFAULT 0.8500,
    billing_cycle_start_day INT NOT NULL DEFAULT 1 CHECK (billing_cycle_start_day BETWEEN 1 AND 28),
    cut_protection_watts INT NOT NULL DEFAULT 3500,
    last_meter_kwh NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.household_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS seguras: Cada usuario (anónimo o con login) solo accede a su propia fila.
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.household_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.household_settings;
DROP POLICY IF EXISTS "Users can read their own settings" ON public.household_settings;

CREATE POLICY "Users can insert their own settings" ON public.household_settings
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON public.household_settings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own settings" ON public.household_settings
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

GRANT ALL ON public.household_settings TO authenticated;
REVOKE ALL ON public.household_settings FROM anon;
