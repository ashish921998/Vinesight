'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Brain, ClipboardList, Droplets, FlaskConical } from 'lucide-react'

export function QuickActions() {
  const router = useRouter()
  const params = useParams()
  const farmId = params.id as string

  const quickActions = [
    {
      title: 'Tasks board',
      description: 'Plan, assign, and close farm work faster.',
      icon: ClipboardList,
      onClick: () => router.push(`/farms/${farmId}/tasks`),
      iconClass: 'bg-primary/10 text-primary'
    },
    {
      title: 'AI intelligence',
      description: 'Review pest risk predictions and tailored insights.',
      icon: Brain,
      onClick: () => router.push(`/farms/${farmId}/ai-insights`),
      iconClass: 'bg-accent/20 text-accent-foreground'
    },
    {
      title: 'Lab Tests',
      description: 'Track soil and petiole test history with insights.',
      icon: FlaskConical,
      onClick: () => router.push(`/farms/${farmId}/lab-tests`),
      iconClass: 'bg-blue-500/10 text-blue-600'
    },
    {
      title: 'Soil profiling',
      description: 'Capture palm impressions and AI moisture per section.',
      icon: Droplets,
      onClick: () => router.push(`/farms/${farmId}/soil-profiling`),
      iconClass: 'bg-green-500/10 text-green-600'
    }
  ]

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep the farm log updated in a couple of taps.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="group flex h-full w-full items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
