'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, ChevronRight, IndianRupee } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MarketPrice {
  current: number
  previousWeek: number
  previousYear?: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}

interface MarketInsight {
  optimalHarvestWindow?: {
    start: Date
    end: Date
    reason: string
  }
  demandForecast: 'high' | 'medium' | 'low'
  recommendation: string
  priceHistory: Array<{
    date: string
    price: number
  }>
}

interface MarketInsightsCardProps {
  farmId?: number
  grapeVariety?: string
  region?: string
  loading?: boolean
  className?: string
}

export function MarketInsightsCard({
  farmId,
  grapeVariety = 'Thompson Seedless',
  region = 'Nashik',
  loading,
  className
}: MarketInsightsCardProps) {
  const router = useRouter()
  const [marketData, setMarketData] = useState<{
    price: MarketPrice
    insight: MarketInsight
  } | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoadingData(true)
      try {
        // TODO: Replace with actual market API integration
        // const data = await MarketIntelligenceService.getPriceData(region, grapeVariety)

        // Mock data for now
        const mockData = {
          price: {
            current: 45,
            previousWeek: 42,
            previousYear: 38,
            trend: 'up' as const,
            changePercent: 7.1
          },
          insight: {
            optimalHarvestWindow: {
              start: new Date(2025, 9, 10), // Oct 10
              end: new Date(2025, 9, 20), // Oct 20
              reason: 'Peak market demand + premium pricing window'
            },
            demandForecast: 'high' as const,
            recommendation: 'Harvest during peak window for 15-20% price premium',
            priceHistory: [
              { date: 'Oct 1', price: 42 },
              { date: 'Oct 8', price: 43 },
              { date: 'Oct 15', price: 45 },
              { date: 'Oct 22', price: 47 },
              { date: 'Oct 29', price: 44 }
            ]
          }
        }

        setMarketData(mockData)
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchMarketData()
  }, [farmId, grapeVariety, region])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getDemandColor = (demand: 'high' | 'medium' | 'low') => {
    switch (demand) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  if (loading || loadingData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">📈 Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!marketData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">📈 Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Market data not available. Check back later!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📈 Market Insights
          <Badge variant="secondary" className="ml-auto text-xs">
            {region}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Current Price</div>
              <div className="flex items-baseline gap-2">
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold text-primary">
                    {marketData.price.current}
                  </span>
                  <span className="text-sm text-muted-foreground">/kg</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{grapeVariety}</div>
            </div>

            {/* Trend Badge */}
            <Badge className={cn('flex items-center gap-1', getTrendColor(marketData.price.trend))}>
              {getTrendIcon(marketData.price.trend)}
              {marketData.price.trend === 'up' ? '+' : marketData.price.trend === 'down' ? '-' : ''}
              {Math.abs(marketData.price.changePercent)}%
            </Badge>
          </div>

          {/* Comparison */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/10">
            <div className="text-xs">
              <span className="text-muted-foreground">Last week: </span>
              <span className="font-medium">₹{marketData.price.previousWeek}</span>
            </div>
            {marketData.price.previousYear && (
              <div className="text-xs">
                <span className="text-muted-foreground">Last year: </span>
                <span className="font-medium">₹{marketData.price.previousYear}</span>
              </div>
            )}
          </div>
        </div>

        {/* Demand Forecast */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Market Demand</div>
          <Badge
            variant="outline"
            className={cn('text-xs', getDemandColor(marketData.insight.demandForecast))}
          >
            {marketData.insight.demandForecast.toUpperCase()}
          </Badge>
        </div>

        {/* Optimal Harvest Window */}
        {marketData.insight.optimalHarvestWindow && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-green-700 mt-0.5">🎯</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-900 mb-1">
                  Optimal Harvest Window
                </div>
                <div className="text-sm text-green-800 mb-1">
                  {formatDate(marketData.insight.optimalHarvestWindow.start)} -{' '}
                  {formatDate(marketData.insight.optimalHarvestWindow.end)}
                </div>
                <div className="text-xs text-green-700">
                  {marketData.insight.optimalHarvestWindow.reason}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-blue-700 mt-0.5">💡</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900 mb-1">Recommendation</div>
              <div className="text-sm text-blue-800">{marketData.insight.recommendation}</div>
            </div>
          </div>
        </div>

        {/* Simple Price Trend Visualization */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">5-Week Price Trend</div>
          <div className="flex items-end justify-between gap-1 h-16">
            {marketData.insight.priceHistory.map((point, index) => {
              const maxPrice = Math.max(...marketData.insight.priceHistory.map((p) => p.price))
              const minPrice = Math.min(...marketData.insight.priceHistory.map((p) => p.price))
              const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 100
              const isLatest = index === marketData.insight.priceHistory.length - 1

              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      isLatest ? 'bg-primary' : 'bg-gray-300'
                    )}
                    style={{ height: `${Math.max(height, 20)}%` }}
                  />
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {point.date.split(' ')[1]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* View Full Report Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-sm font-medium"
          onClick={() => router.push('/market-report')}
        >
          View Full Market Report
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
