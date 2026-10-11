import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  FileBadge,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { IdeaDocument, QrErrorCorrectionLevel } from '../types';
import {
  generateQrSvg,
  generateQrPngDataUrl,
  downloadQrAsPng,
  downloadQrAsSvg,
} from '../utils/qrGenerator';

interface QrGeneratorTabProps {
  document: IdeaDocument;
  onOpenLabelModal: (doc: IdeaDocument) => void;
  onUpdateDocumentOptions?: (docId: string, qrOptions: any) => void;
}

export const QrGeneratorTab: React.FC<QrGeneratorTabProps> = ({
  document: doc,
  onOpenLabelModal,
  onUpdateDocumentOptions,
}) => {
  const [size, setSize] = useState<number>(doc.qrOptions?.size || 260);
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrectionLevel>(
    doc.qrOptions?.errorCorrection || 'M'
  );
  const [includeLabel, setIncludeLabel] = useState<boolean>(
    doc.qrOptions?.includeLabel ?? true
  );
  const [darkColor, setDarkColor] = useState<string>(
    doc.qrOptions?.darkColor || '#0f172a'
  );
  const [lightColor, setLightColor] = useState<string>(
    doc.qrOptions?.lightColor || '#ffffff'
  );

  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [regenerateCounter, setRegenerateCounter] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const verificationUrl = doc.verificationUrl;

  // Generate preview whenever parameters change
  useEffect(() => {
    let isCancelled = false;

    const renderPreview = async () => {
      setIsGenerating(true);
      try {
        const dataUrl = await generateQrPngDataUrl(verificationUrl, {
          size,
          errorCorrection,
          includeLabel,
          darkColor,
          lightColor,
        });
        if (!isCancelled) {
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error generating QR preview:', err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    renderPreview();

    return () => {
      isCancelled = true;
    };
  }, [
    verificationUrl,
    size,
    errorCorrection,
    includeLabel,
    darkColor,
    lightColor,
    regenerateCounter,
  ]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopiedUrl(true);
      setStatusMessage('Verification URL copied to clipboard!');
      setTimeout(() => setCopiedUrl(false), 2500);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to copy to clipboard.');
    }
  };

  const handleDownloadPng = async () => {
    try {
      const filename = `${doc.id}_QRCode`;
      await downloadQrAsPng(verificationUrl, filename, {
        size,
        errorCorrection,
        includeLabel,
        darkColor,
        lightColor,
      });
      setStatusMessage(`Downloaded ${filename}.png`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const filename = `${doc.id}_QRCode`;
      await downloadQrAsSvg(verificationUrl, filename, {
        size,
        errorCorrection,
        includeLabel,
        darkColor,
        lightColor,
      });
      setStatusMessage(`Downloaded ${filename}.svg`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleRegenerate = () => {
    setRegenerateCounter(prev => prev + 1);
    setStatusMessage('QR Code regenerated (Document ID preserved).');
    setTimeout(() => setStatusMessage(null), 3000);

    if (onUpdateDocumentOptions) {
      onUpdateDocumentOptions(doc.id, {
        size,
        errorCorrection,
        includeLabel,
        darkColor,
        lightColor,
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
              Live QR Preview
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {errorCorrection} Level • {size}px
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-4 rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner flex items-center justify-center min-h-[300px] w-full max-w-[320px]">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Rendering high-density matrix...</span>
              </div>
            ) : previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt={`QR code for ${doc.id}`}
                className="max-w-full object-contain rounded-lg shadow-md transition-transform duration-200 hover:scale-[1.01]"
                style={{ maxHeight: '320px' }}
              />
            ) : null}
          </div>

          {/* Institutional Label status */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 font-mono">
              Encoded ID: <span className="text-indigo-400 font-bold">{doc.id}</span>
            </p>
            {includeLabel && (
              <p className="text-[11px] text-emerald-400 mt-1">
                ✓ Includes "VJEC IdeaLock" header & verification badge
              </p>
            )}
          </div>

          {/* Status Alert Message */}
          {statusMessage && (
            <div className="mt-4 w-full text-center text-xs py-2 px-3 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-200">
              {statusMessage}
            </div>
          )}

          {/* Export Actions */}
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <button
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SVG</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-3">
            <button
              onClick={handleCopyUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Verify URL</span>
                </>
              )}
            </button>

            <button
              onClick={handleRegenerate}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Regenerate without modifying document ID"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Regenerate Code</span>
            </button>
          </div>

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

      {/* Right Column: Custom Options & Security Audit */}
      <div className="lg:col-span-7 space-y-6">
        {/* Customization Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-base">Custom QR Code Options</h3>
            </div>
            <span className="text-xs text-slate-400">
              Document: <span className="font-mono text-indigo-300 font-bold">{doc.id}</span>
            </span>
          </div>

          {/* Size Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Resolution / Size: <span className="text-indigo-400 font-mono">{size} px</span>
              </label>
              <span className="text-[11px] text-slate-400">160px – 400px</span>
            </div>
            <input
              type="range"
              min="160"
              max="400"
              step="20"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Error Correction Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Error Correction Level (ECC)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { level: 'L', label: 'L (7%)', desc: 'Standard density' },
                  { level: 'M', label: 'M (15%)', desc: 'Recommended' },
                  { level: 'Q', label: 'Q (25%)', desc: 'High tolerance' },
                  { level: 'H', label: 'H (30%)', desc: 'Maximum damage recovery' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => setErrorCorrection(opt.level)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    errorCorrection === opt.level
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Label Banner Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Include VJEC IdeaLock Label
              </div>
              <div className="text-[11px] text-slate-400">
                Embed institutional banner & verification subtitle beneath the matrix
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeLabel}
                onChange={(e) => setIncludeLabel(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Color Palettes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dark Color (Modules)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Light Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Encoded Payload & Security Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              Encoded Payload Audit
            </h4>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Standard-Compliant HTTPS URI
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 mb-1">Target Verification Endpoint:</div>
            <div className="text-xs font-mono text-indigo-300 break-all select-all">
              {verificationUrl}
            </div>
          </div>

          {/* Security Rules Notice */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-600/30 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold block">
                Security Constraint Enforced:
              </strong>
              This QR code acts strictly as an opaque pointer to the public verification endpoint.
              In adherence with the VJEC IdeaLock protocol,{' '}
              <span className="text-amber-200 font-bold">
                no private key, authentication bearer, password, or automatic VERIFIED grant
              </span>{' '}
              is ever encoded. Scanning always leads to server-side cryptographic audit.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
