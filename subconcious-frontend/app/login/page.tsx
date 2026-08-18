'use client'

import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GithubIcon, GoogleIcon } from '@/components/brand-icons'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spotlight } from '@/components/ui/spotlight'
import { useAuthStore } from '@/lib/stores/auth.store'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const { login, signup, isLoading } = useAuthStore()

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'signup' || urlMode === 'signin') {
      setMode(urlMode)
    }
  }, [searchParams])

  const isSignup = mode === 'signup'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    try {
      if (isSignup) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-background selection:bg-primary/20 selection:text-foreground overflow-hidden">
      {/* Aceternity Spotlight Background Beam */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 border-b border-border/40 backdrop-blur-md">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {/* Header text */}
          <div className="mb-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-muted-foreground mb-3 backdrop-blur-md shadow-xs"
            >
              <Sparkles className="size-3 text-foreground" />
              <span>Personal Knowledge Base</span>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
              {isSignup ? 'Create your Subconscious' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              {isSignup
                ? 'Capture thoughts in nested pages and chat with your notes.'
                : 'Sign in to access your nested notes and AI assistant.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-5 flex rounded-2xl border border-border bg-card/40 p-1 backdrop-blur-md shadow-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
              }}
              className={`relative flex-1 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                !isSignup
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
              className={`relative flex-1 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                isSignup
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-border bg-card/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl bg-background/90 transition-all focus-visible:ring-2 focus-visible:ring-foreground"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      isSignup ? 'new-password' : 'current-password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-11 pr-10 rounded-xl bg-background/90 transition-all focus-visible:ring-2 focus-visible:ring-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="mt-2 h-11 w-full rounded-xl font-semibold gap-2 shadow-lg cursor-pointer bg-primary text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      {isSignup ? 'Create Account' : 'Continue to Workspace'}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border/80" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                or continue with
              </span>
              <span className="h-px flex-1 bg-border/80" />
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={`${BACKEND_URL}/api/v1/auth/google`}
                className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/60 text-xs font-semibold text-foreground transition-all hover:bg-accent hover:border-neutral-500 hover:scale-[1.01]"
              >
                <GoogleIcon className="size-4" />
                Continue with Google
              </a>
              <a
                href={`${BACKEND_URL}/api/v1/auth/github`}
                className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/60 text-xs font-semibold text-foreground transition-all hover:bg-accent hover:border-neutral-500 hover:scale-[1.01]"
              >
                <GithubIcon className="size-4" />
                Continue with GitHub
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}
