import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export interface SlashItem {
  id: string
  title: string
  description: string
  icon: string
  command: ({ editor, range }: { editor: any; range: any }) => void
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
