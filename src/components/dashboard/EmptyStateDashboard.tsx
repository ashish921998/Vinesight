'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  MessageSquare,
  Play,
  Sprout,
  type LucideIcon
} from 'lucide-react'

interface EmptyStateDashboardProps {
  onCreateFarm?: () => void
  userName?: string
}

export function EmptyStateDashboard({ onCreateFarm, userName }: EmptyStateDashboardProps) {
  const router = useRouter()

  const handleCreateFarm = () => {
    if (onCreateFarm) {
      onCreateFarm()
    } else {
      router.push('/onboarding')
    }
  }

  const handleExploreDemoData = () => {
    alert('Demo data feature coming soon!')
  }

  const quickActions: Array<{
    key: string
    icon: LucideIcon
    label: string
    action: () => void
  }> = [
    {
      key: 'farm',
      icon: Sprout,
      label: 'Create your farm',
      action: handleCreateFarm
    },
    {
      key: 'demo',
      icon: Play,
      label: 'Preview demo experience',
      action: handleExploreDemoData
    },
    {
      key: 'assistant',
      icon: MessageSquare,
      label: 'Chat with the AI assistant',
      action: () => router.push('/ai-assistant')
    }
  ]

  const onboardingSteps = [
    {
      key: 'step-1',
      title: 'Add your farm profile',
      description: 'Set farm location, acreage, crop variety, and phenology stage.'
    },
    {
      key: 'step-2',
      title: 'Log your first activities',
      description: 'Capture irrigation, spray, harvest, and expense history.'
    },
    {
      key: 'step-3',
      title: 'Unlock AI insights',
      description: 'Review tailored recommendations and daily playbooks.'
    }
  ]

  const supportShortcuts: Array<{
    key: string
    icon: LucideIcon
    label: string
    action: () => void
  }> = [
    {
      key: 'tutorials',
      icon: BookOpen,
      label: 'See quick guides',
      action: () => router.push('/grape-farming-guide')
    },
    {
      key: 'support',
      icon: MessageSquare,
      label: 'Ask the AI assistant',
      action: () => router.push('/ai-assistant')
    }
  ]

  const heroTitle = userName
    ? `${userName}, let’s set up your vineyard.`
    : 'Let’s set up your vineyard.'
  const heroSubtitle =
    'Start by adding your farm profile, then log your first activities to unlock AI insights tailored to your context.'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6">
          <div className="flex h-16 items-center justify-between lg:h-20">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary shadow-sm">
                <Sprout className="h-5 w-5" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
                  VineSight
                </span>
                <span className="text-base font-semibold text-foreground">
                  {userName ? `Welcome, ${userName}!` : 'Your AI-powered vineyard companion'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-3 py-6 sm:px-4 md:px-6 md:py-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateFarm}
                className="text-primary hover:text-primary"
              >
                Begin setup
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {quickActions.map(({ key, icon: Icon, label, action }) => (
                <button
                  key={key}
                  type="button"
                  onClick={action}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Three simple steps</h2>
            </div>
            <ol className="mt-5 space-y-3">
              {onboardingSteps.map((step, index) => (
                <li
                  key={step.key}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold text-foreground shadow-sm">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Need guidance?</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            We keep things focused so you can move quickly. Use the resources below whenever you
            need extra help.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {supportShortcuts.map(({ key, icon: Icon, label, action }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={action}
                className="border-border text-foreground hover:border-primary/40 hover:bg-secondary"
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
