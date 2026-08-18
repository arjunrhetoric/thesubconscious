'use client'

import { Bot, FileText, Sparkles } from 'lucide-react'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'

export function LandingScrollShowcase() {
  return (
    <section className="bg-black py-0 md:py-10 relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-400">
              <Sparkles className="size-3 text-white" />
              Real-Time App Showcase
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight text-balance">
              Think in nested pages.{' '}
              <span className="text-neutral-500 font-normal">
                Everything in sync.
              </span>
            </h2>
          </div>
        }
      >
        {/* Full Workspace Interface inside 3D Container */}
        <div className="h-full w-full bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-8 text-left select-none overflow-hidden">
          {/* Top Titlebar */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-neutral-700" />
              <div className="size-3 rounded-full bg-neutral-700" />
              <div className="size-3 rounded-full bg-neutral-700" />
              <span className="ml-3 text-xs text-neutral-400 font-mono">
                thesubconscious.app/workspace/distributed-architecture
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Qdrant Cloud RAG Active</span>
            </div>
          </div>

          {/* Body Columns */}
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Sidebar Mockup */}
            <div className="col-span-4 hidden md:flex flex-col border-r border-neutral-800/80 pr-6">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-white text-black text-xs font-bold">
                  SB
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Production Brain</div>
                  <div className="text-[10px] text-neutral-500">arjun@company.io</div>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Pages &amp; Trees
              </p>
              <div className="space-y-1.5 text-xs text-neutral-400">
                <div className="flex items-center gap-2 rounded-lg bg-neutral-800/80 px-2.5 py-1.5 text-white font-medium">
                  <FileText className="size-3.5" />
                  Distributed Systems 101
                </div>
                <div className="pl-4 space-y-1">
                  <div className="flex items-center gap-1.5 rounded px-2 py-1 hover:text-white">
                    <span className="size-1 rounded-full bg-neutral-500" />
                    Load Balancing Algorithms
                  </div>
                  <div className="flex items-center gap-1.5 rounded px-2 py-1 text-white font-medium bg-neutral-900 border border-neutral-800">
                    <span className="size-1.5 rounded-full bg-white" />
                    Consistent Hashing &amp; Ring
                  </div>
                  <div className="flex items-center gap-1.5 rounded px-2 py-1 hover:text-white">
                    <span className="size-1 rounded-full bg-neutral-500" />
                    Redis Invalidation Patterns
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800/60 flex items-center gap-2 text-[11px] text-neutral-500">
                <Sparkles className="size-3.5 text-white" />
                <span>38 notes indexed in Qdrant</span>
              </div>
            </div>

            {/* Note Editor & RAG Chat Mockup */}
            <div className="col-span-12 md:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                    system-design
                  </span>
                  <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                    networking
                  </span>
                  <span className="rounded-md border border-neutral-700 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                    ✓ AI Suggested
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  Consistent Hashing &amp; Virtual Nodes
                </h1>

                <div className="space-y-3 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  <p>
                    Consistent hashing maps both servers and data keys to a 360° circular hash ring. When a node is added or removed, only <strong>k/N</strong> keys need remapping on average.
                  </p>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 font-mono text-xs text-neutral-300">
                    <code>hash(key) % 2^32 -&gt; assigned to next clockwise server node</code>
                  </div>
                </div>
              </div>

              {/* Floating Live AI RAG Chat Response */}
              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Bot className="size-4" />
                    <span>The Subconscious AI Assistant</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Gemini 3.5 Flash RAG</span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  &quot;According to your notes, virtual nodes distribute keys more uniformly across physical servers, preventing hotspotting when nodes have heterogeneous compute capacities.&quot;
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-neutral-800 pt-2.5">
                  <span className="text-[10px] uppercase text-neutral-400 font-bold">Source:</span>
                  <span className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-white">
                    Consistent Hashing &amp; Virtual Nodes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  )
}
