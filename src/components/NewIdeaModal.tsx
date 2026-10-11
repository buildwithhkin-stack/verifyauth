import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  Barcode as BarcodeIcon,
  Sparkles,
  Layers,
  Lock,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { IdeaDocument, CodeGenerationChoice } from '../types';
import { generateDocumentId, computeSha256, getVerificationUrl } from '../services/crypto';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (doc: IdeaDocument, actionChoice: CodeGenerationChoice) => void;
}

export const NewIdeaModal: React.FC<NewIdeaModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const [docId, setDocId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [creator, setCreator] = useState<string>('Harikrishnak K');
  const [institution, setInstitution] = useState<string>('Vimal Jyothi Engineering College');
  const [department, setDepartment] = useState<string>('Computer Science & AI');
  const [abstract, setAbstract] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('IP-Protection, Innovation, VJEC');
  const [codeChoice, setCodeChoice] = useState<CodeGenerationChoice>('both');
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or re-generate unique doc ID on open
  useEffect(() => {
    if (isOpen) {
      setDocId(generateDocumentId());
      setError(null);
    }
  }, [isOpen]);

  // Compute live SHA-256 fingerprint whenever title, abstract, or creator changes
  useEffect(() => {
    let active = true;
    const runHash = async () => {
      setIsHashing(true);
      const payload = `${title}|${creator}|${institution}|${department}|${abstract}`;
      const hash = await computeSha256(payload);
      if (active) {
        setCalculatedHash(hash);
        setIsHashing(false);
      }
    };
    runHash();
    return () => {
      active = false;
    };
  }, [title, creator, institution, department, abstract]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }
    if (!creator.trim()) {
      setError('Creator name is required.');
      return;
    }
    if (!abstract.trim()) {
      setError('Abstract / Technical summary is required.');
      return;
    }

    const now = new Date();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newDoc: IdeaDocument = {
      id: docId,
      title: title.trim(),
      creator: creator.trim(),
      institution: institution.trim(),
      department: department.trim(),
      abstract: abstract.trim(),
      registeredAt: now.toISOString(),
      serverTimestamp: now.getTime(),
      sha256Hash: calculatedHash,
      status: 'active',
      tags: tags.length ? tags : ['Innovation'],
      verificationUrl: getVerificationUrl(docId),
      preferredCodeType: codeChoice,
      qrOptions: {
        size: 260,
        errorCorrection: 'M',
        includeLabel: true,
        darkColor: '#0f172a',
        lightColor: '#ffffff',
      },
      barcodeOptions: {
        format: 'CODE128',
        width: 2,
        height: 64,
        displayValue: true,
        lineColor: '#0f172a',
        background: '#ffffff',
      },
    };

    onDocumentCreated(newDoc, codeChoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Register New Idea Document</h2>
              <p className="text-xs text-slate-400">
                VJEC Intellectual Property Ledger • Cryptographic Stamping
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-600/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto-Generated Unique Document ID */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Assigned Unique Document ID
              </span>
              <span className="text-sm text-slate-400">
                Guaranteed collision-free, compatible with Code 128, Code 39 & QR
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 font-mono text-base font-extrabold text-indigo-400 bg-indigo-950/80 border border-indigo-700/60 rounded-xl tracking-wider">
                {docId}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Idea / Document Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI-Driven Decentralized Micro-Hydro Generator Controller"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Creator & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Creator / Author <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Harikrishnak K"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Institution
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Department & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department / Division
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Keywords / Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Abstract / Technical Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Abstract / Technical Summary <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Provide a technical summary of the novelty, methodology, architecture, and engineering principles..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Live SHA-256 Fingerprint */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Live SHA-256 Integrity Fingerprint:
              </span>
              <span className="text-emerald-400 font-medium">Native WebCrypto</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 break-all select-all">
              {calculatedHash || 'Computing...'}
            </div>
          </div>

          {/* Prompt requirement: "offer these options: Generate QR Code, Generate Barcode, Generate Both" */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-200 mb-2">
              Select Code Generation Options for this Document:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCodeChoice('both')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  codeChoice === 'both'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Generate Both</span>
                  </div>
                  <span className="text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Creates both URL QR Code & Document ID Barcode
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCodeChoice('qr')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  codeChoice === 'qr'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1">
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Generate QR Code</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  High-speed mobile verification URL scanner
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCodeChoice('barcode')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  codeChoice === 'barcode'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1">
                  <BarcodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Generate Barcode</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Physical Code 128 / Code 39 industrial scanner
                </p>
              </button>
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Register & Generate Codes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
