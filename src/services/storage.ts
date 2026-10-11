import { IdeaDocument } from '../types';
import { getVerificationUrl } from './crypto';

const STORAGE_KEY = 'vjec_idealock_registry_v1';

export const INITIAL_DOCUMENTS: IdeaDocument[] = [
  {
    id: 'VJEC-2026-HK8891',
    title: 'Adaptive Dual-Axis Solar Canopy with Dynamic Micro-Inverter Grid',
    creator: 'Harikrishnak K',
    institution: 'Vimal Jyothi Engineering College',
    department: 'Electrical & Electronics Engineering (EEE)',
    abstract: 'An automated photovoltaic canopy designed for hill-campus terrains featuring real-time solar vector tracking, anti-soiling sensor sweeps, and decentralized micro-inverter grid balancing.',
    registeredAt: '2026-03-14T09:30:00.000Z',
    serverTimestamp: 1773480600000,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'active',
    tags: ['Renewable Energy', 'IoT', 'Power Systems'],
    verificationUrl: getVerificationUrl('VJEC-2026-HK8891'),
    preferredCodeType: 'both',
    qrOptions: {
      size: 240,
      errorCorrection: 'M',
      includeLabel: true,
      darkColor: '#0f172a',
      lightColor: '#ffffff'
    },
    barcodeOptions: {
      format: 'CODE128',
      width: 2,
      height: 64,
      displayValue: true,
      lineColor: '#0f172a',
      background: '#ffffff'
    }
  },
  {
    id: 'VJEC-2026-M4K72X',
    title: 'LoRa Mesh Early Warning Telemetry for Western Ghats Slope Instability',
    creator: 'Harikrishnak K',
    institution: 'Vimal Jyothi Engineering College',
    department: 'Applied Electronics & Instrumentation',
    abstract: 'Sub-surface pore water pressure capacitive array with subterranean LoRa repeaters providing 72-hour landslide vulnerability forecast models for hilly transportation corridors.',
    registeredAt: '2026-05-20T14:15:00.000Z',
    serverTimestamp: 1779286500000,
    sha256Hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    status: 'active',
    tags: ['Disaster Management', 'LoRaWAN', 'Civil Sensorics'],
    verificationUrl: getVerificationUrl('VJEC-2026-M4K72X'),
    preferredCodeType: 'both',
    qrOptions: {
      size: 240,
      errorCorrection: 'Q',
      includeLabel: true,
      darkColor: '#0f172a',
      lightColor: '#ffffff'
    },
    barcodeOptions: {
      format: 'CODE39',
      width: 2,
      height: 60,
      displayValue: true,
      lineColor: '#0f172a',
      background: '#ffffff'
    }
  },
  {
    id: 'VJEC-2026-RV9910',
    title: 'Superconducting Magnetic Energy Storage Demo Prototype (Deprecated)',
    creator: 'Harikrishnak K',
    institution: 'Vimal Jyothi Engineering College',
    department: 'Mechanical & Power Research Group',
    abstract: 'Early stage cryogenic pulse chamber designed for micro-grid transient absorption. Superceded by cryogenic solid-state patent filing.',
    registeredAt: '2026-01-10T11:00:00.000Z',
    serverTimestamp: 1768042800000,
    sha256Hash: '9f83c12a76f2f9c469b4661876e6e22ef7245c71b6916568c6a084c8d5d1c238',
    status: 'revoked',
    statusReason: 'Revoked by Author: Replaced with multi-institution patent registration VJEC-2026-SM9924.',
    tags: ['Cryogenics', 'SMES', 'Archived'],
    verificationUrl: getVerificationUrl('VJEC-2026-RV9910'),
    preferredCodeType: 'qr',
    qrOptions: {
      size: 240,
      errorCorrection: 'M',
      includeLabel: true,
      darkColor: '#0f172a',
      lightColor: '#ffffff'
    },
    barcodeOptions: {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      lineColor: '#0f172a',
      background: '#ffffff'
    }
  }
];

export function getStoredDocuments(): IdeaDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    const docs = JSON.parse(raw) as IdeaDocument[];
    // Ensure verification URLs are properly mapped to current origin
    return docs.map(d => ({
      ...d,
      verificationUrl: getVerificationUrl(d.id)
    }));
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

export function saveDocument(doc: IdeaDocument): void {
  const docs = getStoredDocuments();
  const existingIdx = docs.findIndex(d => d.id === doc.id);
  if (existingIdx >= 0) {
    docs[existingIdx] = doc;
  } else {
    docs.unshift(doc);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function findDocumentById(id: string): IdeaDocument | undefined {
  const docs = getStoredDocuments();
  const cleanId = id.trim().toUpperCase();
  return docs.find(d => d.id.toUpperCase() === cleanId);
}

export function revokeDocument(id: string, reason: string): boolean {
  const docs = getStoredDocuments();
  const doc = docs.find(d => d.id === id);
  if (!doc) return false;
  doc.status = 'revoked';
  doc.statusReason = reason;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  return true;
}

export function resetSampleData(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
}
