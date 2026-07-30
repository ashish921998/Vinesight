'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppDownloadBadge, type AppDownloadLink } from '@/components/AppDownloadBadge'
import {
  Reveal,
  StaggerGroup,
  StaggerChild,
  ParallaxWrap,
  ScaleIn,
  WordReveal,
  MagneticButton
} from '@/components/landing/MittiReveal'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getLastRoute } from '@/lib/route-persistence'
import { resolveModuleHome } from '@/lib/auth/module-home'
import { ORG_HOME } from '@/lib/auth/homes'
import {
  ArrowUpRight,
  CheckCircle,
  ClipboardList,
  Languages,
  Loader2,
  ShieldCheck,
  Sprout,
  BarChart3,
  Handshake
} from 'lucide-react'

const DEMO_URL = 'https://calendar.app.google/vq1JzfjiT59v9dAS7'

const proofPoints = [
  {
    title: 'Running with Fratelli Fruits FPC',
    description: 'Active deployment across a grape-export farmer network.',
    icon: Handshake
  },
  {
    title: '80+ farms onboarded',
    description: 'Growers brought onto the platform in the last six months.',
    icon: Sprout
  },
  {
    title: 'Built for field adoption',
    description: 'Works offline, in English, हिंदी, and मराठी.',
    icon: Languages
  }
]

const workflowSteps = [
  {
    number: '01',
    title: 'Onboard your network',
    description:
      'Add your growers under your organization with per-farmer licenses. We help with onboarding and field visits.'
  },
  {
    number: '02',
    title: 'Growers log from the field',
    description:
      'Sprays, irrigation, labour, and lab samples recorded in seconds, offline if needed, in their own language.'
  },
  {
    number: '03',
    title: 'You see everything',
    description:
      'Advisory activity, spray records, lab results, and crop status across every farm you source from.'
  }
]

const visibilityGroups = [
  {
    title: 'Advisory coordination',
    icon: ClipboardList,
    items: [
      'Recommendations logged against the farm, not lost in chat',
      'Follow-through visible against actual field activity',
      'Soil and petiole issues triaged in a review queue'
    ]
  },
  {
    title: 'Compliance and traceability',
    icon: ShieldCheck,
    items: [
      'Spray records with product, dose, and date',
      'Audit-ready documentation for export buyers',
      'Labour and cost records per block'
    ]
  },
  {
    title: 'Network overview',
    icon: BarChart3,
    items: [
      'Farms, licenses, and activity in one dashboard',
      'Lab results and trends for every grower',
      'Farmer directory with farm-level access control'
    ]
  }
]

const comparison = {
  old: [
    'Advisory sent over WhatsApp, lost in chat history',
    'Spray and harvest records re-typed into Excel, weeks late',
    'No visibility into what actually happened on each farm'
  ],
  with: [
    'Advisory logged per farm, with follow-through visible',
    'Field records captured the same day, from the field',
    'Crop status and compliance across the whole network'
  ]
}

const appDownloadLinks: AppDownloadLink[] = [
  {
    label: 'Download for iOS',
    href: 'https://apps.apple.com/us/app/vinesight/id6756113329',
    badgeSrc: '/app-store-badge.svg'
  },
  {
    label: 'Download for Android',
    href: 'https://play.google.com/store/apps/details?id=com.vinesight.app',
    badgeSrc: '/google-play-badge.svg'
  }
]

const trustedBy = ['Fratelli Fruits', 'Sahyadri Farms', 'Mahagrapes', 'PPF', 'Shramik']

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useSupabaseAuth()

  useEffect(() => {
    if (!loading && user) {
      let isMounted = true
      const lastRoute = getLastRoute()
      const resolveTargetRoute = async () => {
        const moduleHome = await resolveModuleHome(user.id)
        if (!isMounted) return
        const targetRoute = moduleHome === ORG_HOME ? ORG_HOME : lastRoute || moduleHome
        router.replace(targetRoute)
      }
      void resolveTargetRoute()
      return () => {
        isMounted = false
      }
    }
  }, [loading, user, router])

  if (!loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center mitti-surface-cream">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mitti-surface-cream overflow-hidden">
      {/* ============ HEADER ============ */}
      <header className="fixed top-0 z-50 w-full">
        <div
          className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between"
          style={{
            backgroundColor: 'rgba(253, 252, 239, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="VineSight logo"
              width={32}
              height={40}
              className="h-8 w-7 object-contain"
              priority
            />
            <span className="font-display text-lg font-bold tracking-tight">VineSight</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="font-display text-sm font-medium px-4 py-2 rounded-full hover:bg-black/[0.04] transition-colors"
              href="/login"
            >
              Log In
            </Link>
            <MagneticButton
              className="mitti-btn-primary text-sm"
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
              <ArrowUpRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          {/* Eyebrow */}
          <Reveal delay={0.1}>
            <p className="mitti-eyebrow mb-6">Vine to container · Grape export compliance</p>
          </Reveal>

          {/* Hero heading — word-by-word reveal */}
          <h1 className="mitti-hero-text mb-8 max-w-5xl">
            <WordReveal text="Every grape farm" delay={0.3} />
            <br />
            <WordReveal text="you source from," delay={0.5} />{' '}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 600,
                color: 'var(--mitti-sage)'
              }}
            >
              <WordReveal text="in one place." delay={0.7} />
            </span>
          </h1>

          {/* Hero subtitle */}
          <Reveal delay={1.0}>
            <p
              className="text-lg md:text-xl leading-relaxed max-w-2xl mb-10"
              style={{ color: 'rgba(10, 10, 10, 0.6)' }}
            >
              Built for grape exporters, wine producers, and cooperatives worldwide. Growers log
              sprays, irrigation, and lab results from the field — you see compliance and crop
              status across every farm.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={1.1}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <MagneticButton
                className="mitti-btn-primary text-base"
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Start your compliance journey
                <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton className="mitti-btn-ghost text-base" href="#field-app">
                See the field app
              </MagneticButton>
            </div>
          </Reveal>

          {/* Hero phones */}
          <ScaleIn delay={1.2} className="mt-16 md:mt-20">
            <div className="flex items-start justify-center gap-4 md:gap-6">
              <div className="hidden sm:block mt-12 mitti-image-frame">
                <PhoneFrame
                  src="/screenshots/dashboard.png"
                  alt="VineSight farmer app dashboard"
                  width={238}
                />
              </div>
              <div className="mitti-image-frame relative z-10">
                <PhoneFrame
                  src="/screenshots/lab-tests.png"
                  alt="VineSight lab tests screen"
                  width={250}
                />
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* ============ TRUSTED BY — MARQUEE ============ */}
      <div className="mitti-divider" />
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="mitti-eyebrow text-center mb-8">Trusted by grape exporters worldwide</p>
          </Reveal>
          <div className="overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, var(--mitti-cream), transparent)' }}
            />
            <div
              className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, var(--mitti-cream), transparent)' }}
            />
            <div className="mitti-marquee">
              {[...trustedBy, ...trustedBy, ...trustedBy, ...trustedBy].map((name, i) => (
                <span
                  key={i}
                  className="font-display text-2xl font-semibold whitespace-nowrap px-10"
                  style={{ color: 'rgba(10, 10, 10, 0.3)' }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="mitti-divider" />

      {/* ============ PROOF STRIP — STATS ============ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-16">
            <p className="mitti-eyebrow mb-4">Why VineSight</p>
            <h2 className="mitti-heading max-w-3xl">
              From scattered WhatsApp logs to one source of truth
            </h2>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {proofPoints.map((point) => {
              const Icon = point.icon
              return (
                <StaggerChild key={point.title}>
                  <div className="mitti-card h-full">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: 'var(--mitti-lime)' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: 'var(--mitti-forest)' }} />
                    </div>
                    <h3 className="font-display font-bold text-base mb-2">{point.title}</h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgba(10, 10, 10, 0.55)' }}
                    >
                      {point.description}
                    </p>
                  </div>
                </StaggerChild>
              )
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* ============ HOW IT WORKS — DARK FOREST SECTION ============ */}
      <section className="mitti-surface-forest py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-16">
            <p className="mitti-eyebrow mb-4" style={{ color: 'var(--mitti-lime)' }}>
              How it works
            </p>
            <h2 className="mitti-heading">Three steps to full network visibility</h2>
          </Reveal>

          <div className="space-y-0">
            {workflowSteps.map((step, index) => (
              <Reveal
                key={step.number}
                delay={index * 0.1}
                className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] gap-6 md:gap-12 items-start py-8"
              >
                <ParallaxWrap amount={15} className="">
                  <span
                    className="font-display font-bold select-none block"
                    style={{
                      fontSize: 'clamp(3rem, 6vw, 5rem)',
                      lineHeight: 1,
                      color: 'rgba(229, 255, 178, 0.25)'
                    }}
                  >
                    {step.number}
                  </span>
                </ParallaxWrap>
                <div className="pt-2 md:pt-4">
                  <h3 className="font-display font-semibold text-xl md:text-2xl mb-3">
                    {step.title}
                  </h3>
                  <p
                    className="text-base md:text-lg leading-relaxed max-w-xl"
                    style={{ color: 'rgba(253, 252, 239, 0.6)' }}
                  >
                    {step.description}
                  </p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div
                    className="col-span-2 h-px mt-4"
                    style={{ backgroundColor: 'rgba(253, 252, 239, 0.08)' }}
                  />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VISIBILITY — THREE PILLARS ============ */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-16 max-w-3xl">
            <p className="mitti-eyebrow mb-4">Visibility</p>
            <h2 className="mitti-heading mb-6">
              One view of advisory, compliance, and crop status
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(10, 10, 10, 0.55)' }}>
              Your agronomists and your growers work in the same system, so the records build
              themselves as the season runs.
            </p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibilityGroups.map((group) => {
              const Icon = group.icon
              return (
                <StaggerChild key={group.title}>
                  <div className="mitti-card h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="size-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(111, 143, 94, 0.12)' }}
                      >
                        <Icon className="h-5 w-5" style={{ color: 'var(--mitti-sage)' }} />
                      </div>
                      <h3 className="font-display font-bold text-sm">{group.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 items-start text-sm"
                          style={{ color: 'rgba(10, 10, 10, 0.65)' }}
                        >
                          <CheckCircle
                            className="h-4 w-4 shrink-0 mt-0.5"
                            style={{ color: 'var(--mitti-sage)' }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerChild>
              )
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* ============ COMPARISON — LIME ACCENT SECTION ============ */}
      <section className="mitti-surface-lime py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12">
            <p className="mitti-eyebrow mb-4" style={{ color: 'var(--mitti-forest)' }}>
              The difference
            </p>
            <h2 className="mitti-heading" style={{ color: 'var(--mitti-forest)' }}>
              From WhatsApp and Excel to one system
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old way */}
            <Reveal className="rounded-2xl p-8">
              <div
                className="rounded-2xl p-8 border"
                style={{
                  backgroundColor: 'rgba(10, 10, 10, 0.03)',
                  borderColor: 'rgba(10, 10, 10, 0.08)'
                }}
              >
                <h3
                  className="font-display font-bold text-lg mb-6"
                  style={{ color: 'rgba(10, 10, 10, 0.5)' }}
                >
                  Today
                </h3>
                <ul className="space-y-4">
                  {comparison.old.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 items-start"
                      style={{ color: 'rgba(10, 10, 10, 0.5)' }}
                    >
                      <span
                        className="text-xl leading-none mt-0.5"
                        style={{ color: 'rgba(10, 10, 10, 0.3)' }}
                      >
                        ✕
                      </span>
                      <span className="text-base leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* With VineSight */}
            <Reveal delay={0.08} className="rounded-2xl p-8">
              <div
                className="rounded-2xl p-8 border"
                style={{
                  backgroundColor: 'var(--mitti-cream)',
                  borderColor: 'rgba(10, 10, 10, 0.12)'
                }}
              >
                <h3
                  className="font-display font-bold text-lg mb-6"
                  style={{ color: 'var(--mitti-forest)' }}
                >
                  With VineSight
                </h3>
                <ul className="space-y-4">
                  {comparison.with.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 items-start"
                      style={{ color: 'var(--mitti-ink)' }}
                    >
                      <CheckCircle
                        className="h-5 w-5 shrink-0 mt-0.5"
                        style={{ color: 'var(--mitti-sage)' }}
                      />
                      <span className="text-base leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FIELD APP ============ */}
      <section id="field-app" className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Phones left */}
            <ParallaxWrap amount={20}>
              <div className="flex justify-center lg:justify-start gap-4 md:gap-6">
                <ScaleIn className="hidden sm:block mt-12 mitti-image-frame">
                  <PhoneFrame
                    src="/screenshots/workers-wages.png"
                    alt="VineSight workers screen"
                    width={220}
                  />
                </ScaleIn>
                <ScaleIn delay={0.15} className="mitti-image-frame">
                  <PhoneFrame
                    src="/screenshots/irrigation-calculator.png"
                    alt="VineSight irrigation calculator"
                    width={220}
                  />
                </ScaleIn>
              </div>
            </ParallaxWrap>

            {/* Copy right */}
            <div>
              <Reveal>
                <p className="mitti-eyebrow mb-4">Field app</p>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="mitti-heading mb-6">The app your growers actually use</h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p
                  className="text-lg leading-relaxed mb-8 max-w-lg"
                  style={{ color: 'rgba(10, 10, 10, 0.55)' }}
                >
                  Simple enough for daily field work: log a spray, mark attendance, or run an
                  irrigation calculation in seconds. Adoption is our problem, not yours.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  {appDownloadLinks.map((link) => (
                    <AppDownloadBadge key={link.label} link={link} compact />
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA — DARK FOREST ============ */}
      <section className="mitti-surface-forest py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <p className="mitti-eyebrow mb-6" style={{ color: 'var(--mitti-lime)' }}>
              Get started
            </p>
            <h2 className="mitti-heading mb-6">See it on your own grower network</h2>
            <p
              className="text-lg mb-10 leading-relaxed"
              style={{ color: 'rgba(253, 252, 239, 0.6)' }}
            >
              A 30-minute walkthrough with your farms and workflows. Pilot deployments available for
              exporters, cooperatives, and wine producers worldwide.
            </p>
            <MagneticButton
              className="mitti-btn-primary text-lg"
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
              <ArrowUpRight className="h-5 w-5" />
            </MagneticButton>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        style={{
          backgroundColor: 'var(--mitti-forest-deep, #0A1510)',
          color: 'rgba(253, 252, 239, 0.5)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-mark.png"
                alt="VineSight logo"
                width={28}
                height={35}
                className="h-7 w-6 object-contain opacity-60"
              />
              <span
                className="font-display font-bold text-sm"
                style={{ color: 'rgba(253, 252, 239, 0.8)' }}
              >
                VineSight
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                className="text-xs hover:text-white transition-colors"
                style={{ color: 'rgba(253, 252, 239, 0.5)' }}
                href="/privacy"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-xs hover:text-white transition-colors"
                style={{ color: 'rgba(253, 252, 239, 0.5)' }}
                href="/terms"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div
            className="mt-8 pt-8 text-xs text-center"
            style={{
              borderTop: '1px solid rgba(253, 252, 239, 0.06)',
              color: 'rgba(253, 252, 239, 0.3)'
            }}
          >
            © {new Date().getFullYear()} VineSight LLP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---- PhoneFrame helper (kept from original) ---- */
function PhoneFrame({
  src,
  alt,
  priority = false,
  width = 290,
  className = ''
}: {
  src: string
  alt: string
  priority?: boolean
  width?: number
  className?: string
}) {
  return (
    <div
      className={`relative rounded-[2.25rem] bg-white p-2 shadow-[0_24px_60px_-24px_rgba(10,10,10,0.25)] ${className}`}
      style={{ width }}
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={1298}
        priority={priority}
        className="h-auto w-full rounded-[1.75rem] select-none"
        sizes={`${width}px`}
      />
    </div>
  )
}
