'use client'

import { Menu, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { usePageStore } from '@/lib/stores/page.store'
import { useChatStore } from '@/lib/stores/chat.store'
import { cn } from '@/lib/utils'
import { ChatPanel } from './chat-panel'
import { ChatSheet } from './chat-sheet'
import { Editor } from './editor'
import { ShareDialog } from './share-dialog'
import { Sidebar } from './sidebar'

export function AppWorkspace() {
  const router = useRouter()
  const { user, token, isInitialized, rehydrate } = useAuthStore()
  const { tree, activePage, activePageId, loadTree, selectPage, hydrateFromLocal, initSyncEngine, teardownSyncEngine } = usePageStore()
  const { isOpen: isChatOpen, mode: chatMode, openChat, closeChat } = useChatStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Rehydrate auth on load
  useEffect(() => {
    rehydrate()
  }, [rehydrate])

  // Auth guard: redirect to login if initialized and no token
  useEffect(() => {
    if (isInitialized && !token) {
      router.push('/login')
    }
  }, [isInitialized, token, router])

  // Keyboard shortcut: Cmd+K / Ctrl+K to toggle AI chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isChatOpen) {
          closeChat()
        } else {
          openChat(window.innerWidth < 768 ? 'sheet' : 'panel')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isChatOpen, openChat, closeChat])

  // Load tree: hydrate from IndexedDB instantly (0ms), then sync with API
  useEffect(() => {
    if (token) {
      // 1. Instant render from IndexedDB (0ms)
      hydrateFromLocal()
      // 2. Start background sync engine
      initSyncEngine()
      // 3. Fetch latest from API in background
      loadTree()
    }

    return () => {
      teardownSyncEngine()
    }
  }, [token, loadTree, hydrateFromLocal, initSyncEngine, teardownSyncEngine])

  if (!isInitialized) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (!token) {
    return null
  }

  const emptyTree = tree.length === 0

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-[280px] shrink-0 border-r border-sidebar-border md:block">
        <Sidebar
          activeId={activePageId || ''}
          onSelect={selectPage}
          onOpenChat={() => openChat('panel')}
          empty={emptyTree}
        />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <span className="flex-1 truncate text-sm font-medium">
            {activePage?.title || 'Untitled'}
          </span>
          <button
            type="button"
            aria-label="Ask your notes"
            onClick={() => openChat('sheet')}
            className="inline-flex size-9 items-center justify-center rounded-md text-brand transition-colors hover:bg-accent"
          >
            <Sparkles className="size-5" />
          </button>
        </header>

        {/* Editor scroll area */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Editor onShare={() => setShareOpen(true)} />
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/50 duration-150 animate-in fade-in"
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] flex-col border-r border-sidebar-border bg-sidebar duration-150 animate-in slide-in-from-left">
            <div className="flex items-center justify-end p-2">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Sidebar
                activeId={activePageId || ''}
                onSelect={(id) => {
                  selectPage(id)
                  setSidebarOpen(false)
                }}
                onOpenChat={() => {
                  setSidebarOpen(false)
                  openChat('sheet')
                }}
                empty={emptyTree}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI chat — desktop full page overlay */}
      {isChatOpen && chatMode === 'panel' && (
        <div className="absolute inset-0 z-40 hidden md:block">
          <ChatPanel onClose={closeChat} />
        </div>
      )}

      {/* AI chat — mobile bottom sheet */}
      {isChatOpen && chatMode === 'sheet' && (
        <ChatSheet onClose={closeChat} />
      )}

      {/* Share modal */}
      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
    </div>
  )
}
