'use client'

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useChatStore, type ChatMessage } from '@/lib/stores/chat.store'
import { usePageStore } from '@/lib/stores/page.store'
import { cn } from '@/lib/utils'
import { EmptyChat } from './empty-chat'

function SourceChip({
  id,
  label,
  onSelect,
}: {
  id: string
  label: string
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-all hover:border-neutral-600 hover:text-foreground cursor-pointer shadow-xs"
    >
      <FileText className="size-3 text-muted-foreground" />
      <span>{label}</span>
    </button>
  )
}

function ClaudeThinkingIndicator() {
  const [thoughtStep, setThoughtStep] = useState(0)
  const steps = [
    'Searching vector space in Qdrant Cloud…',
    'Matching semantic note chunks…',
    'Formulating grounded answer with citations…',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtStep((prev) => (prev + 1) % steps.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {/* Glowing Claude-style Thinking Star */}
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
          </span>

          <span className="text-sm font-medium tracking-wide animate-claude-shimmer">
            Thinking…
          </span>
        </div>

        {/* Dynamic Thought Subtext */}
        <div className="mt-2.5 pl-5 text-xs text-muted-foreground/80 font-mono flex items-center gap-1.5 transition-all duration-300">
          <span className="size-1 rounded-full bg-muted-foreground/60" />
          <span>{steps[thoughtStep]}</span>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onSelectSource,
}: {
  message: ChatMessage
  onSelectSource: (id: string) => void
}) {
  const [showThoughts, setShowThoughts] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground shadow-xs">
          {message.content}
        </div>
      </div>
    )
  }

  // If streaming and content is still empty, display Claude-style thinking animation
  if (message.streaming && !message.content) {
    return <ClaudeThinkingIndicator />
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-card p-4 shadow-sm">
        {/* Header / Thought Accordion */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>The Subconscious</span>
          </div>

          <button
            type="button"
            onClick={() => setShowThoughts((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Thought for 1.4s</span>
            {showThoughts ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        </div>

        {/* Collapsible thought drawer */}
        {showThoughts && (
          <div className="mb-3 rounded-xl border border-border/60 bg-muted/40 p-2.5 text-xs text-muted-foreground font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span>✓ Retrieved nearest 5 semantic chunks from Qdrant</span>
            </div>
            <div>• Filtered user workspace vector space</div>
            <div>• Constrained synthesis to source note ground truth</div>
          </div>
        )}

        {/* Streaming text */}
        <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
          {message.content}
          {message.streaming && (
            <span className="inline-block size-2 ml-1 rounded-full bg-amber-500 animate-pulse" />
          )}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Cited Sources:
            </span>
            {message.sources.map((s) => (
              <SourceChip
                key={s.id}
                id={s.id}
                label={s.label}
                onSelect={onSelectSource}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScopeDropdown() {
  const [open, setOpen] = useState(false)
  const { scope, setScope } = useChatStore()
  const { activePage } = usePageStore()

  const currentLabel =
    scope === 'all'
      ? 'All Notes'
      : `This page (${activePage?.title || 'Untitled'})`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <span>scoped to:</span>
        <span className="font-semibold text-foreground">{currentLabel}</span>
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-1 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setScope('all')
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-accent cursor-pointer',
              scope === 'all'
                ? 'text-foreground font-semibold bg-accent/60'
                : 'text-muted-foreground'
            )}
          >
            All Notes (Entire Workspace)
          </button>
          {activePage && (
            <button
              type="button"
              onClick={() => {
                setScope('current')
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-accent truncate cursor-pointer',
                scope === 'current'
                  ? 'text-foreground font-semibold bg-accent/60'
                  : 'text-muted-foreground'
              )}
            >
              This page ({activePage.title || 'Untitled'})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ChatContent({
  condensed = false,
  onNavigatePage,
}: {
  condensed?: boolean
  onNavigatePage?: (id: string) => void
}) {
  const [value, setValue] = useState('')
  const { messages, sendMessage, isGenerating } = useChatStore()
  const { activePageId, selectPage } = usePageStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new streaming tokens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!value.trim() || isGenerating) return
    const q = value
    setValue('')
    sendMessage(q, activePageId)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectSource = (id: string) => {
    selectPage(id)
    if (onNavigatePage) {
      onNavigatePage(id)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyChat onPick={(prompt) => sendMessage(prompt, activePageId)} />
        ) : (
          <div
            className={cn(
              'mx-auto flex w-full flex-col gap-4 px-4 py-6',
              condensed ? 'max-w-full' : 'max-w-[700px] sm:px-6'
            )}
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onSelectSource={handleSelectSource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background/80 px-4 py-3.5 backdrop-blur-md">
        <div
          className={cn(
            'mx-auto w-full',
            condensed ? 'max-w-full' : 'max-w-[700px]'
          )}
        >
          <div className="mb-2">
            <ScopeDropdown />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 pl-4 focus-within:border-ring shadow-xs">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Ask The Subconscious anything about your notes…"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleSend}
              aria-label="Send message"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer"
              disabled={value.trim().length === 0 || isGenerating}
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
