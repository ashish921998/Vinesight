'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Sparkles, Sprout, ClipboardList, LineChart, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardOnboardingProps {
  onAddFarm: () => void
}

interface BenefitItem {
  icon: LucideIcon
  title: string
  description: string
}

export function DashboardOnboarding({ onAddFarm }: DashboardOnboardingProps) {
  const { t } = useTranslation()

  const benefits: BenefitItem[] = [
    {
      icon: Sparkles,
      title: t('dashboard.onboarding.benefits.recommendations.title'),
      description: t('dashboard.onboarding.benefits.recommendations.description')
    },
    {
      icon: ClipboardList,
      title: t('dashboard.onboarding.benefits.tracking.title'),
      description: t('dashboard.onboarding.benefits.tracking.description')
    },
    {
      icon: LineChart,
      title: t('dashboard.onboarding.benefits.planning.title'),
      description: t('dashboard.onboarding.benefits.planning.description')
    }
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-12">
      <Card className="w-full max-w-4xl border-none bg-white/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="px-8 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg">
            <Sprout className="h-8 w-8" />
          </div>
          <Badge className="mx-auto mt-6 border-emerald-200 bg-emerald-100/80 text-emerald-700">
            {t('dashboard.onboarding.badge')}
          </Badge>
          <CardTitle className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {t('dashboard.onboarding.title')}
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t('dashboard.onboarding.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10 px-8 pb-10">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t('dashboard.onboarding.benefitsTitle')}
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group rounded-2xl border border-emerald-100 bg-white/90 p-5 text-left shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                >
                  <benefit.icon className="mb-3 h-6 w-6 text-emerald-600 transition-colors group-hover:text-emerald-700" />
                  <h4 className="text-sm font-semibold text-foreground">{benefit.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
              onClick={onAddFarm}
            >
              <Sparkles className="h-5 w-5" />
              {t('dashboard.onboarding.ctaPrimary')}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Link href="/help?category=getting-started">
                {t('dashboard.onboarding.ctaSecondary')}
              </Link>
            </Button>
            <p className="max-w-md text-center text-sm text-muted-foreground">
              {t('dashboard.onboarding.helperText')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
