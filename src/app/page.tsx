'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { getLastRoute } from '@/lib/route-persistence'
import { Warehouse, ClipboardCheck, LineChart } from 'lucide-react'

const activityLog = [
  {
    date: 'Oct 24, 2023',
    block: 'B4-Merlot',
    detail: 'Post-harvest irrigation cycle (12hrs)',
    input: 'Water',
    cost: '$42.00'
  },
  {
    date: 'Oct 23, 2023',
    block: 'C2-Chard',
    detail: 'Equipment maintenance: Harvester 02',
    input: 'Grease/Labor',
    cost: '-'
  },
  {
    date: 'Oct 22, 2023',
    block: 'A1-Pinot',
    detail: 'Soil Amendment Application (Compost)',
    input: 'Org. Compost',
    cost: '$185.50',
    highlighted: true
  },
  {
    date: 'Oct 22, 2023',
    block: 'B5-Syrah',
    detail: 'Fungicide Spray - Late Season Prev.',
    input: 'Sulfur WG',
    cost: '$38.25'
  },
  {
    date: 'Oct 21, 2023',
    block: 'B4-Merlot',
    detail: 'Scouting Report: No mite pressure obs.',
    input: 'Labor',
    cost: '$15.00'
  }
]

const manageCategories = [
  {
    title: 'Field Operations',
    items: ['Weather & irrigation events', 'Block-by-block yield history', 'Daily scouting logs']
  },
  {
    title: 'Inputs & Assets',
    items: [
      'Chemical inventory & usage',
      'Equipment maintenance schedules',
      'Pesticide lot tracking'
    ]
  },
  {
    title: 'Costs & Accountability',
    items: ['Payroll & labor tracking', 'Cost analysis per acre', 'Regulatory reporting compliance']
  }
]

const comparison = {
  old: [
    { title: 'Late Nights', body: 'Re-typing field notes into Excel after dark.' },
    {
      title: 'Lost History',
      body: '“When did we last spray Block 4?” requires digging through paper files.'
    },
    { title: 'Communication Gaps', body: "Crew doesn't know the exact schedule until they arrive." }
  ],
  with: [
    { title: 'Fast Entry', body: 'Log irrigation in under 10 seconds from the field.' },
    {
      title: 'Instant Recall',
      body: 'Tap a block to see every spray, test, and harvest note instantly.'
    },
    {
      title: 'Clear Orders',
      body: 'Assign tasks digitally. Crew sees exactly what to do and where.'
    }
  ]
}

const coreModules = [
  {
    title: 'Block-wise Field Records',
    description: 'Record activities right from the tractor or field.',
    body: (
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[280px] h-full flex flex-col">
        <div className="p-6 bg-slate-50 flex-1 flex">
          <div className="bg-white border border-slate-200 p-3 rounded text-sm w-full flex flex-col">
            <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
              <span className="font-bold text-slate-800">Log Activity</span>
              <span className="text-xs text-slate-500">Draft</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500 uppercase">Block</div>
                <div className="font-medium text-slate-800">B4-Merlot</div>
              </div>
              <div className="bg-slate-50 p-2 border border-slate-200 rounded col-span-2">
                <div className="text-[10px] text-slate-500 uppercase">Operation</div>
                <div className="font-medium text-slate-800">Canopy Management</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500 uppercase">Labor Hrs</div>
                <div className="font-medium text-slate-800">4.5</div>
              </div>
              <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500 uppercase">Equipment</div>
                <div className="font-medium text-slate-800">None</div>
              </div>
            </div>
            <button className="w-full bg-[#4a5e4d] text-white text-xs font-bold py-2 rounded">
              Submit Record
            </button>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Soil & Petiole Test Tracking',
    description: 'Import lab PDFs or enter data manually to visualize trends.',
    body: (
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[280px] h-full flex flex-col">
        <div className="p-6 bg-slate-50 flex-1 flex">
          <div className="bg-white border border-slate-200 rounded overflow-hidden w-full">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Nutrient</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2 font-medium">Nitrogen (N)</td>
                  <td className="px-3 py-2">2.1%</td>
                  <td className="px-3 py-2 text-slate-500">2.0-2.4%</td>
                  <td className="px-3 py-2 text-right text-green-600">→</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Phosphorus</td>
                  <td className="px-3 py-2">0.18%</td>
                  <td className="px-3 py-2 text-slate-500">0.15-0.3%</td>
                  <td className="px-3 py-2 text-right text-green-600">↗</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Potassium</td>
                  <td className="px-3 py-2 text-red-600 font-bold">0.85%</td>
                  <td className="px-3 py-2 text-slate-500">1.0-1.5%</td>
                  <td className="px-3 py-2 text-right text-red-600">↘</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Magnesium</td>
                  <td className="px-3 py-2">0.45%</td>
                  <td className="px-3 py-2 text-slate-500">0.4-0.6%</td>
                  <td className="px-3 py-2 text-right text-green-600">↗</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Calcium</td>
                  <td className="px-3 py-2">1.25%</td>
                  <td className="px-3 py-2 text-slate-500">1.0-1.5%</td>
                  <td className="px-3 py-2 text-right text-green-600">→</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
]

const irrigationPlan = [
  {
    day: 'Monday',
    entries: [
      { title: 'Sector North', subtitle: '4 Hours • Drip', tone: 'blue' },
      { title: 'No other activity', subtitle: '', tone: 'muted' }
    ]
  },
  {
    day: 'Tuesday',
    entries: [
      { title: 'Fertigation: K+', subtitle: 'Sector South • 200L', tone: 'amber' },
      { title: 'Sector South', subtitle: '2 Hours • Post-Fert', tone: 'blue' }
    ]
  },
  {
    day: 'Wednesday',
    entries: [
      { title: 'Harvest Prep', subtitle: 'All Sectors • Equipment Check', tone: 'purple' },
      { title: 'No irrigation scheduled', subtitle: '', tone: 'muted' }
    ]
  }
]

const personas = [
  {
    title: 'Owners',
    subtitle: 'Know costs and yield per block.',
    body: 'Make investment decisions based on actual field data, not guesswork.',
    icon: Warehouse
  },
  {
    title: 'Managers',
    subtitle: 'Assign and verify daily work.',
    body: 'Eliminate morning confusion and track progress in real-time.',
    icon: ClipboardCheck
  },
  {
    title: 'Consultants',
    subtitle: 'Review client data remotely.',
    body: 'Access history and logs before you even arrive at the vineyard.',
    icon: LineChart
  }
]

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
    <div className="min-h-screen bg-[#f9f8f6] text-[#1a1f1b]">
      <header className="w-full border-b border-[#e2e0dd] bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-[#4a5e4d] text-white flex items-center justify-center text-xs font-bold">
              VS
            </div>
            <h1 className="text-xl font-bold tracking-tight">VineSight</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#1a1f1b] hover:text-[#4a5e4d] transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <button
              className="hidden sm:inline-flex bg-[#4a5e4d] hover:bg-[#3b4b3d] text-white text-sm font-semibold px-5 py-2.5 rounded shadow-sm transition-colors"
              onClick={() =>
                document.getElementById('after-hero')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              See how it fits your vineyard
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center">
        <section className="w-full max-w-[1024px] px-4 sm:px-6 py-16 md:py-20 flex flex-col items-center text-center">
          <h2 className="text-[36px] md:text-[42px] font-bold leading-[1.2] tracking-[-0.02em] mb-6 max-w-[800px]">
            All your vineyard records, schedules, and lab reports in one place.
          </h2>
          <p className="text-[#444f46] text-[18px] md:text-[19px] leading-[1.6] font-normal mb-8 max-w-[640px]">
            Track irrigation, sprays, lab tests, tasks, and expenses — without spreadsheets,
            notebooks, or WhatsApp chaos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
            <button
              className="bg-[#4a5e4d] hover:bg-[#3b4b3d] text-white text-base font-semibold px-8 py-3 rounded shadow-sm w-full sm:w-auto text-center"
              onClick={() =>
                document.getElementById('after-hero')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              See how it fits your vineyard
            </button>
          </div>

          <div className="w-full bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden text-left">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Recent Activity Log
                </span>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-[15%]">Date</th>
                    <th className="px-4 py-3 w-[15%]">Block ID</th>
                    <th className="px-4 py-3 w-[40%]">Activity Detail</th>
                    <th className="px-4 py-3 w-[15%]">Input Used</th>
                    <th className="px-4 py-3 w-[15%] text-right">Cost/Acre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {activityLog.map((row) => (
                    <tr
                      key={`${row.date}-${row.block}-${row.detail}`}
                      className={row.highlighted ? 'bg-slate-50/50' : ''}
                    >
                      <td className="px-4 py-2.5">{row.date}</td>
                      <td className="px-4 py-2.5 font-medium">{row.block}</td>
                      <td className="px-4 py-2.5">{row.detail}</td>
                      <td className="px-4 py-2.5 text-slate-500">{row.input}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>Displaying 5 of 1,248 records</span>
              <span>Last synced: 2 mins ago</span>
            </div>
          </div>
        </section>

        <section
          id="after-hero"
          className="w-full max-w-[1024px] px-4 sm:px-6 py-12 border-t border-slate-200"
        >
          <h3 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.01em] mb-10 text-center md:text-left">
            What this helps you manage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {manageCategories.map((cat) => (
              <div key={cat.title}>
                <h4 className="text-lg font-bold mb-4 border-b border-slate-200 pb-2">
                  {cat.title}
                </h4>
                <ul className="space-y-3">
                  {cat.items.map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="text-slate-400 text-lg mt-0.5" aria-hidden="true">
                        •
                      </span>
                      <p className="text-[16px] text-[#444f46]">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full bg-white py-16 border-y border-slate-200">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
            <h3 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.01em] mb-8">
              How it fits into daily work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-50 p-6 rounded border border-red-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-9 w-9 rounded bg-white border border-red-100 text-red-700 flex items-center justify-center font-semibold">
                    ←
                  </div>
                  <h4 className="font-bold text-lg text-red-900">The Old Way</h4>
                </div>
                <ul className="space-y-4">
                  {comparison.old.map((item) => (
                    <li key={item.title} className="text-[16px] text-slate-700 leading-normal">
                      <span className="font-semibold text-slate-900">{item.title}:</span>{' '}
                      {item.body}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#f9f8f6] p-6 rounded border border-[#4a5e4d]/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-9 w-9 rounded bg-[#4a5e4d] text-white flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <h4 className="font-bold text-lg text-[#4a5e4d]">With VineSight</h4>
                </div>
                <ul className="space-y-4">
                  {comparison.with.map((item) => (
                    <li key={item.title} className="text-[16px] text-slate-700 leading-normal">
                      <span className="font-semibold text-slate-900">{item.title}:</span>{' '}
                      {item.body}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[1024px] px-4 sm:px-6 py-16">
          <h3 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.01em] mb-8">
            Core Modules
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {coreModules.map((mod) => (
              <div key={mod.title} className="flex flex-col gap-3 min-h-[360px]">
                <h4 className="text-lg font-bold">{mod.title}</h4>
                <p className="text-[#444f46] text-[16px] leading-snug">{mod.description}</p>
                <div className="flex-1 flex">
                  <div className="w-full h-full">{mod.body}</div>
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-3 lg:col-span-2">
              <h4 className="text-lg font-bold">Irrigation & Fertigation Planning</h4>
              <p className="text-[#444f46] text-[16px] leading-snug">
                Plan water usage based on soil moisture data and weather forecasts.
              </p>
              <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 flex gap-4 overflow-x-auto">
                  {irrigationPlan.map((day) => (
                    <div
                      key={day.day}
                      className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded p-3"
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                        {day.day}
                      </div>
                      {day.entries.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded h-full flex items-center justify-center">
                          <div className="text-xs text-slate-400">Scheduled Maintenance</div>
                        </div>
                      ) : (
                        day.entries.map((entry) =>
                          entry.tone === 'muted' ? (
                            <div
                              key={entry.title}
                              className="p-2 rounded mb-2 border bg-slate-50 border-slate-100 text-xs text-slate-400 flex items-center"
                            >
                              {entry.title}
                            </div>
                          ) : (
                            <div
                              key={entry.title}
                              className={`p-2 rounded mb-2 border ${
                                entry.tone === 'amber'
                                  ? 'bg-amber-50 border-amber-100 text-amber-900'
                                  : entry.tone === 'purple'
                                    ? 'bg-purple-50 border-purple-100 text-purple-800'
                                    : 'bg-blue-50 border-blue-100 text-blue-800'
                              }`}
                            >
                              <div className="text-xs font-bold">{entry.title}</div>
                              {entry.subtitle && (
                                <div className="text-[10px] text-inherit opacity-80">
                                  {entry.subtitle}
                                </div>
                              )}
                            </div>
                          )
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-slate-100 py-16">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
            <h3 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.01em] mb-10 text-center">
              Built for the rigorous demands of viticulture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {personas.map((persona) => {
                const Icon = persona.icon
                return (
                  <div
                    key={persona.title}
                    className="bg-white p-6 rounded border border-slate-200 text-left shadow-sm"
                  >
                    <div className="h-10 w-10 rounded bg-slate-100 text-[#4a5e4d] flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900 mb-1">{persona.title}</h4>
                    <p className="text-sm text-slate-600 font-medium">{persona.subtitle}</p>
                    <p className="text-xs text-slate-500 mt-2">{persona.body}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 border-t border-slate-200 pt-10 text-slate-600 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">↓</span>
                <span>Export your data anytime (CSV/PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true">🔒</span>
                <span>Your data stays private</span>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true">🤝</span>
                <span>Built with agronomists</span>
              </div>
            </div>
          </div>
        </section>

        <section id="cta-section" className="w-full max-w-[600px] px-4 sm:px-6 py-20 text-center">
          <h3 className="text-[30px] font-bold tracking-tight mb-4">
            See how VineSight fits into your vineyard’s daily work.
          </h3>
          <button
            className="bg-[#4a5e4d] hover:bg-[#3b4b3d] text-white text-lg font-bold px-8 py-4 rounded shadow-sm w-full sm:w-auto"
            onClick={() => router.push('/login')}
          >
            Try it for your vineyard
          </button>
          <p className="text-[#444f46] text-sm mt-4">
            No credit card required · Setup takes less than 15 minutes
          </p>
          <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500">
            © {new Date().getFullYear()} VineSight. All rights reserved.
            <span className="mx-2">•</span>
            <Link className="underline hover:text-slate-800" href="/privacy">
              Privacy Policy
            </Link>
            <span className="mx-2">•</span>
            <Link className="underline hover:text-slate-800" href="/terms">
              Terms of Service
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
