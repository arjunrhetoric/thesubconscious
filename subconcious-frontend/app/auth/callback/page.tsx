'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setToken = useAuthStore((state) => state.setToken)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setToken(token).then(() => {
        router.replace('/')
      })
    } else {
      router.replace('/login')
    }
  }, [searchParams, setToken, router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CallbackHandler />
    </Suspense>
  )
}
