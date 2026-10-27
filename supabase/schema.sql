-- ==============================================================================
-- AHORRATECH - ARQUITECTURA DE BASE DE DATOS EMPRESARIAL (POSTGRESQL / SUPABASE)
-- ==============================================================================
-- Grado de Cumplimiento: 3NF (Tercera Forma Normal) + IoT Timeseries Pattern + Multi-Tenancy RLS
-- Diseñado para control de telemetría IoT (ESP32 + PZEM-004T), calibración OCR,
-- tarifas reguladas de Bolivia (CRE, DELAPAZ, ELFEC) y facturación a inquilinos en Bs.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS (Best Practice)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ORGANIZACIONES / PROPIETARIOS (Multi-Tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),                         -- NIT o CI en Bolivia
    phone VARCHAR(20) NOT NULL,
    plan_tier VARCHAR(20) DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro_edificio')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. PERFILES DE USUARIO (Vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'landlord' CHECK (role IN ('superadmin', 'landlord', 'tenant', 'technician')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. INMUEBLES FÍSICOS (Propiedades / Edificios / Casas de Alquiler)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,                  -- Ej: "Edificio Los Álamos", "Casa San Pedro"
    address TEXT NOT NULL,
    city VARCHAR(50) DEFAULT 'Santa Cruz',       -- Santa Cruz, La Paz, Cochabamba, El Alto, Tarija
    distributor VARCHAR(50) DEFAULT 'CRE',       -- CRE, DELAPAZ, ELFEC, ENDE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TARIFAS ELÉCTRICAS REGULADAS (Normativa AETN Bolivia)
-- Precisiones decimales fijadas con NUMERIC para evitar errores de redondeo en dinero
CREATE TABLE IF NOT EXISTS public.tariff_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor VARCHAR(50) NOT NULL,            -- CRE, DELAPAZ, ELFEC
    category VARCHAR(50) DEFAULT 'Domiciliaria',
    fixed_charge_bs NUMERIC(10, 2) DEFAULT 12.50,-- Cargo fijo mensual en Bs
    rate_tier1_bs NUMERIC(10, 4) DEFAULT 0.6500, -- 0 - 100 kWh (Bs/kWh)
    rate_tier2_bs NUMERIC(10, 4) DEFAULT 0.8500, -- 101 - 300 kWh (Bs/kWh)
    rate_tier3_bs NUMERIC(10, 4) DEFAULT 1.2500, -- Más de 300 kWh (Bs/kWh)
    street_lighting_pct NUMERIC(5, 2) DEFAULT 10.0, -- Tasa Alumbrado público (%)
    waste_management_bs NUMERIC(10, 2) DEFAULT 15.00, -- Tasa de Aseo Urbano en Bs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.tariff_plans (distributor, category, fixed_charge_bs, rate_tier1_bs, rate_tier2_bs, rate_tier3_bs)
VALUES 
    ('CRE', 'Domiciliaria', 12.80, 0.6700, 0.8750, 1.2900),
    ('DELAPAZ', 'Domiciliaria', 11.50, 0.6200, 0.8300, 1.2200),
    ('ELFEC', 'Domiciliaria', 12.00, 0.6400, 0.8500, 1.2500)
ON CONFLICT DO NOTHING;

-- 7. UNIDADES O SUB-MEDICIONES (Departamentos, Cuartos de Inquilinos, Zonas)
CREATE TABLE IF NOT EXISTS public.meter_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tariff_plan_id UUID REFERENCES public.tariff_plans(id),
    name VARCHAR(100) NOT NULL,                  -- Ej: "Dpto 101", "Cuarto 3", "Tienda PB"
    monthly_budget_bs NUMERIC(10, 2) DEFAULT 180.00,
    cycle_start_day INT DEFAULT 1 CHECK (cycle_start_day BETWEEN 1 AND 28),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_meter_units_updated_at
BEFORE UPDATE ON public.meter_units
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. DISPOSITIVOS HARDWARE IOT (ESP32 + PZEM-004T + Relay)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID UNIQUE REFERENCES public.meter_units(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) UNIQUE NOT NULL,     -- MAC física única
    api_key VARCHAR(64) UNIQUE NOT NULL,         -- Token de autorización REST/WebSockets
    firmware_version VARCHAR(20) DEFAULT '1.0.0',
    relay_state BOOLEAN DEFAULT TRUE,            -- Estado de corte remoto (ON/OFF)
    is_online BOOLEAN DEFAULT FALSE,
    last_ping TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TELEMETRÍA DE ALTA FRECUENCIA (Series temporales IoT)
CREATE TABLE IF NOT EXISTS public.telemetry_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    voltage NUMERIC(5, 1) NOT NULL,              -- Tensión V (220V)
    current NUMERIC(6, 2) NOT NULL,              -- Corriente A
    power NUMERIC(7, 1) NOT NULL,                -- Potencia W
    energy_kwh NUMERIC(10, 2) NOT NULL,          -- Acumulado kWh
    frequency NUMERIC(4, 1) DEFAULT 50.0,        -- Hz (50Hz en Bolivia)
    power_factor NUMERIC(3, 2) DEFAULT 0.98,     -- cos phi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AGREGADOS DIARIOS PRECALCULADOS (IoT Rollup Pattern - Cero latencia en gráficos)
CREATE TABLE IF NOT EXISTS public.daily_energy_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    total_kwh NUMERIC(10, 2) NOT NULL,
    cost_bs NUMERIC(10, 2) NOT NULL,
    peak_power_w NUMERIC(7, 1) NOT NULL,
    min_voltage NUMERIC(5, 1) NOT NULL,
    max_voltage NUMERIC(5, 1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (device_id, reading_date)
);

-- 11. AUDITORÍA Y CALIBRACIÓN CON FOTO (OCR Multimodal)
CREATE TABLE IF NOT EXISTS public.meter_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.meter_units(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,                     -- URL en Supabase Storage
    detected_kwh NUMERIC(10, 2) NOT NULL,        -- Lectura extraída por Gemini Vision
    hardware_kwh NUMERIC(10, 2) NOT NULL,        -- Lo que marcaba el PZEM en ese instante
    difference_kwh NUMERIC(10, 2) NOT NULL,      -- Desfase para calibración
    meter_serial VARCHAR(50),                    -- Nº de serie físico
    ocr_confidence NUMERIC(5, 2) DEFAULT 98.0,
    status VARCHAR(20) DEFAULT 'calibrated' CHECK (status IN ('pending', 'calibrated', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. RECIBOS MENSUALES DE COBRO (EN BOLIVIANOS)
CREATE TABLE IF NOT EXISTS public.monthly_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.meter_units(id) ON DELETE CASCADE,
    billing_period VARCHAR(7) NOT NULL,          -- Formato YYYY-MM
    start_kwh NUMERIC(10, 2) NOT NULL,
    end_kwh NUMERIC(10, 2) NOT NULL,
    total_kwh NUMERIC(10, 2) NOT NULL,
    total_bs NUMERIC(10, 2) NOT NULL,            -- Monto en Bs para cobrar al inquilino
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    qr_payment_payload TEXT,                     -- Payload de QR Simple Bolivia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. ÍNDICES DE ALTO RENDIMIENTO (Query Optimization)
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON public.telemetry_readings (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_device_date ON public.daily_energy_aggregates (device_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_scans_unit ON public.meter_scans (unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_unit ON public.monthly_bills (unit_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_devices_unit ON public.devices (unit_id);

-- 14. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_energy_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;

-- Propietario lee todo lo de su organización
CREATE POLICY "Landlord access properties" ON public.properties
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Inquilino lee solo su unidad asignada; Propietario lee todas las unidades de su propiedad
CREATE POLICY "Tenant and Landlord access units" ON public.meter_units
    FOR ALL USING (
        assigned_tenant_id = auth.uid()
        OR property_id IN (
            SELECT p.id FROM public.properties p
            JOIN public.profiles pr ON pr.organization_id = p.organization_id
            WHERE pr.id = auth.uid()
        )
    );

-- Inquilinos y Propietarios leen sus facturas
CREATE POLICY "Access monthly bills" ON public.monthly_bills
    FOR SELECT USING (
        unit_id IN (
            SELECT u.id FROM public.meter_units u
            WHERE u.assigned_tenant_id = auth.uid()
            OR u.property_id IN (
                SELECT p.id FROM public.properties p
                JOIN public.profiles pr ON pr.organization_id = p.organization_id
                WHERE pr.id = auth.uid()
            )
        )
    );

-- Inquilinos y Propietarios leen telemetría agregada
CREATE POLICY "Access daily aggregates" ON public.daily_energy_aggregates
    FOR SELECT USING (
        device_id IN (
            SELECT d.id FROM public.devices d
            JOIN public.meter_units u ON u.id = d.unit_id
            WHERE u.assigned_tenant_id = auth.uid()
            OR u.property_id IN (
                SELECT p.id FROM public.properties p
                JOIN public.profiles pr ON pr.organization_id = p.organization_id
                WHERE pr.id = auth.uid()
            )
        )
    );

-- 15. FUNCIÓN RPC PARA INGESTIÓN IOT DESDE ESP32 (Autenticación nativa por API Key)
CREATE OR REPLACE FUNCTION public.ingest_esp32_telemetry(
    p_mac_address VARCHAR(17),
    p_api_key VARCHAR(64),
    p_voltage NUMERIC(5, 1),
    p_current NUMERIC(6, 2),
    p_power NUMERIC(7, 1),
    p_energy_kwh NUMERIC(10, 2),
    p_frequency NUMERIC(4, 1) DEFAULT 50.0,
    p_power_factor NUMERIC(3, 2) DEFAULT 0.98
)
RETURNS JSONB AS $$
DECLARE
    v_device_id UUID;
    v_relay_state BOOLEAN;
BEGIN
    SELECT id, relay_state INTO v_device_id, v_relay_state
    FROM public.devices
    WHERE mac_address = p_mac_address AND api_key = p_api_key;

    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'Dispositivo no autorizado o credenciales inválidas' USING ERRCODE = '28000';
    END IF;

    -- Actualizar estado de ping y presencia online
    UPDATE public.devices
    SET is_online = TRUE, last_ping = NOW()
    WHERE id = v_device_id;

    -- Registrar lectura de alta frecuencia
    INSERT INTO public.telemetry_readings (
        device_id, voltage, current, power, energy_kwh, frequency, power_factor
    ) VALUES (
        v_device_id, p_voltage, p_current, p_power, p_energy_kwh, p_frequency, p_power_factor
    );

    RETURN jsonb_build_object(
        'status', 'ok',
        'relay_state', v_relay_state,
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
