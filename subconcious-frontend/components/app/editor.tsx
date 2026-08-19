'use client'

import {
  Bold,
  Check,
  ChevronRight,
  Code,
  Copy,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Plus,
  Quote,
  Share2,
  Table as TableIcon,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { usePageStore } from '@/lib/stores/page.store'
import { cn } from '@/lib/utils'
import { storeImageLocally } from '@/lib/image-utils'

const lowlight = createLowlight(all)

function OverflowMenu({ onShare }: { onShare: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { activePageId, deletePage, createPage, activePage } = usePageStore()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    if (!activePageId) return
    setOpen(false)
    if (confirm('Are you sure you want to delete this page and all its subpages?')) {
      await deletePage(activePageId)
    }
  }

  const handleDuplicate = async () => {
    if (!activePage) return
    setOpen(false)
    const newId = await createPage(activePage.parentId)
    usePageStore.getState().updateTitle(newId, `${activePage.title} (Copy)`)
    usePageStore.getState().updateContent(newId, activePage.content)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Page actions"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
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
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            <Share2 className="size-4" />
            Share
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            <Copy className="size-4" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-accent cursor-pointer"
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

  // Keep references to active IDs and content to prevent stale React closure bugs
  const activePageIdRef = useRef(activePageId)
  useEffect(() => {
    activePageIdRef.current = activePageId
  }, [activePageId])

  const activePageRef = useRef(activePage)
  useEffect(() => {
    activePageRef.current = activePage
  }, [activePage])

  // Sync title when activePage changes
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title || 'Untitled')
    }
  }, [activePage?._id, activePage?.title])

  // Local-first image upload (stored in IndexedDB, 0ms render)
  const handleImageUpload = async (file: File) => {
    const currentId = activePageIdRef.current
    if (!file || !currentId) return
    setIsUploading(true)
    setUploadProgress(30)

    try {
      // 1. Compress and store locally in IndexedDB (0ms latency, $0 cost)
      const { imageId, blobUrl } = await storeImageLocally(file, currentId)
      setUploadProgress(100)

      // 2. Insert image node into Tiptap with local blob URL
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: blobUrl, alt: file.name || 'image' })
          .run()

        // Immediate save with new image
        const json = editor.getJSON()
        updateContent(currentId, json)
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
        codeBlock: false,
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

      // Debounce saving (1.2 seconds) using latest activePageIdRef to avoid stale closures
      const currentTargetId = activePageIdRef.current
      if (currentTargetId) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          const json = editor.getJSON()
          updateContent(currentTargetId, json)
        }, 1200)
      }
    },
  })

  // Re-sync editor content when switching pages
  useEffect(() => {
    if (editor && activePage) {
      // Clear any pending debounced save from the previous page so it doesn't overwrite
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }

      const currentDoc = editor.getJSON()
      const currentJSON = JSON.stringify(currentDoc)
      const pageJSON = JSON.stringify(activePage.content)

      if (currentJSON !== pageJSON) {
        // Set content without firing onUpdate to prevent false auto-save cycles
        editor.commands.setContent(
          activePage.content || {
            type: 'doc',
            content: [{ type: 'paragraph', content: [] }],
          },
          false
        )
      }
    }
  }, [activePage?._id, activePage?.content, editor])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    const currentId = activePageIdRef.current
    if (currentId) {
      updateTitle(currentId, newTitle)
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

  if (!activePage && !isLoadingPage) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <FileText className="size-8 opacity-40" />
        <p className="text-sm">Select or create a page to begin editing</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-10">
      {/* Top action bar: breadcrumbs + share button */}
      <div className="flex items-center justify-between gap-2">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((seg, i) => (
            <span key={seg.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/40">/</span>}
              <button
                type="button"
                onClick={() => selectPage(seg.id)}
                className={cn(
                  'truncate rounded px-1 py-0.5 transition-colors hover:bg-accent hover:text-foreground cursor-pointer',
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
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
            <p className="text-xs font-medium">Processing &amp; saving image locally...</p>
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

        {/* Slash Command Floating Popover Menu */}
        {slashMenuOpen && (
          <div className="absolute top-12 left-0 z-40 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Basic Blocks
            </p>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => applySlashCommand('h1')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <Heading1 className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Heading 1</div>
                  <div className="text-[10px] text-muted-foreground">Big section title</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('h2')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <Heading2 className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Heading 2</div>
                  <div className="text-[10px] text-muted-foreground">Medium subsection</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('h3')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <Heading3 className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Heading 3</div>
                  <div className="text-[10px] text-muted-foreground">Small heading</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('todo')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <ListTodo className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">To-do List</div>
                  <div className="text-[10px] text-muted-foreground">Track tasks with a checkbox</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('bullet')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <List className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Bullet List</div>
                  <div className="text-[10px] text-muted-foreground">Create a simple bulleted list</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('number')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <ListOrdered className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Numbered List</div>
                  <div className="text-[10px] text-muted-foreground">Create a list with numbering</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('code')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <FileText className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Code Block</div>
                  <div className="text-[10px] text-muted-foreground">Syntax highlighted snippet</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('quote')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <Quote className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Quote</div>
                  <div className="text-[10px] text-muted-foreground">Capture a quote</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('table')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <TableIcon className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Table</div>
                  <div className="text-[10px] text-muted-foreground">Add a simple data table</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => applySlashCommand('image')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                <ImageIcon className="size-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Image</div>
                  <div className="text-[10px] text-muted-foreground">Upload image (0ms local-first)</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar for Quick Formatting & Image Upload */}
      {editor && (
        <div className="sticky bottom-4 z-20 mx-auto mt-6 flex items-center justify-center gap-1 rounded-xl border border-border bg-popover/95 p-1 shadow-xl backdrop-blur-md w-fit">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer',
              editor.isActive('bold') && 'bg-accent text-foreground font-bold'
            )}
            title="Bold"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer',
              editor.isActive('italic') && 'bg-accent text-foreground italic'
            )}
            title="Italic"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer',
              editor.isActive('code') && 'bg-accent text-foreground'
            )}
            title="Code"
          >
            <Code className="size-4" />
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <Upload className="size-4" />
          </button>
        </div>
      )}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
        }}
        className="hidden"
      />
    </div>
  )
}

function TagRow() {
  const { activePage, activePageId, acceptTag, rejectTag } = usePageStore()
  const [newTagName, setNewTagName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!activePage) return null

  const tags = activePage.tags || []
  const acceptedTags = tags.filter((t) => t.status === 'accepted')
  const suggestedTags = tags.filter((t) => t.status === 'suggested')

  const handleAddCustomTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim() || !activePageId) return
    const name = newTagName.trim().toLowerCase().replace(/\s+/g, '-')
    setNewTagName('')
    setIsAdding(false)
    await acceptTag(activePageId, name)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Accepted tags */}
      {acceptedTags.map((tag) => (
        <span
          key={tag.name}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
        >
          <span>{tag.name}</span>
          <button
            type="button"
            onClick={() => activePageId && rejectTag(activePageId, tag.name)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {/* AI Suggested Tags */}
      {suggestedTags.map((tag) => (
        <span
          key={tag.name}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
        >
          <span className="text-[10px] uppercase font-bold text-amber-400">AI</span>
          <span>{tag.name}</span>
          <button
            type="button"
            onClick={() => activePageId && acceptTag(activePageId, tag.name)}
            className="hover:text-emerald-400 font-bold ml-1 cursor-pointer"
            title="Accept tag"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => activePageId && rejectTag(activePageId, tag.name)}
            className="hover:text-red-400 cursor-pointer"
            title="Reject tag"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {/* Add tag button / input */}
      {isAdding ? (
        <form onSubmit={handleAddCustomTag} className="inline-flex items-center">
          <input
            autoFocus
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onBlur={() => setIsAdding(false)}
            placeholder="tag-name"
            className="h-6 w-24 rounded border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-ring"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground cursor-pointer"
        >
          <Plus className="size-3" />
          <span>Add tag</span>
        </button>
      )}
    </div>
  )
}
