'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function LandingCTA() {
  return (
    <section className="py-24 md:py-36 bg-black relative border-t border-neutral-900 overflow-hidden">
      {/* Subtle radial ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[300px] w-[500px] rounded-full bg-white/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-8 relative z-10 text-center">
        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-8 sm:p-16 backdrop-blur-sm shadow-2xl">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-neutral-800 text-white mb-6 border border-neutral-700 shadow-inner">
            <Sparkles className="size-5" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white text-balance">
            Start organizing with The Subconscious
          </h2>

          <p className="mt-4 max-w-xl mx-auto text-base text-neutral-400 leading-relaxed text-pretty">
            Structure your knowledge in nested trees, search across thoughts in milliseconds, and converse with your personal mind.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?mode=signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-neutral-200 hover:scale-105 shadow-xl cursor-pointer"
            >
              Create Free Account
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-8 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-neutral-800 hover:border-neutral-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
