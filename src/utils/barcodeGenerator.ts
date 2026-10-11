import JsBarcode from 'jsbarcode';
import { BarcodeFormat } from '../types';

export interface BarcodeRenderOptions {
  format: BarcodeFormat;
  width: number; // Single bar width (1 - 4)
  height: number; // Barcode height (30 - 150)
  displayValue: boolean;
  lineColor?: string;
  background?: string;
  fontSize?: number;
  margin?: number;
  textMargin?: number;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Validates the payload against barcode standard constraints.
 */
export function validateBarcodePayload(
  payload: string,
  format: BarcodeFormat
): BarcodeValidationResult {
  if (!payload || payload.trim().length === 0) {
    return {
      isValid: false,
      error: 'Document ID / barcode payload cannot be empty.',
    };
  }

  const trimmed = payload.trim();

  if (trimmed.length > 60) {
    return {
      isValid: false,
      error: 'Payload is too long for high-density scanning (maximum 60 characters).',
    };
  }

  if (format === 'CODE39') {
    // Code 39 only supports uppercase alphanumeric, dash, period, space, dollar, slash, plus, percent
    const code39Regex = /^[0-9A-Z\-\.\ \$\/\+\%]+$/;
    const uppercaseVal = trimmed.toUpperCase();

    if (!code39Regex.test(uppercaseVal)) {
      return {
        isValid: false,
        error:
          'Code 39 only supports uppercase letters (A-Z), digits (0-9), and symbols: - . $ / + % and space.',
      };
    }

    return {
      isValid: true,
      sanitizedValue: uppercaseVal,
    };
  }

  if (format === 'CODE128') {
    // Code 128 supports full standard ASCII (char codes 0 to 127)
    // Check for non-ASCII characters
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed.charCodeAt(i) > 127) {
        return {
          isValid: false,
          error: `Code 128 cannot encode non-ASCII character '${trimmed[i]}'. Use standard ASCII alphanumeric characters.`,
        };
      }
    }

    return {
      isValid: true,
      sanitizedValue: trimmed,
    };
  }

  return { isValid: true, sanitizedValue: trimmed };
}

/**
 * Renders a barcode to an SVG element.
 */
export function renderBarcodeToSvg(
  svgElement: SVGSVGElement,
  value: string,
  options: BarcodeRenderOptions
): void {
  const validation = validateBarcodePayload(value, options.format);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid barcode payload');
  }

  JsBarcode(svgElement, validation.sanitizedValue || value, {
    format: options.format,
    width: options.width,
    height: options.height,
    displayValue: options.displayValue,
    lineColor: options.lineColor || '#0f172a',
    background: options.background || '#ffffff',
    fontSize: options.fontSize || 14,
    margin: options.margin ?? 10,
    textMargin: options.textMargin ?? 4,
    font: 'monospace',
    textAlign: 'center',
  });
}

/**
 * Generates an SVG string representation of the barcode.
 */
export function generateBarcodeSvgString(
  value: string,
  options: BarcodeRenderOptions
): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  renderBarcodeToSvg(svg, value, options);
  return new XMLSerializer().serializeToString(svg);
}

/**
 * Generates a PNG Data URL using Canvas.
 */
export function generateBarcodePngDataUrl(
  value: string,
  options: BarcodeRenderOptions
): string {
  const validation = validateBarcodePayload(value, options.format);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid barcode payload');
  }

  const canvas = document.createElement('canvas');
  JsBarcode(canvas, validation.sanitizedValue || value, {
    format: options.format,
    width: options.width,
    height: options.height,
    displayValue: options.displayValue,
    lineColor: options.lineColor || '#0f172a',
    background: options.background || '#ffffff',
    fontSize: options.fontSize || 14,
    margin: options.margin ?? 12,
    textMargin: options.textMargin ?? 4,
    font: 'monospace',
    textAlign: 'center',
  });

  return canvas.toDataURL('image/png');
}

/**
 * Downloads a Barcode directly as PNG.
 */
export function downloadBarcodeAsPng(
  value: string,
  filename: string,
  options: BarcodeRenderOptions
): void {
  const dataUrl = generateBarcodePngDataUrl(value, options);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a Barcode directly as SVG.
 */
export function downloadBarcodeAsSvg(
  value: string,
  filename: string,
  options: BarcodeRenderOptions
): void {
  const svgString = generateBarcodeSvgString(value, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
