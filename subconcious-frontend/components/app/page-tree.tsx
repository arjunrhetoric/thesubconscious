'use client'

import { ChevronRight, FileText, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PageNode } from '@/lib/stores/page.store'
import { usePageStore } from '@/lib/stores/page.store'
import { cn } from '@/lib/utils'

function TreeItem({
  node,
  depth,
  activeId,
  onSelect,
}: {
  node: PageNode
  depth: number
  activeId: string
  onSelect: (id: string) => void
}) {
  const hasChildren = !!node.children?.length
  const [open, setOpen] = useState(true)
  const isActive = activeId === node._id
  const { createPage, deletePage } = usePageStore()

  const handleAddSubpage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await createPage(node._id)
    setOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${node.title || 'Untitled'}" and all its subpages?`)) {
      await deletePage(node._id)
    }
  }

  return (
    <div>
      <div
        onClick={() => onSelect(node._id)}
        className={cn(
          'group/item flex h-8 items-center gap-1.5 rounded-xl pr-2 text-xs transition-all cursor-pointer select-none',
          isActive
            ? 'bg-primary/10 text-foreground font-semibold shadow-xs'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronRight
              className={cn(
                'size-3.5 transition-transform duration-200',
                open && 'rotate-90 text-foreground'
              )}
            />
          </button>
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center">
            <FileText className="size-3 text-muted-foreground/70" />
          </span>
        )}

        <span className="flex-1 truncate py-1 text-left">
          {node.title || 'Untitled'}
        </span>

        {/* Quick action buttons on hover */}
        <div className="hidden items-center gap-0.5 group-hover/item:flex">
          <button
            type="button"
            onClick={handleAddSubpage}
            title="Add sub-page"
            aria-label="Add sub-page"
            className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer transition-colors"
          >
            <Plus className="size-3" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete page"
            aria-label="Delete page"
            className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-destructive cursor-pointer transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
        </div>

        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className="size-1.5 shrink-0 rounded-full bg-foreground"
          />
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex flex-col gap-0.5 overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeItem
                key={child._id}
                node={child}
                depth={depth + 1}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PageTree({
  tree,
  activeId,
  onSelect,
}: {
  tree: PageNode[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {tree.map((node) => (
        <TreeItem
          key={node._id}
          node={node}
          depth={0}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
