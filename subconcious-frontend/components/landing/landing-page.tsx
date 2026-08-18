'use client'

import { LandingNav } from './landing-nav'
import { LandingHero } from './landing-hero'
import { LandingScrollShowcase } from './landing-scroll-showcase'
import { LandingFeatures } from './landing-features'
import { LandingWorkflow } from './landing-workflow'
import { LandingCTA } from './landing-cta'
import { LandingFooter } from './landing-footer'

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-black text-white selection:bg-white selection:text-black">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingScrollShowcase />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
