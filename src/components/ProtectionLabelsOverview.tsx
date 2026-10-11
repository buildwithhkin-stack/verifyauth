import React, { useState } from 'react';
import {
  FileBadge,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import { IdeaDocument } from '../types';
import { ProtectionLabelModal } from './ProtectionLabelModal';

interface ProtectionLabelsOverviewProps {
  documents: IdeaDocument[];
  onOpenLabelModal: (doc: IdeaDocument) => void;
}

export const ProtectionLabelsOverview: React.FC<ProtectionLabelsOverviewProps> = ({
  documents,
  onOpenLabelModal,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<IdeaDocument>(documents[0]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Print-Ready Document Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Idea Protection Labels & Archival Badges
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Official physical stickers and certificates featuring institution headers, author
            attribution, timestamp proof, QR verification matrix, and linear barcode serials.
          </p>
        </div>

        {selectedDoc && (
          <button
            onClick={() => onOpenLabelModal(selectedDoc)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01]"
          >
            <Printer className="w-4 h-4" />
            <span>Open Print / PDF Studio</span>
          </button>
        )}
      </div>

      {/* Grid of registered document labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {doc.id}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to Print
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Creator: {doc.creator}</p>
                <p className="text-[11px] text-slate-400">
                  {doc.institution} • {doc.department}
                </p>
              </div>

              {/* Mini Label Representation Preview */}
              <div className="p-3 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm space-y-1.5 select-none">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-[10px] tracking-tight">
                    VJEC IDEALOCK
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">{doc.id}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5 text-[8px] text-slate-600 font-mono">
                    <div>AUTHENTICATED IP SEAL</div>
                    <div>SHA-256 LEDGER LINKED</div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-800">
                    <QrCode className="w-5 h-5 text-indigo-700" />
                    <BarcodeIcon className="w-6 h-5 text-slate-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-5 mt-4 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => onOpenLabelModal(doc)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <FileBadge className="w-3.5 h-3.5" />
                <span>Customize & Print</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
