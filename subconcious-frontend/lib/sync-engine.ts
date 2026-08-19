/**
 * Background Sync Engine
 *
 * Runs in the background, syncing local IndexedDB changes to the cloud
 * when online. Handles online/offline detection, retry with exponential
 * backoff, and conflict resolution (last-write-wins).
 *
 * @module sync-engine
 */

import { apiRequest } from './api'
import * as localDb from './local-db'
import type { SyncQueueEntry } from './local-db'

// ─── Types ──────────────────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error'

export interface SyncState {
  status: SyncStatus
  pendingCount: number
  lastSyncedAt: Date | null
  isOnline: boolean
}

type SyncListener = (state: SyncState) => void

// ─── Sync Engine ────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 1_000 // Fast 1s responsive background sync
const MAX_RETRY_DELAY_MS = 15_000
const MAX_RETRIES = 5

let syncTimer: ReturnType<typeof setInterval> | null = null
let isSyncing = false
const listeners = new Set<SyncListener>()

const state: SyncState = {
  status: 'synced',
  pendingCount: 0,
  lastSyncedAt: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
}

function notify() {
  for (const listener of listeners) {
    listener({ ...state })
  }
}

/**
 * Subscribe to sync state changes.
 * Returns an unsubscribe function.
 */
export function onSyncStateChange(listener: SyncListener): () => void {
  listeners.add(listener)
  // Immediately notify with current state
  listener({ ...state })
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Get the current sync state snapshot.
 */
export function getSyncState(): SyncState {
  return { ...state }
}

// ─── Online / Offline Detection ─────────────────────────────────────────

function handleOnline() {
  state.isOnline = true
  state.status = state.pendingCount > 0 ? 'pending' : 'synced'
  notify()
  // Immediately attempt a sync when coming back online
  processQueue()
}

function handleOffline() {
  state.isOnline = false
  state.status = 'offline'
  notify()
}

// ─── Queue Processing ───────────────────────────────────────────────────

async function processQueue() {
  if (isSyncing || !state.isOnline) return

  const count = await localDb.getSyncQueueCount()
  state.pendingCount = count

  if (count === 0) {
    state.status = 'synced'
    notify()
    return
  }

  isSyncing = true
  state.status = 'syncing'
  notify()

  try {
    // Process up to 10 items in batch for high performance
    const entries = await localDb.popSyncQueue(10)

    for (const entry of entries) {
      try {
        await processEntry(entry)
        state.lastSyncedAt = new Date()
      } catch (error) {
        console.error('[SyncEngine] Failed to process entry:', error)

        // Re-queue with incremented retry count if under limit
        if (entry.retryCount < MAX_RETRIES) {
          await localDb.queueSync({
            ...entry,
            retryCount: entry.retryCount + 1,
          })
        }
      }
    }

    // Update pending count
    state.pendingCount = await localDb.getSyncQueueCount()
    state.status = state.pendingCount > 0 ? 'pending' : 'synced'
  } catch (error) {
    console.error('[SyncEngine] Queue processing error:', error)
    state.status = 'error'
  } finally {
    isSyncing = false
    notify()
  }
}

async function processEntry(entry: SyncQueueEntry): Promise<void> {
  const delay = getRetryDelay(entry.retryCount)
  if (delay > 0) {
    await sleep(delay)
  }

  switch (entry.type) {
    case 'create_page': {
      const { title, content, parentId, tempId } = entry.payload
      const data = await apiRequest('/pages', {
        method: 'POST',
        body: JSON.stringify({ title, content, parentId }),
      })
      // Update local page with the real server ID
      if (tempId && data.page?._id) {
        const localPage = await localDb.getPage(tempId)
        if (localPage) {
          await localDb.deletePage(tempId)
          await localDb.savePage({
            ...localPage,
            _id: data.page._id,
            _dirty: false,
            _tempId: undefined,
          })
        }
      }
      break
    }

    case 'update_page': {
      const { pageId, ...fields } = entry.payload
      if (!pageId || pageId.startsWith('temp_')) {
        // Skip invalid/unmaterialized temp page updates
        return
      }
      await apiRequest(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      // Mark local page as clean
      const localPage = await localDb.getPage(pageId)
      if (localPage) {
        await localDb.savePage({ ...localPage, _dirty: false })
      }
      break
    }

    case 'delete_page': {
      if (!entry.pageId || entry.pageId.startsWith('temp_')) {
        return
      }
      try {
        await apiRequest(`/pages/${entry.pageId}`, { method: 'DELETE' })
      } catch (error: any) {
        // 404 is fine — the page was already deleted on the server
        if (error?.message?.includes('404')) return
        throw error
      }
      break
    }

    case 'upload_image': {
      // For public pages: upload encrypted image to Cloudinary
      // This is handled separately in the share flow
      console.log('[SyncEngine] Image upload sync not yet implemented for public pages')
      break
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getRetryDelay(retryCount: number): number {
  if (retryCount === 0) return 0
  return Math.min(1000 * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY_MS)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Lifecycle ──────────────────────────────────────────────────────────

/**
 * Start the background sync engine.
 * Call this once when the app initializes (after auth).
 */
export function startSyncEngine(): void {
  if (syncTimer) return // Already running

  // Register online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    state.isOnline = navigator.onLine
  }

  // Start the sync loop
  syncTimer = setInterval(processQueue, SYNC_INTERVAL_MS)

  // Run immediately
  processQueue()
}

/**
 * Stop the background sync engine.
 * Call this on logout or app teardown.
 */
export function stopSyncEngine(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  listeners.clear()
}

/**
 * Force an immediate sync attempt.
 */
export function forceSync(): void {
  processQueue()
}
