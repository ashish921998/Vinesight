'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { m, useReducedMotion } from 'framer-motion'
import { AppDownloadBadge, type AppDownloadLink } from '@/components/AppDownloadBadge'
import { Reveal } from '@/components/landing/Reveal'
import { Marquee } from '@/components/landing/Marquee'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getLastRoute } from '@/lib/route-persistence'
import { resolveModuleHome } from '@/lib/auth/module-home'
import { ORG_HOME } from '@/lib/auth/homes'
import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react'

const DEMO_URL = 'https://calendar.app.google/vq1JzfjiT59v9dAS7'

/**
 * Marketing palette, scoped to this page: the product skins in DESIGN.md
 * (slate + sage) stay untouched, while the homepage runs a cream/forest
 * editorial voice with a lime + orange accent pair.
 */
const INK = '#102117' // deep forest — headings and dark slabs
const PAPER = '#fdfaef' // cream page
const LIME = '#e5ffb2' // affirmative accent
const ORANGE = '#ff561c' // the single conversion colour
const SAGE = '#b1bd99'

const HAIRLINE = 'rgba(16,33,23,0.18)'
const HAIRLINE_INV = 'rgba(253,250,239,0.18)'

/** Wide grotesque display voice (Archivo on its width axis). */
const display =
  'font-[family-name:var(--font-archivo)] [font-stretch:125%] font-semibold tracking-[-0.02em]'
/** Mono eyebrow above every section, like a field label. */
const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.18em]'

const workflowSteps = [
  { title: 'Onboard your network', body: 'Your growers, under your organization.' },
  { title: 'Growers log from the field', body: 'Sprays, irrigation, labour, lab samples.' },
  { title: 'You see everything', body: 'Every farm you source from, one dashboard.' }
]

const comparison = {
  today: [
    'Advisory sent over WhatsApp, lost in chat history',
    'Records re-typed into Excel, weeks late',
    'No visibility into what happened on each farm'
  ],
  vinesight: [
    'Advisory logged per farm, follow-through visible',
    'Field records captured the same day',
    'Compliance across the whole network'
  ]
}

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Field app', href: '#field-app' },
  { label: 'Guide', href: '/grape-farming-guide' }
]

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

function DemoButton({
  className = '',
  label = 'Book a demo'
}: {
  className?: string
  label?: string
}) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${className}`}
      style={{ backgroundColor: ORANGE }}
      href={DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  )
}

function LandingBottom() {
  return (
    <>
      <section id="field-app" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 md:pb-28">
        <Reveal
          className="overflow-hidden rounded-[2rem] px-6 pt-12 sm:px-12 md:pt-16"
          style={{ backgroundColor: SAGE }}
        >
          <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="pb-12 md:pb-16 lg:col-span-5">
              <h2 className={`${display} mb-4 text-3xl leading-[1.05] md:text-[40px]`}>
                The app your growers actually use.
              </h2>
              <p className="mb-8 max-w-[420px] text-[17px] leading-relaxed opacity-80">
                Log a spray, mark attendance, run an irrigation calculation. Offline, in English,{' '}
                <span lang="hi">हिंदी</span>, and <span lang="mr">मराठी</span>.
              </p>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                {appDownloadLinks.map((link) => (
                  <AppDownloadBadge key={link.label} link={link} compact />
                ))}
              </div>
            </div>
            <div className="-mb-px flex justify-center gap-5 lg:col-span-7 lg:justify-end">
              {[
                {
                  src: '/screenshots/dashboard.png',
                  alt: 'VineSight farmer app dashboard with quick actions for logs, water calculations, lab tests, and weather',
                  className: 'w-[210px] sm:w-[236px]'
                },
                {
                  src: '/screenshots/lab-tests.png',
                  alt: 'VineSight lab tests screen showing soil and petiole analysis results with nutrient levels',
                  className: 'hidden w-[236px] sm:block'
                }
              ].map((screenshot) => (
                <div
                  key={screenshot.src}
                  className={`${screenshot.className} shrink-0 rounded-t-[2rem] border border-b-0 p-2 pb-0 shadow-[0_-10px_50px_-20px_rgba(16,33,23,0.5)]`}
                  style={{ backgroundColor: PAPER, borderColor: 'rgba(16,33,23,0.14)' }}
                >
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    width={600}
                    height={1298}
                    sizes="236px"
                    className="h-auto w-full select-none rounded-t-[1.6rem]"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section style={{ backgroundColor: INK, color: PAPER }}>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <Reveal className="max-w-4xl">
            <h2 className={`${display} text-4xl leading-[1.02] md:text-[68px]`}>
              See it on your own grower network.
            </h2>
            <div className="mt-8">
              <DemoButton />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function LandingFooter() {
  return (
    <footer style={{ backgroundColor: INK, color: PAPER }}>
      <div
        className="mx-auto max-w-7xl border-t px-4 py-12 sm:px-6"
        style={{ borderColor: HAIRLINE_INV }}
      >
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="VineSight logo"
              width={32}
              height={40}
              className="h-8 w-6 object-contain"
            />
            <span className={`${display} text-lg`}>VineSight</span>
          </div>
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-14 gap-y-3 text-[14px] sm:grid-cols-3"
          >
            <a className="opacity-70 hover:opacity-100" href="#how-it-works">
              How it works
            </a>
            <a className="opacity-70 hover:opacity-100" href="#field-app">
              Field app
            </a>
            <Link className="opacity-70 hover:opacity-100" href="/grape-farming-guide">
              Grape farming guide
            </Link>
            <Link className="opacity-70 hover:opacity-100" href="/precision-agriculture">
              Precision agriculture
            </Link>
            <Link className="opacity-70 hover:opacity-100" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="opacity-70 hover:opacity-100" href="/terms">
              Terms of Service
            </Link>
          </nav>
        </div>
        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.14em] opacity-50">
          © {new Date().getFullYear()} VineSight. All rights reserved.
        </p>
        <p className="mt-4 text-[11px] leading-relaxed opacity-40">
          Hero imagery: Sentinel-2 cloudless 2020 by{' '}
          <a
            className="underline underline-offset-2"
            href="https://s2maps.eu"
            target="_blank"
            rel="noopener noreferrer"
          >
            EOX IT Services GmbH
          </a>
          , containing modified Copernicus Sentinel data (2020), licensed{' '}
          <a
            className="underline underline-offset-2"
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useSupabaseAuth()
  const reduce = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)

  // The nav sits transparent over the satellite hero and gains its cream fill +
  // hairline only once the page has moved, so the image reads full-bleed at rest.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      let isMounted = true
      const lastRoute = getLastRoute()
      const resolveTargetRoute = async () => {
        const moduleHome = await resolveModuleHome(user.id)
        // resolveModuleHome is async; if the component unmounts while the
        // membership query is in flight (back button, fast nav), bail before
        // calling router.replace on an unmounted component. Mirrors the guard
        // in src/app/auth/callback/page.tsx.
        if (!isMounted) return
        const targetRoute = moduleHome === ORG_HOME ? ORG_HOME : lastRoute || moduleHome
        router.replace(targetRoute)
      }
      // Redirect stays client-side by design (localStorage last-route + middleware redirect-loop
      // avoidance - see the render-gate note below); the flash this rule warns about is already
      // prevented by that gate.
      // react-doctor-disable-next-line react-doctor/nextjs-no-client-side-redirect, nextjs-no-client-side-redirect -- justified above
      void resolveTargetRoute()
      return () => {
        isMounted = false
      }
    }
  }, [loading, user, router])

  // Authenticated visitors are being redirected to their module home by the effect
  // above. Don't paint the marketing page in that window, or it flashes before the
  // redirect lands. This stays client-side on purpose: the target comes from
  // localStorage (getLastRoute), and middleware deliberately leaves the homepage
  // redirect to the client to avoid dashboard redirect loops (see middleware.ts).
  if (!loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Hero entrance: one shared transition, staggered by index. Mount-time rather
  // than scroll-triggered, since the hero is already in view on load.
  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] as const }
        }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK }}>
      <Marquee>
        <>
          The VineSight grower app is live on iOS and Android.{' '}
          <a className="underline underline-offset-4" href="#field-app">
            Get it here
          </a>
        </>
      </Marquee>

      {/* NAV — transparent over the hero, fills in on scroll */}
      <header
        className="sticky top-0 z-50 w-full transition-[background-color,backdrop-filter,border-color] duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(253,250,239,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'rgba(16,33,23,0.1)' : 'transparent'}`
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="VineSight logo"
              width={32}
              height={40}
              className="h-8 w-6 object-contain"
              priority
            />
            <span className={`${display} text-lg`}>VineSight</span>
          </div>
          {/* Vertical rule between mark and links, as on the reference nav */}
          <span
            className="hidden h-7 w-px lg:block"
            style={{ backgroundColor: 'rgba(16,33,23,0.15)' }}
          />
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium opacity-70 transition-opacity hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 sm:gap-5">
            <Link
              href="/login"
              className="whitespace-nowrap text-[14px] font-medium opacity-70 hover:opacity-100"
            >
              Log In
            </Link>
            <DemoButton className="!whitespace-nowrap !px-4 !py-2.5 !text-[13px] sm:!px-5 sm:!text-[14px]" />
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* HERO — real Sentinel-2 imagery of the Nashik vineyard belt, washed
            pale so the forest-ink type holds contrast on top of it. */}
        <section className="relative -mt-[68px] overflow-hidden">
          <div className="absolute inset-0">
            <m.div
              className="absolute inset-0"
              initial={reduce ? false : { scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 18, ease: 'easeOut' }}
            >
              <Image
                src="/hero/nashik-sentinel2.webp"
                alt="Sentinel-2 satellite view of the vineyard belt around Nashik, Maharashtra, showing the field parcels VineSight tracks"
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{
                  // Lifts raw Sentinel-2 true colour to a pale, high-chroma
                  // backdrop. Framing favours the parcel-dense east side over the
                  // dry hills on the west edge of the tile.
                  filter: 'brightness(1.42) saturate(1.32) contrast(0.9)',
                  objectPosition: '72% 55%'
                }}
              />
            </m.div>
            {/* Two-layer cream wash: vertical fades the image out into the page
                colour, horizontal keeps a calm bed under the type on the left
                while the parcels stay crisp on the right. */}
            <div
              className="absolute inset-0"
              style={{
                background: [
                  `linear-gradient(to bottom, rgba(253,250,239,0.30) 0%, rgba(253,250,239,0.40) 50%, ${PAPER} 100%)`,
                  'linear-gradient(to right, rgba(253,250,239,0.72) 0%, rgba(253,250,239,0.30) 48%, rgba(253,250,239,0) 78%)'
                ].join(', ')
              }}
            />
            {/* On narrow screens the type spans the full width, so the horizontal
                bias above can't clear a bed for it. Add cream instead. */}
            <div
              className="absolute inset-0 md:hidden"
              style={{ backgroundColor: 'rgba(253,250,239,0.42)' }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-[136px] sm:px-6 md:pb-32 md:pt-[184px]">
            {/* 13.5vw / 186px ceiling keeps this 12-character word on one line at
                every width — Archivo at wdth 125 renders it ~6.55x the font-size. */}
            <m.h1 className={`${display} text-[min(13.5vw,186px)] leading-[0.85]`} {...rise(0)}>
              Traceability
            </m.h1>
            <m.p
              className={`${display} mt-3 text-2xl leading-tight md:text-4xl lg:text-[42px]`}
              {...rise(1)}
            >
              Every grape farm you source from, in one place.
            </m.p>
            <m.p
              className="mt-7 max-w-[520px] text-[17px] leading-relaxed opacity-80 lg:text-[19px]"
              {...rise(2)}
            >
              Growers log sprays, irrigation, and lab results from the field. You see compliance and
              crop status across every farm you buy from.
            </m.p>
            <m.div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" {...rise(3)}>
              <DemoButton />
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full border bg-[rgba(253,250,239,0.9)] px-7 py-3.5 text-[15px] font-semibold backdrop-blur-sm transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#fdfaef]"
                style={{ borderColor: HAIRLINE }}
                href="#field-app"
              >
                See the field app
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </m.div>
          </div>
        </section>

        {/* TRUSTED BY */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 md:pb-28">
          <Reveal className="flex flex-col items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              <span className={`${display} text-xl md:text-2xl`}>Fratelli Fruits FPC</span>
              <span className="hidden h-6 w-px sm:block" style={{ backgroundColor: HAIRLINE }} />
              <span className="font-mono text-sm opacity-70">80+ farms onboarded</span>
            </div>
          </Reveal>
        </section>

        {/* CONTRAST — the dark editorial slab */}
        <section style={{ backgroundColor: INK, color: PAPER }}>
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
            <Reveal className="mb-14 max-w-3xl">
              <h2 className={`${display} text-3xl leading-[1.05] md:text-5xl`}>
                From WhatsApp and Excel to one system of record.
              </h2>
            </Reveal>
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <Reveal>
                <p className={`${eyebrow} mb-6 opacity-50`}>Today</p>
                <ul className="space-y-5">
                  {comparison.today.map((item) => (
                    <li
                      key={item}
                      className="border-t pt-4 text-[17px] leading-snug opacity-50"
                      style={{ borderColor: HAIRLINE_INV }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.08}>
                <p className={`${eyebrow} mb-6`} style={{ color: LIME }}>
                  With VineSight
                </p>
                <ul className="space-y-5">
                  {comparison.vinesight.map((item) => (
                    <li
                      key={item}
                      className="border-t pt-4 text-[17px] leading-snug"
                      style={{ borderColor: LIME }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal className="mb-14 max-w-2xl">
            <h2 className={`${display} text-3xl leading-[1.05] md:text-5xl`}>Three steps.</h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {workflowSteps.map((step, index) => (
              <Reveal
                key={step.title}
                delay={index * 0.08}
                className="border-t pt-6"
                style={{ borderColor: HAIRLINE }}
              >
                <p className="mb-6 font-mono text-sm opacity-50">0{index + 1}</p>
                <h3 className={`${display} mb-2 text-xl`}>{step.title}</h3>
                <p className="text-[15px] leading-relaxed opacity-70">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <LandingBottom />
      </main>
      <LandingFooter />
    </div>
  )
}
