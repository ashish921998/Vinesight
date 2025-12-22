'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Lock,
  Mail,
  Server,
  Shield,
  Smartphone,
  Upload,
  Users
} from 'lucide-react'
import { SEOSchema } from '@/components/SEOSchema'
import { SUPPORT_EMAIL } from '@/lib/constants'

type Section = {
  title: string
  items: string[]
}

const LAST_UPDATED = 'December 19, 2025'

const COLLECTION: Section[] = [
  {
    title: 'Account & identity',
    items: [
      'Name, email, phone number, and auth identifiers',
      'Language, notification, and consent preferences'
    ]
  },
  {
    title: 'Farm & operational data',
    items: [
      'Irrigation, spray, scouting, yield, and labour records',
      'Soil, weather, satellite, or sensor data tied to your farms',
      'Photos/files you upload for analysis or record keeping'
    ]
  },
  {
    title: 'Product analytics',
    items: [
      'Device + app metadata for performance and reliability',
      'Feature usage to improve workflows (no ads, no selling)',
      'Crash + diagnostics to keep sync reliable offline/online'
    ]
  }
]

const CONTROLS: Section[] = [
  {
    title: 'You control',
    items: [
      'Access, export, or delete your data by emailing support',
      'In-app account deletion in Settings → Account',
      'Consent and notification preferences anytime'
    ]
  },
  {
    title: 'We commit',
    items: [
      'Encryption in transit and at rest',
      'Least-privilege access for support staff',
      'No selling of personal data; no third-party ads'
    ]
  }
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOSchema
        title="Privacy Policy - VineSight"
        description="How VineSight collects, protects, and uses your data across web and mobile."
        type="guide"
        url="/privacy"
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
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <section className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            Data you own, protected by design
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            We collect only what we need to operate VineSight. Your operational data is encrypted,
            never sold, and always exportable.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-accent" />
                At a glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>We use encryption at rest and in transit and apply least-privilege access.</p>
              <p>No selling of personal data. No third-party advertising.</p>
              <p>Account deletion is available in-app or by contacting us.</p>
              <p>We retain data only as long as necessary to run the service.</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Apple App Store summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>
                    Data linked to you: contact info, identifiers, usage, diagnostics, user content.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>Not used for tracking or ads; not sold.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>
                    Delete your account in-app (Settings → Account) or email {SUPPORT_EMAIL}.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5" />
                  <span>
                    Encrypted in transit and at rest; shared only with processors required to run
                    VineSight.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLLECTION.map((section) => (
            <Card key={section.title} className="border border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-primary" />
                How we use and share data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We process data to deliver the product, support users, secure the platform, and
                improve reliability.
              </p>
              <p>
                Processors may include hosting, analytics, logging, payments, and email providers.
                They are bound by confidentiality and data processing terms.
              </p>
              <p>
                We may disclose data if required by law or to protect VineSight, users, or the
                public.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                Data retention & location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Data is stored in secure cloud regions with encryption at rest and in transit.</p>
              <p>
                We retain data only while your account is active or as required for legal/compliance
                purposes.
              </p>
              <p>Backups are purged on a rolling basis; exports are available on request.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CONTROLS.map((section) => (
            <Card key={section.title} className="border border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {section.title === 'You control' ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-accent" />
                  )}
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
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Third-party services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                We rely on cloud infrastructure, analytics, and support tools to operate VineSight.
              </p>
              <p>Vendors are vetted for security; data shared is limited to what is necessary.</p>
              <p>
                Current categories: hosting, analytics/telemetry, email/SMS, payments, support, and
                backup.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Children’s data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                VineSight is not directed to children under 16. We do not knowingly collect their
                data.
              </p>
              <p>If you believe a minor’s data is in our system, contact us to remove it.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Security practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Encryption at rest and in transit; audit logging for privileged access.</p>
              <p>Role-based access controls; periodic security reviews of critical systems.</p>
              <p>Responsible disclosure: email security reports to {SUPPORT_EMAIL}.</p>
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
              <p>Questions or requests (access, export, deletion):</p>
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
