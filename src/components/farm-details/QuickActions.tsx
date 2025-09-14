'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BarChart3, Brain } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface QuickActionsProps {
  onDataLogsClick: () => void
}

export function QuickActions({ onDataLogsClick }: QuickActionsProps) {
  const router = useRouter()
  const params = useParams()
  const farmId = params.id as string

  const quickActions = [
    {
      title: 'Add Data Logs',
      description: 'Record all farm activities',
      icon: Plus,
      color: 'bg-green-100 text-green-600 hover:bg-green-200',
      onClick: onDataLogsClick,
      featured: true,
    },
    {
      title: 'AI Intelligence',
      description: 'Pest predictions & smart insights',
      icon: Brain,
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      onClick: () => router.push(`/farms/${farmId}/ai-insights`),
      badge: 'NEW',
    },
    {
      title: 'View Reports',
      description: 'Generate & export reports',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      onClick: () => router.push('/reports'),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <Plus className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action: any) => {
          const Icon = action.icon

          return (
            <Card
              key={action.title}
              className="border-gray-200 cursor-pointer hover:border-gray-300 transition-all active:scale-98 relative"
              onClick={action.onClick}
            >
              {action.badge && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 z-10"
                >
                  {action.badge}
                </Badge>
              )}
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-2xl ${action.color} transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{action.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
