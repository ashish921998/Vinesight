'use client'

import { Card, CardContent } from '@/components/ui/card'

interface FarmOverviewProps {
  loading: boolean
}

export function FarmOverview({ loading }: FarmOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Remove the overview cards section - component now returns null
  return null
}
