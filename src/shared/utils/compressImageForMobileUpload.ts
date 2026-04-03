import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { getInfoAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** 0.5 MB cap per photo after resize/compress (mobile-first). */
export const MOBILE_UPLOAD_MAX_BYTES = 512 * 1024;

const RESIZE_WIDTHS = [1024, 900, 800, 720] as const;
const INITIAL_QUALITY = 0.65;
const MIN_QUALITY = 0.25;
const QUALITY_STEP = 0.05;

async function getOutputSizeBytes(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('compressImageForMobileUpload: output file missing');
    }
    const blob = await response.blob();
    return blob.size;
  }

  const info = await getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('compressImageForMobileUpload: output file missing');
  }
  if (info.isDirectory) {
    throw new Error('compressImageForMobileUpload: expected a file');
  }
  return info.size;
}

/**
 * Resizes and JPEG-compresses a picked image for upload. Tries max width 1024 down to 720,
 * quality 0.65 down to 0.25 per width, until output is ≤ {@link MOBILE_UPLOAD_MAX_BYTES}.
 * If still over the limit, returns the smallest intermediate file.
 */
export async function compressImageForMobileUpload(sourceUri: string): Promise<{ uri: string }> {
  let bestUri: string | undefined;
  let bestSize = Infinity;

  for (const width of RESIZE_WIDTHS) {
    for (let quality = INITIAL_QUALITY; quality >= MIN_QUALITY - 1e-9; quality -= QUALITY_STEP) {
      const { uri } = await manipulateAsync(sourceUri, [{ resize: { width } }], {
        compress: quality,
        format: SaveFormat.JPEG,
      });

      const size = await getOutputSizeBytes(uri);
      if (size < bestSize) {
        bestSize = size;
        bestUri = uri;
      }

      if (size <= MOBILE_UPLOAD_MAX_BYTES) {
        return { uri };
      }
    }
  }

  if (bestUri === undefined) {
    throw new Error('compressImageForMobileUpload: failed to process image');
  }

  return { uri: bestUri };
}
