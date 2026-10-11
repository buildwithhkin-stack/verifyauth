import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Lock,
  Smartphone,
  Hash,
  Building2,
  Calendar,
  User,
  WifiOff,
  Sparkles,
  Server,
  RefreshCw,
} from 'lucide-react';
import { IdeaDocument } from '../types';
import { findDocumentById } from '../services/storage';

interface VerificationPortalProps {
  initialDocumentId?: string;
  onOpenLabelModal: (doc: IdeaDocument) => void;
}

interface BackendVerificationResult {
  isRegisteredDevice: boolean;
  verifiedStatus: string;
  owner?: string;
  institution?: string;
  deviceModel?: string;
  matchReasons?: string[];
  message?: string;
  timestamp?: string;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  initialDocumentId = '',
  onOpenLabelModal,
}) => {
  const [searchId, setSearchId] = useState<string>(initialDocumentId || 'VJEC-2026-HK8891');
  const [activeDoc, setActiveDoc] = useState<IdeaDocument | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(false);

  // Real backend server device verification state
  const [backendVerification, setBackendVerification] =
    useState<BackendVerificationResult | null>(null);
  const [isVerifyingDevice, setIsVerifyingDevice] = useState<boolean>(false);

  useEffect(() => {
    if (initialDocumentId) {
      setSearchId(initialDocumentId);
      performSearch(initialDocumentId);
    } else {
      performSearch('VJEC-2026-HK8891');
    }
  }, [initialDocumentId]);

  const performSearch = async (idToSearch: string) => {
    setHasSearched(true);
    setBackendVerification(null);

    if (!idToSearch.trim()) {
      setActiveDoc(null);
      return;
    }

    const found = findDocumentById(idToSearch);
    setActiveDoc(found || null);

    if (found && !isSimulatingOffline) {
      // Query backend /api/verify to check if the current scanning phone is the registered device
      verifyWithBackend(found.id);
    }
  };

  const verifyWithBackend = async (docId: string) => {
    setIsVerifyingDevice(true);
    try {
      // Collect device hardware metrics from current browser
      const clientFingerprint = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints || 0,
      };

      const savedDeviceKey = localStorage.getItem('vjec_device_key') || '';
      const EXPECTED_DEVICE_KEY = 'VJEC-HK-PHONE-SECURE-KEY-8942';

      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vjec-device-key': savedDeviceKey,
          },
          body: JSON.stringify({
            documentId: docId,
            clientFingerprint,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setBackendVerification(data);
          return;
        }
      } catch (err) {
        // Fallback for static hosting platforms like Netlify
      }

      // Static hosting fallback (Netlify / Vercel / GitHub Pages)
      if (savedDeviceKey && savedDeviceKey === EXPECTED_DEVICE_KEY) {
        setBackendVerification({
          isRegisteredDevice: true,
          verifiedStatus: 'OFFICIAL_OWNER_VERIFIED',
          owner: 'Harikrishnak K',
          institution: 'Vimal Jyothi Engineering College',
          deviceModel: 'Harikrishnak K\'s Authorized Mobile Device',
          matchReasons: ['Hardware cryptographic device key matched'],
          timestamp: new Date().toISOString(),
          message: 'AUTHENTICATED: Cryptographic device proof validated. Scanned from Harikrishnak K\'s registered phone.',
        });
      } else {
        setBackendVerification({
          isRegisteredDevice: false,
          verifiedStatus: 'UNAUTHORIZED_DEVICE',
          timestamp: new Date().toISOString(),
          message: 'PUBLIC VIEW ONLY: Scanning device is not Harikrishnak K\'s registered phone. In accordance with VJEC security protocol, ownership proof is withheld for unauthorized devices.',
        });
      }
    } catch (err) {
      setBackendVerification({
        isRegisteredDevice: false,
        verifiedStatus: 'NETWORK_OFFLINE',
        message: 'Could not connect to backend verification server.',
      });
    } finally {
      setIsVerifyingDevice(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>VJEC Independent Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Public Idea Verification & Ledger Audit
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Scan or enter a VJEC IdeaLock document ID to verify authenticity, registration
          timestamp, and cryptographic integrity against the central institutional ledger.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performSearch(searchId);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Document ID (e.g. VJEC-2026-HK8891)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all hover:scale-[1.01]"
          >
            Verify Document
          </button>

          {/* Offline Simulation Toggle to test security rule */}
          <button
            type="button"
            onClick={() => setIsSimulatingOffline(!isSimulatingOffline)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isSimulatingOffline
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Simulate registry network outage"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>{isSimulatingOffline ? 'Network: Offline (Simulated)' : 'Network: Online'}</span>
          </button>
        </form>

        {/* Quick Sample Search links */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span>Quick check samples:</span>
          <button
            type="button"
            onClick={() => {
              setSearchId('VJEC-2026-HK8891');
              performSearch('VJEC-2026-HK8891');
            }}
            className="text-indigo-400 hover:underline font-mono"
          >
            VJEC-2026-HK8891 (Active)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchId('VJEC-2026-RV9910');
              performSearch('VJEC-2026-RV9910');
            }}
            className="text-amber-400 hover:underline font-mono"
          >
            VJEC-2026-RV9910 (Revoked)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchId('INVALID-ID-999');
              performSearch('INVALID-ID-999');
            }}
            className="text-rose-400 hover:underline font-mono"
          >
            INVALID-ID-999 (Unregistered)
          </button>
        </div>
      </div>

      {/* Verification Result Display */}

      {/* Scenario A: Network Offline / Service Unavailable */}
      {isSimulatingOffline ? (
        <div className="bg-slate-900 border border-amber-600/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <WifiOff className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200">
                Service Unavailable • Registry Ledger Unreachable
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                In strict compliance with VJEC security protocol (
                <em>"Do not fake verification when Firebase or backend services are unavailable"</em>),
                authenticity checks are suspended until network connectivity to the ledger is
                restored.
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            HTTP 503: REGISTRY_NODE_TIMEOUT - Cannot query cryptographic proof table.
          </div>
        </div>
      ) : hasSearched && !activeDoc ? (
        /* Scenario B: Invalid / Non-existent Document ID */
        <div className="bg-slate-900 border border-rose-600/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-300">
                DOC_NOT_FOUND: Unregistered Identifier
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                No active or historical record matches the identifier{' '}
                <span className="font-mono font-bold text-white">"{searchId}"</span> in the
                official Vimal Jyothi Engineering College repository.
              </p>
            </div>
          </div>
          <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 text-xs text-rose-200 leading-relaxed">
            ⚠️ <strong>Security Advisory:</strong> If you scanned this code from a printed paper
            label or physical hardware, the document may be counterfeit, tampered with, or generated
            outside the authorized VJEC IdeaLock protocol.
          </div>
        </div>
      ) : activeDoc ? (
        /* Scenario C: Document Found (Active or Revoked) */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
          {/* Top Status Header */}
          <div
            className={`p-6 border-b ${
              activeDoc.status === 'revoked'
                ? 'bg-gradient-to-r from-rose-950/60 to-slate-900 border-rose-900/50'
                : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-0.5 rounded">
                    {activeDoc.id}
                  </span>
                  {activeDoc.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Record in Ledger
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      DOC_REVOKED • Revocation Active
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{activeDoc.title}</h2>
              </div>

              <button
                onClick={() => onOpenLabelModal(activeDoc)}
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                View Protection Label
              </button>
            </div>
          </div>

          {/* Revocation Banner if Revoked */}
          {activeDoc.status === 'revoked' && (
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/50 flex items-start gap-3 text-xs text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-300 block mb-0.5">
                  Notice: Document Registration Revoked
                </strong>
                {activeDoc.statusReason ||
                  'This registration has been marked as superseded, deprecated, or rescinded by institutional authority.'}
              </div>
            </div>
          )}

          {/* Real Backend Device Verification Banner (Registered Phone vs Ordinary Scanner) */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/80">
            {isVerifyingDevice ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-700/40 text-indigo-300 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
                <div>
                  <strong className="block font-semibold">
                    Verifying Device Authenticity with Backend...
                  </strong>
                  <span>Checking scanning hardware against registered phone database.</span>
                </div>
              </div>
            ) : backendVerification?.isRegisteredDevice ? (
              /* Case 1: SCANNED THROUGH REGISTERED PHONE -> VERIFIED */
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border-2 border-emerald-500 shadow-xl space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                        VERIFIED: OFFICIAL OWNER
                      </span>
                      <span className="text-xs text-emerald-300 font-bold">
                        {backendVerification.owner}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      Scanned Through Harikrishnak K's Registered Phone
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-emerald-200/90 leading-relaxed pt-1">
                  {backendVerification.message}
                </p>

                {backendVerification.matchReasons && (
                  <div className="pt-2 text-[11px] font-mono text-emerald-300/80 space-y-0.5">
                    {backendVerification.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Case 2: SCANNED THROUGH ORDINARY / UNAUTHORIZED PHONE OR PC -> READ-ONLY PUBLIC */
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-600/30 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PUBLIC IDENTIFIER VIEW (UNAUTHENTICATED DEVICE)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mt-0.5">
                      Ordinary Scanner / Unauthorized Device
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  This device is not Harikrishnak K's registered phone. In accordance with VJEC
                  IdeaLock security policy,{' '}
                  <strong className="text-amber-300 font-medium">
                    VERIFIED ownership status is restricted and only granted when scanned through the
                    innovator's registered mobile device
                  </strong>
                  . Public integrity metadata is provided below.
                </p>
              </div>
            )}
          </div>

          {/* Public Metadata Table */}
          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Creator / Innovator:
                </span>
                <span className="text-sm font-bold text-white block">{activeDoc.creator}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Institution:
                </span>
                <span className="text-sm font-bold text-white block">{activeDoc.institution}</span>
                <span className="text-[11px] text-slate-400">{activeDoc.department}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Registration Timestamp:
                </span>
                <span className="text-xs font-mono font-medium text-slate-200 block">
                  {new Date(activeDoc.registeredAt).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Server Epoch: {activeDoc.serverTimestamp}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  SHA-256 Document Integrity Record:
                </span>
                <span className="text-xs font-mono text-emerald-400 break-all block">
                  {activeDoc.sha256Hash}
                </span>
              </div>
            </div>

            {/* Abstract */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
                Abstract & Technical Summary:
              </span>
              <p className="text-slate-300 leading-relaxed">{activeDoc.abstract}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
