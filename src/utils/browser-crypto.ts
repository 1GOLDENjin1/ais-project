// Browser-compatible crypto utilities
// Replaces Node.js crypto module for browser compatibility

/**
 * Generate a UUID-like string using browser-safe methods
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const generateUUID = (): string => {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
    // Use native browser crypto.randomUUID if available (modern browsers)
    return globalThis.crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate a random ID string (shorter than UUID)
 */
export const generateRandomId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${randomPart}`;
};

/**
 * Generate secure random bytes for browser use
 */
export const getRandomBytes = (length: number): Uint8Array => {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
  
  // Fallback for environments without crypto.getRandomValues
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
};

/**
 * Hash a string using browser-compatible methods
 * Note: This is NOT cryptographically secure - use for non-security purposes only
 */
export const simpleHash = async (input: string): Promise<string> => {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.warn('SubtleCrypto not available, using fallback hash');
    }
  }
  
  // Simple fallback hash (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

export default {
  generateUUID,
  generateRandomId,
  getRandomBytes,
  generateRandomString,
  simpleHash
};