-- =====================================================================
-- AhorraTech · Endurecimiento de seguridad (ejecutar después de schema.sql)
-- ---------------------------------------------------------------------
-- Problema: la anon key viaja dentro de la app (es pública). Las políticas
-- anteriores permitían a CUALQUIERA leer todas las lecturas y fotos e
-- insertar datos sin límite.
--
-- Solución:
--   * Cada teléfono inicia una sesión ANÓNIMA de Supabase Auth
--     (Authentication → Sign In / Providers → "Allow anonymous sign-ins").
--   * Cada fila y cada foto pertenece a su usuario (auth.uid()).
--   * El bucket de fotos es privado, solo JPEG y máximo 5 MB.
--   * El OCR se hace en una Edge Function con cuota diaria por usuario.
-- Es idempotente: puede ejecutarse más de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. meter_scans: dueño por fila + validaciones de datos
-- ---------------------------------------------------------------------
ALTER TABLE public.meter_scans
    ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scans_owner ON public.meter_scans (owner_id, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meter_scans_values_check') THEN
        ALTER TABLE public.meter_scans ADD CONSTRAINT meter_scans_values_check CHECK (
            detected_kwh >= 0 AND detected_kwh < 100000000
            AND hardware_kwh >= 0 AND hardware_kwh < 100000000
            AND abs(difference_kwh) < 100000000
            AND (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 100))
            AND char_length(photo_url) <= 300
            AND (meter_serial IS NULL OR char_length(meter_serial) <= 50)
        ) NOT VALID;
    END IF;
END $$;

-- Las políticas abiertas se eliminan.
DROP POLICY IF EXISTS "Allow insert meter_scans" ON public.meter_scans;
DROP POLICY IF EXISTS "Allow select meter_scans" ON public.meter_scans;
DROP POLICY IF EXISTS "Owner inserts meter_scans" ON public.meter_scans;
DROP POLICY IF EXISTS "Owner reads meter_scans" ON public.meter_scans;

-- Solo usuarios con sesión (anónima o normal) y únicamente con su propio id.
-- La foto debe estar dentro de la carpeta del usuario.
CREATE POLICY "Owner inserts meter_scans" ON public.meter_scans
    FOR INSERT TO authenticated
    WITH CHECK (
        owner_id = auth.uid()
        AND photo_url LIKE auth.uid()::text || '/%'
    );

CREATE POLICY "Owner reads meter_scans" ON public.meter_scans
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

-- Sin políticas de UPDATE/DELETE: el historial de calibraciones es inmutable.
REVOKE ALL ON public.meter_scans FROM anon;

-- ---------------------------------------------------------------------
-- 2. Storage: bucket privado, solo JPEG ≤ 5 MB, carpeta por usuario
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('meter-photos', 'meter-photos', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg'];

DROP POLICY IF EXISTS "Allow upload meter-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow view meter-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner uploads meter-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner reads meter-photos" ON storage.objects;

CREATE POLICY "Owner uploads meter-photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'meter-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Owner reads meter-photos" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'meter-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ---------------------------------------------------------------------
-- 2b. Función de ingestión del ESP32: fija search_path (evita secuestro de
--     esquema en funciones SECURITY DEFINER).
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regprocedure('public.ingest_esp32_telemetry(varchar, varchar, numeric, numeric, numeric, numeric, numeric, numeric)') IS NOT NULL THEN
        ALTER FUNCTION public.ingest_esp32_telemetry(varchar, varchar, numeric, numeric, numeric, numeric, numeric, numeric)
            SET search_path = public;
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Cuota diaria de OCR por usuario (la usa la Edge Function ocr-meter)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ocr_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ocr_usage ENABLE ROW LEVEL SECURITY;
-- Sin políticas: nadie la lee ni la escribe directamente; solo la función de abajo.
REVOKE ALL ON public.ocr_usage FROM anon, authenticated;

-- Incrementa el contador del usuario actual de forma atómica.
-- Devuelve TRUE si todavía está dentro del límite diario.
CREATE OR REPLACE FUNCTION public.consume_ocr_quota(p_daily_limit INTEGER DEFAULT 30)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_count INTEGER;
BEGIN
    IF v_user IS NULL THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.ocr_usage (user_id, usage_date, request_count)
    VALUES (v_user, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET request_count = public.ocr_usage.request_count + 1
    RETURNING request_count INTO v_count;

    RETURN v_count <= LEAST(GREATEST(p_daily_limit, 1), 200);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ocr_quota(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ocr_quota(INTEGER) TO authenticated;
