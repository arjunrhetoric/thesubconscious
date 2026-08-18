import { Suspense } from 'react'
import { AppWorkspace } from '@/components/app/app-workspace'

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <AppWorkspace />
    </Suspense>
  )
}
