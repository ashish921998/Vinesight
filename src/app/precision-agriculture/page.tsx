'use client'

import { SEOSchema } from '@/components/SEOSchema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Satellite, Database, Bot, Zap, MapPin, Wifi, Gauge, TrendingUp } from 'lucide-react'

export default function PrecisionAgriculture() {
  const technologies = [
    {
      icon: Satellite,
      title: 'GPS & Remote Sensing',
      description: 'Satellite-guided precision farming',
      benefits: [
        'Field mapping accuracy',
        'Variable rate applications',
        'Yield monitoring',
        'Boundary management'
      ],
      adoption: '95%',
      roi: '20-30%'
    },
    {
      icon: Database,
      title: 'Data Analytics Platform',
      description: 'Big data for agricultural insights',
      benefits: [
        'Predictive analytics',
        'Historical comparisons',
        'Performance benchmarking',
        'Decision support'
      ],
      adoption: '78%',
      roi: '15-25%'
    },
    {
      icon: Bot,
      title: 'Agricultural Robotics',
      description: 'Automated farming operations',
      benefits: [
        'Precision planting',
        'Autonomous harvesting',
        'Selective spraying',
        '24/7 monitoring'
      ],
      adoption: '35%',
      roi: '40-60%'
    },
    {
      icon: Wifi,
      title: 'IoT Sensor Networks',
      description: 'Real-time field monitoring',
      benefits: [
        'Soil moisture tracking',
        'Weather monitoring',
        'Pest detection',
        'Equipment status'
      ],
      adoption: '65%',
      roi: '25-35%'
    }
  ]

  const precisionTechniques = [
    {
      category: 'Soil Management',
      icon: MapPin,
      techniques: [
        'Grid soil sampling',
        'Variable rate fertilization',
        'pH management zones',
        'Organic matter mapping'
      ],
      impact: '30% reduction in fertilizer costs'
    },
    {
      category: 'Crop Monitoring',
      icon: Gauge,
      techniques: [
        'NDVI vegetation indices',
        'Thermal imaging',
        'Growth stage tracking',
        'Stress detection'
      ],
      impact: '20% increase in early problem detection'
    },
    {
      category: 'Water Management',
      icon: Zap,
      techniques: [
        'Smart irrigation systems',
        'Soil moisture optimization',
        'Weather-based scheduling',
        'Deficit irrigation strategies'
      ],
      impact: '40% water usage reduction'
    },
    {
      category: 'Yield Optimization',
      icon: TrendingUp,
      techniques: [
        'Yield mapping',
        'Prescription seeding',
        'Harvest optimization',
        'Quality prediction'
      ],
      impact: '15-25% yield improvement'
    }
  ]

  const implementationSteps = [
    {
      step: 1,
      title: 'Assessment & Planning',
      description: 'Evaluate current operations and set precision agriculture goals',
      duration: '2-4 weeks',
      actions: ['Farm audit', 'Technology needs analysis', 'Budget planning', 'ROI projections']
    },
    {
      step: 2,
      title: 'Infrastructure Setup',
      description: 'Install necessary hardware and connectivity',
      duration: '4-8 weeks',
      actions: [
        'GPS base stations',
        'IoT sensor deployment',
        'Communication networks',
        'Data storage systems'
      ]
    },
    {
      step: 3,
      title: 'Data Collection',
      description: 'Begin gathering field and operational data',
      duration: '1-2 seasons',
      actions: ['Soil sampling', 'Yield monitoring', 'Weather tracking', 'Equipment data logging']
    },
    {
      step: 4,
      title: 'Analysis & Optimization',
      description: 'Use data insights to optimize operations',
      duration: 'Ongoing',
      actions: [
        'Prescription maps',
        'Variable rate applications',
        'Performance monitoring',
        'Continuous improvement'
      ]
    }
  ]

  return (
    <>
      <SEOSchema
        type="guide"
        title="Precision Agriculture Technology Guide - Smart Farming Solutions 2025"
        description="Complete guide to precision agriculture technologies, GPS farming, IoT sensors, and data-driven agricultural practices for modern farms."
        url="/precision-agriculture"
        image="https://vinesight.vercel.app/og-image.png"
        guideCategory="Precision Agriculture"
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Precision Agriculture Technology
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Transform your farming operations with cutting-edge technology. GPS guidance, IoT
            sensors, AI analytics, and robotic automation for maximum efficiency and sustainability.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Badge variant="secondary">GPS Farming</Badge>
            <Badge variant="secondary">IoT Agriculture</Badge>
            <Badge variant="secondary">Smart Sensors</Badge>
            <Badge variant="secondary">Agricultural AI</Badge>
            <Badge variant="secondary">Farm Robotics</Badge>
          </div>
        </div>

        {/* Key Technologies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Core Technologies</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {technologies.map((tech) => {
              const Icon = tech.icon
              return (
                <Card key={tech.title} className="relative">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{tech.title}</CardTitle>
                        <CardDescription className="mb-3">{tech.description}</CardDescription>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Adoption: </span>
                            <span className="font-semibold text-primary">{tech.adoption}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ROI: </span>
                            <span className="font-semibold text-green-600">{tech.roi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tech.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Precision Techniques */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Precision Farming Techniques</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {precisionTechniques.map((technique) => {
              const Icon = technique.icon
              return (
                <Card key={technique.category}>
                  <CardHeader>
                    <div className="text-center">
                      <Icon className="h-10 w-10 text-primary mx-auto mb-3" />
                      <CardTitle className="text-lg">{technique.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 mb-4">
                      {technique.techniques.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs bg-green-50 text-green-700 p-2 rounded">
                      <strong>Impact:</strong> {technique.impact}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Implementation Roadmap */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Implementation Roadmap</CardTitle>
            <CardDescription>
              Step-by-step guide to adopting precision agriculture technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {implementationSteps.map((phase) => (
                <div key={phase.step} className="relative">
                  {phase.step !== implementationSteps.length && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                  )}
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {phase.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{phase.title}</h3>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{phase.description}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {phase.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits & ROI */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Economic Benefits of Precision Agriculture</CardTitle>
            <CardDescription>Quantified returns from precision farming investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">25-35%</div>
                <div className="text-sm text-green-700">Input Cost Reduction</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">15-25%</div>
                <div className="text-sm text-blue-700">Yield Increase</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">40-50%</div>
                <div className="text-sm text-purple-700">Labor Efficiency</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">2-3 Years</div>
                <div className="text-sm text-orange-700">Payback Period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center bg-accent/5 border-accent/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Start Your Precision Agriculture Journey
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              VineSight integrates the latest precision agriculture technologies into an easy-to-use
              platform. Get GPS guidance, IoT sensor integration, and AI-powered analytics in one
              solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12">
                Schedule Demo
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                View Technology Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
