'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, ArrowRight, Sparkles, TrendingUp, Bug } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AIInsightsTabProps {
  farmId: number
}

export function AIInsightsTab({ farmId }: AIInsightsTabProps) {
  const router = useRouter()

  const aiFeatures = [
    {
      title: 'Pest & Disease Predictions',
      description: 'AI-powered predictions for pest and disease outbreaks',
      icon: Bug,
      color: 'text-red-600 bg-red-50',
      route: `/farms/${farmId}/ai-insights`
    },
    {
      title: 'Smart Task Recommendations',
      description: 'Get personalized task suggestions based on weather and farm data',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50',
      route: `/farms/${farmId}/ai-insights`
    },
    {
      title: 'Profitability Insights',
      description: 'Analyze expenses and optimize your farm operations',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
      route: `/farms/${farmId}/ai-insights`
    }
  ]

  return (
    <div className="px-4 pb-24 space-y-4">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardContent className="p-6 text-center">
          <div className="inline-flex p-4 bg-white/80 rounded-2xl mb-4">
            <Brain className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Farm Intelligence</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get smart insights, predictions, and recommendations powered by advanced AI
          </p>
          <Button
            onClick={() => router.push(`/farms/${farmId}/ai-insights`)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            <Brain className="h-4 w-4 mr-2" />
            View All AI Insights
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 px-1">Available Features</h3>
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card
              key={feature.title}
              className="border-gray-200 cursor-pointer hover:border-gray-300 transition-all"
              onClick={() => router.push(feature.route)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
