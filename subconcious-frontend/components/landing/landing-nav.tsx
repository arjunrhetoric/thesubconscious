'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Menu, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth.store'

export function LandingNav() {
  const { token } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it Works
            </a>
            <Link href="/security" className="transition-colors hover:text-foreground flex items-center gap-1.5">
              <span>Security &amp; Privacy</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-400 font-semibold">Zero-Knowledge</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {token ? (
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/workspace" className="gap-2">
                Open Workspace
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="gap-1.5 text-xs sm:text-sm" asChild>
                <Link href="/login?mode=signup">
                  <span>Get Started</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl px-5 py-6 space-y-4 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              How it Works
            </a>
            <Link
              href="/security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Security &amp; Privacy Architecture</span>
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold">
                0ms Local-First
              </span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {token ? (
              <Button className="w-full justify-center gap-2" asChild>
                <Link href="/workspace" onClick={() => setMobileMenuOpen(false)}>
                  Open Workspace
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="w-full justify-center" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full justify-center gap-2" asChild>
                  <Link href="/login?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started Free
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
