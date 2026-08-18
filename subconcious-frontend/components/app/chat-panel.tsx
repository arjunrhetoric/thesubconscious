'use client'

import { Sparkles, Trash2, X } from 'lucide-react'
import { useChatStore } from '@/lib/stores/chat.store'
import { ChatContent } from './chat-content'

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { clearMessages, messages } = useChatStore()

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background duration-150 animate-in fade-in">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
            <Sparkles className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">Ask The Subconscious</h2>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Gemini 3.5 RAG
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              title="Clear conversation"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>
      <ChatContent onNavigatePage={() => onClose()} />
    </div>
  )
}
