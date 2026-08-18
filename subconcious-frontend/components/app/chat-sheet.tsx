'use client'

import { Sparkles, X } from 'lucide-react'
import { ChatContent } from './chat-content'

export function ChatSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Dim backdrop */}
      <button
        type="button"
        aria-label="Close chat"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 duration-150 animate-in fade-in"
      />

      {/* Sheet */}
      <div className="relative flex h-[82%] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-xl duration-200 animate-in slide-in-from-bottom">
        <div className="flex flex-col items-center pt-2.5 pb-1">
          <span className="h-1 w-9 rounded-full bg-border" />
        </div>
        <header className="flex items-center justify-between px-4 pt-1 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <Sparkles className="size-3.5" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight">Ask The Subconscious</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 border-t border-border flex flex-col">
          <ChatContent condensed onNavigatePage={() => onClose()} />
        </div>
      </div>
    </div>
  )
}
