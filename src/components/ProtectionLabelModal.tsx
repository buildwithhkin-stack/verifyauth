import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  QrCode,
  Barcode as BarcodeIcon,
  Sparkles,
  Layers,
} from 'lucide-react';
import { IdeaDocument, BarcodeFormat } from '../types';
import { generateQrPngDataUrl } from '../utils/qrGenerator';
import { renderBarcodeToSvg, generateBarcodePngDataUrl } from '../utils/barcodeGenerator';

interface ProtectionLabelModalProps {
  document: IdeaDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProtectionLabelModal: React.FC<ProtectionLabelModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [codeMode, setCodeMode] = useState<'both' | 'qr_only' | 'barcode_only'>('both');
  const [labelTheme, setLabelTheme] = useState<'official' | 'compact' | 'certificate'>('official');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const printableRef = useRef<HTMLDivElement | null>(null);

  // Initialize preferred code type from document if set
  useEffect(() => {
    if (doc?.preferredCodeType) {
      if (doc.preferredCodeType === 'qr') setCodeMode('qr_only');
      else if (doc.preferredCodeType === 'barcode') setCodeMode('barcode_only');
      else setCodeMode('both');
    }
  }, [doc]);

  // Generate QR and Barcode data URLs for high-res display and canvas download
  useEffect(() => {
    if (!doc) return;

    let active = true;

    const generateCodes = async () => {
      try {
        // QR Code
        const qrUrl = await generateQrPngDataUrl(doc.verificationUrl, {
          size: 200,
          errorCorrection: 'M',
          includeLabel: false,
          darkColor: '#0f172a',
          lightColor: '#ffffff',
          margin: 1,
        });

        // Barcode
        const barcodeFormat: BarcodeFormat = doc.barcodeOptions?.format || 'CODE128';
        const bcUrl = generateBarcodePngDataUrl(doc.id, {
          format: barcodeFormat,
          width: 2,
          height: 48,
          displayValue: true,
          lineColor: '#0f172a',
          background: '#ffffff',
          fontSize: 12,
          margin: 4,
        });

        if (active) {
          setQrDataUrl(qrUrl);
          setBarcodeDataUrl(bcUrl);
        }
      } catch (err) {
        console.error('Error generating label visuals:', err);
      }
    };

    generateCodes();

    return () => {
      active = false;
    };
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Renders the label onto an off-screen high-DPI canvas to download a crisp PNG image sticker
   */
  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const scale = 2; // High-DPI 2x Retina
      const width = 800;
      const height = codeMode === 'both' ? 560 : 460;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Outer border & security guilloche style
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, width - 36, height - 36);

      // Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 18, width - 36, 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('VJEC IDEALOCK', 36, 52);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('INTELLECTUAL PROPERTY PROTECTION RECORD', 220, 52);

      // Seal text on right
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('OFFICIAL REGISTRATION', width - 36, 52);

      // Body metadata
      ctx.textAlign = 'left';
      let currentY = 100;

      const drawField = (label: string, value: string, isMono = false, isBold = false) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(label, 36, currentY);

        ctx.fillStyle = '#0f172a';
        ctx.font = `${isBold ? 'bold' : '500'} 13px ${isMono ? 'monospace' : '"Plus Jakarta Sans", sans-serif'}`;
        ctx.fillText(value, 160, currentY);

        currentY += 26;
      };

      drawField('Creator:', doc.creator, false, true);
      drawField('Institution:', doc.institution, false, true);
      drawField('Document Title:', doc.title.length > 50 ? `${doc.title.substring(0, 48)}...` : doc.title, false, true);
      drawField('Document ID:', doc.id, true, true);
      drawField('Registered At:', `${new Date(doc.registeredAt).toUTCString()} (Server Timestamp: ${doc.serverTimestamp})`, true, false);
      drawField('Integrity:', 'SHA-256 record available through the verification page', false, false);

      // Draw Codes Section
      const codesY = currentY + 10;

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, codesY);
      ctx.lineTo(width - 36, codesY);
      ctx.stroke();

      const qrImg = new Image();
      const bcImg = new Image();

      const loadImg = (img: HTMLImageElement, src: string) =>
        new Promise((resolve) => {
          img.onload = resolve;
          img.src = src;
        });

      if (codeMode === 'both') {
        if (qrDataUrl && barcodeDataUrl) {
          await Promise.all([loadImg(qrImg, qrDataUrl), loadImg(bcImg, barcodeDataUrl)]);
          // Draw QR on left
          ctx.drawImage(qrImg, 46, codesY + 16, 140, 140);
          ctx.fillStyle = '#64748b';
          ctx.font = '600 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VERIFICATION QR CODE', 116, codesY + 172);

          // Draw Barcode on right
          ctx.drawImage(bcImg, 240, codesY + 36, width - 280, 80);
          ctx.fillText(`DOCUMENT ID BARCODE (${doc.barcodeOptions?.format || 'CODE128'})`, 240 + (width - 280) / 2, codesY + 140);
        }
      } else if (codeMode === 'qr_only') {
        if (qrDataUrl) {
          await loadImg(qrImg, qrDataUrl);
          ctx.drawImage(qrImg, (width - 150) / 2, codesY + 16, 150, 150);
          ctx.fillStyle = '#64748b';
          ctx.font = '600 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VERIFICATION QR CODE', width / 2, codesY + 180);
        }
      } else if (codeMode === 'barcode_only') {
        if (barcodeDataUrl) {
          await loadImg(bcImg, barcodeDataUrl);
          ctx.drawImage(bcImg, 60, codesY + 25, width - 120, 85);
          ctx.fillStyle = '#64748b';
          ctx.font = '600 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`DOCUMENT ID BARCODE (${doc.barcodeOptions?.format || 'CODE128'})`, width / 2, codesY + 130);
        }
      }

      // Convert to download link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${doc.id}_Protection_Label.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Download Protection Label
                <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60">
                  {doc.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official institutional tamper-evident label for Vimal Jyothi Engineering College
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar & Options */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {/* Code Selection Toggle: QR only, Barcode only, Both */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Codes to include:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setCodeMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  codeMode === 'both'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Both (QR & Barcode)</span>
              </button>

              <button
                type="button"
                onClick={() => setCodeMode('qr_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  codeMode === 'qr_only'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Only</span>
              </button>

              <button
                type="button"
                onClick={() => setCodeMode('barcode_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  codeMode === 'barcode_only'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarcodeIcon className="w-3.5 h-3.5" />
                <span>Barcode Only</span>
              </button>
            </div>
          </div>

          {/* Quick Print & Download buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
              title="Print directly or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all hover:scale-[1.01]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Download PNG Sticker'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-950/80">
          {/* Printable Label Paper Card */}
          <div
            id="vjec-printable-label"
            ref={printableRef}
            className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-slate-900 p-6 md:p-8 relative select-none"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            {/* Guilloche / Security Double Border */}
            <div className="absolute inset-1.5 border border-indigo-600/40 rounded-xl pointer-events-none" />
            <div className="absolute inset-2.5 border border-dashed border-slate-300 rounded-lg pointer-events-none" />

            {/* Header: VJEC IDEALOCK */}
            <div className="bg-slate-900 text-white rounded-lg px-5 py-3 flex items-center justify-between mb-5 relative z-10 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base">
                  V
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight leading-none text-white">
                    VJEC IDEALOCK
                  </h1>
                  <span className="text-[10px] text-slate-300 tracking-wider uppercase font-semibold">
                    Official Innovation Protection Seal
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-bold bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 px-2 py-1 rounded">
                  REGISTRY VERIFIED
                </span>
              </div>
            </div>

            {/* Document Metadata Fields strictly as specified in Prompt Section 5 */}
            <div className="space-y-2 text-xs relative z-10 pb-4 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Creator:
                </span>
                <span className="col-span-9 text-slate-900 font-extrabold text-sm">
                  {doc.creator}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Institution:
                </span>
                <span className="col-span-9 text-slate-800 font-bold">
                  {doc.institution}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Document Title:
                </span>
                <span className="col-span-9 text-slate-900 font-semibold italic">
                  "{doc.title}"
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Document ID:
                </span>
                <span className="col-span-9 font-mono text-indigo-900 font-black text-sm tracking-wider">
                  {doc.id}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Registered At:
                </span>
                <span className="col-span-9 text-slate-700 font-mono text-[11px]">
                  {new Date(doc.registeredAt).toUTCString()} (Epoch: {doc.serverTimestamp})
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-3 text-slate-500 font-bold uppercase text-[11px]">
                  Integrity:
                </span>
                <span className="col-span-9 text-emerald-800 font-semibold text-[11px]">
                  SHA-256 record available through the verification page
                </span>
              </div>
            </div>

            {/* Codes Section: QR and / or Barcode */}
            <div className="pt-4 relative z-10">
              {codeMode === 'both' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* QR Code Container */}
                  <div className="md:col-span-4 flex flex-col items-center p-2 rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">
                      QR Code: Verification URL
                    </span>
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Verification QR Code"
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[9px] font-mono text-slate-500 mt-1 text-center">
                      Scan with mobile device
                    </span>
                  </div>

                  {/* Barcode Container */}
                  <div className="md:col-span-8 flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 shadow-inner min-h-[140px]">
                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-2">
                      Barcode: Document ID ({doc.barcodeOptions?.format || 'CODE128'})
                    </span>
                    {barcodeDataUrl ? (
                      <img
                        src={barcodeDataUrl}
                        alt="Document ID Barcode"
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-48 h-16 bg-slate-200 animate-pulse rounded" />
                    )}
                    <span className="text-[9px] font-mono text-slate-500 mt-2 text-center">
                      Industrial Alphanumeric Scan Format
                    </span>
                  </div>
                </div>
              )}

              {codeMode === 'qr_only' && (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">
                    QR Code: Verification URL
                  </span>
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Verification QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  )}
                  <span className="text-[10px] font-mono text-indigo-900 font-bold mt-1">
                    {doc.id}
                  </span>
                </div>
              )}

              {codeMode === 'barcode_only' && (
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-600 uppercase mb-2">
                    Barcode: Document ID ({doc.barcodeOptions?.format || 'CODE128'})
                  </span>
                  {barcodeDataUrl && (
                    <img
                      src={barcodeDataUrl}
                      alt="Document ID Barcode"
                      className="max-h-24 max-w-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Label Footer Legal & Anti-Tamper Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Vimal Jyothi Engineering College • Chemperi, Kannur, Kerala
              </span>
              <span className="font-mono mt-1 sm:mt-0 text-slate-400">
                SHA-256: {doc.sha256Hash.substring(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Print layout optimized for thermal label rolls, sticker paper, and PDF archival.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
