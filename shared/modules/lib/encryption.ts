/**
 * Encryption Service — AES-256 Symmetric Encryption (Isomorphic via crypto-js)
 *
 * Use for encrypting sensitive fields at rest (PII, API keys, secrets) on server,
 * or encrypting LocalStorage/SessionStorage payloads on the client.
 *
 * Server key comes from ENCRYPTION_KEY env var.
 * Client key comes from VITE_STORAGE_KEY (or a fallback).
 */
import CryptoJS from 'crypto-js';

/**
 * Get the encryption key securely depending on environment.
 */
const getKey = (): string => {
  // Check if we are in Node.js (Server)
  if (typeof process !== 'undefined' && process.env && process.env.ENCRYPTION_KEY) {
    return process.env.ENCRYPTION_KEY;
  }

  // Check if we are in Vite (Browser)
  // @ts-expect-error - import.meta is available in Vite but not Node
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_STORAGE_KEY) {
    // @ts-expect-error - import.meta.env is available in Vite
    return import.meta.env.VITE_STORAGE_KEY as string;
  }

  // Fallback for browser if not provided (should be overridden in production)
  return 'default-client-side-storage-key-123!';
};

/**
 * Encrypt a plaintext string using AES.
 */
export const encrypt = (plaintext: string, overrideKey?: string): string => {
  const key = overrideKey || getKey();
  return CryptoJS.AES.encrypt(plaintext, key).toString();
};

/**
 * Decrypt a ciphertext string using AES.
 * Returns null if decryption fails (e.g., wrong key or invalid data).
 */
export const decrypt = (ciphertext: string, overrideKey?: string): string | null => {
  try {
    const key = overrideKey || getKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    // If decryption fails due to bad key, it usually returns an empty string
    return decryptedData || null;
  } catch {
    return null;
  }
};

/**
 * Generate a cryptographically secure random token (hex).
 * Works isomorphically.
 */
export const generateSecureToken = (bytes: number = 48): string => {
  const randomWords = CryptoJS.lib.WordArray.random(bytes);
  return CryptoJS.enc.Hex.stringify(randomWords);
};

/**
 * Hash a token for safe storage (SHA-256).
 */
export const hashToken = (token: string): string => {
  return CryptoJS.SHA256(token).toString(CryptoJS.enc.Hex);
};
