'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  ChevronRight,
  Calculator,
  Droplets,
  BarChart3,
  Brain,
  Smartphone,
  Zap,
  Shield,
  HelpCircle,
  ArrowLeft,
  Phone,
  Clock,
  Users
} from 'lucide-react'
import { SEOSchema } from '@/components/SEOSchema'
import Link from 'next/link'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

interface HelpCategory {
  id: string
  title: string
  description: string
  icon: any
  articles: number
  popular?: boolean
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of VineSight and set up your first farm',
    icon: BookOpen,
    articles: 8,
    popular: true
  },
  {
    id: 'calculators',
    title: 'Scientific Calculators',
    description: 'Using ETc, MAD, Nutrient, and other farming calculators',
    icon: Calculator,
    articles: 12
  },
  {
    id: 'data-logging',
    title: 'Data Logging',
    description: 'Recording irrigation, spray, harvest, and expense data',
    icon: Droplets,
    articles: 15
  },
  {
    id: 'ai-features',
    title: 'AI Assistant & Insights',
    description: 'Leveraging AI recommendations and predictions',
    icon: Brain,
    articles: 10,
    popular: true
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'Understanding your farm performance data',
    icon: BarChart3,
    articles: 9
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'Using VineSight on your smartphone',
    icon: Smartphone,
    articles: 6
  },
  {
    id: 'automation',
    title: 'IoT & Automation',
    description: 'Connecting sensors and automating tasks',
    icon: Zap,
    articles: 7
  },
  {
    id: 'account',
    title: 'Account & Security',
    description: 'Managing your account and data security',
    icon: Shield,
    articles: 5
  }
]

const popularFAQs: FAQItem[] = [
  {
    id: 'setup-first-farm',
    question: 'How do I set up my first farm in VineSight?',
    answer:
      'To set up your first farm: 1) Sign in to your VineSight account, 2) Click "Add Farm" on the dashboard, 3) Enter your farm details including location, area, and crop type, 4) Set up your irrigation system parameters, and 5) Start logging your first activities.',
    category: 'getting-started',
    tags: ['setup', 'farm', 'beginner']
  },
  {
    id: 'etc-calculator',
    question: 'What is the ETc calculator and how do I use it?',
    answer:
      "The ETc (Crop Evapotranspiration) calculator helps determine your crop's water requirements. Enter your crop type, growth stage, weather data, and soil conditions to get precise irrigation recommendations based on FAO-56 methodology.",
    category: 'calculators',
    tags: ['ETc', 'irrigation', 'water', 'calculator']
  },
  {
    id: 'ai-recommendations',
    question: 'How accurate are the AI recommendations?',
    answer:
      "Our AI recommendations are based on scientific models, weather data, and your farm's historical performance. They achieve 85%+ accuracy for pest predictions and 90%+ for irrigation timing, continuously improving with more data.",
    category: 'ai-features',
    tags: ['AI', 'accuracy', 'predictions']
  },
  {
    id: 'data-export',
    question: 'Can I export my farm data?',
    answer:
      'Yes! VineSight supports exporting your data in multiple formats including CSV, PDF reports, and Excel. Go to Analytics > Export Data to download your records for any date range.',
    category: 'analytics',
    tags: ['export', 'data', 'CSV', 'reports']
  },
  {
    id: 'mobile-offline',
    question: 'Does the mobile app work offline?',
    answer:
      'The mobile app supports offline data entry for critical operations like logging irrigation and spray records. Data syncs automatically when you regain internet connection.',
    category: 'mobile-app',
    tags: ['mobile', 'offline', 'sync']
  },
  {
    id: 'pest-alerts',
    question: 'How do pest prediction alerts work?',
    answer:
      "Our AI analyzes weather patterns, historical data, and regional pest reports to predict disease/pest outbreaks 24-72 hours in advance. You'll receive notifications with prevention recommendations.",
    category: 'ai-features',
    tags: ['pest', 'alerts', 'prediction', 'weather']
  }
]

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = popularFAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCategories = helpCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEOSchema
        title="Help Center - VineSight Grape Farming Assistant"
        description="Get help with VineSight's grape farming tools, calculators, AI features, and data management. Comprehensive guides and FAQs for Indian grape farmers."
        type="guide"
        image="https://farmai.vercel.app/og-image.png"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
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
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Everything you need to know about VineSight
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles, features, or questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!selectedCategory ? (
          <>
            {/* Quick Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-10 w-10 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                  <p className="text-gray-600 mb-4">Get instant help from our support team</p>
                  <Button className="bg-green-600 hover:bg-green-700">Start Chat</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Mail className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">Send us detailed questions</p>
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    Email Us
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardContent className="p-6 text-center">
                  <Phone className="h-10 w-10 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                  <p className="text-gray-600 mb-4">Speak directly with experts</p>
                  <Button
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  >
                    Call Us
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Help Categories */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Category</h2>
              <p className="text-gray-600 mb-8">Find help articles organized by topic</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-200 group"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <category.icon className="h-6 w-6 text-green-600" />
                        </div>
                        {category.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{category.articles} articles</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Popular FAQs */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600 mb-8">Quick answers to common questions</p>

              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <Card key={faq.id} className="border border-gray-200">
                    <CardContent className="p-0">
                      <button
                        className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          <ChevronRight
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedFAQ === faq.id ? 'rotate-90' : ''}`}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {helpCategories.find((c) => c.id === faq.category)?.title}
                          </Badge>
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Category Detail View
          <div>
            <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {helpCategories.find((c) => c.id === selectedCategory)?.title}
              </h1>
              <p className="text-xl text-gray-600">
                {helpCategories.find((c) => c.id === selectedCategory)?.description}
              </p>
            </div>

            {/* Category-specific content would go here */}
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Articles Coming Soon</h3>
              <p className="text-gray-500">
                We&apos;re working on detailed help articles for{' '}
                {helpCategories.find((c) => c.id === selectedCategory)?.title.toLowerCase()}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Support Hours */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Support Hours</p>
                <p className="text-sm text-gray-600">Mon-Fri 9AM-6PM IST</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Response Time</p>
                <p className="text-sm text-gray-600">Usually within 2 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
