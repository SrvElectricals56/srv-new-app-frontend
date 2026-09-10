import { decode } from 'fast-png';
import jsQR from 'jsqr';

/** Pure local fallback for native gallery decoders, including transparent PNGs. */
export function decodePngQr(bytes: Uint8Array): string | null {
  const png = decode(bytes);
  if (png.depth !== 8 || png.width * png.height > 4_000_000) return null;
  const rgba = new Uint8ClampedArray(png.width * png.height * 4);
  for (let pixel = 0; pixel < png.width * png.height; pixel++) {
    const offset = pixel * png.channels;
    const alpha = png.channels === 2 ? png.data[offset + 1] : png.channels === 4 ? png.data[offset + 3] : 255;
    for (let channel = 0; channel < 3; channel++) {
      const value = png.data[offset + (png.channels < 3 ? 0 : channel)];
      rgba[pixel * 4 + channel] = Math.round((value * alpha + 255 * (255 - alpha)) / 255);
    }
    rgba[pixel * 4 + 3] = 255;
  }
  return jsQR(rgba, png.width, png.height, { inversionAttempts: 'attemptBoth' })?.data?.trim() || null;
}
