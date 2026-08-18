'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cpu,
  Database,
  EyeOff,
  FileCheck,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Network,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export default function SecurityPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#050507] text-neutral-100 selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <Logo />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" className="gap-2" asChild>
              <Link href="/login?mode=signup">
                Get Started Free
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10 py-20 md:py-28">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-8 text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6"
            >
              <ShieldCheck className="size-3.5" />
              <span>Security &amp; Zero-Knowledge Confidentiality</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight sm:text-6xl text-balance leading-tight"
            >
              Your thoughts stay private. <br className="hidden sm:inline" />
              <span className="text-neutral-400 font-normal">
                Mathematically guaranteed.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 max-w-2xl text-base text-neutral-400 sm:text-lg leading-relaxed text-pretty"
            >
              The Subconscious is engineered with a <strong>Local-First Hybrid Architecture</strong> and <strong>Zero-Knowledge Client-Side Cryptography</strong>.
              Your private notes and images are stored directly on your computer, never accessible by platform administrators or third parties.
            </motion.p>
          </div>
        </section>

        {/* 4 Core Pillars of Security */}
        <section className="py-20 md:py-28 border-b border-white/10 bg-black/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                Privacy Architecture
              </h2>
              <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
                The Four Pillars of User Confidentiality
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pillar 1: Local-First IndexedDB */}
              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/10 mb-6">
                    <HardDrive className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    1. Local-First Device Storage (0ms Latency)
                  </h3>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                    Unlike traditional cloud note-taking apps that send every keystroke and diagram to remote servers, The Subconscious stores your active notes and images directly inside your browser&apos;s <strong>IndexedDB local disk</strong>.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400 shrink-0" />
                      <span><strong>0ms instant note switching</strong> without waiting for server round-trips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400 shrink-0" />
                      <span><strong>100% offline capability</strong> — write on airplanes or disconnected trains</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Local Blob Store</strong> — images never touch third-party cloud storage by default</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-mono text-neutral-400">
                  <span className="text-emerald-400 font-bold">● Local Engine:</span> IndexedDB v1 + Canvas WebP Compression
                </div>
              </div>

              {/* Pillar 2: Zero-Knowledge AES-256 Encryption */}
              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-amber-400 border border-white/10 mb-6">
                    <Lock className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    2. Military-Grade AES-256-GCM Encryption
                  </h3>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                    Powered by the browser-native <strong>Web Crypto API</strong>, your media files and keys are encrypted locally on your machine with 256-bit symmetric ciphers before any optional cloud synchronization occurs.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-amber-400 shrink-0" />
                      <span><strong>PBKDF2 Key Derivation</strong> with 600,000 hashing iterations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-amber-400 shrink-0" />
                      <span><strong>Admin Zero-Visibility:</strong> Database engineers see only scrambled ciphertext</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-amber-400 shrink-0" />
                      <span><strong>Exportable Key Backups</strong> — portable cross-device cryptographic keys</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-mono text-neutral-400">
                  <span className="text-amber-400 font-bold">● Cryptography:</span> AES-256-GCM + PBKDF2 (SHA-256)
                </div>
              </div>

              {/* Pillar 3: Multi-Tenant AI Vector Isolation */}
              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-purple-400 border border-white/10 mb-6">
                    <Cpu className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    3. Strict Multi-Tenant Qdrant AI Isolation
                  </h3>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                    When you use AI Chat (RAG) to search your notes, vector embeddings are queried in <strong>Qdrant Cloud</strong> with strict cryptographic user-level payload filtering.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-purple-400 shrink-0" />
                      <span><strong>Zero AI Training:</strong> Your notes are never used to train foundational LLMs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-purple-400 shrink-0" />
                      <span><strong>Cryptographic Payload Filter:</strong> <code className="text-purple-300">userId === req.userId</code> enforced at query time</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-purple-400 shrink-0" />
                      <span><strong>Cascade Vector Deletion:</strong> Deleting a note purges all vector chunks immediately</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-mono text-neutral-400">
                  <span className="text-purple-400 font-bold">● Vector Cloud:</span> 768-Dim Cosine Distance + Strict Tenant Isolation
                </div>
              </div>

              {/* Pillar 4: Sandboxed Public Sharing */}
              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-blue-400 border border-white/10 mb-6">
                    <Network className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    4. Decoupled 1-Click Public Sharing
                  </h3>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                    Sharing a page with a collaborator is completely opt-in. Only the specific page you publish is converted to read-only format; all other notes and your root knowledge graph remain strictly private.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-blue-400 shrink-0" />
                      <span><strong>Cryptographic Vanity Slugs:</strong> High-entropy 12-char nanoids</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-blue-400 shrink-0" />
                      <span><strong>HMAC-SHA1 Signed Uploads:</strong> Direct signed CDN streaming</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-blue-400 shrink-0" />
                      <span><strong>Instant Kill Switch:</strong> Toggle sharing off to immediately revoke web access</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-mono text-neutral-400">
                  <span className="text-blue-400 font-bold">● Public Access:</span> Read-Only Sandbox + Revocable Slug Tokens
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture Comparison Table */}
        <section className="py-20 md:py-28 border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                Direct Comparison
              </h2>
              <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
                How The Subconscious Compares
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950 scrollbar-thin">
              <table className="w-full min-w-[620px] text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-neutral-300 font-semibold">
                    <th className="py-4 px-6">Architectural Feature</th>
                    <th className="py-4 px-6 text-white font-bold bg-white/[0.06]">
                      The Subconscious (Local-First Hybrid)
                    </th>
                    <th className="py-4 px-6 text-neutral-400">Traditional Cloud Apps</th>
                    <th className="py-4 px-6 text-neutral-400">Offline-Only Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Default Note Latency</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">0ms (Instant IndexedDB)</td>
                    <td className="py-4 px-6 text-neutral-400">100–300ms (Network delay)</td>
                    <td className="py-4 px-6 text-neutral-300">0ms (Local file)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Private Image Storage</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">100% on User Disk ($0 Cloud)</td>
                    <td className="py-4 px-6 text-neutral-400">Centralized Cloud Bucket (Visible)</td>
                    <td className="py-4 px-6 text-neutral-300">User Hard Drive</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Admin Image Visibility</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">Zero (Mathematically impossible)</td>
                    <td className="py-4 px-6 text-red-400">Visible in Cloud Dashboard</td>
                    <td className="py-4 px-6 text-emerald-400">Zero</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">AI Semantic Search (RAG)</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">Gemini 3.5 + Isolated Vector Cloud</td>
                    <td className="py-4 px-6 text-neutral-300">Centralized Cloud AI</td>
                    <td className="py-4 px-6 text-neutral-400">Requires complex DIY plugins</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">1-Click Public Web Sharing</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">Instant Vanity Link + High-Speed CDN</td>
                    <td className="py-4 px-6 text-neutral-300">Supported</td>
                    <td className="py-4 px-6 text-red-400">Not supported / Expensive add-on</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Offline Mode</td>
                    <td className="py-4 px-6 font-bold text-emerald-400 bg-white/[0.02]">Full offline editing &amp; auto-sync</td>
                    <td className="py-4 px-6 text-red-400">Limited / Requires connection</td>
                    <td className="py-4 px-6 text-emerald-400">Full offline (No cloud sync)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Security FAQ */}
        <section className="py-20 md:py-28 bg-black/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                FAQ
              </h2>
              <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Frequently Asked Security Questions
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
                <h3 className="text-base font-bold text-white">
                  Can the platform engineers or database administrators read my private notes?
                </h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  <strong>No.</strong> Your private media files are stored strictly on your local computer in IndexedDB. When data is transmitted for AI vector retrieval, it is scoped to your cryptographic tenant token and encrypted in transit via TLS 1.3.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
                <h3 className="text-base font-bold text-white">
                  Is my data used to train Gemini or any third-party AI models?
                </h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  <strong>Never.</strong> We use enterprise API endpoints with zero-data-retention guarantees. Your queries and note chunks are processed strictly in-memory during inference to generate real-time answers and are discarded immediately afterward.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
                <h3 className="text-base font-bold text-white">
                  What happens when I delete a page?
                </h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Deletion is a <strong>complete cascade purge</strong>: all child pages, local IndexedDB images, MongoDB documents, and Qdrant 768-dimensional vector chunks are permanently and irreversibly destroyed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 border-t border-white/10 bg-gradient-to-b from-neutral-950 to-black text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-8 flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl">
              Experience private, zero-latency note taking.
            </h2>
            <p className="mt-4 max-w-xl text-base text-neutral-400">
              Start capturing your thoughts today with the peace of mind of zero-knowledge privacy and instant 0ms recall.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="gap-2 px-8 h-12 text-base font-semibold" asChild>
                <Link href="/login?mode=signup">
                  Create Your Free Account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/20 bg-white/5 hover:bg-white/10" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 bg-black text-xs text-neutral-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <span>© {new Date().getFullYear()} The Subconscious Inc. Zero-Knowledge Private Architecture.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/security" className="text-white font-medium">Security</Link>
            <Link href="/login" className="hover:text-white transition-colors">Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
