import { buildPhotoFileName, uploadMeterScan } from '../cloud/supabaseStorage';

const payload = { detectedKWh: 120, previousKWh: 100, differenceKWh: 20, meterSerial: 'CRE 12/34', confidence: 95 };
const opts = { url: 'https://demo.supabase.co/', anonKey: 'anon', now: 1700000000000 };
const res = (status: number, body: unknown = []) =>
  ({ ok: status < 300, status, json: () => Promise.resolve(body) }) as unknown as Response;

describe('buildPhotoFileName', () => {
  it('limpia caracteres peligrosos del serial', () => {
    expect(buildPhotoFileName('CRE 12/34 ñ', 1)).toBe('meter_CRE-12-34-n_1.jpg');
    expect(buildPhotoFileName(null, 1)).toBe('meter_scan_1.jpg');
    expect(buildPhotoFileName('///', 1)).toBe('meter_scan_1.jpg');
  });
});

describe('uploadMeterScan', () => {
  it('sin configuración no intenta subir', async () => {
    const fetchImpl = jest.fn();
    const r = await uploadMeterScan('file://a.jpg', payload, { url: '', anonKey: '', fetchImpl });
    expect(r).toEqual({ success: false, error: 'El respaldo en la nube no está configurado.' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sube la foto y registra la calibración', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(res(200)).mockResolvedValueOnce(res(201, [{ id: 'abc' }]));
    const r = await uploadMeterScan('file://a.jpg', payload, { ...opts, fetchImpl });
    expect(r).toEqual({
      success: true,
      photoUrl: 'https://demo.supabase.co/storage/v1/object/public/meter-photos/meter_CRE-12-34_1700000000000.jpg',
      recordId: 'abc',
    });
    const body = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(body).toMatchObject({ detected_kwh: 120, hardware_kwh: 100, difference_kwh: 20, status: 'calibrated' });
  });

  it('reporta errores de almacenamiento y de base de datos', async () => {
    const storageFail = jest.fn().mockResolvedValue(res(403));
    expect(await uploadMeterScan('f', payload, { ...opts, fetchImpl: storageFail })).toMatchObject({ success: false });

    const dbFail = jest.fn().mockResolvedValueOnce(res(200)).mockResolvedValueOnce(res(400));
    const r = await uploadMeterScan('f', payload, { ...opts, fetchImpl: dbFail });
    expect(r).toEqual({ success: false, error: 'La foto se subió, pero no se pudo registrar (error 400).' });
  });

  it('sin conexión no lanza excepciones', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await uploadMeterScan('f', payload, { ...opts, fetchImpl })).toEqual({
      success: false,
      error: 'Sin conexión: la lectura se guardó solo en el teléfono.',
    });
  });
});
