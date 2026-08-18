'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem('sb-theme') as 'dark' | 'light') || 'dark'
    setTheme(stored)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('sb-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return { theme, toggle }
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
