-- Pruebas de seguridad (RLS). Se ejecutan en CI sobre PostgreSQL con supabase/tests/00_supabase_stub.sql.
-- Cualquier "FALLO" aborta la ejecución.
\set ON_ERROR_STOP on
INSERT INTO auth.users VALUES ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222') ON CONFLICT DO NOTHING;

-- Usuario A inserta su lectura y su foto
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
INSERT INTO public.meter_scans (photo_url, detected_kwh, hardware_kwh, difference_kwh)
VALUES ('11111111-1111-1111-1111-111111111111/meter_a.jpg', 120, 100, 20);
INSERT INTO storage.objects (bucket_id, name) VALUES ('meter-photos', '11111111-1111-1111-1111-111111111111/meter_a.jpg');
SELECT 'A ve sus filas: ' || count(*) FROM public.meter_scans;
SELECT 'cuota A (1..3): ' || public.consume_ocr_quota(2) || ',' || public.consume_ocr_quota(2) || ',' || public.consume_ocr_quota(2);

-- Usuario B no ve lo de A ni puede escribir en la carpeta de A
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
SELECT 'B ve filas de A: ' || count(*) FROM public.meter_scans;
SELECT 'B ve fotos de A: ' || count(*) FROM storage.objects;
DO $$ BEGIN
  INSERT INTO public.meter_scans (photo_url, detected_kwh, hardware_kwh, difference_kwh)
  VALUES ('11111111-1111-1111-1111-111111111111/robada.jpg', 1, 1, 0);
  RAISE EXCEPTION 'FALLO: B escribió en la carpeta de A';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: B bloqueado en carpeta ajena';
END $$;
DO $$ BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('meter-photos', '11111111-1111-1111-1111-111111111111/x.jpg');
  RAISE EXCEPTION 'FALLO: B subió foto a carpeta de A';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: B no sube a carpeta ajena';
END $$;
DO $$ BEGIN
  UPDATE public.meter_scans SET detected_kwh = 0;
  RAISE NOTICE 'OK: UPDATE no afecta filas (sin política)';
END $$;
DO $$ BEGIN
  INSERT INTO public.meter_scans (photo_url, detected_kwh, hardware_kwh, difference_kwh)
  VALUES ('22222222-2222-2222-2222-222222222222/x.jpg', -5, 1, 0);
  RAISE EXCEPTION 'FALLO: aceptó kWh negativo';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: valores inválidos rechazados';
END $$;

-- Rol anónimo (solo anon key, sin sesión): nada
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', false);
DO $$ BEGIN
  PERFORM count(*) FROM public.meter_scans;
  RAISE EXCEPTION 'FALLO: anon pudo leer meter_scans';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: anon no lee meter_scans';
END $$;
DO $$ BEGIN
  PERFORM public.consume_ocr_quota(5);
  RAISE EXCEPTION 'FALLO: anon pudo usar cuota OCR';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: anon no usa OCR';
END $$;
RESET ROLE;
SELECT 'bucket privado: ' || (NOT public) || ', limite: ' || file_size_limit || ', tipos: ' || array_to_string(allowed_mime_types, ',') FROM storage.buckets WHERE id = 'meter-photos';
SELECT 'search_path RPC: ' || array_to_string(proconfig, ',') FROM pg_proc WHERE proname = 'ingest_esp32_telemetry';

-- Verificaciones finales (abortan si algo no quedó seguro)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'meter-photos' AND public) THEN
    RAISE EXCEPTION 'FALLO: el bucket meter-photos es público';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE 'Allow %' AND tablename IN ('meter_scans', 'objects')) THEN
    RAISE EXCEPTION 'FALLO: quedan políticas abiertas';
  END IF;
  RAISE NOTICE 'OK: configuración de seguridad verificada';
END $$;
