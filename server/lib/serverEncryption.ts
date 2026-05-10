/**
 * Server-Side Encryption — AES-256-GCM (Node native crypto)
 *
 * Used for encrypting sensitive data at rest in the database (e.g., tenant db_url).
 * This is a SERVER-ONLY module — do NOT use in shared/ or client code.
 *
 * Uses Node's native `crypto` module with AES-256-GCM (authenticated encryption),
 * which is more secure and performant than the crypto-js library used in shared/.
 *
 * Format: iv:authTag:ciphertext (all hex-encoded, stored as a single text string)
 *
 * Key: ENCRYPTION_KEY from env (64 hex chars = 32 bytes = 256 bits)
 */
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Get the encryption key as a Buffer from the ENCRYPTION_KEY env var.
 * ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).
 */
const getKeyBuffer = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in iv:authTag:ciphertext format
 */
export const serverEncrypt = (plaintext: string): string => {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a ciphertext string that was encrypted with serverEncrypt.
 * Expects input in the format: iv:authTag:ciphertext (all hex-encoded).
 *
 * @param encryptedText - The encrypted string in iv:authTag:ciphertext format
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, or invalid format)
 */
export const serverDecrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format — expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Check if a string looks like it was encrypted with serverEncrypt.
 * Used to distinguish between encrypted and plaintext values during migration.
 *
 * Encrypted format: iv(32 hex):authTag(32 hex):ciphertext(variable hex)
 */
export const isEncrypted = (value: string): boolean => {
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  const [iv, authTag] = parts;
  // IV should be 32 hex chars (16 bytes), authTag should be 32 hex chars (16 bytes)
  if (iv.length !== 32 || authTag.length !== 32) return false;

  // All parts should be valid hex
  return /^[0-9a-f]+$/i.test(parts.join(''));
};
