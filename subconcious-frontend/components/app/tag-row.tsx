'use client'

import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { usePageStore } from '@/lib/stores/page.store'

export function TagRow() {
  const { activePage, acceptTag, rejectTag } = usePageStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  if (!activePage) return null

  const tags = activePage.tags || []

  // Deduplicate tags by name (keep accepted over suggested if duplicated)
  const tagMap = new Map<string, { name: string; status: 'accepted' | 'suggested' }>()
  for (const t of tags) {
    if (!tagMap.has(t.name) || t.status === 'accepted') {
      tagMap.set(t.name, t)
    }
  }

  const uniqueTags = Array.from(tagMap.values())
  const accepted = uniqueTags.filter((t) => t.status === 'accepted')
  const suggested = uniqueTags.filter((t) => t.status === 'suggested')

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) {
      setIsAdding(false)
      return
    }
    await acceptTag(activePage._id, newTagName.trim().toLowerCase())
    setNewTagName('')
    setIsAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {accepted.map((tag, index) => (
        <Badge key={`accepted-${tag.name}-${index}`} variant="neutral" className="pr-1">
          {tag.name}
          <button
            type="button"
            onClick={() => rejectTag(activePage._id, tag.name)}
            aria-label={`Remove tag ${tag.name}`}
            className="rounded-full p-0.5 text-secondary-foreground/60 hover:text-secondary-foreground"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {suggested.map((tag, index) => (
        <button
          key={`suggested-${tag.name}-${index}`}
          type="button"
          onClick={() => acceptTag(activePage._id, tag.name)}
          className="cursor-pointer"
        >
          <Badge variant="suggested">
            <Plus className="size-3" />
            {tag.name}
          </Badge>
        </button>
      ))}

      {suggested.length > 0 && (
        <span className="ml-1 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-brand uppercase">
          AI
        </span>
      )}

      {isAdding ? (
        <form onSubmit={handleAddCustom} className="inline-flex items-center">
          <input
            type="text"
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onBlur={handleAddCustom}
            placeholder="tag name..."
            className="h-6 rounded border border-border bg-background px-2 text-xs outline-none focus:border-brand"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
        >
          <Plus className="size-3" />
          Add tag
        </button>
      )}
    </div>
  )
}
