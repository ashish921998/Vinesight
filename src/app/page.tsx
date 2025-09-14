'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  CheckCircle,
  BarChart3,
  Brain,
  TrendingUp,
  Shield,
  Users,
  CloudSun,
} from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { SEOSchema } from '@/components/SEOSchema'
import { Navbar } from '@/components/homepage/Navbar'

export default function Homepage() {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading VineSight...</p>
        </div>
      </div>
    )
  }

  // Don't show homepage if user is logged in (will redirect)
  if (user) {
    return null
  }

  return (
    <>
      <SEOSchema
        type="homepage"
        title="VineSight - AI-Powered Farm Management Platform | Smart Agriculture Technology"
        description="Transform your farming operations with VineSight's intelligent platform. Get data-driven insights, powerful calculators, and comprehensive management tools designed specifically for modern agriculture."
        url="/"
        image="https://vinesight.vercel.app/og-image.png"
      />

      <div className="min-h-screen bg-white">
        {/* Fixed Navigation */}
        <Navbar />

        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    AI-Powered
                    <br />
                    <span className="text-green-600">Farm Management</span>
                    <br />
                    Made Simple
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                    Transform your farming operations with advanced AI insights, real-time
                    monitoring, and data-driven decision making tools.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <LoginButton className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg inline-flex items-center justify-center">
                    Start using Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </LoginButton>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1602330102257-04c00af50c1a?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Modern smart farming with AI technology and data analytics"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Everything You Need to Manage Your Farm
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src="https://plus.unsplash.com/premium_photo-1661631096484-de84cb0e71c1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Real-Time Analytics"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Monitor your farm&apos;s performance with comprehensive dashboards and real-time
                    data visualization.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Performance tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Data visualization</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Crop Management"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Crop Management</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Advanced crop monitoring and management tools powered by AI and IoT sensors.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Growth tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Disease detection</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src="https://images.unsplash.com/photo-1744230673231-865d54a0aba4?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="AI Recommendations"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">AI Recommendations</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get personalized farming recommendations based on your farm&apos;s data and
                    external factors.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Smart insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Predictive analytics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Comprehensive Farm Management Tools
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to run a successful modern farm operation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-green-100 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Analytics & Reports</h3>
                  <p className="text-gray-600">
                    Comprehensive analytics and reporting tools to track farm performance, yields,
                    and profitability.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Performance dashboards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Custom reports</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 p-3 rounded-lg w-fit">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-gray-600">
                    Get personalized farming recommendations and insights powered by artificial
                    intelligence.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Smart recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">24/7 farm advisor</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-yellow-100 p-3 rounded-lg w-fit">
                  <CloudSun className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Weather Integration</h3>
                  <p className="text-gray-600">
                    Real-time weather data and forecasts to optimize farming decisions and
                    scheduling.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">7-day forecasts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Weather alerts</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-purple-100 p-3 rounded-lg w-fit">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Performance Tracking</h3>
                  <p className="text-gray-600">
                    Monitor farm efficiency, track KPIs, and identify areas for improvement.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Efficiency metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Benchmarking</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Task Management</h3>
                  <p className="text-gray-600">
                    Organize farm tasks, set reminders, and coordinate team activities efficiently.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Smart reminders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Team coordination</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
                <div className="bg-indigo-100 p-3 rounded-lg w-fit">
                  <Shield className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Disease & Pest Prediction</h3>
                  <p className="text-gray-600">
                    Early warning system for pest and disease outbreaks using AI and weather data.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Early warnings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Prevention strategies</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">Ready to Transform Your Farm?</h2>
            <p className="text-xl text-gray-600">
              Join thousands of farmers who have transformed their operations with VineSight.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LoginButton className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg">
                Start using for Free
              </LoginButton>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-bold text-gray-900">Trusted by Farmers Worldwide</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">10,000+</div>
                  <div className="text-gray-600 mt-2">Active Farmers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">2.5M</div>
                  <div className="text-gray-600 mt-2">Acres Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">98%</div>
                  <div className="text-gray-600 mt-2">Customer Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">$25M+</div>
                  <div className="text-gray-600 mt-2">Savings Generated</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Empowering Modern Agriculture with AI
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    VineSight combines cutting-edge artificial intelligence with deep agricultural
                    expertise to help farmers optimize their operations, increase yields, and
                    maximize profitability.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="bg-green-100 p-3 rounded-lg w-fit">
                      <Brain className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
                    <p className="text-gray-600 text-sm">
                      Advanced machine learning algorithms analyze your farm data to provide
                      actionable recommendations.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-100 p-3 rounded-lg w-fit">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Data-Driven Decisions</h3>
                    <p className="text-gray-600 text-sm">
                      Make informed decisions based on real-time data, weather patterns, and
                      predictive analytics.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-purple-100 p-3 rounded-lg w-fit">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Risk Management</h3>
                    <p className="text-gray-600 text-sm">
                      Early warning systems for pests, diseases, and weather events help protect
                      your crops.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-yellow-100 p-3 rounded-lg w-fit">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Continuous Improvement</h3>
                    <p className="text-gray-600 text-sm">
                      Track performance metrics and identify opportunities for optimization and
                      growth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://plus.unsplash.com/premium_photo-1661897775104-98e395fb49e1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Modern farming technology and data analytics"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">VineSight</h3>
                <p className="text-gray-400 text-sm">
                  AI-powered farm management for modern agriculture
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="#features" className="hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-white">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#integrations" className="hover:text-white">
                      Integrations
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/help" className="hover:text-white">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/tutorials" className="hover:text-white">
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="hover:text-white">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>support@vinesight.com</li>
                  <li>1-800-VINESIGHT</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-400">© 2025 VineSight. All rights reserved.</div>
              <div className="flex gap-4 mt-4 sm:mt-0">
                <a href="/privacy" className="text-sm text-gray-400 hover:text-white">
                  Privacy
                </a>
                <a href="/terms" className="text-sm text-gray-400 hover:text-white">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
