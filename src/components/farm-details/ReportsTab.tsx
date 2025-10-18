'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, FileText, Download, TrendingUp, ClipboardList, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReportsTabProps {
  farmId: number
  totalHarvest?: number
  totalWaterUsage?: number
  recordCounts?: {
    irrigation: number
    spray: number
    fertigation: number
    harvest: number
    expense: number
    soilTest: number
  }
}

export function ReportsTab({
  farmId,
  totalHarvest = 0,
  totalWaterUsage = 0,
  recordCounts
}: ReportsTabProps) {
  const router = useRouter()

  const quickStats = [
    {
      label: 'Total Harvest',
      value: `${totalHarvest.toFixed(0)} kg`,
      icon: ClipboardList,
      color: 'text-green-600 bg-green-50'
    },
    {
      label: 'Water Used',
      value: `${totalWaterUsage.toFixed(0)} L`,
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Logs Recorded',
      value: recordCounts ? Object.values(recordCounts).reduce((sum, count) => sum + count, 0) : 0,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50'
    }
  ]

  const reportOptions = [
    {
      title: 'Farm Activity Summary',
      description: 'Download all your farm records and activities',
      icon: FileText,
      onClick: () => router.push(`/farms/${farmId}/logs`)
    },
    {
      title: 'Detailed Reports',
      description: 'Generate PDF reports for harvest, spray, expenses and more',
      icon: Download,
      onClick: () => router.push('/reports')
    },
    {
      title: 'Profitability Analysis',
      description: 'Track your expenses and profitability trends',
      icon: TrendingUp,
      onClick: () => router.push('/analytics')
    }
  ]

  return (
    <div className="px-4 pb-24 space-y-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Farm Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 px-1">Report Tools</h3>
        {reportOptions.map((option) => {
          const Icon = option.icon
          return (
            <Card
              key={option.title}
              className="border-gray-200 cursor-pointer hover:border-gray-300 transition-all"
              onClick={option.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{option.title}</h4>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                  <Download className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Export All Farm Data</h4>
          <p className="text-sm text-gray-600 mb-4">
            Download complete farm logs including irrigation, spray, harvest, expense and soil
            tests.
          </p>
          <Button onClick={() => router.push('/reports')} className="bg-blue-600 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
