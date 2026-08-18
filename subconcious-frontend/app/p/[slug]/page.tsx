'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { ReadOnlyEditor } from '@/components/app/read-only-editor'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface SharedPageData {
  _id: string
  title: string
  content: any
  tags: { name: string; status: string }[]
  isPublic: boolean
  shareSlug: string
  createdAt: string
  updatedAt: string
}

export default function PublicSharedPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [page, setPage] = useState<SharedPageData | null>(null)
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    fetch(`${API_BASE}/public/pages/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('This shared page does not exist or is no longer public.')
        }
        return res.json()
      })
      .then((data) => {
        setPage(data.page)
        setChildren(data.children || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <Logo className="mb-4" />
        <h1 className="text-xl font-semibold">Page not available</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || 'This page could not be found.'}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          Go to The Subconscious
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
        <Logo />
        <Link
          href="/login"
          className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          Try The Subconscious
        </Link>
      </header>

      <main className="flex-1">
        <article className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-16">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Shared page · Read-only
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl text-foreground">
            {page.title || 'Untitled'}
          </h1>

          {page.tags && page.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {page.tags.map((tag) => (
                <Badge key={tag.name} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-9">
            <ReadOnlyEditor content={page.content} />
          </div>

          {/* Subpages if included in share */}
          {children.length > 0 && (
            <div className="mt-16 border-t border-border pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sub-pages
              </h2>
              <div className="mt-4 flex flex-col gap-6">
                {children.map((child) => (
                  <div key={child._id} className="rounded-lg border border-border bg-card p-5">
                    <h3 className="text-lg font-semibold text-foreground">{child.title}</h3>
                    <div className="mt-3">
                      <ReadOnlyEditor content={child.content} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-center px-5 py-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Logo showWordmark={false} iconClassName="size-4" />
            Made with The Subconscious
          </Link>
        </div>
      </footer>
    </div>
  )
}
