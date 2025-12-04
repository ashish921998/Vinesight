'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  Mail,
  Phone,
  Scale,
  Shield,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { SEOSchema } from '@/components/SEOSchema'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-sky-50">
      <SEOSchema
        title="Terms of Service - FarmAI"
        description="Terms and conditions for using FarmAI. Understand your rights, responsibilities, and how we run the platform."
        type="guide"
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
                <Scale className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">The rules for using FarmAI</p>
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
                <FileText className="h-8 w-8 text-emerald-600 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Agreement overview</h2>
                  <p className="text-gray-700 mb-4">
                    These Terms govern your access to FarmAI. By creating an account or using the
                    platform you agree to follow them and our Privacy Policy.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">Fair use</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">Data protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-sm">Responsible AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Acceptance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Acceptance and eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                You must accept these Terms and be legally capable of entering into agreements in
                your region to use FarmAI. If you use FarmAI on behalf of an organization, you
                confirm you have authority to bind that organization.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">You agree to:</h3>
                <ul className="space-y-1 text-green-800 text-sm">
                  <li>• Provide accurate registration and billing information</li>
                  <li>• Be at least 18, or use with appropriate guardian consent</li>
                  <li>• Comply with applicable laws and agricultural regulations</li>
                  <li>• Not misuse FarmAI, its APIs, or underlying infrastructure</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-sky-700" />
                What FarmAI provides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                FarmAI delivers digital tools to manage farms, analyze data, and receive AI-powered
                assistance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform services</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Farm records, dashboards, and team collaboration
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Scientific calculators, weather overlays, and alerts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">Storage for files and imagery you upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">Billing, subscriptions, and user management</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">AI assistance</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Recommendations and summaries generated by AI models
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Optional analysis of imagery or documents you submit
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Access to third-party AI providers under their terms
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-700 mt-0.5" />
                      <span className="text-sm">
                        Controls to manage context shared with the assistant
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-600" />
                Your responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-gray-700">
                <p>To keep FarmAI secure and reliable for everyone, you agree to:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>Maintain the confidentiality of your login credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>
                      Not interfere with or reverse-engineer the platform or its safeguards
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>Ensure you have rights to the data and content you upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    <span>Use outputs responsibly and validate before operational decisions</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-sky-700" />
                Privacy and data use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>
                Our use of personal and farm data is described in the{' '}
                <Link href="/privacy" className="text-emerald-700 underline">
                  Privacy Policy
                </Link>
                . By using FarmAI you consent to that policy, including how we work with service and
                AI providers to deliver the product.
              </p>
              <p>
                You grant FarmAI a limited license to host, process, and analyze content you submit
                solely to provide the services. You retain ownership of your data.
              </p>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-purple-700" />
                Payments and subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing terms</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        Fees, plan limits, and renewal periods are shown at checkout
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        Taxes may be added based on your billing location
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        Unpaid or failed charges may pause or end access
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        App Store purchases are billed by Apple; manage or cancel via iOS Settings →
                        Apple ID → Subscriptions.
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Changes and cancellation
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        You may change plans or cancel in-app; changes apply to future periods
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        Refunds are governed by the plan-specific policy shown at purchase
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-700 mt-0.5" />
                      <span className="text-sm">
                        We may adjust pricing with prior notice for future renewals
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Store Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-emerald-700" />
                Apple App Store terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p className="text-sm">
                For the FarmAI iOS app, these additional terms apply to satisfy App Store Review
                Guidelines:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <span>
                    The agreement is between you and FarmAI; Apple is not responsible for the app.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <span>Support, maintenance, and privacy inquiries are handled by FarmAI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <span>
                    In-app purchases through Apple follow Apple Media Services terms; refunds are
                    managed by Apple where required.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <span>
                    You must comply with Apple&apos;s App Store and device terms when using the app.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <span>Apple is a third-party beneficiary of this agreement for the iOS app.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AI and Accuracy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                AI, accuracy, and risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                FarmAI provides recommendations and AI-generated outputs to support decisions, but
                final choices remain yours. Always validate outputs before operational use,
                especially where safety, compliance, or financial outcomes are involved.
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                  <span>AI outputs may be incorrect, incomplete, or outdated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                  <span>Environmental factors can change quickly; confirm with local experts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                  <span>FarmAI is not liable for losses resulting from reliance on outputs</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* IP and Ownership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-sky-700" />
                Intellectual property and licenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>
                FarmAI and its logos, software, and content are owned by us or our licensors. We
                grant you a limited, non-exclusive, non-transferable license to use the platform in
                line with these Terms.
              </p>
              <p>
                You retain ownership of the data and content you submit. You give FarmAI permission
                to host, process, and use that content solely to operate and improve the services.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-emerald-700" />
                Suspension and termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>
                You may stop using FarmAI at any time. We may suspend or terminate access if you
                breach these Terms, fail to pay fees, or misuse the platform.
              </p>
              <p>
                On termination we may delete or archive your account data per our retention policy.
                You remain responsible for charges incurred before termination.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-purple-700" />
                Governing law and changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>
                These Terms are governed by the laws of the jurisdiction where FarmAI is organized,
                without regard to conflict-of-law principles. Local mandatory consumer rights still
                apply.
              </p>
              <p>
                We may update these Terms to reflect product or legal changes. If updates are
                material, we will notify you through the app or email before they take effect. Your
                continued use after changes means you accept the revised Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-6 w-6 text-emerald-700" />
                Questions or concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms or need to report an issue, reach out to us.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">support@farmai.app</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Abuse/Security</p>
                  <p className="text-sm text-gray-600">security@farmai.app</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
