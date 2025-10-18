'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, Activity, Brain, BarChart3 } from 'lucide-react'

interface FarmDetailsTabsProps {
  overviewContent: React.ReactNode
  activitiesContent: React.ReactNode
  aiInsightsContent?: React.ReactNode
  analyticsContent?: React.ReactNode
}

export function FarmDetailsTabs({
  overviewContent,
  activitiesContent,
  aiInsightsContent,
  analyticsContent
}: FarmDetailsTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList
        className="w-full grid grid-cols-4 h-12 mb-4 mx-4"
        style={{ width: 'calc(100% - 2rem)' }}
      >
        <TabsTrigger value="overview" className="text-xs sm:text-sm">
          <LayoutGrid className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="activities" className="text-xs sm:text-sm">
          <Activity className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logs</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="text-xs sm:text-sm">
          <Brain className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">AI</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="text-xs sm:text-sm">
          <BarChart3 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        {overviewContent}
      </TabsContent>

      <TabsContent value="activities" className="mt-0">
        {activitiesContent}
      </TabsContent>

      <TabsContent value="ai" className="mt-0">
        {aiInsightsContent || (
          <div className="px-4 py-8 text-center text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>AI insights coming soon...</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="analytics" className="mt-0">
        {analyticsContent || (
          <div className="px-4 py-8 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Analytics coming soon...</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
