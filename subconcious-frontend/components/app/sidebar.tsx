'use client'

import { ChevronsUpDown, Cloud, CloudOff, LogOut, Plus, RefreshCw, Search, Settings, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore } from '@/lib/stores/auth.store'
import { usePageStore } from '@/lib/stores/page.store'
import { cn } from '@/lib/utils'
import { EmptyTree } from './empty-tree'
import { PageTree } from './page-tree'

export function Sidebar({
  activeId,
  onSelect,
  onOpenChat,
  empty = false,
  className,
}: {
  activeId: string
  onSelect: (id: string) => void
  onOpenChat: () => void
  empty?: boolean
  className?: string
}) {
  const { user, logout } = useAuthStore()
  const { tree, createPage, isOffline, pendingSyncs } = usePageStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = user?.username || user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TS'

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none',
        className
      )}
    >
      {/* Workspace Header */}
      <div className="p-3">
        <div className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-sidebar-accent/50 transition-colors">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background text-xs font-bold shadow-xs">
            {initials}
          </span>
          <span className="flex-1 truncate">
            <span className="block text-sm font-semibold text-foreground truncate">
              {displayName}&apos;s Subconscious
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Personal workspace
            </span>
          </span>
        </div>
      </div>

      {/* Quick Search / Chat Button */}
      <div className="px-3">
        <button
          type="button"
          onClick={onOpenChat}
          className="flex h-9 w-full items-center justify-between rounded-xl border border-sidebar-border bg-card/60 px-3 text-xs text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:border-neutral-700 shadow-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span>Ask or search notes...</span>
          </span>
          <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* New page button */}
      <div className="px-3 mt-2">
        <button
          type="button"
          onClick={() => createPage(null)}
          className="flex h-8 w-full items-center gap-2 rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
        >
          <Plus className="size-4" />
          <span>New Page</span>
        </button>
      </div>

      {/* Page Tree */}
      <div className="mt-2 flex-1 overflow-y-auto px-3 pb-3">
        {empty ? (
          <EmptyTree onNewPage={() => createPage(null)} />
        ) : (
          <>
            <p className="px-2 pt-2 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Pages
            </p>
            <PageTree tree={tree} activeId={activeId} onSelect={onSelect} />
          </>
        )}
      </div>

      {/* AI Chat Launcher Bar */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onOpenChat}
          className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 text-left text-sm transition-all hover:border-neutral-600 hover:shadow-sm cursor-pointer"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="size-3.5" />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold text-foreground">Ask The Subconscious</span>
            <span className="block text-[10px] text-muted-foreground">
              Gemini 3.5 RAG
            </span>
          </span>
        </button>
      </div>

      {/* Sync Status Indicator */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] text-muted-foreground">
          {isOffline ? (
            <>
              <CloudOff className="size-3 text-red-400" />
              <span>Offline — saved locally</span>
            </>
          ) : pendingSyncs > 0 ? (
            <>
              <RefreshCw className="size-3 text-amber-400 animate-spin" />
              <span>{pendingSyncs} change{pendingSyncs > 1 ? 's' : ''} syncing...</span>
            </>
          ) : (
            <>
              <Cloud className="size-3 text-emerald-400" />
              <span>All changes synced</span>
            </>
          )}
        </div>
      </div>

      {/* User / Settings Footer */}
      <div ref={menuRef} className="relative border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials}
            </span>
          )}
          <span className="flex-1 truncate">
            <span className="block truncate text-xs font-medium text-foreground">{displayName}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {user?.email}
            </span>
          </span>
          <ThemeToggle />
          <button
            type="button"
            aria-label="User settings"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
          >
            <Settings className="size-4" />
          </button>
        </div>

        {/* User Popup Menu */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 z-30 mb-2 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl duration-150 animate-in fade-in slide-in-from-bottom-1">
            <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground truncate">
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                setUserMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-accent cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
