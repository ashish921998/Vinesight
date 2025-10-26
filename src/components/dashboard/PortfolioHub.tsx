'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { PortfolioService } from '@/lib/portfolio-service'
import {
  calculatePortfolioMetrics,
  createFarmSummaries,
  getCriticalAlerts,
  type PortfolioMetrics,
  type FarmSummary,
  type CriticalAlert
} from '@/lib/portfolio-utils'
import { type Farm } from '@/types/types'

// Components
import { PortfolioSnapshot } from './PortfolioSnapshot'
import { CriticalAlertsSection } from './CriticalAlertsSection'
import { FarmCardGrid } from './FarmCardGrid'
import { FarmDetailModal } from './FarmDetailModal'
import { NoFarmsDashboard } from './NoFarmsDashboard'

interface PortfolioHubProps {
  className?: string
}

export function PortfolioHub({ className }: PortfolioHubProps) {
  const { user, loading: authLoading } = useSupabaseAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [farms, setFarms] = useState<Farm[]>([])
  const [farmsData, setFarmsData] = useState<Map<number, any>>(new Map())
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null)
  const [farmSummaries, setFarmSummaries] = useState<FarmSummary[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null)
  const [showFarmDetail, setShowFarmDetail] = useState(false)

  // Load portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (authLoading) return

      if (!user) {
        setError('Please sign in to view your portfolio')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // OPTIMIZED: Single call gets farms, tasks, alerts, AND financials
        const portfolioData = await PortfolioService.getPortfolioData()
        setFarms(portfolioData.farms)
        setFarmsData(portfolioData.farmsData)

        // Calculate portfolio metrics with already-loaded financial data
        const baseMetrics = calculatePortfolioMetrics(portfolioData.farms, portfolioData.farmsData)
        const metrics = {
          ...baseMetrics,
          totalRevenue: portfolioData.financials.totalRevenue,
          totalExpenses: portfolioData.financials.totalExpenses,
          profitMargin: portfolioData.financials.profitMargin
        }

        setPortfolioMetrics(metrics)

        // Create farm summaries
        const summaries = createFarmSummaries(portfolioData.farms, portfolioData.farmsData)
        setFarmSummaries(summaries)

        // Get critical alerts
        const alerts = getCriticalAlerts(portfolioData.farms, portfolioData.farmsData)
        setCriticalAlerts(alerts)
      } catch (err) {
        console.error('Error loading portfolio data:', err)
        setError('Failed to load portfolio data')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [user, authLoading])

  // Refresh portfolio data
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const portfolioData = await PortfolioService.refreshPortfolio()
      setFarms(portfolioData.farms)
      setFarmsData(portfolioData.farmsData)

      const baseMetrics = calculatePortfolioMetrics(portfolioData.farms, portfolioData.farmsData)
      const metrics = {
        ...baseMetrics,
        totalRevenue: portfolioData.financials.totalRevenue,
        totalExpenses: portfolioData.financials.totalExpenses,
        profitMargin: portfolioData.financials.profitMargin
      }

      setPortfolioMetrics(metrics)

      const summaries = createFarmSummaries(portfolioData.farms, portfolioData.farmsData)
      setFarmSummaries(summaries)

      const alerts = getCriticalAlerts(portfolioData.farms, portfolioData.farmsData)
      setCriticalAlerts(alerts)
    } catch (err) {
      console.error('Error refreshing portfolio:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Handle farm selection
  const handleFarmSelect = (farmId: number) => {
    setSelectedFarmId(farmId)
    setShowFarmDetail(true)
  }

  // Handle alert click
  const handleAlertClick = (farmId: number, alert: CriticalAlert) => {
    setSelectedFarmId(farmId)
    setShowFarmDetail(true)
  }

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Portfolio Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Show no farms state
  if (farms.length === 0) {
    return <NoFarmsDashboard />
  }

  return (
    <div className={`min-h-screen bg-background touch-manipulation select-none ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">🍇 VineSight Portfolio</h1>
            <p className="text-xs text-muted-foreground">
              {farms.length} {farms.length === 1 ? 'Farm' : 'Farms'} • Last updated: Just now
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {/* Portfolio Snapshot */}
        {portfolioMetrics && (
          <div className="py-4">
            <PortfolioSnapshot metrics={portfolioMetrics} loading={false} />
          </div>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="py-2">
            <CriticalAlertsSection alerts={criticalAlerts} onAlertClick={handleAlertClick} />
          </div>
        )}

        {/* Farm Cards Grid */}
        <div className="py-4">
          <FarmCardGrid farms={farmSummaries} onFarmSelect={handleFarmSelect} loading={false} />
        </div>

        {/* Bottom Safe Area */}
        <div className="h-8" />
      </div>

      {/* Farm Detail Modal */}
      <FarmDetailModal
        farmId={selectedFarmId}
        open={showFarmDetail}
        onClose={() => {
          setShowFarmDetail(false)
          setSelectedFarmId(null)
        }}
        preloadedFarm={selectedFarmId ? farms.find((f) => f.id === selectedFarmId) : undefined}
        preloadedData={selectedFarmId ? farmsData.get(selectedFarmId) : undefined}
      />
    </div>
  )
}
