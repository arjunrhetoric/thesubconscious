import { create } from 'zustand'
import { apiRequest } from '../api'
import * as localDb from '../local-db'
import type { LocalPage } from '../local-db'
import { resolveLocalImages, unresolveLocalImages, publishLocalImages } from '../image-utils'
import { startSyncEngine, stopSyncEngine, onSyncStateChange, forceSync, type SyncState } from '../sync-engine'

export interface Tag {
  name: string
  status: 'accepted' | 'suggested'
}

export interface PageNode {
  _id: string
  title: string
  parentId: string | null
  order: number
  tags: Tag[]
  isPublic: boolean
  shareSlug: string | null
  children?: PageNode[]
}

export interface BreadcrumbItem {
  id: string
  title: string
}

export interface PageDetail {
  _id: string
  title: string
  content: any
  parentId: string | null
  tags: Tag[]
  isPublic: boolean
  includeSubpagesInShare: boolean
  shareSlug: string | null
  order: number
  createdAt: string
  updatedAt: string
}

interface PageState {
  tree: PageNode[]
  activePageId: string | null
  activePage: PageDetail | null
  breadcrumb: BreadcrumbItem[]
  isLoadingTree: boolean
  isLoadingPage: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'saved-locally'

  // ─── Local-First State ────────────────────────────────────────────
  isOffline: boolean
  pendingSyncs: number
  lastSyncedAt: Date | null
  isHydrated: boolean

  // ─── Actions ──────────────────────────────────────────────────────
  loadTree: () => Promise<void>
  selectPage: (id: string) => Promise<void>
  createPage: (parentId?: string | null) => Promise<string>
  updateTitle: (id: string, title: string) => Promise<void>
  updateContent: (id: string, content: any) => Promise<void>
  movePage: (id: string, newParentId: string | null, newOrder: number) => Promise<void>
  deletePage: (id: string) => Promise<void>
  acceptTag: (pageId: string, tagName: string) => Promise<void>
  rejectTag: (pageId: string, tagName: string) => Promise<void>
  updateShare: (pageId: string, isPublic: boolean, includeSubpages: boolean) => Promise<{ shareSlug: string | null }>

  // ─── Local-First Actions ──────────────────────────────────────────
  hydrateFromLocal: () => Promise<void>
  initSyncEngine: () => void
  teardownSyncEngine: () => void
}

// ─── Helpers ────────────────────────────────────────────────────────────

function buildTree(pages: LocalPage[]): PageNode[] {
  const nodeMap = new Map<string, PageNode>()
  const roots: PageNode[] = []

  // First pass: create all nodes
  for (const page of pages) {
    nodeMap.set(page._id, {
      _id: page._id,
      title: page.title,
      parentId: page.parentId,
      order: page.order,
      tags: page.tags,
      isPublic: page.isPublic,
      shareSlug: page.shareSlug,
      children: [],
    })
  }

  // Second pass: build parent-child relationships
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by order
  for (const node of nodeMap.values()) {
    node.children?.sort((a, b) => a.order - b.order)
  }
  roots.sort((a, b) => a.order - b.order)

  return roots
}

function buildBreadcrumb(pages: LocalPage[], pageId: string): BreadcrumbItem[] {
  const breadcrumb: BreadcrumbItem[] = []
  let currentId: string | null = pageId
  const pageMap = new Map(pages.map((p) => [p._id, p]))

  while (currentId) {
    const page = pageMap.get(currentId)
    if (!page) break
    breadcrumb.unshift({ id: page._id, title: page.title || 'Untitled' })
    currentId = page.parentId
  }

  return breadcrumb
}

function pageToLocalPage(page: any, dirty = false): LocalPage {
  return {
    _id: page._id,
    title: page.title || 'Untitled',
    content: page.content,
    parentId: page.parentId || null,
    tags: page.tags || [],
    isPublic: page.isPublic || false,
    includeSubpagesInShare: page.includeSubpagesInShare || false,
    shareSlug: page.shareSlug || null,
    order: page.order || 0,
    createdAt: page.createdAt || new Date().toISOString(),
    updatedAt: page.updatedAt || new Date().toISOString(),
    _dirty: dirty,
  }
}

// ─── Store ──────────────────────────────────────────────────────────────

export const usePageStore = create<PageState>((set, get) => ({
  tree: [],
  activePageId: null,
  activePage: null,
  breadcrumb: [],
  isLoadingTree: false,
  isLoadingPage: false,
  saveStatus: 'saved',

  isOffline: false,
  pendingSyncs: 0,
  lastSyncedAt: null,
  isHydrated: false,

  // ─── Hydrate from IndexedDB on startup (0ms first paint) ──────────

  hydrateFromLocal: async () => {
    try {
      const localPages = await localDb.getAllPages()
      if (localPages.length > 0) {
        const tree = buildTree(localPages)
        set({ tree, isHydrated: true })

        // Auto-select first page if none selected
        const { activePageId } = get()
        if (!activePageId && tree.length > 0) {
          get().selectPage(tree[0]._id)
        }
      }
    } catch (error) {
      console.error('[PageStore] Failed to hydrate from IndexedDB:', error)
    }
  },

  // ─── Sync Engine Lifecycle ────────────────────────────────────────

  initSyncEngine: () => {
    startSyncEngine()
    onSyncStateChange((syncState: SyncState) => {
      set({
        isOffline: !syncState.isOnline,
        pendingSyncs: syncState.pendingCount,
        lastSyncedAt: syncState.lastSyncedAt,
      })
    })
  },

  teardownSyncEngine: () => {
    stopSyncEngine()
  },

  // ─── Tree Loading (Local-First) ───────────────────────────────────

  loadTree: async () => {
    set({ isLoadingTree: true })
    try {
      const data = await apiRequest('/pages/tree')

      // Flatten the server tree into local pages and cache in IndexedDB
      const flatPages = flattenTree(data.tree)
      await localDb.savePages(flatPages.map((p) => pageToLocalPage(p)))

      set({ tree: data.tree, isLoadingTree: false })

      // Auto-select first page if none selected and pages exist
      const { activePageId } = get()
      if (!activePageId && data.tree.length > 0) {
        get().selectPage(data.tree[0]._id)
      }
    } catch (e) {
      // If API fails (offline), fall back to local data
      console.warn('[PageStore] API tree fetch failed, using local cache:', e)
      const localPages = await localDb.getAllPages()
      if (localPages.length > 0) {
        const tree = buildTree(localPages)
        set({ tree, isLoadingTree: false })

        const { activePageId } = get()
        if (!activePageId && tree.length > 0) {
          get().selectPage(tree[0]._id)
        }
      } else {
        set({ isLoadingTree: false })
      }
    }
  },

  // ─── Page Selection (Local-First) ─────────────────────────────────

  selectPage: async (id: string) => {
    if (!id) return
    const prevActiveId = get().activePageId
    if (prevActiveId === id && get().activePage) return

    // 1. Try to load from IndexedDB immediately (0ms instant paint)
    try {
      const localPage = await localDb.getPage(id)
      if (localPage) {
        const allPages = await localDb.getAllPages()
        const breadcrumb = buildBreadcrumb(allPages, id)
        const resolvedContent = await resolveLocalImages(localPage.content)

        set({
          activePageId: id,
          activePage: {
            _id: localPage._id,
            title: localPage.title,
            content: resolvedContent,
            parentId: localPage.parentId,
            tags: localPage.tags,
            isPublic: localPage.isPublic,
            includeSubpagesInShare: localPage.includeSubpagesInShare,
            shareSlug: localPage.shareSlug,
            order: localPage.order,
            createdAt: localPage.createdAt,
            updatedAt: localPage.updatedAt,
          },
          breadcrumb,
          isLoadingPage: false,
        })
      } else {
        // Only show loader if we genuinely have no local copy
        set({ activePageId: id, isLoadingPage: true })
      }

      // 2. Non-blocking background sync with API
      apiRequest(`/pages/${id}`)
        .then(async (data) => {
          const serverPage = data.page
          if (!serverPage) return

          // Cache in IndexedDB
          await localDb.savePage(pageToLocalPage(serverPage))

          // Resolve local images in server content too
          const resolvedContent = await resolveLocalImages(serverPage.content)

          // Update UI if the user is still on this page
          if (get().activePageId === id) {
            set({
              activePage: { ...serverPage, content: resolvedContent },
              breadcrumb: data.breadcrumb || [],
              isLoadingPage: false,
            })
          }
        })
        .catch((apiError) => {
          if (!localPage) {
            console.error('[PageStore] No local cache and API failed:', apiError)
            set({ isLoadingPage: false })
          }
        })
    } catch (error) {
      console.error('[PageStore] selectPage error:', error)
      set({ isLoadingPage: false })
    }
  },

  // ─── Create Page (Local-First) ────────────────────────────────────

  createPage: async (parentId: string | null = null) => {
    try {
      const data = await apiRequest('/pages', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled',
          content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
          parentId: parentId || null,
        }),
      })

      const newPage = data.page
      await localDb.savePage(pageToLocalPage(newPage, false))

      await get().loadTree()
      await get().selectPage(newPage._id)
      return newPage._id
    } catch (e) {
      console.error('Failed to create page:', e)
      throw e
    }
  },

  // ─── Update Title (Local-First) ───────────────────────────────────

  updateTitle: async (id: string, title: string) => {
    const { activePage } = get()
    if (activePage && activePage._id === id) {
      set({ activePage: { ...activePage, title } })
    }

    // 1. Update IndexedDB immediately
    let localPage = await localDb.getPage(id)
    if (!localPage) {
      const active = get().activePage
      if (active && active._id === id) {
        localPage = pageToLocalPage(active)
      }
    }
    if (localPage) {
      await localDb.savePage({
        ...localPage,
        title,
        updatedAt: new Date().toISOString(),
        _dirty: true,
      })
    }

    // 2. Rebuild tree
    const allPages = await localDb.getAllPages()
    const tree = buildTree(allPages)
    set({ tree })

    // 3. Queue sync
    await localDb.queueSync({
      type: 'update_page',
      pageId: id,
      payload: { pageId: id, title },
      timestamp: Date.now(),
      retryCount: 0,
    })

    // 4. Best-effort immediate API call
    try {
      await apiRequest(`/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
    } catch (e) {
      // Will sync later
    }

    forceSync()
  },

  // ─── Update Content (Local-First) ─────────────────────────────────

  updateContent: async (id: string, content: any) => {
    set({ saveStatus: 'saving' })

    // Convert blob: URLs back to localimg:// references before storing
    const storageContent = unresolveLocalImages(content)

    // 1. Save to IndexedDB immediately (0ms perceived save)
    let localPage = await localDb.getPage(id)
    if (!localPage) {
      const active = get().activePage
      if (active && active._id === id) {
        localPage = pageToLocalPage(active)
      }
    }
    if (localPage) {
      await localDb.savePage({
        ...localPage,
        content: storageContent,
        updatedAt: new Date().toISOString(),
        _dirty: true,
      })
    }
    set({ saveStatus: 'saved-locally' })

    // 2. Queue sync to server
    await localDb.queueSync({
      type: 'update_page',
      pageId: id,
      payload: { pageId: id, content: storageContent },
      timestamp: Date.now(),
      retryCount: 0,
    })

    // 3. Best-effort immediate API call
    try {
      const data = await apiRequest(`/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: storageContent }),
      })

      const { activePage } = get()
      if (activePage && activePage._id === id) {
        set({
          activePage: {
            ...activePage,
            content: content, // Keep the blob: URL version for display
            tags: data.page.tags || activePage.tags,
          },
          saveStatus: 'saved',
        })
      } else {
        set({ saveStatus: 'saved' })
      }
    } catch (e) {
      // Saved locally — will sync when online
      set({ saveStatus: 'saved-locally' })
    }

    forceSync()
  },

  // ─── Move Page ────────────────────────────────────────────────────

  movePage: async (id: string, newParentId: string | null, newOrder: number) => {
    // Update locally
    const localPage = await localDb.getPage(id)
    if (localPage) {
      await localDb.savePage({
        ...localPage,
        parentId: newParentId,
        order: newOrder,
        _dirty: true,
      })
    }

    const allPages = await localDb.getAllPages()
    const tree = buildTree(allPages)
    set({ tree })

    // Queue sync
    await localDb.queueSync({
      type: 'update_page',
      pageId: id,
      payload: { pageId: id, parentId: newParentId, order: newOrder },
      timestamp: Date.now(),
      retryCount: 0,
    })

    try {
      await apiRequest(`/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ parentId: newParentId, order: newOrder }),
      })
      await get().loadTree()
    } catch (e) {
      console.error('Failed to move page:', e)
    }
  },

  // ─── Delete Page (Local-First) ────────────────────────────────────

  deletePage: async (id: string) => {
    // 1. Delete from IndexedDB immediately
    await localDb.deletePage(id)

    // Also delete child pages locally
    const allPages = await localDb.getAllPages()
    const childIds = allPages
      .filter((p) => p.parentId === id)
      .map((p) => p._id)

    for (const childId of childIds) {
      await localDb.deletePage(childId)
    }

    // 2. Rebuild tree
    const remainingPages = await localDb.getAllPages()
    const tree = buildTree(remainingPages)

    const { activePageId } = get()
    if (activePageId === id) {
      if (tree.length > 0) {
        set({ tree })
        get().selectPage(tree[0]._id)
      } else {
        set({ tree, activePageId: null, activePage: null, breadcrumb: [] })
      }
    } else {
      set({ tree })
    }

    // 3. Queue sync
    await localDb.queueSync({
      type: 'delete_page',
      pageId: id,
      payload: { pageId: id },
      timestamp: Date.now(),
      retryCount: 0,
    })

    // 4. Best-effort immediate API call
    try {
      await apiRequest(`/pages/${id}`, { method: 'DELETE' })
    } catch (e) {
      // Will sync later
    }

    forceSync()
  },

  // ─── Tags (API-Only — No local-first needed) ─────────────────────

  acceptTag: async (pageId: string, tagName: string) => {
    try {
      const data = await apiRequest(`/pages/${pageId}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ name: tagName, action: 'accept' }),
      })

      const { activePage } = get()
      if (activePage && activePage._id === pageId) {
        set({ activePage: { ...activePage, tags: data.tags } })
      }

      // Update local cache
      const localPage = await localDb.getPage(pageId)
      if (localPage) {
        await localDb.savePage({ ...localPage, tags: data.tags })
      }
    } catch (e) {
      console.error('Failed to accept tag:', e)
    }
  },

  rejectTag: async (pageId: string, tagName: string) => {
    try {
      const data = await apiRequest(`/pages/${pageId}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ name: tagName, action: 'reject' }),
      })

      const { activePage } = get()
      if (activePage && activePage._id === pageId) {
        set({ activePage: { ...activePage, tags: data.tags } })
      }

      // Update local cache
      const localPage = await localDb.getPage(pageId)
      if (localPage) {
        await localDb.savePage({ ...localPage, tags: data.tags })
      }
    } catch (e) {
      console.error('Failed to reject tag:', e)
    }
  },

  // ─── Share (API-Only) ─────────────────────────────────────────────

  updateShare: async (pageId: string, isPublic: boolean, includeSubpages: boolean) => {
    try {
      // If making page public, publish any local images to public CDN / Data URLs
      if (isPublic) {
        const { activePage } = get()
        if (activePage && activePage._id === pageId && activePage.content) {
          try {
            const publishedContent = await publishLocalImages(pageId, activePage.content)
            await apiRequest(`/pages/${pageId}`, {
              method: 'PATCH',
              body: JSON.stringify({ content: publishedContent }),
            })
            set({
              activePage: {
                ...activePage,
                content: publishedContent,
              },
            })
          } catch (pubErr) {
            console.warn('[updateShare] Failed to publish local images:', pubErr)
          }
        }
      }

      const data = await apiRequest(`/pages/${pageId}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic, includeSubpages }),
      })

      const { activePage } = get()
      if (activePage && activePage._id === pageId) {
        set({
          activePage: {
            ...activePage,
            isPublic: data.page.isPublic,
            includeSubpagesInShare: data.page.includeSubpagesInShare,
            shareSlug: data.page.shareSlug,
          },
        })
      }

      // Update local cache
      const localPage = await localDb.getPage(pageId)
      if (localPage) {
        await localDb.savePage({
          ...localPage,
          isPublic: data.page.isPublic,
          includeSubpagesInShare: data.page.includeSubpagesInShare,
          shareSlug: data.page.shareSlug,
        })
      }

      return { shareSlug: data.page.shareSlug }
    } catch (e) {
      console.error('Failed to update share:', e)
      throw e
    }
  },
}))

// ─── Tree Flattening Helper ─────────────────────────────────────────────

function flattenTree(tree: any[]): any[] {
  const result: any[] = []
  function walk(nodes: any[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(tree)
  return result
}
