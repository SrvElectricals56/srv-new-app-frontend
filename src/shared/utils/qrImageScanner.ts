import { scanFromURLAsync } from 'expo-camera';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';

type GalleryImage = {
  uri: string;
  width?: number | null;
  height?: number | null;
};

async function scan(uri: string) {
  const matches = await scanFromURLAsync(uri, ['qr']);
  return matches.find((match) => Boolean(match.data?.trim()))?.data?.trim() ?? null;
}

async function scanPasses(uri: string, width: number, height: number, scales: number[]) {
  const positions = [0, 0.5, 1];
  for (const scale of scales) {
    // Process one crop row at a time. Creating nine 1600px PNGs concurrently
    // can exhaust memory on Android devices with aggressive vendor limits.
    for (const yRatio of positions) {
      const results = await Promise.all(
        positions.map(async (xRatio) => {
          try {
            const processed = await manipulateAsync(
              uri,
              [cropAction(width, height, scale, xRatio, yRatio), { resize: { width: 1600 } }],
              { compress: 1, format: SaveFormat.PNG },
            );
            return await scan(processed.uri).catch(() => null);
          } catch {
            return null;
          }
        }),
      );
      const decoded = results.find(Boolean);
      if (decoded) return decoded;
    }
  }
  return null;
}

function cropAction(width: number, height: number, scale: number, xRatio: number, yRatio: number): Action {
  const cropWidth = Math.max(128, Math.floor(width * scale));
  const cropHeight = Math.max(128, Math.floor(height * scale));
  return {
    crop: {
      originX: Math.max(0, Math.floor((width - cropWidth) * xRatio)),
      originY: Math.max(0, Math.floor((height - cropHeight) * yRatio)),
      width: cropWidth,
      height: cropHeight,
    },
  };
}

/**
 * Decode the original immediately, then retry normalized/upscaled crops.
 * The early exit keeps clear codes fast while the fallback passes help with
 * small, dull, compressed, or mildly blurred gallery images.
 */
export async function scanQrFromGalleryImage(image: GalleryImage) {
  const direct = await scan(image.uri).catch(() => null);
  if (direct) return direct;

  const width = Number(image.width ?? 0);
  const height = Number(image.height ?? 0);
  if (width < 128 || height < 128) return null;

  const longestEdge = Math.max(width, height);
  const normalizedLongestEdge = Math.min(2600, Math.max(1800, longestEdge * 2));
  const resize = width >= height
    ? { resize: { width: Math.round(normalizedLongestEdge) } } as Action
    : { resize: { height: Math.round(normalizedLongestEdge) } } as Action;

  try {
    // Normalizing first also resolves EXIF orientation, which avoids invalid crop
    // coordinates on Android gallery photos taken in portrait mode.
    const normalized = await manipulateAsync(image.uri, [resize], {
      compress: 1,
      format: SaveFormat.PNG,
    });
    const normalizedResult = await scan(normalized.uri).catch(() => null);
    if (normalizedResult) return normalizedResult;

    // Android's native decoder performs best when the QR occupies most of the
    // bitmap. Scan overlapping 3x3 crops in parallel so off-centre codes are
    // found quickly without asking the user to crop the photo manually.
    const croppedResult = await scanPasses(
      normalized.uri,
      normalized.width,
      normalized.height,
      [0.72, 0.5],
    );
    if (croppedResult) return croppedResult;
  } catch {
    // The caller shows the user-facing retry message.
  }

  return null;
}
