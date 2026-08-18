'use client'

import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { WebcamPixelGrid } from '@/components/ui/webcam-pixel-grid'
import { ButtonMovingBorder } from '@/components/ui/moving-border'

export function LandingHero() {
  return (
    <section className="relative min-h-[92vh] w-full bg-[#030303] overflow-hidden flex flex-col items-center justify-center pt-20 pb-16">
      {/* Interactive Pixel Grid Background */}
      <div className="absolute inset-0 z-0">
        <WebcamPixelGrid
          gridCols={56}
          gridRows={36}
          maxElevation={45}
          motionSensitivity={0.25}
          elevationSmoothing={0.15}
          colorMode="monochrome"
          backgroundColor="#030303"
          mirror={true}
          gapRatio={0.06}
          darken={0.65}
          borderColor="#ffffff"
          borderOpacity={0.05}
          className="w-full h-full"
        />
      </div>

      {/* Radial Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black pointer-events-none z-[1]" />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 text-center flex flex-col items-center">
        {/* Security & Architecture Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/security"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs sm:text-sm text-white/90 backdrop-blur-md shadow-xs hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>0ms Local-First &amp; Zero-Knowledge Confidentiality</span>
            <span className="text-white/40">Read Architecture →</span>
          </Link>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-8xl text-balance leading-none"
        >
          Think in nested pages.{' '}
          <span className="text-neutral-500 font-normal">
            Chat with your notes.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-base text-neutral-400 sm:text-xl leading-relaxed text-pretty"
        >
          A high-performance workspace powered by grounded vector AI and 0ms local-first architecture.
          Every thought you write is stored instantly on your device, vector-indexed, and ready to be recalled with verifiable source citations.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/login?mode=signup">
            <ButtonMovingBorder
              borderRadius="100px"
              className="h-12 px-8 text-base font-semibold text-white bg-neutral-950 gap-2 cursor-pointer shadow-lg hover:scale-105 transition-transform"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </ButtonMovingBorder>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400"
        >
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" /> 0ms Local-First Engine
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-amber-400" /> Zero-Knowledge AES-256
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-white" /> Gemini 3.5 RAG &amp; Citations
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-white" /> 1-Click Public Web Share
          </span>
        </motion.div>
      </div>
    </section>
  )
}
