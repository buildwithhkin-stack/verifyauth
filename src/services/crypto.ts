/**
 * Cryptographic utility functions for VJEC IdeaLock.
 * Uses native Web Crypto API for SHA-256 integrity checks.
 */

export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates an opaque, clean, institutional Document ID.
 * Example: VJEC-2026-X89K2M
 * Fully compatible with Code 128, Code 39, and QR standards.
 */
export function generateDocumentId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude easily confused chars like 0/O, 1/I
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `VJEC-2026-${randomPart}`;
}

/**
 * Builds the canonical verification URL for a given document ID.
 */
export function getVerificationUrl(docId: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#/verify/${encodeURIComponent(docId)}`;
  }
  return `https://idealock.vjec.ac.in/verify/${encodeURIComponent(docId)}`;
}
