'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft } from 'lucide-react'
import { PestAlertDashboard } from '@/components/ai/PestAlertDashboard'
import { SupabaseService } from '@/lib/supabase-service'
import { type Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'

export default function PestAlertsPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = params.id as string
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFarmData = useCallback(async () => {
    try {
      const data = await SupabaseService.getDashboardSummary(parseInt(farmId))
      setFarm(data.farm)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading farm data:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadFarmData()
  }, [loadFarmData])

  const handleBack = () => {
    router.push(`/farms/${farmId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <output className="sr-only" aria-live="polite">
          Loading pest alerts...
        </output>
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="w-48 h-5" />
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Pest & Disease Alerts</h1>
              <p className="text-sm text-gray-600">
                {farm?.name ? capitalize(farm.name) : `Farm ${farmId}`} • AI Monitoring
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <PestAlertDashboard farmId={parseInt(farmId)} className="w-full" />
      </div>
    </div>
  )
}
