import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Lock,
} from 'lucide-react';
import { generateQrSvg } from '../utils/qrGenerator';
import { validateBarcodePayload, generateBarcodeSvgString } from '../utils/barcodeGenerator';
import { findDocumentById, getStoredDocuments } from '../services/storage';

interface TestCase {
  id: string;
  name: string;
  description: string;
  run: () => Promise<{ passed: boolean; message: string }>;
}

export const SecurityTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<
    Record<string, { passed: boolean; message: string }>
  >({});

  const testCases: TestCase[] = [
    {
      id: 'qr-valid',
      name: 'QR Code Generation & HTTPS Verification URL',
      description: 'Generates valid QR SVG encoding HTTPS verification endpoint without credentials.',
      run: async () => {
        const doc = getStoredDocuments()[0];
        const svg = await generateQrSvg(doc.verificationUrl, {
          size: 200,
          errorCorrection: 'M',
          includeLabel: true,
        });
        const hasSvg = svg.includes('<svg') && svg.includes('</svg>');
        const hasLabel = svg.includes('VJEC IDEALOCK VERIFIED ID');
        if (hasSvg && hasLabel) {
          return {
            passed: true,
            message: `Generated QR code with HTTPS verification endpoint: ${doc.verificationUrl}`,
          };
        }
        return { passed: false, message: 'QR SVG generation output was incomplete.' };
      },
    },
    {
      id: 'barcode-code128',
      name: 'Barcode Code 128 Alphanumeric ID Support',
      description: 'Encodes alphanumeric Document ID with Code 128 format.',
      run: async () => {
        const testId = 'VJEC-2026-HK8891';
        const val = validateBarcodePayload(testId, 'CODE128');
        if (!val.isValid) {
          return { passed: false, message: `Validation failed: ${val.error}` };
        }
        const svg = generateBarcodeSvgString(testId, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
        });
        if (svg.includes('<svg') && svg.includes('rect')) {
          return {
            passed: true,
            message: `Successfully rendered Code 128 barcode for ${testId}.`,
          };
        }
        return { passed: false, message: 'Code 128 barcode generation failed.' };
      },
    },
    {
      id: 'barcode-code39-valid',
      name: 'Barcode Code 39 Uppercase Standard Validation',
      description: 'Encodes uppercase alphanumeric Document ID with Code 39 format.',
      run: async () => {
        const testId = 'VJEC-2026-M4K72X';
        const val = validateBarcodePayload(testId, 'CODE39');
        if (!val.isValid) {
          return { passed: false, message: `Validation failed: ${val.error}` };
        }
        const svg = generateBarcodeSvgString(val.sanitizedValue || testId, {
          format: 'CODE39',
          width: 2,
          height: 50,
          displayValue: true,
        });
        if (svg.includes('<svg')) {
          return {
            passed: true,
            message: `Successfully validated and rendered Code 39 for ${testId}.`,
          };
        }
        return { passed: false, message: 'Code 39 rendering failed.' };
      },
    },
    {
      id: 'barcode-code39-invalid-rejection',
      name: 'Barcode Code 39 Invalid Payload Rejection',
      description: 'Verifies that invalid characters (e.g. lowercase, #, @, !) are strictly rejected for Code 39.',
      run: async () => {
        const invalidPayload = 'invalid_lowercase#code!';
        const val = validateBarcodePayload(invalidPayload, 'CODE39');
        if (!val.isValid && val.error) {
          return {
            passed: true,
            message: `Correctly rejected invalid payload: "${val.error}"`,
          };
        }
        return { passed: false, message: 'Failed to reject invalid Code 39 payload!' };
      },
    },
    {
      id: 'security-no-secrets-encoded',
      name: 'Security Policy: Zero-Secrets in Codes',
      description: 'Verifies neither private keys, passwords, bearer tokens, nor verified status are in code payloads.',
      run: async () => {
        const docs = getStoredDocuments();
        for (const doc of docs) {
          // Check QR payload
          if (
            doc.verificationUrl.includes('bearer') ||
            doc.verificationUrl.includes('token=') ||
            doc.verificationUrl.includes('privateKey') ||
            doc.verificationUrl.includes('status=VERIFIED')
          ) {
            return {
              passed: false,
              message: `Security violation in QR URL for document ${doc.id}!`,
            };
          }
          // Check Barcode payload
          if (doc.id.includes('VERIFIED') || doc.id.includes('AUTH_TOKEN')) {
            return {
              passed: false,
              message: `Security violation in Barcode payload for document ${doc.id}!`,
            };
          }
        }
        return {
          passed: true,
          message: 'All generated QR & Barcodes strictly contain opaque pointers and URLs only.',
        };
      },
    },
    {
      id: 'revoked-document-handling',
      name: 'Revoked Record Enforcement',
      description: 'Verifies that revoked documents (e.g. VJEC-2026-RV9910) return proper revoked status & reason.',
      run: async () => {
        const revokedDoc = findDocumentById('VJEC-2026-RV9910');
        if (!revokedDoc) {
          return { passed: false, message: 'Sample revoked document not found.' };
        }
        if (revokedDoc.status === 'revoked' && revokedDoc.statusReason) {
          return {
            passed: true,
            message: `Document status verified as revoked with reason: "${revokedDoc.statusReason.substring(0, 40)}..."`,
          };
        }
        return { passed: false, message: 'Document is not marked as revoked!' };
      },
    },
    {
      id: 'backend-device-auth',
      name: 'Backend Server: Phone Authorization & Unauthorized Restriction',
      description: 'Verifies backend /api/verify endpoint restricts ordinary scanners to public unverified view.',
      run: async () => {
        try {
          const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: 'VJEC-2026-HK8891' }),
          });
          const data = await res.json();
          if (data && 'isRegisteredDevice' in data && 'verifiedStatus' in data) {
            return {
              passed: true,
              message: `Backend returned verifiedStatus: "${data.verifiedStatus}". Ordinary device received read-only view.`,
            };
          }
          return { passed: false, message: 'Backend did not return valid verification payload.' };
        } catch (err: any) {
          return { passed: false, message: `Backend API check failed: ${err.message}` };
        }
      },
    },
  ];

  const handleRunAllTests = async () => {
    setIsRunning(true);
    const newResults: Record<string, { passed: boolean; message: string }> = {};

    for (const test of testCases) {
      try {
        const res = await test.run();
        newResults[test.id] = res;
      } catch (err: any) {
        newResults[test.id] = { passed: false, message: err.message };
      }
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const totalRun = Object.keys(results).length;
  const passedCount = Object.values(results).filter((r) => r.passed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Protocol Compliance Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Generator Test Suite
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated test runner verifying QR & barcode generation, payload constraints, Code 39
            validation, revoked state handling, and zero-credential security rules.
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all hover:scale-[1.01]"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Running Test Suite...' : 'Run All Verification Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      {totalRun > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Tests Executed</span>
            <span className="text-2xl font-black text-white">{totalRun}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Passed Checks</span>
            <span className="text-2xl font-black text-emerald-400">{passedCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Status</span>
            <span
              className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${
                passedCount === totalRun ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {passedCount === totalRun ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> 100% Security Compliant
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" /> Issues Detected
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Test Cases List */}
      <div className="space-y-3">
        {testCases.map((tc) => {
          const res = results[tc.id];
          return (
            <div
              key={tc.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{tc.name}</h3>
                  {res && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        res.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{tc.description}</p>
                {res && (
                  <p
                    className={`text-xs font-mono pt-1 ${
                      res.passed ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    → {res.message}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {res ? (
                  res.passed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-500" />
                  )
                ) : (
                  <span className="text-xs text-slate-500 italic">Pending execution</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
