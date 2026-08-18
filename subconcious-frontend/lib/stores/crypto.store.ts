/**
 * Encryption Key Management Store
 *
 * Zustand store managing the user's AES-256-GCM encryption key lifecycle.
 * Handles key derivation from password (PBKDF2), random key generation
 * for OAuth users, and key persistence in IndexedDB.
 *
 * @module crypto.store
 */

import { create } from 'zustand'
import {
  deriveKey,
  generateSalt,
  generateRandomKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  type EncryptedPayload,
} from '../crypto'
import * as localDb from '../local-db'

interface CryptoState {
  /** Whether the encryption key is initialized and ready to use */
  isKeyReady: boolean

  /** The active CryptoKey (never serialized or sent to server) */
  _key: CryptoKey | null

  /**
   * Initialize the encryption key.
   * For password-based users: derives key from password via PBKDF2.
   * For OAuth users: loads existing key from IndexedDB or generates a new one.
   */
  initializeKey: (userId: string, password?: string) => Promise<void>

  /**
   * Encrypt a Blob (e.g. image bytes) with the active key.
   * Returns the encrypted payload (iv + ciphertext as base64).
   */
  encryptBlob: (blob: Blob) => Promise<EncryptedPayload>

  /**
   * Decrypt an encrypted payload back to a Blob.
   */
  decryptBlob: (payload: EncryptedPayload, mimeType?: string) => Promise<Blob>

  /**
   * Export the current key as a downloadable backup string.
   * Users can save this to recover their encrypted images on a new device.
   */
  exportKeyBackup: () => Promise<string | null>

  /**
   * Import a key from a backup string.
   */
  importKeyBackup: (userId: string, backupString: string) => Promise<void>

  /**
   * Clear the key from memory (on logout).
   */
  clearKey: () => void
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  isKeyReady: false,
  _key: null,

  initializeKey: async (userId: string, password?: string) => {
    try {
      // Check if we have a stored key in IndexedDB
      const stored = await localDb.getEncryptionKey(userId)

      if (stored) {
        // Re-import the stored key
        const key = await importKey(stored.exportedKey)
        set({ _key: key, isKeyReady: true })
        return
      }

      // No stored key — create a new one
      let key: CryptoKey
      let salt: Uint8Array

      if (password) {
        // Password-based user: derive key from password
        salt = generateSalt()
        key = await deriveKey(password, salt)
      } else {
        // OAuth user: generate a random key
        salt = generateSalt() // Salt is just for record-keeping
        key = await generateRandomKey()
      }

      // Export and store in IndexedDB
      const exported = await exportKey(key)
      const saltBase64 = btoa(String.fromCharCode(...salt))

      await localDb.saveEncryptionKey({
        userId,
        salt: saltBase64,
        exportedKey: exported,
        createdAt: new Date().toISOString(),
      })

      set({ _key: key, isKeyReady: true })
    } catch (error) {
      console.error('[CryptoStore] Failed to initialize encryption key:', error)
      // Don't block the app — encryption is optional for private-only notes
      set({ isKeyReady: false })
    }
  },

  encryptBlob: async (blob: Blob) => {
    const { _key } = get()
    if (!_key) {
      throw new Error('Encryption key not initialized')
    }

    const arrayBuffer = await blob.arrayBuffer()
    return encrypt(arrayBuffer, _key)
  },

  decryptBlob: async (payload: EncryptedPayload, mimeType = 'image/webp') => {
    const { _key } = get()
    if (!_key) {
      throw new Error('Encryption key not initialized')
    }

    const decrypted = await decrypt(payload, _key)
    return new Blob([decrypted], { type: mimeType })
  },

  exportKeyBackup: async () => {
    const { _key } = get()
    if (!_key) return null

    const exported = await exportKey(_key)
    // Create a human-friendly backup format
    return `TSC-KEY-V1:${exported}`
  },

  importKeyBackup: async (userId: string, backupString: string) => {
    if (!backupString.startsWith('TSC-KEY-V1:')) {
      throw new Error('Invalid backup key format')
    }

    const base64Key = backupString.slice('TSC-KEY-V1:'.length)
    const key = await importKey(base64Key)

    // Store in IndexedDB
    const exported = await exportKey(key)
    await localDb.saveEncryptionKey({
      userId,
      salt: '', // No salt for imported keys
      exportedKey: exported,
      createdAt: new Date().toISOString(),
    })

    set({ _key: key, isKeyReady: true })
  },

  clearKey: () => {
    set({ _key: null, isKeyReady: false })
  },
}))
