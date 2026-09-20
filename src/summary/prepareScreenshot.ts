import { nativeImage } from 'electron';

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';
const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,';
const MAX_SCREENSHOT_WIDTH_PX = 1600;
const JPEG_QUALITY = 80;

export function prepareScreenshotForAnalysis(pngDataUrl: unknown): string {
  if (typeof pngDataUrl !== 'string' || !pngDataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
    throw new Error('Screenshot must be a PNG data URL');
  }
  const image = nativeImage.createFromDataURL(pngDataUrl);
  if (image.isEmpty()) throw new Error('Screenshot image is empty');

  const { width } = image.getSize();
  const resized = width > MAX_SCREENSHOT_WIDTH_PX
    ? image.resize({ width: MAX_SCREENSHOT_WIDTH_PX })
    : image;
  return `${JPEG_DATA_URL_PREFIX}${resized.toJPEG(JPEG_QUALITY).toString('base64')}`;
}
