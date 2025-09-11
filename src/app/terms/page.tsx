"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Scale,
  Phone,
  Mail,
  Globe,
  Calendar,
  CreditCard
} from "lucide-react";
import { SEOSchema } from "@/components/SEOSchema";
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEOSchema 
        title="Terms of Service - VineSight Grape Farming Assistant"
        description="Terms and conditions for using VineSight's grape farming platform. Legal terms for Indian grape farmers and agricultural services."
        type="guide"
        image="https://farmai.vercel.app/og-image.png"
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Scale className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">
              Terms and conditions for using VineSight
            </p>
            <p className="text-sm text-gray-500">
              Last updated: January 15, 2024
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Overview */}
        <div className="mb-12">
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <FileText className="h-8 w-8 text-purple-600 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Agreement Overview</h2>
                  <p className="text-gray-700 mb-4">
                    These Terms of Service ("Terms") govern your access to and use of VineSight's agricultural 
                    platform and services. By using our platform, you agree to these terms and our Privacy Policy.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-sm">Fair Use Policy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-sm">Data Protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-sm">Community Standards</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                By accessing or using VineSight's services, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms. If you do not agree to these Terms, you may not use our services.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Eligibility Requirements</h3>
                <ul className="space-y-1 text-green-800 text-sm">
                  <li>• Must be at least 18 years old or have parental consent</li>
                  <li>• Must be engaged in or interested in agricultural activities</li>
                  <li>• Must provide accurate and complete registration information</li>
                  <li>• Must comply with all applicable local, state, and national laws</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-600" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VineSight provides a comprehensive digital platform for grape farming management, including:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Farm management and record keeping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Scientific calculators (ETc, MAD, nutrients)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Weather data and irrigation planning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Expense tracking and profitability analysis</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Services</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Disease and pest prediction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Personalized farming recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Market intelligence and pricing insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">AI assistant for farming queries</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-orange-600" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Security</h3>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Maintain the security and confidentiality of your account credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Notify us immediately of any unauthorized access to your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Keep your contact information current and accurate</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Accuracy</h3>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Provide accurate and complete information about your farm and operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Update information promptly when circumstances change</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Verify AI recommendations against local conditions and expertise</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceptable Use</h3>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Use services only for legitimate agricultural purposes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Respect intellectual property rights and community guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                      <span>Comply with all applicable laws and regulations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">The following activities are strictly prohibited:</p>
                <ul className="space-y-2 text-red-700 text-sm">
                  <li>• Sharing account credentials or allowing unauthorized access</li>
                  <li>• Attempting to reverse engineer, decompile, or extract our algorithms</li>
                  <li>• Using automated tools to access our services without permission</li>
                  <li>• Uploading malicious content or attempting to compromise system security</li>
                  <li>• Misrepresenting your identity or providing false information</li>
                  <li>• Using the platform for illegal activities or to harm others</li>
                  <li>• Attempting to circumvent usage limits or access restrictions</li>
                </ul>
              </div>

              <p className="text-gray-700">
                Violations of these prohibitions may result in immediate account suspension or termination, 
                and may be reported to relevant authorities if illegal activity is suspected.
              </p>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                Intellectual Property Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Rights</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">VineSight platform, software, and algorithms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">Trademarks, logos, and brand materials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">AI models and prediction systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">User interface and experience design</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Your farming data remains your property</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Photos and content you upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Right to export your data anytime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Limited license to use our platform</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Availability & Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-indigo-600" />
                Service Availability & Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Availability</h3>
                  <p className="text-gray-700 mb-2">
                    We strive to provide reliable service but cannot guarantee 100% uptime due to:
                  </p>
                  <ul className="space-y-1 text-gray-700 ml-4 text-sm">
                    <li>• Scheduled maintenance and updates</li>
                    <li>• Internet connectivity issues</li>
                    <li>• Third-party service dependencies (weather data, mapping services)</li>
                    <li>• Unexpected technical difficulties</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Modifications</h3>
                  <p className="text-gray-700">
                    We reserve the right to modify, update, or discontinue features with reasonable notice. 
                    Major changes affecting core functionality will be communicated at least 30 days in advance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-green-600" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Free Services</h3>
                  <p className="text-gray-700 mb-2">
                    Basic features are available at no cost, including:
                  </p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Farm registration and basic record keeping</li>
                    <li>• Weather data and ETc calculations</li>
                    <li>• Limited AI assistant interactions</li>
                    <li>• Basic analytics and reporting</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Premium Features</h3>
                  <p className="text-gray-700 mb-2">
                    Advanced features may require subscription:
                  </p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Advanced AI predictions and recommendations</li>
                    <li>• Unlimited data storage and history</li>
                    <li>• Priority customer support</li>
                    <li>• Integration with IoT devices</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Payment Policy</h4>
                <ul className="space-y-1 text-green-800 text-sm">
                  <li>• All prices are in Indian Rupees (INR) unless otherwise specified</li>
                  <li>• Subscriptions are billed monthly or annually as selected</li>
                  <li>• Refunds available within 7 days of purchase for annual plans</li>
                  <li>• You can cancel your subscription at any time</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                Important Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Agricultural Guidance</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  VineSight provides information and recommendations based on data analysis and agricultural science. 
                  However, farming decisions should always consider:
                </p>
                <ul className="space-y-1 text-yellow-800 text-sm">
                  <li>• Local conditions and micro-climate variations</li>
                  <li>• Expert advice from agricultural extension officers</li>
                  <li>• Regulatory requirements and safety guidelines</li>
                  <li>• Your own experience and observation</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Limitation of Liability</h3>
                <p className="text-red-800 text-sm">
                  VineSight provides services "as is" and cannot be held liable for crop losses, equipment damage, 
                  or other agricultural outcomes resulting from use of our platform. Users are responsible for 
                  validating all recommendations against local conditions and expert advice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">By You</h3>
                  <p className="text-gray-700 mb-2">You may terminate your account at any time by:</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Using account deletion option in settings</li>
                    <li>• Contacting our support team</li>
                    <li>• Your data will be deleted within 30 days</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">By Us</h3>
                  <p className="text-gray-700 mb-2">We may suspend/terminate accounts for:</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Violation of these terms</li>
                    <li>• Illegal or harmful activities</li>
                    <li>• Extended inactivity (with notice)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-purple-600" />
                Governing Law & Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of India. Any disputes will be resolved through:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">1. Direct Communication</h4>
                    <p className="text-sm text-gray-600">
                      We encourage resolving disputes through direct communication with our support team
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Scale className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">2. Arbitration</h4>
                    <p className="text-sm text-gray-600">
                      Unresolved disputes may be subject to binding arbitration under Indian Arbitration law
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">3. Jurisdiction</h4>
                    <p className="text-sm text-gray-600">
                      Courts in Maharashtra, India have exclusive jurisdiction for any legal proceedings
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-6 w-6 text-purple-600" />
                Questions About These Terms?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">legal@vinesight.in</p>
                </div>
                <div className="text-center">
                  <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">+91-XXX-XXX-XXXX</p>
                </div>
                <div className="text-center">
                  <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Website</p>
                  <p className="text-sm text-gray-600">www.vinesight.in</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            By using VineSight, you acknowledge that you have read, understood, and agree to these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}