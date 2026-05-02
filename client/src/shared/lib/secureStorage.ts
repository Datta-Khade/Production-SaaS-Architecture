/**
 * Secure Storage Utility
 *
 * Wraps localStorage and sessionStorage with transparent AES encryption.
 * Automatically serializes/deserializes JSON objects.
 * Falls back to in-memory storage if quota exceeded or disabled.
 */
import { encrypt, decrypt } from '@shared/modules/lib/encryption';

type StorageType = 'local' | 'session';

class SecureStorageAPI {
  private type: StorageType;
  private memoryFallback: Map<string, string> = new Map();

  constructor(type: StorageType) {
    this.type = type;
  }

  private get storage(): Storage {
    return this.type === 'local' ? window.localStorage : window.sessionStorage;
  }

  /**
   * Set an item in storage (automatically stringified and encrypted)
   */
  public setItem<T>(key: string, value: T): void {
    try {
      const stringified = JSON.stringify(value);
      const encrypted = encrypt(stringified);
      this.storage.setItem(key, encrypted);
    } catch (e) {
      console.warn(`[SecureStorage] Failed to save to ${this.type}Storage, falling back to memory`, e);
      // Fallback to memory if storage is full or disabled (e.g., incognito)
      const stringified = JSON.stringify(value);
      this.memoryFallback.set(key, encrypt(stringified));
    }
  }

  /**
   * Retrieve and decrypt an item from storage
   */
  public getItem<T>(key: string): T | null {
    let encrypted = null;

    try {
      encrypted = this.storage.getItem(key);
    } catch {
      encrypted = this.memoryFallback.get(key) || null;
    }

    if (!encrypted) return null;

    const decrypted = decrypt(encrypted);
    if (!decrypted) {
      // Data might be corrupted, tampered with, or unencrypted legacy data.
      // Clean it up to prevent permanent crash loops.
      this.removeItem(key);
      return null;
    }

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      // It was just a plain string saved
      return decrypted as unknown as T;
    }
  }

  /**
   * Remove an item from storage
   */
  public removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
      // Ignore
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Clear all items
   */
  public clear(): void {
    try {
      this.storage.clear();
    } catch {
      // Ignore
    }
    this.memoryFallback.clear();
  }
}

export const SecureLocalStorage = new SecureStorageAPI('local');
export const SecureSessionStorage = new SecureStorageAPI('session');

