'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { BarChart3, Bug, DollarSign, Droplets, MessageCircle, Plus } from 'lucide-react'

interface NoFarmsDashboardProps {
  className?: string
}

const features = [
  {
    icon: BarChart3,
    title: 'Smart Task Management',
    description: 'AI-powered scheduling based on weather & soil'
  },
  {
    icon: Bug,
    title: 'Disease Predictions',
    description: '24-72 hour early warning system'
  },
  {
    icon: DollarSign,
    title: 'Profitability Tracking',
    description: 'Track expenses, revenue & ROI'
  },
  {
    icon: Droplets,
    title: 'Resource Optimization',
    description: 'Water & nutrient management'
  },
  {
    icon: MessageCircle,
    title: 'AI Chatbot Assistant',
    description: 'Get farming advice 24/7'
  }
]

export function NoFarmsDashboard({ className }: NoFarmsDashboardProps) {
  const router = useRouter()

  const handleAddFarm = () => {
    router.push('/farms')
  }

  const handleLearnMore = () => {
    router.push('/') // Homepage with features
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-green-50 to-white ${className}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-lg font-bold flex items-center gap-2">🍇 VineSight</h1>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-180px)] max-w-2xl mx-auto">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <h2 className="text-3xl font-bold mb-2 text-foreground">Welcome to VineSight</h2>
          <p className="text-muted-foreground text-lg">Let&apos;s get your farm digital</p>
        </div>

        {/* Features Card */}
        <Card className="w-full max-w-md mb-8 border-2">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Key Features You&apos;ll Get:</h3>
            <div className="space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="w-full max-w-md space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
            onClick={handleAddFarm}
          >
            <Plus className="h-5 w-5" />
            Add Your First Farm
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50"
            onClick={handleLearnMore}
          >
            Learn More
          </Button>
        </div>

        {/* Optional: Quick stats */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Join 1000+ farmers already using VineSight
          </p>
        </div>
      </div>
    </div>
  )
}
