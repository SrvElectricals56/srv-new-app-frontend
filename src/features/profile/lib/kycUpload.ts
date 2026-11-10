import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const KYC_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const KYC_FAST_UPLOAD_THRESHOLD = 450 * 1024;
const KYC_UPLOAD_MAX_DIMENSION = 1400;

type PickedKycFile = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

type UploadFile = { uri: string; name: string; type: string };

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg', jfif: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  tif: 'image/tiff', tiff: 'image/tiff', avif: 'image/avif',
  heic: 'image/heic', heif: 'image/heif', bmp: 'image/bmp',
};

export function describeKycFile(file: PickedKycFile, documentType: string) {
  const name = file.name?.trim().split(/[\\/]/).pop() || `${documentType}-${Date.now()}`;
  const extension = name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
  const reportedMime = file.mimeType?.trim().toLowerCase() || '';
  const isPdf = extension === 'pdf' || (!extension && reportedMime === 'application/pdf');
  const type = isPdf
    ? 'application/pdf'
    : IMAGE_MIME_BY_EXTENSION[extension] || (reportedMime === 'image/jpg' ? 'image/jpeg' : reportedMime) || 'application/octet-stream';
  const shouldConvertImage = !isPdf && (
    ['heic', 'heif', 'bmp'].includes(extension) ||
    ['image/heic', 'image/heif', 'image/bmp'].includes(type) ||
    (file.size != null && file.size > KYC_FAST_UPLOAD_THRESHOLD && type.startsWith('image/')) ||
    (!extension && !reportedMime)
  );
  return { uri: file.uri, name, type, isPdf, shouldConvertImage };
}

export async function prepareKycUpload(file: PickedKycFile, documentType: string): Promise<UploadFile> {
  const described = describeKycFile(file, documentType);
  if (described.isPdf && file.size != null && file.size > KYC_MAX_FILE_SIZE) {
    throw new Error('PDF is too large. Please choose a file smaller than 25 MB.');
  }
  if (!described.shouldConvertImage) {
    return { uri: described.uri, name: described.name, type: described.type };
  }

  try {
    // Expo 58 downsamples during decoding with maxWidth/maxHeight. This avoids
    // loading full-resolution phone photos into memory and greatly reduces the
    // bytes sent to the backend without weakening OCR readability.
    const context = ImageManipulator.manipulate(file.uri, {
      maxWidth: KYC_UPLOAD_MAX_DIMENSION,
      maxHeight: KYC_UPLOAD_MAX_DIMENSION,
    });
    const image = await context.renderAsync();
    const jpeg = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.74 });
    const stem = described.name.replace(/\.[^.]+$/, '');
    return { uri: jpeg.uri, name: `${stem}.jpg`, type: 'image/jpeg' };
  } catch {
    if (/\.(heic|heif|bmp)$/i.test(described.name) || ['image/heic', 'image/heif', 'image/bmp'].includes(described.type)) {
      throw new Error('Could not prepare this photo. Please save it as JPG or PNG and try again.');
    }
    return { uri: described.uri, name: described.name, type: described.type };
  }
}
