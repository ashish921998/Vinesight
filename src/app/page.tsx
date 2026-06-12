'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppDownloadBadge, type AppDownloadLink } from '@/components/AppDownloadBadge'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getLastRoute } from '@/lib/route-persistence'
import {
  BarChart3,
  CheckCircle,
  ClipboardList,
  Handshake,
  Languages,
  ShieldCheck,
  Sprout,
  XCircle
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
    description: (
      <>
        Works offline, in English, <span lang="hi">हिंदी</span>, and <span lang="mr">मराठी</span>.
      </>
    ),
    icon: Languages
  }
]

const workflowSteps = [
  {
    title: 'Onboard your network',
    description:
      'Add your growers under your organization with per-farmer licenses. We help with onboarding and field visits.'
  },
  {
    title: 'Growers log from the field',
    description:
      'Sprays, irrigation, labour, and lab samples recorded in seconds, offline if needed, in their own language.'
  },
  {
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
      className={`relative rounded-[2.25rem] border border-border bg-card p-2 shadow-[0_24px_60px_-24px_rgba(47,58,68,0.35)] ${className}`}
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

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useSupabaseAuth()

  useEffect(() => {
    if (!loading && user) {
      const lastRoute = getLastRoute()
      const targetRoute = lastRoute || '/dashboard'
      router.replace(targetRoute)
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="VineSight logo"
              width={32}
              height={40}
              className="h-10 w-8 object-contain"
              priority
            />
            <h1 className="text-primary text-lg font-bold tracking-tight">VineSight</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-muted"
              href="/login"
            >
              Log In
            </Link>
            <a
              className="bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all text-accent-foreground text-sm font-semibold px-4 py-2 rounded-lg shadow-sm"
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
            </a>
          </div>
        </div>
      </header>

      <main className="w-full overflow-hidden">
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-[1.1] tracking-tight mb-6">
                Every grape farm you source from, <span className="text-accent">in one place.</span>
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-9 max-w-[540px]">
                Built for grape exporters, wine producers, and cooperatives worldwide. Growers log
                sprays, irrigation, and lab results from the field; you see compliance and crop
                status across every farm.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <a
                  className="bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all text-accent-foreground text-base font-semibold px-6 py-3.5 rounded-lg shadow-md text-center inline-flex items-center justify-center gap-2"
                  href={DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a demo
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  className="text-accent hover:text-accent/80 transition-colors text-base font-semibold px-2 py-3.5 text-center"
                  href="#field-app"
                >
                  See the field app
                </a>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-start">
                <PhoneFrame
                  src="/screenshots/dashboard-nashik.png"
                  alt="VineSight farmer app dashboard for a vineyard with quick actions for logs, water calculations, lab tests, and weather"
                  priority
                  width={238}
                  className="hidden sm:block mt-10"
                />
                <PhoneFrame
                  src="/screenshots/lab-tests.png"
                  alt="VineSight lab tests screen showing soil and petiole analysis results with nutrient levels"
                  priority
                  width={238}
                  className="sm:-ml-14 z-10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary">
          <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {proofPoints.map((point) => {
              const Icon = point.icon
              return (
                <div key={point.title} className="flex items-start gap-4">
                  <div className="size-10 shrink-0 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">{point.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-20 md:py-24">
          <h3 className="text-3xl font-bold tracking-tight mb-12">How it works</h3>
          <div className="space-y-10">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[64px_1fr] sm:grid-cols-[96px_1fr] gap-4 sm:gap-8 items-start"
              >
                <div className="text-5xl sm:text-6xl font-extrabold text-accent/25 leading-none select-none">
                  {index + 1}
                </div>
                <div className="pt-1 sm:pt-2">
                  <h4 className="font-bold text-xl mb-2">{step.title}</h4>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-[560px]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-secondary border-y border-border">
          <div className="max-w-6xl mx-auto px-4 py-20 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-4">
                <h3 className="text-3xl font-bold tracking-tight mb-4">
                  One view of advisory, compliance, and crop status
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Your agronomists and your growers work in the same system, so the records build
                  themselves as the season runs.
                </p>
              </div>
              <div className="lg:col-span-8 divide-y divide-border">
                {visibilityGroups.map((group) => {
                  const Icon = group.icon
                  return (
                    <div
                      key={group.title}
                      className="py-7 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-3 sm:gap-8"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-accent shrink-0" />
                        <h4 className="font-bold text-base">{group.title}</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {group.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 items-start text-sm text-muted-foreground"
                          >
                            <CheckCircle className="text-accent h-4 w-4 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-20 md:py-24">
          <h3 className="text-3xl font-bold tracking-tight mb-10">
            From WhatsApp and Excel to one system
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-8 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="text-muted-foreground h-6 w-6" />
                <h4 className="font-bold text-lg text-muted-foreground">Today</h4>
              </div>
              <ul className="space-y-5">
                {comparison.old.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <XCircle className="text-muted-foreground/60 h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-accent/5 p-8 rounded-xl border border-accent/30">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-accent h-6 w-6" />
                <h4 className="font-bold text-lg text-accent">With VineSight</h4>
              </div>
              <ul className="space-y-5">
                {comparison.with.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <CheckCircle className="text-accent h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-base text-foreground leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-secondary border-y border-border" id="field-app">
          <div className="max-w-6xl mx-auto px-4 py-20 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <h3 className="text-3xl font-bold tracking-tight mb-4">
                  The app your growers actually use
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-[520px] mb-6">
                  Simple enough for daily field work: log a spray, mark attendance, or run an
                  irrigation calculation in seconds. Adoption is our problem, not yours.
                </p>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  {appDownloadLinks.map((link) => (
                    <AppDownloadBadge key={link.label} link={link} compact />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-6 flex justify-center lg:justify-end gap-6">
                <PhoneFrame
                  src="/screenshots/workers-wages.png"
                  alt="VineSight workers screen showing daily attendance and wage totals in rupees"
                  width={230}
                />
                <PhoneFrame
                  src="/screenshots/irrigation-calculator.png"
                  alt="VineSight MAD calculator computing maximum allowable deficit from root depth and water retention"
                  width={230}
                  className="hidden sm:block mt-10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-xl mx-auto px-4 py-20 md:py-24 text-center">
          <h3 className="text-3xl font-bold tracking-tight mb-4">
            See it on your own grower network
          </h3>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            A 30-minute walkthrough with your farms and workflows. Pilot deployments available for
            exporters, cooperatives, and wine producers worldwide.
          </p>
          <a
            className="bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all text-accent-foreground text-lg font-bold px-8 py-4 rounded-lg shadow-lg shadow-accent/25 w-full sm:w-auto inline-block"
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </a>
        </section>

        <footer className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-muted-foreground">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
              <p className="sm:mr-auto">© {new Date().getFullYear()} VineSight.</p>
              <Link className="hover:text-foreground transition-colors" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-foreground transition-colors" href="/terms">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
