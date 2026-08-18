import { create } from 'zustand'

export interface ChatSource {
  id: string
  label: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  streaming?: boolean
}

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  mode: 'panel' | 'sheet'
  scope: 'all' | 'current'
  isGenerating: boolean

  openChat: (mode?: 'panel' | 'sheet') => void
  closeChat: () => void
  setScope: (scope: 'all' | 'current') => void
  sendMessage: (text: string, currentPageId?: string | null) => Promise<void>
  clearMessages: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isOpen: false,
  mode: 'panel',
  scope: 'all',
  isGenerating: false,

  openChat: (mode = 'panel') => set({ isOpen: true, mode }),
  closeChat: () => set({ isOpen: false }),
  setScope: (scope) => set({ scope }),
  clearMessages: () => set({ messages: [] }),

  sendMessage: async (text: string, currentPageId: string | null = null) => {
    if (!text.trim() || get().isGenerating) return

    const userMsgId = 'user_' + Date.now()
    const assistantMsgId = 'asst_' + Date.now()

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text.trim(),
    }

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      streaming: true,
      sources: [],
    }

    set((state) => ({
      messages: [...state.messages, userMessage, initialAssistantMessage],
      isGenerating: true,
    }))

    // Determine scope
    const { scope } = get()
    const resolvedScope = scope === 'current' && currentPageId ? currentPageId : 'all'

    // Get auth token
    let token = ''
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('sb_token') || ''
    }

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          scope: resolvedScope,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to communicate with AI chat service')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.token) {
                  accumulatedText += data.token
                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulatedText, streaming: true }
                        : m
                    ),
                  }))
                }

                if (data.done) {
                  const mappedSources: ChatSource[] = (data.sources || []).map(
                    (s: any) => ({
                      id: s.pageId,
                      label: s.pageTitle,
                    })
                  )

                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: accumulatedText,
                            streaming: false,
                            sources: mappedSources,
                          }
                        : m
                    ),
                    isGenerating: false,
                  }))
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error: any) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  '⚠️ Could not connect to AI service. Please check your network or try again.',
                streaming: false,
              }
            : m
        ),
        isGenerating: false,
      }))
    }
  },
}))
