'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Copy,
  FolderTree,
  Globe2,
  HardDrive,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

export function LandingFeatures() {
  const [copied, setCopied] = useState(false)
  const [activeSlash, setActiveSlash] = useState('heading')

  const copyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section id="features" className="py-24 md:py-32 bg-black relative border-t border-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1 text-xs font-medium text-neutral-400">
            <Sparkles className="size-3 text-white" />
            Core Architecture
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
            Engineered for 0ms speed and absolute privacy
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-neutral-400">
            Every layer is optimized for instant flow — from local-first 0ms storage and client-side encryption to vector-grounded recall.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Card 1: 0ms Local-First Engine & Security (Span 3) - HERO CARD */}
          <div className="col-span-1 lg:col-span-3 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-950 to-black p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300 hover:border-neutral-700 hover:shadow-2xl">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-4">
                <Zap className="size-3.5" />
                <span>0ms Local-First Engine</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Instant Latency &amp; Zero-Knowledge Confidentiality
              </h3>
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                Your private notes and photos are stored directly on your device in browser <strong>IndexedDB</strong>. 
                Images never leave your machine unless you share them. No cloud lag, zero admin visibility, and 100% offline capability.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/security"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Read Security Architecture</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <span className="text-xs text-neutral-500">
                  AES-256-GCM + PBKDF2 Web Crypto Standard
                </span>
              </div>
            </div>

            {/* Visualizer Pill Box */}
            <div className="w-full md:w-auto shrink-0 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 font-mono text-xs text-neutral-300 space-y-3 min-w-[280px]">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-2">
                <span>LOCAL CACHE</span>
                <span className="text-emerald-400 font-bold">● 0ms READ</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="size-4 text-emerald-400" />
                <span>IndexedDB Object Store</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-amber-400" />
                <span>AES-256 Client Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <Zap className="size-4 text-white" />
                <span>Offline Auto-Sync Queue</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tree (Span 2) */}
          <div className="col-span-1 lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-2xl">
            <div className="max-w-lg">
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white mb-4 border border-neutral-800">
                <FolderTree className="size-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Infinite Nested Page Tree
              </h3>
              <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                Organize thoughts hierarchically with unlimited depth. Sub-pages inside sub-pages with automatic breadcrumb calculation and cascade deletion across MongoDB and Qdrant.
              </p>
            </div>

            {/* Tree Visualizer */}
            <div className="mt-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 font-mono text-xs text-neutral-300">
              <div className="flex items-center justify-between text-neutral-500 text-[11px] border-b border-neutral-800/80 pb-2 mb-3">
                <span>/workspace/tree</span>
                <span className="text-emerald-400">● 1 Query O(1) Recursive</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-white font-semibold border border-neutral-800">
                  <span>📁 Engineering Architecture</span>
                </div>
                <div className="pl-6 space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md px-3 py-1 text-neutral-400 hover:text-white">
                    <span>📄 Load Balancing Algorithms</span>
                  </div>
                  <div className="pl-6 flex items-center gap-2 rounded-md border border-neutral-700 bg-white/5 px-3 py-1.5 text-white font-medium">
                    <span>📄 Consistent Hashing Ring</span>
                    <span className="ml-auto text-[10px] rounded bg-white text-black px-1.5 py-0.2 font-sans font-bold">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI RAG (Span 1) */}
          <div className="col-span-1 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white mb-4 border border-neutral-800">
                <Bot className="size-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Gemini 3.5 RAG &amp; Citations
              </h3>
              <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                Claude-style undulating thinking wave and real-time SSE token streaming. Answers cite exact source notes.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Sparkles className="size-3 text-white" />
                  <span>Qdrant 768-Dim Search</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">score: 0.94</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                &quot;Consistent hashing prevents massive key movement during horizontal cluster scale.&quot;
              </p>
              <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-800 pt-2 text-[10px]">
                <span className="text-neutral-500 font-bold uppercase">Source:</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-white font-medium">
                  Consistent Hashing
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Tiptap Editor (Span 1) */}
          <div className="col-span-1 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white mb-4 border border-neutral-800">
                <Code2 className="size-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Tiptap Block Editor
              </h3>
              <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                Press &quot;/&quot; for slash commands, task lists, code blocks, and tables with 2-second debounced auto-save.
              </p>
            </div>

            {/* Slash Menu Selector */}
            <div className="mt-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-2.5">
                <span className="text-white font-bold">/</span>
                <span>Select block type:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['heading', 'todo', 'code', 'table', 'image'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveSlash(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                      activeSlash === t
                        ? 'bg-white text-black font-semibold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    /{t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Sharing & Uploads (Span 2) */}
          <div className="col-span-1 lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-2xl">
            <div className="max-w-lg">
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white mb-4 border border-neutral-800">
                <Globe2 className="size-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                1-Click Public Sharing &amp; CDN Publishing
              </h3>
              <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                Publish clean read-only pages with vanity URLs. Local images are automatically synced to high-speed CDN on publication while private notes remain on your device.
              </p>
            </div>

            {/* Share Link Simulator */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3.5">
              <div className="flex items-center gap-2 flex-1 min-w-0 font-mono text-xs text-neutral-300">
                <Globe2 className="size-4 text-neutral-500 shrink-0" />
                <span className="truncate">thesubconscious.app/p/8Naj_Hr3dwDX</span>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-semibold text-black transition-transform hover:scale-105 cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-black" /> : <Copy className="size-3.5 text-black" />}
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
