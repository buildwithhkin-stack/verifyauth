import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Barcode as BarcodeIcon,
  RefreshCw,
  FileBadge,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { IdeaDocument, BarcodeFormat } from '../types';
import {
  renderBarcodeToSvg,
  generateBarcodePngDataUrl,
  downloadBarcodeAsPng,
  downloadBarcodeAsSvg,
  validateBarcodePayload,
} from '../utils/barcodeGenerator';

interface BarcodeGeneratorTabProps {
  document: IdeaDocument;
  onOpenLabelModal: (doc: IdeaDocument) => void;
  onUpdateDocumentOptions?: (docId: string, barcodeOptions: any) => void;
}

export const BarcodeGeneratorTab: React.FC<BarcodeGeneratorTabProps> = ({
  document: doc,
  onOpenLabelModal,
  onUpdateDocumentOptions,
}) => {
  const [format, setFormat] = useState<BarcodeFormat>(
    doc.barcodeOptions?.format || 'CODE128'
  );
  const [width, setWidth] = useState<number>(doc.barcodeOptions?.width || 2);
  const [height, setHeight] = useState<number>(doc.barcodeOptions?.height || 64);
  const [displayValue, setDisplayValue] = useState<boolean>(
    doc.barcodeOptions?.displayValue ?? true
  );
  const [lineColor, setLineColor] = useState<string>(
    doc.barcodeOptions?.lineColor || '#0f172a'
  );
  const [background, setBackground] = useState<string>(
    doc.barcodeOptions?.background || '#ffffff'
  );

  const [customPayload, setCustomPayload] = useState<string>(doc.id);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync custom payload when selected document changes
  useEffect(() => {
    setCustomPayload(doc.id);
  }, [doc.id]);

  // Validate and render barcode live into SVG element
  useEffect(() => {
    const valResult = validateBarcodePayload(customPayload, format);
    if (!valResult.isValid) {
      setValidationError(valResult.error || 'Invalid payload');
      return;
    }
    setValidationError(null);

    if (svgRef.current) {
      try {
        renderBarcodeToSvg(svgRef.current, customPayload, {
          format,
          width,
          height,
          displayValue,
          lineColor,
          background,
        });
      } catch (err: any) {
        setValidationError(err.message || 'Error rendering barcode');
      }
    }
  }, [customPayload, format, width, height, displayValue, lineColor, background]);

  const handleDownloadPng = () => {
    try {
      const filename = `${customPayload.replace(/[^a-zA-Z0-9_-]/g, '_')}_Barcode_${format}`;
      downloadBarcodeAsPng(customPayload, filename, {
        format,
        width,
        height,
        displayValue,
        lineColor,
        background,
      });
      setStatusMessage(`Downloaded ${filename}.png`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDownloadSvg = () => {
    try {
      const filename = `${customPayload.replace(/[^a-zA-Z0-9_-]/g, '_')}_Barcode_${format}`;
      downloadBarcodeAsSvg(customPayload, filename, {
        format,
        width,
        height,
        displayValue,
        lineColor,
        background,
      });
      setStatusMessage(`Downloaded ${filename}.svg`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleResetToDocId = () => {
    setCustomPayload(doc.id);
    setStatusMessage(`Reset payload to registered ID: ${doc.id}`);
    setTimeout(() => setStatusMessage(null), 3000);

    if (onUpdateDocumentOptions) {
      onUpdateDocumentOptions(doc.id, {
        format,
        width,
        height,
        displayValue,
        lineColor,
        background,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Live Preview & Immediate Actions */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Barcode Preview
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
              {format}
            </span>
          </div>

          {/* Barcode Display Box */}
          <div className="relative p-6 rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner flex flex-col items-center justify-center min-h-[220px] w-full overflow-x-auto">
            {validationError ? (
              <div className="flex flex-col items-center text-center gap-2 p-4 text-rose-400 max-w-sm">
                <AlertTriangle className="w-8 h-8 text-rose-500 shrink-0" />
                <span className="text-xs font-medium">{validationError}</span>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg shadow-md max-w-full overflow-x-auto flex items-center justify-center">
                <svg ref={svgRef} className="max-w-full" />
              </div>
            )}
          </div>

          {/* Validation Status Indicator */}
          <div className="mt-4 text-center">
            {validationError ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Invalid payload for {format}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid {format} standard encoding</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Target ID: <span className="text-slate-200 font-bold">{customPayload}</span>
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="mt-4 w-full text-center text-xs py-2 px-3 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-200">
              {statusMessage}
            </div>
          )}

          {/* Export Actions */}
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <button
              onClick={handleDownloadPng}
              disabled={!!validationError}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              disabled={!!validationError}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SVG</span>
            </button>
          </div>

          {/* Reset / Resync button */}
          <button
            onClick={handleResetToDocId}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset to Document ID ({doc.id})</span>
          </button>

          {/* Protection Label Shortcut */}
          <button
            onClick={() => onOpenLabelModal(doc)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01]"
          >
            <FileBadge className="w-4 h-4" />
            <span>Generate Print-Ready Protection Label</span>
          </button>
        </div>
      </div>

      {/* Right Column: Custom Options & Format Selection */}
      <div className="lg:col-span-7 space-y-6">
        {/* Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-base">Custom Barcode Options</h3>
            </div>
            <span className="text-xs text-slate-400">
              Format: <span className="font-mono text-indigo-300 font-bold">{format}</span>
            </span>
          </div>

          {/* Format Selector: Code 128 vs Code 39 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Barcode Standard Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('CODE128')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  format === 'CODE128'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Code 128</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  High density, supports all alphanumeric characters and symbols.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('CODE39')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  format === 'CODE39'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Code 39</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Legacy industrial standard. Alphanumeric uppercase (A-Z, 0-9, -.$/+%).
                </p>
              </button>
            </div>
          </div>

          {/* Payload Field with Real-time Validation */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Barcode Payload / Document ID
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {customPayload.length} chars
              </span>
            </div>
            <input
              type="text"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none transition-colors ${
                validationError
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-800 focus:border-indigo-500'
              }`}
              placeholder="Enter alphanumeric document ID..."
            />
            {validationError && (
              <p className="mt-1.5 text-xs text-rose-400 leading-tight">
                ⚠️ {validationError}
              </p>
            )}
          </div>

          {/* Dimension Sliders */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bar Width Scale */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Bar Width Scale: <span className="text-indigo-400 font-mono">{width}x</span>
                </label>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1x (Fine)</span>
                <span>4x (Broad)</span>
              </div>
            </div>

            {/* Height Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Barcode Height: <span className="text-indigo-400 font-mono">{height}px</span>
                </label>
              </div>
              <input
                type="range"
                min="30"
                max="140"
                step="5"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>30px</span>
                <span>140px</span>
              </div>
            </div>
          </div>

          {/* Human Readable ID Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Human-Readable Document ID
              </div>
              <div className="text-[11px] text-slate-400">
                Print plain alphanumeric text beneath the barcode stripes for visual inspection
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={displayValue}
                onChange={(e) => setDisplayValue(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Color Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bar Line Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Background Fill
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Standard Validation Guidelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarcodeIcon className="w-4 h-4 text-indigo-400" />
            Barcode Standard & Security Compliance
          </h4>

          <div className="p-3.5 bg-amber-950/30 border border-amber-600/30 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold block">
                Zero-Credential Encoding Rule:
              </strong>
              Barcodes represent opaque document serial numbers for warehouse/lab indexing.
              They never encode authentication tokens, passwords, or verified status. A physical
              laser scanner reading this code receives the document identifier only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
