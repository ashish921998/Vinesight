'use client'

import { SEOSchema } from '@/components/SEOSchema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sprout,
  Calendar,
  Droplets,
  Bug,
  TrendingUp,
  Thermometer,
  Users,
  Award,
} from 'lucide-react'

export default function GrapeFarmingGuide() {
  const sections = [
    {
      icon: Sprout,
      title: 'Getting Started with Grape Farming',
      description: 'Essential basics for new vineyard owners',
      topics: [
        'Selecting the right grape varieties for your climate',
        'Site selection and soil preparation',
        'Planning your vineyard layout',
        'Understanding trellis systems',
      ],
    },
    {
      icon: Calendar,
      title: 'Seasonal Vineyard Management',
      description: 'Year-round grape farming calendar',
      topics: [
        'Spring: Pruning and canopy management',
        'Summer: Disease prevention and irrigation',
        'Fall: Harvest timing and techniques',
        'Winter: Dormant season care',
      ],
    },
    {
      icon: Droplets,
      title: 'Smart Irrigation for Grapes',
      description: 'Water management techniques',
      topics: [
        'Drip irrigation system setup',
        'Calculating water requirements',
        'Deficit irrigation strategies',
        'Monitoring soil moisture',
      ],
    },
    {
      icon: Bug,
      title: 'Disease & Pest Management',
      description: 'Protecting your vineyard naturally',
      topics: [
        'Common grape diseases identification',
        'Integrated pest management (IPM)',
        'Organic treatment options',
        'Preventive spray schedules',
      ],
    },
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increased Yields',
      description: 'Scientific approach can boost production by 30-40%',
    },
    {
      icon: Thermometer,
      title: 'Climate Resilience',
      description: 'Adaptive techniques for changing weather patterns',
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Connect with experienced grape farmers',
    },
    {
      icon: Award,
      title: 'Quality Improvement',
      description: 'Better grape quality leads to premium pricing',
    },
  ]

  return (
    <>
      <SEOSchema
        type="guide"
        title="Complete Grape Farming Guide 2025 - Modern Vineyard Management Techniques"
        description="Comprehensive guide to grape farming and vineyard management. Learn modern techniques for higher yields, disease prevention, and sustainable grape cultivation."
        url="/grape-farming-guide"
        image="https://farmai.vercel.app/og-image.png"
        guideCategory="Viticulture"
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Complete Grape Farming Guide
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Master modern vineyard management with proven techniques for sustainable grape
            cultivation, higher yields, and premium quality production
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            <span className="bg-secondary px-3 py-1 rounded-full">Vineyard Management</span>
            <span className="bg-secondary px-3 py-1 rounded-full">Grape Cultivation</span>
            <span className="bg-secondary px-3 py-1 rounded-full">Precision Agriculture</span>
            <span className="bg-secondary px-3 py-1 rounded-full">Sustainable Farming</span>
          </div>
        </div>

        {/* Quick Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <Card key={benefit.title} className="text-center">
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8 mb-12">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.title}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{section.title}</CardTitle>
                      <CardDescription className="text-base">{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.topics.map((topic, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-foreground">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Key Farming Terms */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Essential Grape Farming Terminology</CardTitle>
            <CardDescription>Important terms every grape farmer should know</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">Brix</h4>
                  <p className="text-sm text-muted-foreground">
                    Measurement of sugar content in grapes, indicating ripeness
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Veraison</h4>
                  <p className="text-sm text-muted-foreground">
                    The stage when grapes begin to change color and ripen
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Canopy Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Techniques to optimize vine growth and fruit exposure
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">Terroir</h4>
                  <p className="text-sm text-muted-foreground">
                    Environmental factors affecting grape flavor and quality
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Vintage</h4>
                  <p className="text-sm text-muted-foreground">
                    The year in which grapes were harvested
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Phylloxera</h4>
                  <p className="text-sm text-muted-foreground">
                    Devastating grape pest; reason for grafting onto resistant rootstock
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Ready to Transform Your Vineyard?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of successful grape farmers using FarmAI&apos;s smart management tools.
              Get AI-powered insights, yield predictions, and personalized farming recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                View Calculators
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
