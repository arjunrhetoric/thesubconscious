/**
 * Zero-Knowledge Client-Side Encryption Library
 * 
 * Uses the native Web Crypto API (AES-256-GCM + PBKDF2) to encrypt/decrypt
 * image data entirely in the browser. Encryption keys never leave the client.
 * 
 * @module crypto
 */

const PBKDF2_ITERATIONS = 600_000
const AES_KEY_LENGTH = 256
const IV_LENGTH = 12 // 96-bit IV for AES-GCM

// ─── Key Derivation ────────────────────────────────────────────────────

/**
 * Derive a 256-bit AES-GCM key from a user password using PBKDF2.
 * The salt should be stored alongside the exported key in IndexedDB.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // extractable so we can export for backup
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random 16-byte salt for PBKDF2 key derivation.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Generate a random AES-256-GCM key (for OAuth users without a password).
 */
export async function generateRandomKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

// ─── Key Serialization ─────────────────────────────────────────────────

/**
 * Export a CryptoKey to a base64 string for storage in IndexedDB.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(raw)
}

/**
 * Import a CryptoKey from a base64 string retrieved from IndexedDB.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(base64Key)
  return crypto.subtle.importKey(
    'raw',
    raw as BufferSource,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// ─── Encryption / Decryption ────────────────────────────────────────────

export interface EncryptedPayload {
  /** Base64-encoded 12-byte IV */
  iv: string
  /** Base64-encoded ciphertext */
  ciphertext: string
}

/**
 * Encrypt binary data (e.g. image bytes) with AES-256-GCM.
 * Returns the IV and ciphertext as base64 strings.
 */
export async function encrypt(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data
  )

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  }
}

/**
 * Decrypt AES-256-GCM encrypted data back to an ArrayBuffer.
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = base64ToArrayBuffer(payload.iv)
  const ciphertext = base64ToArrayBuffer(payload.ciphertext)

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) as BufferSource },
    key,
    ciphertext
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
