import React, { useState } from 'react';
import {
  QrCode,
  Barcode as BarcodeIcon,
  ShieldCheck,
  FileText,
  User,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { IdeaDocument } from '../types';
import { QrGeneratorTab } from './QrGeneratorTab';
import { BarcodeGeneratorTab } from './BarcodeGeneratorTab';

interface CodeGeneratorDashboardProps {
  documents: IdeaDocument[];
  selectedDocumentId: string;
  onSelectDocumentId: (id: string) => void;
  onOpenLabelModal: (doc: IdeaDocument) => void;
  onOpenNewIdeaModal: () => void;
  onUpdateDocumentOptions?: (docId: string, options: any) => void;
}

export const CodeGeneratorDashboard: React.FC<CodeGeneratorDashboardProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocumentId,
  onOpenLabelModal,
  onOpenNewIdeaModal,
  onUpdateDocumentOptions,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode'>('qr');

  const currentDoc =
    documents.find((d) => d.id === selectedDocumentId) || documents[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              VJEC Intellectual Property Suite
            </span>
            <span className="text-xs text-slate-400">• Built-in Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Code Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            In-app generator for registered intellectual property documents.
            Generates standardized QR codes and linear barcodes linked to the
            official VJEC verification registry.
          </p>
        </div>

        {/* Quick New Idea Registration */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => currentDoc && onOpenLabelModal(currentDoc)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Download Protection Label</span>
          </button>
        </div>
      </div>

      {/* Document Selector Card */}
      {currentDoc ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Target Idea Document:
                </span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-800/60 rounded">
                  {currentDoc.id}
                </span>
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                    currentDoc.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {currentDoc.status === 'active' ? 'Active Registration' : 'Revoked Record'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {currentDoc.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Creator: <strong className="text-slate-300">{currentDoc.creator}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {currentDoc.institution}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {new Date(currentDoc.registeredAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Document Switcher Dropdown */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Switch Registered Document:
                </label>
                <select
                  value={currentDoc.id}
                  onChange={(e) => onSelectDocumentId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer pr-8"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.title.substring(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2.5 py-3.5 px-6 font-semibold text-sm transition-all border-b-2 relative ${
            activeTab === 'qr'
              ? 'text-indigo-400 border-indigo-500 bg-slate-900/40'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Code Generator</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300">
            HTTPS URL
          </span>
        </button>

        <button
          onClick={() => setActiveTab('barcode')}
          className={`flex items-center gap-2.5 py-3.5 px-6 font-semibold text-sm transition-all border-b-2 relative ${
            activeTab === 'barcode'
              ? 'text-indigo-400 border-indigo-500 bg-slate-900/40'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <BarcodeIcon className="w-4 h-4" />
          <span>Barcode Generator</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300">
            Code 128 / 39
          </span>
        </button>
      </div>

      {/* Active Tab Content */}
      {currentDoc && (
        <div className="pt-2">
          {activeTab === 'qr' ? (
            <QrGeneratorTab
              document={currentDoc}
              onOpenLabelModal={onOpenLabelModal}
              onUpdateDocumentOptions={onUpdateDocumentOptions}
            />
          ) : (
            <BarcodeGeneratorTab
              document={currentDoc}
              onOpenLabelModal={onOpenLabelModal}
              onUpdateDocumentOptions={onUpdateDocumentOptions}
            />
          )}
        </div>
      )}
    </div>
  );
};
