import { buildPhotoFileName, uploadMeterScan } from '../cloud/supabaseStorage';
import { CloudAuthError } from '../cloud/supabaseAuth';

const payload = { detectedKWh: 120, previousKWh: 100, differenceKWh: 20, meterSerial: 'CRE 12/34', confidence: 95 };
const session = { accessToken: 'USER_JWT', refreshToken: 'r', expiresAt: 9e9, userId: 'user-1' };
const opts = {
  url: 'https://demo.supabase.co/',
  anonKey: 'anon',
  now: 1700000000000,
  getSession: () => Promise.resolve(session),
};
const res = (status: number) => ({ ok: status < 300, status, json: () => Promise.resolve(null) }) as unknown as Response;

describe('buildPhotoFileName', () => {
  it('limpia caracteres peligrosos del serial (evita salir de la carpeta del usuario)', () => {
    expect(buildPhotoFileName('CRE 12/34 ñ', 1)).toBe('meter_CRE-12-34-n_1.jpg');
    expect(buildPhotoFileName('../../otro', 1)).toBe('meter_otro_1.jpg');
    expect(buildPhotoFileName(null, 1)).toBe('meter_scan_1.jpg');
    expect(buildPhotoFileName('///', 1)).toBe('meter_scan_1.jpg');
  });
});

describe('uploadMeterScan', () => {
  it('sin configuración no intenta subir', async () => {
    const fetchImpl = jest.fn();
    const r = await uploadMeterScan('file://a.jpg', payload, { ...opts, url: '', anonKey: '', fetchImpl });
    expect(r).toEqual({ success: false, error: 'El respaldo en la nube no está configurado.' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sube a la carpeta del usuario con su token y registra sin pedir lectura de vuelta', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(res(200)).mockResolvedValueOnce(res(201));
    const r = await uploadMeterScan('file://a.jpg', payload, { ...opts, fetchImpl });
    const path = 'user-1/meter_CRE-12-34_1700000000000.jpg';
    expect(r).toEqual({ success: true, photoPath: path });

    const [storageUrl, storageInit] = fetchImpl.mock.calls[0];
    expect(storageUrl).toBe(`https://demo.supabase.co/storage/v1/object/meter-photos/${path}`);
    expect(storageInit.headers.Authorization).toBe('Bearer USER_JWT');

    const dbInit = fetchImpl.mock.calls[1][1];
    expect(dbInit.headers.Prefer).toBe('return=minimal');
    expect(JSON.parse(dbInit.body)).toMatchObject({ owner_id: 'user-1', photo_url: path, detected_kwh: 120, status: 'calibrated' });
  });

  it('sin sesión en la nube informa el motivo', async () => {
    const getSession = () => Promise.reject(new CloudAuthError('El servidor no tiene habilitado el acceso anónimo.', 'anonymous_disabled'));
    const r = await uploadMeterScan('f', payload, { ...opts, getSession, fetchImpl: jest.fn() });
    expect(r).toEqual({ success: false, error: 'El servidor no tiene habilitado el acceso anónimo.' });
  });

  it('reporta errores de almacenamiento y de base de datos', async () => {
    expect(await uploadMeterScan('f', payload, { ...opts, fetchImpl: jest.fn().mockResolvedValue(res(403)) })).toMatchObject({
      success: false,
    });
    const dbFail = jest.fn().mockResolvedValueOnce(res(200)).mockResolvedValueOnce(res(400));
    expect(await uploadMeterScan('f', payload, { ...opts, fetchImpl: dbFail })).toEqual({
      success: false,
      error: 'La foto se subió, pero no se pudo registrar (error 400).',
    });
  });

  it('sin conexión no lanza excepciones', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await uploadMeterScan('f', payload, { ...opts, fetchImpl })).toEqual({
      success: false,
      error: 'Sin conexión: la lectura se guardó solo en el teléfono.',
    });
  });
});
