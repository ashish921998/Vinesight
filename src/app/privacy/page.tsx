'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Database,
  Eye,
  FileText,
  Globe,
  Lock,
  Mail,
  Server,
  Shield,
  Smartphone,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { SEOSchema } from '@/components/SEOSchema'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-sky-50">
      <SEOSchema
        title="Privacy Policy - FarmAI"
        description="How FarmAI collects, uses, and protects your farming data. Transparent privacy practices built for growers and agronomy teams."
        type="guide"
        url="/privacy"
        guideCategory="Legal"
        image="/og-image.png"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">How FarmAI protects and handles your data</p>
            <p className="text-sm text-gray-500">Last updated: December 3, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Overview */}
        <div className="mb-12">
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Our promise to you</h2>
                  <p className="text-gray-700 mb-4">
                    Farm data is sensitive. We collect only what we need to run FarmAI, keep it
                    secured with industry standards, and give you clear controls over how it is
                    used. This policy applies to the FarmAI iOS app and web experience.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">Encryption everywhere</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">Least-privilege access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">No selling of data</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apple App Store Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-700" />
              Apple App Store data disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <p className="text-sm">
              To comply with App Store Review Guidelines, here is a summary of how FarmAI handles
              data on iOS:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span className="text-sm">
                  Data linked to you: contact info (name, email, phone), identifiers, usage data,
                  diagnostics, and user content (images, notes, farm records).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span className="text-sm">
                  We do not use data for tracking or third-party advertising. No data is sold.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span className="text-sm">
                  Account deletion is available in-app: Settings → Account → Delete account. You can
                  also email privacy@farmai.app.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span className="text-sm">
                  Data is encrypted in transit and at rest and only shared with processors listed
                  below to run the service.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-sky-700" />
                Information we collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Account and identity details
                </h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>
                      Name, email, phone number, and authentication identifiers to create and secure
                      your account
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>
                      Farm locations, crop focus, and language preferences to tailor recommendations
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Notification, consent, and communication preferences</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Farm and operational data
                </h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>
                      Irrigation plans, spray logs, crop stage records, and yield estimates
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Soil, weather, satellite, or sensor data connected to your farms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Files and photos you upload for AI analysis or record keeping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Expense entries, subscription status, and payment confirmations</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Device and usage data</h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Device type, browser, IP address, and security signals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Feature usage, performance events, and error reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                    <span>Session cookies or similar technologies for authentication</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-700" />
                How we use information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Deliver the product</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Generate recommendations, schedules, and alerts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Provide AI assistance for agronomy and operations questions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">Surface weather, soil, and imagery insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Process billing, receipts, and subscription changes
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Improve and support FarmAI
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Monitor performance, prevent abuse, and keep systems reliable
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Improve AI models using aggregated or de-identified data
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">Provide support when you request help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span className="text-sm">
                        Send important notices about security, policy, or service changes
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-emerald-700 mt-0.5" />
                <p className="text-sm text-emerald-900">
                  We do not train generative models on your identifiable farm data without your
                  explicit consent. When AI providers process prompts you submit, we minimize the
                  data shared to only what is needed to fulfil the request.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Permissions (iOS) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-purple-700" />
                Mobile app permissions (iOS)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                When you use the FarmAI iOS app, we may request certain device permissions so core
                features work as intended. You can change these anytime in your device settings.
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <Camera className="h-5 w-5 text-purple-700 mt-0.5" />
                  <span className="text-sm">
                    Camera and Photos: Capture or upload field images for AI analysis and records.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone className="h-5 w-5 text-purple-700 mt-0.5" />
                  <span className="text-sm">
                    Location (approximate/precise): Improve weather accuracy and map farm locations.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-purple-700 mt-0.5" />
                  <span className="text-sm">
                    Files and media: Let you attach PDFs or documents to farm records.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-purple-700 mt-0.5" />
                  <span className="text-sm">
                    Push notifications: Send alerts, weather updates, and account notices. You can
                    opt out in iOS settings.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-6 w-6 text-sky-700" />
                Data protection and security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We secure FarmAI with layered controls across infrastructure, application, and
                processes:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Lock className="h-4 w-4 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Encryption end to end</h4>
                      <p className="text-sm text-gray-600">
                        TLS in transit and encryption at rest for all storage locations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Server className="h-4 w-4 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Secure infrastructure</h4>
                      <p className="text-sm text-gray-600">
                        Supabase with Row Level Security, signed URLs for files, and scoped keys
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Access control</h4>
                      <p className="text-sm text-gray-600">
                        Least-privilege roles, MFA for administrators, and audit trails for
                        sensitive actions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-4 w-4 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Operational safeguards</h4>
                      <p className="text-sm text-gray-600">
                        Backup rotation, monitoring, and incident response procedures
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing & Third Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-orange-600" />
                Sharing with third parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-700 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">We do not sell data</h3>
                    <p className="text-orange-800 text-sm">
                      FarmAI never sells or rents your personal or farm data. Sharing only happens
                      as described below.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">When sharing happens</h3>
                <p className="text-gray-700 mb-3">We may share limited data in these cases:</p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      Trusted processors (cloud hosting, analytics, and support) under contract
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      AI providers to fulfil prompts you initiate, using data minimization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      Optional integrations you enable (e.g., sensors, weather, accounting)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>Legal obligations, protection of rights, or investigating abuse</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Third-party services</h3>
                <p className="text-gray-700 mb-3">
                  These partners process data only to provide the app and comply with their own
                  privacy terms:
                </p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      Supabase for hosting, authentication, database, and file storage with RLS
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>AI providers (OpenAI, Google AI, Groq) for prompts you initiate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      Analytics and crash reporting tools (e.g., Sentry) to improve stability
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>Payment processors for subscriptions and invoices</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Your rights and choices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">You control your information across FarmAI:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Data access and control
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        Export your records or request a copy of your data
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        Correct or update inaccurate details in your profile
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        Delete specific records or close your account entirely
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        Opt out of optional analytics or research uses
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        Request deletion from iOS in Settings → Account → Delete account, or email
                        privacy@farmai.app
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Communication preferences
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Choose notification channels and frequency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Unsubscribe from marketing communications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Set language and region preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Adjust AI assistant context sharing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-6 w-6 text-blue-600" />
                Data retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We retain your information only as long as necessary. Deleting the app from your
                device does not delete your account data—please request deletion from settings or
                contact us.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Active accounts</h4>
                    <p className="text-sm text-gray-600">
                      Data is retained while your account is active and for a short period after
                      closure to honour regulatory and billing requirements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Backups</h4>
                    <p className="text-sm text-gray-600">
                      Encrypted backups are held for disaster recovery on a rolling schedule before
                      being purged.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Aggregated insights</h4>
                    <p className="text-sm text-gray-600">
                      De-identified or aggregated data may be kept longer for research and product
                      improvement.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-sky-700" />
                Regional considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">
                FarmAI primarily stores data in the region closest to your operations. If data is
                transferred across regions, we apply equivalent protections and contractual
                safeguards.
              </p>
              <p className="text-gray-700">
                If you are a minor under applicable law, please use FarmAI only with permission from
                a parent or guardian.
              </p>
              <p className="text-gray-700">
                We do not knowingly collect personal data from children under 16. If you believe a
                child has provided data, contact us and we will delete it.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-emerald-700" />
                Questions or requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We are committed to transparency. Reach out if you have privacy questions, need to
                exercise your rights, or want to report a concern.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Privacy & Support</p>
                  <p className="text-sm text-gray-600">privacy@farmai.app</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Security</p>
                  <p className="text-sm text-gray-600">security@farmai.app</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Updates to this policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We may update this policy as our product or regulations change. Significant updates
                will be communicated through the app or by email.
              </p>
              <ul className="space-y-2 text-gray-700 ml-4">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2"></span>
                  <span>
                    We will update the &quot;Last updated&quot; date at the top of this page.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2"></span>
                  <span>We will summarize material changes in your dashboard or by email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2"></span>
                  <span>You can contact us anytime for the current version or with questions.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            FarmAI is built for growers first. Protecting your data and trust is at the core of how
            we operate.
          </p>
        </div>
      </div>
    </div>
  )
}
