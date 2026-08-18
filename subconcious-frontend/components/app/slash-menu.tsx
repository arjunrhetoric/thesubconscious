'use client'

import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Table,
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface SlashCommandItem {
  title: string
  description: string
  icon: any
  command: (editor: any) => void
}

export const getSlashItems = (uploadTrigger?: () => void): SlashCommandItem[] => [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'To-do List',
    description: 'Track tasks with a checkbox',
    icon: ListTodo,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Bullet List',
    description: 'Simple bulleted list',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Sequential ordered list',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Code Block',
    description: 'Syntax-highlighted code snippet',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote or callout',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: Table,
    command: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: ImageIcon,
    command: () => {
      if (uploadTrigger) uploadTrigger()
    },
  },
]

export const SlashMenu = forwardRef(
  (
    {
      items,
      command,
    }: {
      items: SlashCommandItem[]
      command: (item: SlashCommandItem) => void
    },
    ref
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) {
            command(items[selectedIndex])
          }
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div className="w-64 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-md z-50">
        <p className="border-b border-border px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Basic blocks
        </p>
        <div className="p-1">
          {items.map((item, index) => {
            const Icon = item.icon
            const isSelected = index === selectedIndex
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => command(item)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent ${
                  isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 truncate">
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block text-xs text-muted-foreground truncate">{item.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

SlashMenu.displayName = 'SlashMenu'
