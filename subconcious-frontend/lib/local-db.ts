/**
 * IndexedDB Local Storage Layer
 *
 * Provides a typed wrapper around the raw IndexedDB API for storing
 * pages, images, sync queue entries, and encryption keys locally in
 * the browser. No external dependencies.
 *
 * @module local-db
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface LocalPage {
  _id: string
  title: string
  content: any
  parentId: string | null
  tags: Array<{ name: string; status: 'accepted' | 'suggested' }>
  isPublic: boolean
  includeSubpagesInShare: boolean
  shareSlug: string | null
  order: number
  createdAt: string
  updatedAt: string
  /** Tracks whether this page has unsynced local changes */
  _dirty: boolean
  /** Local-only temp ID (before server assigns a real _id) */
  _tempId?: string
}

export interface LocalImage {
  id: string
  blob: Blob
  pageId: string
  mimeType: string
  fileName: string
  createdAt: string
  /** If encrypted before cloud upload, stores the encrypted payload */
  encrypted?: {
    iv: string
    ciphertext: string
  }
}

export type SyncOperationType =
  | 'create_page'
  | 'update_page'
  | 'delete_page'
  | 'upload_image'

export interface SyncQueueEntry {
  id?: number // auto-increment
  type: SyncOperationType
  pageId: string
  payload: any
  timestamp: number
  retryCount: number
}

export interface StoredKeyMaterial {
  userId: string
  salt: string // base64
  exportedKey: string // base64
  createdAt: string
}

// ─── Database Setup ─────────────────────────────────────────────────────

const DB_NAME = 'thesubconscious'
const DB_VERSION = 1

const STORES = {
  PAGES: 'pages',
  IMAGES: 'images',
  SYNC_QUEUE: 'sync_queue',
  CRYPTO_KEYS: 'crypto_keys',
} as const

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Pages store — keyed by _id
      if (!db.objectStoreNames.contains(STORES.PAGES)) {
        const pageStore = db.createObjectStore(STORES.PAGES, { keyPath: '_id' })
        pageStore.createIndex('parentId', 'parentId', { unique: false })
        pageStore.createIndex('_dirty', '_dirty', { unique: false })
      }

      // Images store — keyed by id
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const imgStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' })
        imgStore.createIndex('pageId', 'pageId', { unique: false })
      }

      // Sync queue — auto-increment key
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }

      // Crypto keys — keyed by userId
      if (!db.objectStoreNames.contains(STORES.CRYPTO_KEYS)) {
        db.createObjectStore(STORES.CRYPTO_KEYS, { keyPath: 'userId' })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// ─── Generic Helpers ────────────────────────────────────────────────────

function txn(
  storeName: string,
  mode: IDBTransactionMode
): Promise<IDBObjectStore> {
  return openDB().then((db) => {
    const tx = db.transaction(storeName, mode)
    return tx.objectStore(storeName)
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Pages CRUD ─────────────────────────────────────────────────────────

export async function savePage(page: LocalPage): Promise<void> {
  const store = await txn(STORES.PAGES, 'readwrite')
  await idbRequest(store.put(page))
}

export async function savePages(pages: LocalPage[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.PAGES, 'readwrite')
  const store = tx.objectStore(STORES.PAGES)
  for (const page of pages) {
    store.put(page)
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPage(id: string): Promise<LocalPage | undefined> {
  const store = await txn(STORES.PAGES, 'readonly')
  return idbRequest(store.get(id))
}

export async function getAllPages(): Promise<LocalPage[]> {
  const store = await txn(STORES.PAGES, 'readonly')
  return idbRequest(store.getAll())
}

export async function deletePage(id: string): Promise<void> {
  const store = await txn(STORES.PAGES, 'readwrite')
  await idbRequest(store.delete(id))
}

export async function clearAllPages(): Promise<void> {
  const store = await txn(STORES.PAGES, 'readwrite')
  await idbRequest(store.clear())
}

export async function getDirtyPages(): Promise<LocalPage[]> {
  const all = await getAllPages()
  return all.filter((p) => p._dirty)
}

// ─── Images CRUD ────────────────────────────────────────────────────────

export async function saveImage(image: LocalImage): Promise<void> {
  const store = await txn(STORES.IMAGES, 'readwrite')
  await idbRequest(store.put(image))
}

export async function getImage(id: string): Promise<LocalImage | undefined> {
  const store = await txn(STORES.IMAGES, 'readonly')
  return idbRequest(store.get(id))
}

export async function getImagesByPage(pageId: string): Promise<LocalImage[]> {
  const store = await txn(STORES.IMAGES, 'readonly')
  const index = store.index('pageId')
  return idbRequest(index.getAll(pageId))
}

export async function deleteImage(id: string): Promise<void> {
  const store = await txn(STORES.IMAGES, 'readwrite')
  await idbRequest(store.delete(id))
}

export async function deleteImagesByPage(pageId: string): Promise<void> {
  const images = await getImagesByPage(pageId)
  const store = await txn(STORES.IMAGES, 'readwrite')
  for (const img of images) {
    store.delete(img.id)
  }
}

/**
 * Get an image and return a live blob: URL for rendering in the editor.
 * The caller is responsible for revoking the URL when done.
 */
export async function getImageUrl(id: string): Promise<string | null> {
  const image = await getImage(id)
  if (!image) return null
  return URL.createObjectURL(image.blob)
}

// ─── Sync Queue ─────────────────────────────────────────────────────────

export async function queueSync(entry: Omit<SyncQueueEntry, 'id'>): Promise<void> {
  const store = await txn(STORES.SYNC_QUEUE, 'readwrite')
  await idbRequest(store.add(entry))
}

export async function getAllSyncQueue(): Promise<SyncQueueEntry[]> {
  const store = await txn(STORES.SYNC_QUEUE, 'readonly')
  return idbRequest(store.getAll())
}

export async function popSyncQueue(count: number): Promise<SyncQueueEntry[]> {
  const db = await openDB()
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
  const store = tx.objectStore(STORES.SYNC_QUEUE)

  return new Promise((resolve, reject) => {
    const results: SyncQueueEntry[] = []
    const cursorReq = store.openCursor()

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (!cursor || results.length >= count) {
        resolve(results)
        return
      }
      results.push(cursor.value as SyncQueueEntry)
      cursor.delete() // remove from queue
      cursor.continue()
    }

    cursorReq.onerror = () => reject(cursorReq.error)
  })
}

export async function clearSyncQueue(): Promise<void> {
  const store = await txn(STORES.SYNC_QUEUE, 'readwrite')
  await idbRequest(store.clear())
}

export async function getSyncQueueCount(): Promise<number> {
  const store = await txn(STORES.SYNC_QUEUE, 'readonly')
  return idbRequest(store.count())
}

// ─── Crypto Keys ────────────────────────────────────────────────────────

export async function saveEncryptionKey(material: StoredKeyMaterial): Promise<void> {
  const store = await txn(STORES.CRYPTO_KEYS, 'readwrite')
  await idbRequest(store.put(material))
}

export async function getEncryptionKey(
  userId: string
): Promise<StoredKeyMaterial | undefined> {
  const store = await txn(STORES.CRYPTO_KEYS, 'readonly')
  return idbRequest(store.get(userId))
}

export async function deleteEncryptionKey(userId: string): Promise<void> {
  const store = await txn(STORES.CRYPTO_KEYS, 'readwrite')
  await idbRequest(store.delete(userId))
}

// ─── Storage Info ───────────────────────────────────────────────────────

/**
 * Get an estimate of how much IndexedDB storage is being used.
 * Returns { usage, quota } in bytes, or null if the API is unavailable.
 */
export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
} | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    }
  }
  return null
}
