import { create } from 'zustand'
import { apiRequest } from '../api'

export interface User {
  id: string
  email: string
  username: string
  authProvider: 'local' | 'google' | 'github'
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  setToken: (token: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  rehydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  setToken: async (token: string) => {
    localStorage.setItem('sb_token', token)
    set({ token, isLoading: true })
    try {
      const data = await apiRequest('/auth/me', { token })
      set({ user: data.user, isLoading: false, isInitialized: true })
    } catch (e) {
      localStorage.removeItem('sb_token')
      set({ user: null, token: null, isLoading: false, isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await apiRequest('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('sb_token', data.token)
      set({ user: data.user, token: data.token, isLoading: false, isInitialized: true })
    } catch (e: any) {
      set({ isLoading: false })
      throw e
    }
  },

  signup: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('sb_token', data.token)
      set({ user: data.user, token: data.token, isLoading: false, isInitialized: true })
    } catch (e: any) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('sb_token')
    set({ user: null, token: null, isInitialized: true })
  },

  rehydrate: async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('sb_token')
    if (!token) {
      set({ isInitialized: true })
      return
    }
    set({ token, isLoading: true })
    try {
      const data = await apiRequest('/auth/me', { token })
      set({ user: data.user, isLoading: false, isInitialized: true })
    } catch (e) {
      localStorage.removeItem('sb_token')
      set({ user: null, token: null, isLoading: false, isInitialized: true })
    }
  },
}))
