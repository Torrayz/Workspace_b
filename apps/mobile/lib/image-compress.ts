// ============================================================================
// Image Compression — expo-image-manipulator wrapper
// Resize max 1280px lebar, quality 0.7, format JPEG
// ============================================================================

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Kompresi gambar sebelum upload ke Supabase Storage.
 * - Resize: max lebar 1280px (proporsi dipertahankan)
 * - Quality: 0.7 (70%)
 * - Format: JPEG
 *
 * @param uri - URI file gambar dari image picker
 * @returns URI file hasil kompresi
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

/**
 * Kompresi multiple gambar secara parallel.
 */
export async function compressImages(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(compressImage));
}
