'use client'

import { Check, Copy, Globe, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { usePageStore } from '@/lib/stores/page.store'
import { cn } from '@/lib/utils'

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const { activePage, updateShare } = usePageStore()

  const [isPublic, setIsPublic] = useState(activePage?.isPublic || false)
  const [includeSub, setIncludeSub] = useState(
    activePage?.includeSubpagesInShare || false
  )
  const [copied, setCopied] = useState(false)
  const [shareSlug, setShareSlug] = useState(activePage?.shareSlug || null)

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3001'
  const shareUrl = shareSlug ? `${origin}/p/${shareSlug}` : ''

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const [isPublishing, setIsPublishing] = useState(false)

  const handleTogglePublic = async (val: boolean) => {
    setIsPublic(val)
    if (!activePage) return
    setIsPublishing(true)
    try {
      const res = await updateShare(activePage._id, val, includeSub)
      if (res.shareSlug) {
        setShareSlug(res.shareSlug)
      }
    } catch (e) {
      console.error('Failed to toggle share:', e)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleToggleIncludeSub = async (val: boolean) => {
    setIncludeSub(val)
    if (!activePage) return
    try {
      await updateShare(activePage._id, isPublic, val)
    } catch (e) {
      console.error('Failed to toggle includeSub:', e)
    }
  }

  function copy() {
    if (!shareUrl) return
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl z-10"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
              <Globe className="size-3.5" />
            </span>
            <h2
              id="share-title"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Share Page to Web
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Public Web Access
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anyone with the link can view in read-only mode.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              aria-label="Make this page public"
            />
          </div>

          <div
            className={cn(
              'flex items-center justify-between gap-4 transition-opacity',
              !isPublic && 'opacity-40 pointer-events-none'
            )}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                Include Sub-Pages
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grant access to all child pages in the hierarchy.
              </p>
            </div>
            <Switch
              checked={includeSub}
              onCheckedChange={handleToggleIncludeSub}
              disabled={!isPublic}
              aria-label="Include sub-pages"
            />
          </div>

          {isPublic && shareUrl && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-1.5 pl-3.5"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-background transition-transform hover:scale-105 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </motion.div>
          )}

          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
            Public pages are strictly read-only. Private notes and your AI vector index remain completely confidential.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
