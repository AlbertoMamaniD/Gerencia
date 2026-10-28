/**
 * AhorraTech - Servicio de Almacenamiento en Nube y Auditoría (Supabase)
 * Sube fotografías de medidores al bucket 'meter-photos' y registra la calibración en 'meter_scans'.
 */

export interface SupabaseScanPayload {
  detectedKWh: number;
  hardwareKWh: number;
  differenceKWh: number;
  meterSerial: string;
  confidence: number;
}

export interface SupabaseUploadResult {
  success: boolean;
  photoUrl?: string;
  recordId?: string;
  error?: string;
}

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

/**
 * Sube la imagen del medidor a Supabase Storage y crea el registro de auditoría en la tabla meter_scans.
 */
export async function uploadMeterScanToSupabase(
  imageUri: string,
  data: SupabaseScanPayload,
  config?: SupabaseConfig
): Promise<SupabaseUploadResult> {
  const supabaseUrl = config?.url?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = config?.anonKey?.trim() || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      photoUrl: imageUri,
      error: 'Supabase URL o Anon Key no configuradas',
    };
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const timestamp = Date.now();
  const fileName = `meter_${data.meterSerial || 'scan'}_${timestamp}.jpg`;

  try {
    // 1. SUBIR FOTOGRAFÍA A SUPABASE STORAGE (Bucket: meter-photos)
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob);

    const storageEndpoint = `${cleanUrl}/storage/v1/object/meter-photos/${fileName}`;
    const storageRes = await fetch(storageEndpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    if (!storageRes.ok) {
      const errText = await storageRes.text().catch(() => '');
      return { success: false, photoUrl: imageUri, error: `Error Storage: ${errText || storageRes.status}` };
    }

    const publicPhotoUrl = `${cleanUrl}/storage/v1/object/public/meter-photos/${fileName}`;

    // 2. INSERTAR REGISTRO DE AUDITORÍA EN TABLA meter_scans
    const tableEndpoint = `${cleanUrl}/rest/v1/meter_scans`;
    const dbRes = await fetch(tableEndpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        photo_url: publicPhotoUrl,
        detected_kwh: data.detectedKWh,
        hardware_kwh: data.hardwareKWh,
        difference_kwh: data.differenceKWh,
        meter_serial: data.meterSerial,
        ocr_confidence: data.confidence,
        status: 'calibrated',
      }),
    });

    const dbData = dbRes.ok ? await dbRes.json().catch(() => []) : [];
    const recordId = Array.isArray(dbData) && dbData[0]?.id ? dbData[0].id : undefined;

    return {
      success: true,
      photoUrl: publicPhotoUrl,
      recordId,
    };
  } catch (err) {
    return {
      success: false,
      photoUrl: imageUri,
      error: err instanceof Error ? err.message : 'Error desconocido de conexión',
    };
  }
}
