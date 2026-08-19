'use client'

import {
  Bold,
  Check,
  Code as CodeIcon,
  Copy,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Quote,
  Share2,
  Table as TableIcon,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { usePageStore } from '@/lib/stores/page.store'
import { apiRequest } from '@/lib/api'
import { storeImageLocally, LOCAL_IMAGE_PREFIX } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { TagRow } from './tag-row'

const lowlight = createLowlight(all)

function OverflowMenu({ onShare }: { onShare: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { activePage, deletePage, createPage } = usePageStore()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!activePage) return null

  const handleDelete = async () => {
    setOpen(false)
    if (confirm(`Delete "${activePage.title || 'Untitled'}" and all its subpages?`)) {
      await deletePage(activePage._id)
    }
  }

  const handleDuplicate = async () => {
    setOpen(false)
    try {
      const newPageId = await createPage(activePage.parentId)
      await apiRequest(`/pages/${newPageId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: `${activePage.title} (Copy)`,
          content: activePage.content,
        }),
      })
      usePageStore.getState().selectPage(newPageId)
    } catch (e) {
      console.error('Failed to duplicate page:', e)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Page options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md duration-150 animate-in fade-in slide-in-from-top-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onShare()
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Share2 className="size-4" />
            Share
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Copy className="size-4" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-accent"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function Editor({ onShare }: { onShare: () => void }) {
  const {
    activePage,
    activePageId,
    breadcrumb,
    selectPage,
    updateTitle,
    updateContent,
    saveStatus,
    isLoadingPage,
  } = usePageStore()

  const [title, setTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync title when activePage changes
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title || 'Untitled')
    }
  }, [activePage])

  // Local-first image upload (stored in IndexedDB, never touches cloud for private notes)
  const handleImageUpload = async (file: File) => {
    if (!file || !activePageId) return
    setIsUploading(true)
    setUploadProgress(30)

    try {
      // 1. Compress and store locally in IndexedDB (0ms latency, $0 cost)
      const { imageId, blobUrl } = await storeImageLocally(file, activePageId)

      setUploadProgress(100)

      // 2. Insert image node into Tiptap with local blob URL
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: blobUrl, alt: file.name })
          .run()
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to save image. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // handoff to CodeBlockLowlight
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...'
          }
          return 'Type "/" for commands, or start writing...'
        },
      }),
    ],
    content: activePage?.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert sm:prose-base max-w-none focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      // Check if user typed slash
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, editor.state.selection.from - 2),
        editor.state.selection.from,
        '\n'
      )
      if (textBefore.endsWith('/')) {
        setSlashMenuOpen(true)
      } else {
        setSlashMenuOpen(false)
      }

      // Debounce saving (2 seconds)
      if (activePageId) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          const json = editor.getJSON()
          updateContent(activePageId, json)
        }, 2000)
      }
    },
  })

  // Re-sync editor content when switching pages
  useEffect(() => {
    if (editor && activePage) {
      const currentJSON = JSON.stringify(editor.getJSON())
      const pageJSON = JSON.stringify(activePage.content)
      if (currentJSON !== pageJSON) {
        editor.commands.setContent(
          activePage.content || {
            type: 'doc',
            content: [{ type: 'paragraph', content: [] }],
          }
        )
      }
    }
  }, [activePage?._id, editor])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (activePageId) {
      updateTitle(activePageId, newTitle)
    }
  }

  // Quick slash command actions
  const applySlashCommand = (action: string) => {
    if (!editor) return
    setSlashMenuOpen(false)

    // Remove the "/" trigger
    const { from } = editor.state.selection
    editor.commands.deleteRange({ from: Math.max(0, from - 1), to: from })

    switch (action) {
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
      case 'todo':
        editor.chain().focus().toggleTaskList().run()
        break
      case 'bullet':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'number':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'code':
        editor.chain().focus().toggleCodeBlock().run()
        break
      case 'quote':
        editor.chain().focus().toggleBlockquote().run()
        break
      case 'table':
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
        break
      case 'image':
        fileInputRef.current?.click()
        break
    }
  }

  if (isLoadingPage && !activePage) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (!activePage) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <FileText className="size-8 opacity-40" />
        <p className="text-sm">Select or create a page to begin editing</p>
      </div>
    )
  }

  return (
    <motion.div
      key={activePage._id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative mx-auto flex w-full max-w-[760px] flex-col px-5 py-4 sm:px-8 sm:py-8"
    >
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
        }}
      />

      {/* Top row: breadcrumb + save indicator + actions */}
      <div className="flex items-center justify-between gap-2">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((seg, i) => (
            <span key={seg.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/40">/</span>}
              <button
                type="button"
                onClick={() => selectPage(seg.id)}
                className={cn(
                  'truncate rounded px-1 py-0.5 transition-colors hover:bg-accent hover:text-foreground',
                  i === breadcrumb.length - 1 && 'text-foreground font-medium',
                )}
              >
                {seg.title}
              </button>
            </span>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* Save indicator */}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="size-3 text-emerald-500" />
                Synced
              </>
            ) : saveStatus === 'saved-locally' ? (
              <>
                <Check className="size-3 text-amber-500" />
                Saved locally
              </>
            ) : (
              'Unsaved'
            )}
          </span>

          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <OverflowMenu onShare={onShare} />
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="mt-4 w-full text-2xl font-bold tracking-tight text-foreground bg-transparent border-none outline-none sm:mt-6 sm:text-4xl placeholder:text-muted-foreground/40"
      />

      {/* Tags */}
      <div className="mt-4">
        <TagRow />
      </div>

      {/* Image Uploading Banner */}
      {isUploading && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <Loader2 className="size-4 animate-spin text-brand" />
          <div className="flex-1">
            <p className="text-xs font-medium">Uploading image directly to Cloudinary...</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tiptap Editor */}
      <div className="relative mt-6 min-h-[350px]">
        <EditorContent editor={editor} />

        {/* Slash Commands Dropdown Menu */}
        {slashMenuOpen && (
          <div className="absolute top-10 left-0 z-30 w-64 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md duration-150 animate-in fade-in slide-in-from-top-1">
            <p className="border-b border-border px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Insert Block
            </p>
            <div className="max-h-60 overflow-y-auto p-1 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => applySlashCommand('h1')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <Heading1 className="size-4 text-muted-foreground" />
                <span>Heading 1</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('h2')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <Heading2 className="size-4 text-muted-foreground" />
                <span>Heading 2</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('h3')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <Heading3 className="size-4 text-muted-foreground" />
                <span>Heading 3</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('todo')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <ListTodo className="size-4 text-muted-foreground" />
                <span>To-do List</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('bullet')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <List className="size-4 text-muted-foreground" />
                <span>Bullet List</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('number')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <ListOrdered className="size-4 text-muted-foreground" />
                <span>Numbered List</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('code')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <CodeIcon className="size-4 text-muted-foreground" />
                <span>Code Block</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('quote')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <Quote className="size-4 text-muted-foreground" />
                <span>Quote</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('table')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <TableIcon className="size-4 text-muted-foreground" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('image')}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <ImageIcon className="size-4 text-muted-foreground" />
                <span>Upload Image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar on mobile / quick formatting */}
      {editor && (
        <div className="sticky bottom-4 z-20 mx-auto mt-6 flex items-center gap-1 rounded-lg border border-border bg-popover/90 p-1 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
              editor.isActive('bold') && 'bg-accent text-foreground font-bold'
            )}
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
              editor.isActive('italic') && 'bg-accent text-foreground italic'
            )}
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
              editor.isActive('code') && 'bg-accent text-foreground'
            )}
          >
            <CodeIcon className="size-4" />
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
            className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Upload className="size-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
