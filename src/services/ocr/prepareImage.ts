/**
 * Reduce la foto antes de enviarla al OCR: menos datos móviles y respuesta más rápida.
 * Una foto de 12 MP pesa varios MB en base64; a 1280 px de ancho basta para leer el display.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const OCR_MAX_WIDTH = 1600;

export interface PreparedImage {
  uri: string;
  base64: string;
}

export async function prepareImageForOcr(uri: string, width: number | undefined): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  if (width && width > OCR_MAX_WIDTH) {
    context.resize({ width: OCR_MAX_WIDTH });
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) {
    throw new Error('No se pudo procesar la imagen.');
  }
  return { uri: result.uri, base64: result.base64 };
}
