'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getLastRoute } from '@/lib/route-persistence'
import {
  BadgeDollarSign,
  CheckCircle,
  Download,
  Leaf,
  ShieldCheck,
  Signal,
  Sprout,
  Users,
  XCircle
} from 'lucide-react'

const manageCategories = [
  {
    title: 'Field Operations',
    icon: Sprout,
    items: [
      'Irrigation and spray events',
      'Labour hours logged by block and task',
      'Soil moisture data recorded alongside irrigation',
      'Daily scouting and field observations'
    ]
  },
  {
    title: 'Inputs & Assets',
    icon: Leaf,
    items: [
      'Chemical and fertilizer inventory tracking',
      'Input usage history by block',
      'Equipment and machinery maintenance records'
    ]
  },
  {
    title: 'Costs & Compliance',
    icon: BadgeDollarSign,
    items: [
      'Cost tracking per block and activity',
      'Labour cost accountability',
      'Regulatory reporting and audit-ready records'
    ]
  }
]

const comparison = {
  old: [
    'Late nights re-typing field notes into Excel',
    'Searching paper logs to find spray or irrigation dates',
    'Guessing labour hours, chemical usage, or inventory left'
  ],
  with: [
    'Log irrigation, sprays, and labour in under 10 seconds from the field',
    'Instantly view block history and past activities',
    'Know exactly what was applied, where, and when'
  ]
}

const modules = [
  {
    title: 'Field Records',
    description:
      'Log vineyard activities directly from the field or tractor. Works offline and syncs automatically.',
    preview: 'field'
  },
  {
    title: 'Lab Results',
    description:
      'Track soil and petiole test results over time. Maintain historical soil profiles for each block and spot trends early.',
    preview: 'lab'
  },
  {
    title: 'Planning',
    description:
      'Plan irrigation, sprays, and crew work. See what’s scheduled today and across the week.',
    preview: 'planning'
  }
]

const personas = [
  {
    title: 'Owners',
    description:
      'Get clear visibility into costs, records, and vineyard history. Make decisions based on actual data, not assumptions.',
    icon: Users
  },
  {
    title: 'Managers',
    description: 'Plan daily work, assign tasks, and track progress by block.',
    icon: ShieldCheck
  },
  {
    title: 'Consultants',
    description:
      'Review client data remotely and provide recommendations based on historical records.',
    icon: Leaf
  }
]

const trustBadges = [
  { label: 'Export your data anytime (CSV / PDF)', icon: Download },
  { label: 'Your data stays private and secure', icon: ShieldCheck },
  { label: 'Built with agronomists', icon: Users }
]

function ModulePreview({ type }: { type: 'field' | 'lab' | 'planning' }) {
  if (type === 'field') {
    return (
      <div className="w-[200px] bg-card rounded-xl border border-border p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
          <div className="text-[10px] font-bold text-muted-foreground uppercase">New Activity</div>
          <div className="size-1.5 rounded-full bg-primary" />
        </div>
        <div className="space-y-2">
          <div className="bg-muted p-2.5 rounded-lg border border-border">
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
              Block
            </div>
            <div className="text-xs font-bold text-foreground">B4-Merlot</div>
          </div>
          <div className="bg-muted p-2.5 rounded-lg border border-border">
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
              Task
            </div>
            <div className="text-xs font-bold text-foreground">Canopy Mgmt</div>
          </div>
          <div className="w-full bg-primary text-primary-foreground text-[10px] font-bold py-2 rounded-lg mt-1 text-center shadow-sm">
            Save Record
          </div>
        </div>
      </div>
    )
  }

  if (type === 'lab') {
    return (
      <div className="w-[220px] bg-card rounded-xl border border-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-muted px-3 py-2 border-b border-border flex justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Soil Analysis
          </span>
        </div>
        <table className="w-full text-[11px]">
          <tbody className="divide-y divide-border text-foreground">
            <tr>
              <td className="px-3 py-2">Nitrogen</td>
              <td className="px-3 py-2 text-right text-accent">→</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Potassium</td>
              <td className="px-3 py-2 text-right text-primary">↘</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Magnesium</td>
              <td className="px-3 py-2 text-right text-accent">→</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Calcium</td>
              <td className="px-3 py-2 text-right text-accent">↗</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="w-[200px] flex gap-2 overflow-hidden relative">
      <div className="flex-1 bg-card border border-border rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] min-w-[120px]">
        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Today</div>
        <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg mb-2">
          <div className="text-[10px] font-bold text-primary">Sector N</div>
          <div className="text-[9px] text-primary/80 mt-0.5">Irrigation</div>
        </div>
        <div className="bg-muted border border-border p-2 rounded-lg">
          <div className="text-[10px] font-bold text-muted-foreground">Crew A</div>
          <div className="text-[9px] text-muted-foreground/80 mt-0.5">Pruning</div>
        </div>
      </div>
      <div className="flex-1 bg-card border border-border rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] min-w-[120px] opacity-40">
        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Tomorrow</div>
        <div className="bg-accent/10 border border-accent/20 p-2 rounded-lg">
          <div className="text-[10px] font-bold text-accent">Fert: K+</div>
        </div>
      </div>
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
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="VineSight logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg shadow-sm"
              priority
            />
            <h1 className="text-primary text-lg font-bold tracking-tight">VineSight</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="hidden sm:block text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
              href="/login"
            >
              Log In
            </Link>
            <button
              className="bg-accent hover:bg-accent/90 active:scale-95 transition-all text-accent-foreground text-sm font-semibold px-4 py-2 rounded-lg shadow-sm"
              onClick={() =>
                document.getElementById('daily-work')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              See how it fits your vineyard
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center overflow-hidden w-full">
        <section className="w-full max-w-5xl px-4 py-24 md:py-32 flex flex-col items-center text-center">
          <h2 className="text-[36px] md:text-[52px] font-extrabold leading-[1.15] tracking-tight mb-6 max-w-[800px]">
            All your vineyard records, schedules, and lab reports{' '}
            <span className="text-accent">in one place.</span>
          </h2>
          <p className="text-muted-foreground text-[18px] md:text-[20px] leading-[1.6] font-normal mb-10 max-w-[640px]">
            Track sprays, irrigation, labour, and lab results — block by block. Designed for daily
            vineyard operations, not spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row w-full gap-3 max-w-[400px]">
            <button
              className="bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all text-accent-foreground text-[17px] font-semibold px-6 py-3.5 rounded-xl shadow-md w-full text-center flex items-center justify-center gap-2"
              onClick={() =>
                document.getElementById('daily-work')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              See how it fits your vineyard
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </section>

        <section className="w-full max-w-5xl px-4 py-20 border-t border-border">
          <div className="text-center mb-12">
            <h3 className="text-[28px] font-bold tracking-tight mb-3">
              What this helps you manage
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A single operational record for your vineyard — without fragmented notes, files, or
              guesswork.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {manageCategories.map((category) => {
              const Icon = category.icon
              return (
                <div
                  key={category.title}
                  className="bg-card p-8 rounded-xl border border-border shadow-[0_2px_8px_-2px_rgba(47,58,68,0.08)]"
                >
                  <div className="size-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold mb-4">{category.title}</h4>
                  <ul className="space-y-4">
                    {category.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 items-start text-sm text-muted-foreground"
                      >
                        <CheckCircle className="text-accent h-5 w-5 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="w-full bg-secondary py-24 border-y border-border" id="daily-work">
          <div className="max-w-5xl mx-auto px-4">
            <h3 className="text-[28px] font-bold tracking-tight mb-10 text-center md:text-left">
              How it fits daily work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card p-8 rounded-xl border-l-[6px] border-l-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <Signal className="text-muted-foreground h-7 w-7" />
                  <h4 className="font-bold text-lg text-muted-foreground">The Old Way</h4>
                </div>
                <ul className="space-y-6">
                  {comparison.old.map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <XCircle className="text-muted-foreground h-5 w-5 shrink-0 mt-0.5" />
                      <span className="text-[16px] text-muted-foreground leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card p-8 rounded-xl border-l-[6px] border-l-accent shadow-[0_2px_8px_-2px_rgba(47,58,68,0.08)] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="text-accent h-7 w-7" />
                  <h4 className="font-bold text-lg text-accent">With VineSight</h4>
                </div>
                <ul className="space-y-6">
                  {comparison.with.map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <CheckCircle className="text-accent h-5 w-5 shrink-0 mt-0.5" />
                      <span className="text-[16px] text-foreground leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center md:text-left">
              <p className="text-sm text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                <Signal className="h-4 w-4" />
                Works reliably from the field — even with poor connectivity.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-5xl px-4 py-24">
          <div className="text-center mb-16">
            <h3 className="text-[28px] font-bold tracking-tight mb-3">Core modules</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to replace notebooks and spreadsheets — without complexity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => (
              <div key={module.title} className="flex flex-col gap-5">
                <div className="bg-card rounded-xl p-6 flex justify-center items-center border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-[240px]">
                  <ModulePreview type={module.preview as 'field' | 'lab' | 'planning'} />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">{module.title}</h4>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full bg-secondary py-24 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-[28px] font-bold tracking-tight mb-3">Built for your team</h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                VineSight supports real vineyard workflows — without duplicating effort.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {personas.map((persona) => {
                const Icon = persona.icon
                return (
                  <div
                    key={persona.title}
                    className="bg-card p-6 rounded-xl border border-border h-full shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <h4 className="font-bold text-base">{persona.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona.description}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-border pt-10">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-5 w-5 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wide">{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="w-full max-w-[560px] px-4 py-24 text-center">
          <h3 className="text-[28px] font-bold tracking-tight mb-4">
            Start organizing your vineyard today
          </h3>
          <p className="text-muted-foreground text-[17px] mb-8 leading-relaxed">
            Setup takes less than 15 minutes. No credit card required.
          </p>
          <button
            className="bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all text-accent-foreground text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-accent/25 w-full sm:w-auto"
            onClick={() => router.push('/login')}
          >
            Try it for your vineyard
          </button>
          <div className="mt-16 pt-8 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <p className="sm:mr-auto">© {new Date().getFullYear()} VineSight.</p>
              <Link className="hover:text-foreground transition-colors" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-foreground transition-colors" href="/terms">
                Terms of Service
              </Link>
              <Link className="hover:text-foreground transition-colors" href="/contact">
                Contact
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
