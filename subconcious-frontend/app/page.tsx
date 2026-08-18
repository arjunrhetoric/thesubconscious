'use client'

import { Suspense, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { AppWorkspace } from '@/components/app/app-workspace'
import { LandingPage } from '@/components/landing/landing-page'

function RootContent() {
  const { token, isInitialized, rehydrate } = useAuthStore()

  useEffect(() => {
    rehydrate()
  }, [rehydrate])

  if (!isInitialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  // If user is authenticated, render the workspace; otherwise render the animated landing page
  if (token) {
    return <AppWorkspace />
  }

  return <LandingPage />
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <RootContent />
    </Suspense>
  )
}
