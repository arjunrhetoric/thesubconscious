'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import ImageExtension from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { decryptImageBuffer } from '@/lib/image-utils'

async function processEncryptedContent(content: any): Promise<any> {
  if (!content) return content
  const clone = JSON.parse(JSON.stringify(content))

  async function traverse(node: any) {
    if (!node) return

    if (node.type === 'image' && node.attrs?.src) {
      const src: string = node.attrs.src
      if (src.includes('#encKey=')) {
        const [url, keyHex] = src.split('#encKey=')
        try {
          const res = await fetch(url)
          const buffer = await res.arrayBuffer()
          const decryptedBlobUrl = await decryptImageBuffer(buffer, keyHex)
          node.attrs.src = decryptedBlobUrl
        } catch (e) {
          console.error('Failed to decrypt image:', e)
        }
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        await traverse(child)
      }
    }
  }

  await traverse(clone)
  return clone
}

export function ReadOnlyEditor({ content }: { content: any }) {
  const [decryptedContent, setDecryptedContent] = useState<any>(content)

  useEffect(() => {
    processEncryptedContent(content).then((processed) => {
      setDecryptedContent(processed)
    })
  }, [content])

  const editor = useEditor(
    {
      editable: false,
      content: decryptedContent,
      extensions: [
        StarterKit,
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        ImageExtension.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: 'rounded-xl max-w-full h-auto border border-border shadow-sm my-4',
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'prose dark:prose-invert max-w-none focus:outline-none text-foreground leading-relaxed',
        },
      },
    },
    [decryptedContent]
  )

  if (!editor) return null

  return <EditorContent editor={editor} />
}
