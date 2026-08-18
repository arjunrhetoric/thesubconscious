import Link from 'next/link'
import { Logo } from '@/components/logo'

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-12 bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} The Subconscious Inc. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/login?mode=signup" className="hover:text-foreground transition-colors">
            Create Account
          </Link>
          <Link href="/security" className="hover:text-foreground transition-colors font-semibold text-emerald-400">
            Security &amp; Privacy
          </Link>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            Architecture
          </a>
        </div>
      </div>
    </footer>
  )
}
