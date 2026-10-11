export type BarcodeFormat = 'CODE128' | 'CODE39';

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type CodeGenerationChoice = 'qr' | 'barcode' | 'both' | 'none';

export type DocumentStatus = 'active' | 'revoked' | 'under_review';

export interface IdeaDocument {
  id: string; // e.g. "VJEC-2026-X89K2M"
  title: string;
  creator: string; // Default: Harikrishnak K
  institution: string; // Vimal Jyothi Engineering College
  department: string;
  abstract: string;
  registeredAt: string; // ISO string
  serverTimestamp: number;
  sha256Hash: string; // Document integrity hash
  status: DocumentStatus;
  statusReason?: string;
  tags: string[];
  verificationUrl: string;
  preferredCodeType: CodeGenerationChoice;
  qrOptions?: {
    size: number;
    errorCorrection: QrErrorCorrectionLevel;
    includeLabel: boolean;
    darkColor: string;
    lightColor: string;
  };
  barcodeOptions?: {
    format: BarcodeFormat;
    width: number;
    height: number;
    displayValue: boolean;
    lineColor: string;
    background: string;
  };
}

export interface LabelConfig {
  codeDisplay: 'both' | 'qr_only' | 'barcode_only';
  layoutSize: 'standard' | 'compact' | 'certificate';
  showSha256: boolean;
  showCreator: boolean;
  showInstitution: boolean;
}
