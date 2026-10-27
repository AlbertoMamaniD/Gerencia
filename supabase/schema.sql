-- ==============================================================================
-- AHORRATECH - ESQUEMA DE BASE DE DATOS EMPRESARIAL (100% COMPATIBLE CON SUPABASE)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase (Plan Free / Gratis).
-- Diseñado para control de telemetría IoT (ESP32 + PZEM-004T), calibración OCR,
-- tarifas reguladas de Bolivia (CRE, DELAPAZ, ELFEC) y facturación por cuartos/inmuebles.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE ORGANIZACIONES / PROPIETARIOS
-- Agrupa inmuebles (ej. "Familia Pérez", "Condominio Equipetrol", "Inmobiliaria Santa Cruz")
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),                         -- NIT o CI en Bolivia
    phone VARCHAR(20) NOT NULL,
    plan_tier VARCHAR(20) DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro_edificio')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERFILES DE USUARIO (Vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'landlord' CHECK (role IN ('superadmin', 'landlord', 'tenant', 'technician')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. INMUEBLES FÍSICOS
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,                  -- Ej: "Edificio Los Álamos", "Casa San Pedro"
    address TEXT NOT NULL,
    city VARCHAR(50) DEFAULT 'Santa Cruz',       -- Santa Cruz, La Paz, Cochabamba, El Alto, Tarija
    distributor VARCHAR(50) DEFAULT 'CRE',       -- CRE, DELAPAZ, ELFEC, ENDE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TARIFAS ELÉCTRICAS REGULADAS (Normativa AETN Bolivia)
CREATE TABLE IF NOT EXISTS public.tariff_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor VARCHAR(50) NOT NULL,            -- CRE, DELAPAZ, ELFEC
    category VARCHAR(50) DEFAULT 'Domiciliaria',
    fixed_charge_bs NUMERIC(10, 2) DEFAULT 12.50,-- Cargo fijo mensual en Bs
    rate_tier1_bs NUMERIC(10, 4) DEFAULT 0.6500, -- 0 - 100 kWh (Bs/kWh)
    rate_tier2_bs NUMERIC(10, 4) DEFAULT 0.8500, -- 101 - 300 kWh (Bs/kWh)
    rate_tier3_bs NUMERIC(10, 4) DEFAULT 1.2500, -- Más de 300 kWh (Bs/kWh)
    street_lighting_pct NUMERIC(5, 2) DEFAULT 10.0, -- Alumbrado público (%)
    waste_management_bs NUMERIC(10, 2) DEFAULT 15.00, -- Tasa de Aseo Urbano en Bs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tarifas base oficiales de Bolivia
INSERT INTO public.tariff_plans (distributor, category, fixed_charge_bs, rate_tier1_bs, rate_tier2_bs, rate_tier3_bs)
VALUES 
    ('CRE', 'Domiciliaria', 12.80, 0.6700, 0.8750, 1.2900),
    ('DELAPAZ', 'Domiciliaria', 11.50, 0.6200, 0.8300, 1.2200),
    ('ELFEC', 'Domiciliaria', 12.00, 0.6400, 0.8500, 1.2500)
ON CONFLICT DO NOTHING;

-- 6. UNIDADES O SUB-MEDICIONES (Departamentos, Cuartos de Inquilinos, Zonas)
CREATE TABLE IF NOT EXISTS public.meter_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tariff_plan_id UUID REFERENCES public.tariff_plans(id),
    name VARCHAR(100) NOT NULL,                  -- Ej: "Dpto 101", "Cuarto 3", "Tienda PB"
    monthly_budget_bs NUMERIC(10, 2) DEFAULT 180.00,
    cycle_start_day INT DEFAULT 1 CHECK (cycle_start_day BETWEEN 1 AND 28),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DISPOSITIVOS HARDWARE IOT (ESP32 + PZEM-004T + Relay)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID UNIQUE REFERENCES public.meter_units(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) UNIQUE NOT NULL,     -- Ej: "30:AE:A4:07:0B:84"
    api_key VARCHAR(64) UNIQUE NOT NULL,         -- Token de autorización mTLS / API REST
    firmware_version VARCHAR(20) DEFAULT '1.0.0',
    relay_state BOOLEAN DEFAULT TRUE,            -- Corte preventivo de energía (ON/OFF)
    is_online BOOLEAN DEFAULT FALSE,
    last_ping TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TELEMETRÍA DE ALTA FRECUENCIA
CREATE TABLE IF NOT EXISTS public.telemetry_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    voltage NUMERIC(5, 1) NOT NULL,              -- Tensión V
    current NUMERIC(6, 2) NOT NULL,              -- Corriente A
    power NUMERIC(7, 1) NOT NULL,                -- Potencia W
    energy_kwh NUMERIC(10, 2) NOT NULL,          -- Energía acumulada kWh
    frequency NUMERIC(4, 1) DEFAULT 50.0,        -- Hz
    power_factor NUMERIC(3, 2) DEFAULT 0.98,     -- cos phi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. AUDITORÍA Y CALIBRACIÓN CON FOTO (OCR)
CREATE TABLE IF NOT EXISTS public.meter_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.meter_units(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,                     -- URL en Supabase Storage (Bucket 'meter-photos')
    detected_kwh NUMERIC(10, 2) NOT NULL,        -- Lectura extraída por Google Gemini / OCR
    hardware_kwh NUMERIC(10, 2) NOT NULL,        -- Lo que marcaba el PZEM en ese instante
    difference_kwh NUMERIC(10, 2) NOT NULL,      -- Diferencia detectada
    meter_serial VARCHAR(50),                    -- Nº de serie físico
    ocr_confidence NUMERIC(5, 2) DEFAULT 98.0,
    status VARCHAR(20) DEFAULT 'calibrated' CHECK (status IN ('pending', 'calibrated', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. RECIBOS MENSUALES DE COBRO (EN BOLIVIANOS)
CREATE TABLE IF NOT EXISTS public.monthly_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.meter_units(id) ON DELETE CASCADE,
    billing_period VARCHAR(7) NOT NULL,          -- Ej: "2026-10"
    start_kwh NUMERIC(10, 2) NOT NULL,
    end_kwh NUMERIC(10, 2) NOT NULL,
    total_kwh NUMERIC(10, 2) NOT NULL,
    total_bs NUMERIC(10, 2) NOT NULL,            -- Monto en Bs para cobrar al inquilino
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    qr_payment_payload TEXT,                     -- Payload de QR Simple Bolivia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON public.telemetry_readings (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_unit ON public.meter_scans (unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_unit ON public.monthly_bills (unit_id, billing_period);
