import React, { useState } from 'react';
import {
  FileText,
  QrCode,
  Barcode as BarcodeIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  PlusCircle,
  Hash,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { IdeaDocument } from '../types';
import { revokeDocument, resetSampleData } from '../services/storage';

interface IdeaRegistryProps {
  documents: IdeaDocument[];
  onSelectDocumentForGenerator: (doc: IdeaDocument, tab?: 'qr' | 'barcode') => void;
  onOpenLabelModal: (doc: IdeaDocument) => void;
  onOpenVerificationPortal: (docId: string) => void;
  onOpenNewIdeaModal: () => void;
  onRefreshData: () => void;
}

export const IdeaRegistry: React.FC<IdeaRegistryProps> = ({
  documents,
  onSelectDocumentForGenerator,
  onOpenLabelModal,
  onOpenVerificationPortal,
  onOpenNewIdeaModal,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [revokingDocId, setRevokingDocId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState<string>('');

  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      doc.title.toLowerCase().includes(query) ||
      doc.id.toLowerCase().includes(query) ||
      doc.creator.toLowerCase().includes(query) ||
      doc.department.toLowerCase().includes(query);

    const matchesStatus =
      filterStatus === 'all' ? true : doc.status === filterStatus;

    return matchesQuery && matchesStatus;
  });

  const handleRevokeConfirm = (docId: string) => {
    if (!revocationReason.trim()) {
      alert('Please enter a revocation reason.');
      return;
    }
    revokeDocument(docId, revocationReason.trim());
    setRevokingDocId(null);
    setRevocationReason('');
    onRefreshData();
  };

  const handleResetSamples = () => {
    if (confirm('Reset registry to official VJEC initial sample records?')) {
      resetSampleData();
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero / Header banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Vimal Jyothi Engineering College
            </span>
            <span className="text-xs text-slate-400 font-mono">
              IP Ledger Protocol v2.6
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IdeaLock Document Registry & Visual Code Suite
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Protecting novel engineering research, patent pre-filings, and student capstone
            innovations. Every record is timestamped, hashed with SHA-256, and equipped with
            native QR codes and linear barcodes for physical & digital tracking.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenNewIdeaModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all hover:scale-[1.01]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Idea Document</span>
            </button>
            <button
              onClick={handleResetSamples}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Reset sample ideas"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Sample Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID, creator, or department..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 hidden md:inline">Status:</span>
          {(['all', 'active', 'revoked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Document Records Cards */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No registered idea documents match your criteria.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all hover:border-slate-700 space-y-4 ${
                doc.status === 'revoked'
                  ? 'border-rose-900/40 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              {/* Top row: ID, Status, Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 font-mono text-xs font-extrabold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 rounded">
                    {doc.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      doc.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {doc.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active IP Lock
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Revoked Record
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Abstract */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {doc.abstract}
                </p>
              </div>

              {/* Creator & Metadata strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 py-2 border-y border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>
                    Creator: <strong className="text-slate-200">{doc.creator}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{doc.department}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{new Date(doc.registeredAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Hash and actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-slate-500">SHA-256:</span>
                  <span className="text-emerald-400/90 truncate max-w-xs">
                    {doc.sha256Hash}
                  </span>
                </div>

                {/* Generator & Label Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectDocumentForGenerator(doc, 'qr')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => onSelectDocumentForGenerator(doc, 'barcode')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                  >
                    <BarcodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Barcode</span>
                  </button>

                  <button
                    onClick={() => onOpenLabelModal(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Protection Label</span>
                  </button>

                  <button
                    onClick={() => onOpenVerificationPortal(doc.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Audit in Verification Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </button>

                  {doc.status === 'active' && (
                    <button
                      onClick={() => setRevokingDocId(doc.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 hover:bg-rose-950/40 rounded transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Revoke Reason Form */}
              {revokingDocId === doc.id && (
                <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl space-y-3 mt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Confirm Revocation for {doc.id}</span>
                  </div>
                  <input
                    type="text"
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    placeholder="Enter reason for revoking (e.g., superseding patent, error in abstract)..."
                    className="w-full bg-slate-950 border border-rose-900 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setRevokingDocId(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRevokeConfirm(doc.id)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                    >
                      Confirm Revocation
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
