'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  Layers,
  Mail,
  Scale,
  Shield,
  Users
} from 'lucide-react'
import { SEOSchema } from '@/components/SEOSchema'
import { SUPPORT_EMAIL } from '@/lib/constants'

type Section = {
  title: string
  items: string[]
  icon?: React.ElementType
}

export default function TermsOfServicePage() {
  const lastUpdated = useMemo(() => 'May 20, 2026', [])

  const commitments: Section[] = [
    {
      title: 'When these terms apply',
      items: [
        'They govern all VineSight products and APIs.',
        'Using the service means you agree to these terms and the Privacy Policy.'
      ],
      icon: FileText
    },
    {
      title: 'Eligibility & accounts',
      items: [
        'You must be legally able to contract.',
        'If you use VineSight for an organization, you confirm you have authority to bind it.'
      ],
      icon: Users
    },
    {
      title: 'Fair use',
      items: [
        'No misuse, scraping, or interfering with infrastructure.',
        'Follow applicable laws and agricultural regulations.'
      ],
      icon: Shield
    }
  ]

  const service: Section[] = [
    {
      title: 'What we provide',
      items: [
        'Farm records, dashboards, collaboration, and storage for files you upload.',
        'Weather overlays, calculators, alerts, and reporting exports.',
        'AI-assisted insights built on your data and context.'
      ],
      icon: Layers
    },
    {
      title: 'AI & recommendations',
      items: [
        'Outputs depend on input quality; verify before field action.',
        'You are responsible for regulatory compliance of any decisions.',
        'We may use de-identified data to improve models and reliability.'
      ],
      icon: Globe
    }
  ]

  const payment: Section[] = [
    {
      title: 'Subscriptions & billing',
      items: [
        'Paid plans auto-renew unless cancelled before the next term.',
        'Fees are non-refundable except where required by law.',
        'Taxes may apply based on your billing location.'
      ],
      icon: CreditCard
    },
    {
      title: 'Changes to the service',
      items: [
        'We may update features or discontinue components with notice where reasonable.',
        'We may suspend accounts for non-payment, security risk, or abuse.'
      ],
      icon: AlertTriangle
    }
  ]

  const liability: Section[] = [
    {
      title: 'Liability',
      items: [
        'To the extent permitted by law, VineSight is provided “as is”.',
        'We are not liable for indirect, incidental, or consequential losses.',
        'Our total liability is limited to the amount you paid in the last 6 months.'
      ],
      icon: Scale
    },
    {
      title: 'Termination',
      items: [
        'You may stop using VineSight at any time; delete your account in-app or by contacting us.',
        'We may terminate or suspend access for breach of these terms or to protect the service.'
      ],
      icon: Shield
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOSchema
        title="Terms of Service - VineSight"
        description="The rules for using VineSight across web and mobile."
        type="article"
        url="/terms"
        guideCategory="Legal"
        image="/og-image.png"
      />

      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <section className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
            <Scale className="h-4 w-4 text-primary" />
            Clear rules for using VineSight
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Please read these terms carefully. Using VineSight means you agree to them and to our
            Privacy Policy.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commitments.map((section) => {
            const Icon = section.icon ?? FileText
            return (
              <Card key={section.title} className="border border-border bg-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {service.map((section) => {
            const Icon = section.icon ?? Layers
            return (
              <Card key={section.title} className="border border-border bg-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payment.map((section) => {
            const Icon = section.icon ?? CreditCard
            return (
              <Card key={section.title} className="border border-border bg-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liability.map((section) => {
            const Icon = section.icon ?? Scale
            return (
              <Card key={section.title} className="border border-border bg-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Compliance & data privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                We process data as described in our Privacy Policy. You remain the owner of your
                farm data.
              </p>
              <p>
                You must have rights to the content you upload and ensure it complies with laws
                where you operate.
              </p>
              <p>
                We may anonymize and aggregate data to improve reliability and product performance.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Prohibited uses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>No reverse engineering, scraping, or bypassing security controls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>No unlawful content or violating export controls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>No creating competing models with our outputs without consent.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Governing law & changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                These terms are governed by the laws of your primary billing country unless
                otherwise required.
              </p>
              <p>
                We may update terms; continued use after notice means acceptance. Material changes
                will be communicated.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Questions about these terms or requests related to your account:</p>
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 text-accent" />
                <a className="hover:text-primary" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
