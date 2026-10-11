import QRCode from 'qrcode';
import { QrErrorCorrectionLevel } from '../types';

export interface QrRenderOptions {
  size: number;
  errorCorrection: QrErrorCorrectionLevel;
  includeLabel: boolean;
  darkColor?: string;
  lightColor?: string;
  margin?: number;
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvg(
  url: string,
  options: QrRenderOptions
): Promise<string> {
  const svgString = await QRCode.toString(url, {
    type: 'svg',
    width: options.size,
    errorCorrectionLevel: options.errorCorrection,
    margin: options.margin ?? 2,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#ffffff',
    },
  });

  if (!options.includeLabel) {
    return svgString;
  }

  // Inject VJEC IdeaLock label at bottom of SVG if requested
  const labelHeight = 36;
  const totalHeight = options.size + labelHeight;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (svgEl) {
    svgEl.setAttribute('height', `${totalHeight}`);
    svgEl.setAttribute('viewBox', `0 0 ${options.size} ${totalHeight}`);

    // Add white/light background rectangle for banner
    const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', `${options.size}`);
    bgRect.setAttribute('width', `${options.size}`);
    bgRect.setAttribute('height', `${labelHeight}`);
    bgRect.setAttribute('fill', options.lightColor || '#ffffff');
    svgEl.appendChild(bgRect);

    // Text label
    const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', `${options.size / 2}`);
    textEl.setAttribute('y', `${options.size + 22}`);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('fill', options.darkColor || '#0f172a');
    textEl.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    textEl.setAttribute('font-size', '13');
    textEl.setAttribute('font-weight', '700');
    textEl.setAttribute('letter-spacing', '1px');
    textEl.textContent = 'VJEC IDEALOCK VERIFIED ID';
    svgEl.appendChild(textEl);

    return new XMLSerializer().serializeToString(svgEl);
  }

  return svgString;
}

/**
 * Generates a PNG Data URL using Canvas, including optional label.
 */
export async function generateQrPngDataUrl(
  url: string,
  options: QrRenderOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const labelHeight = options.includeLabel ? 40 : 0;
  canvas.width = options.size;
  canvas.height = options.size + labelHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Fill canvas background
  ctx.fillStyle = options.lightColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render QR to a temp canvas first
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    width: options.size,
    errorCorrectionLevel: options.errorCorrection,
    margin: options.margin ?? 2,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#ffffff',
    },
  });

  // Draw QR
  ctx.drawImage(qrCanvas, 0, 0, options.size, options.size);

  // If label requested, draw institutional banner
  if (options.includeLabel) {
    ctx.fillStyle = options.darkColor || '#0f172a';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VJEC IDEALOCK VERIFICATION', options.size / 2, options.size + 15);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px monospace';
    ctx.fillText('SCAN TO VALIDATE INTEGRITY', options.size / 2, options.size + 29);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Downloads a QR code directly as PNG.
 */
export async function downloadQrAsPng(
  url: string,
  filename: string,
  options: QrRenderOptions
): Promise<void> {
  const dataUrl = await generateQrPngDataUrl(url, options);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a QR code directly as SVG.
 */
export async function downloadQrAsSvg(
  url: string,
  filename: string,
  options: QrRenderOptions
): Promise<void> {
  const svgContent = await generateQrSvg(url, options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
