'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  MapPin,
  ChevronRight,
  Users,
  Tractor,
  BarChart3,
  Target
} from 'lucide-react'
import { capitalize } from '@/lib/utils'

interface Farm {
  id: string
  name: string
  location: string
  totalAcres: number
  cropType: string
  healthScore: number
  status: 'healthy' | 'attention' | 'critical'
  currentYield: number
  expectedYield: number
  profitMargin: number
  waterUsage: number
  activeTasks: number
  criticalAlerts: number
  revenue: number
  expenses: number
  soilMoisture: number
  weatherRisk: 'low' | 'medium' | 'high'
  harvestDays: number
}

interface PortfolioMetrics {
  totalRevenue: number
  totalProfit: number
  totalAcres: number
  averageYield: number
  totalFarms: number
  criticalIssues: number
  resourceUtilization: number
  overallHealthScore: number
}

// Mock data for multi-farm portfolio
const generatePortfolioData = (): { farms: Farm[]; metrics: PortfolioMetrics } => {
  const farms: Farm[] = [
    {
      id: 'farm1',
      name: 'Vineyard Valley',
      location: 'Nashik, Maharashtra',
      totalAcres: 25,
      cropType: 'Grapes',
      healthScore: 92,
      status: 'healthy',
      currentYield: 8.5,
      expectedYield: 9.2,
      profitMargin: 45.2,
      waterUsage: 85,
      activeTasks: 2,
      criticalAlerts: 0,
      revenue: 245000,
      expenses: 134000,
      soilMoisture: 68,
      weatherRisk: 'low',
      harvestDays: 45
    },
    {
      id: 'farm2',
      name: 'Sunset Orchards',
      location: 'Pune, Maharashtra',
      totalAcres: 18,
      cropType: 'Pomegranates',
      healthScore: 76,
      status: 'attention',
      currentYield: 6.8,
      expectedYield: 7.5,
      profitMargin: 32.1,
      waterUsage: 78,
      activeTasks: 5,
      criticalAlerts: 1,
      revenue: 186000,
      expenses: 126000,
      soilMoisture: 45,
      weatherRisk: 'medium',
      harvestDays: 62
    },
    {
      id: 'farm3',
      name: 'Green Acres',
      location: 'Solapur, Maharashtra',
      totalAcres: 30,
      cropType: 'Cotton',
      healthScore: 58,
      status: 'critical',
      currentYield: 4.2,
      expectedYield: 5.8,
      profitMargin: 18.7,
      waterUsage: 92,
      activeTasks: 8,
      criticalAlerts: 3,
      revenue: 156000,
      expenses: 127000,
      soilMoisture: 28,
      weatherRisk: 'high',
      harvestDays: 88
    },
    {
      id: 'farm4',
      name: 'Highland Farms',
      location: 'Satara, Maharashtra',
      totalAcres: 22,
      cropType: 'Strawberries',
      healthScore: 88,
      status: 'healthy',
      currentYield: 12.3,
      expectedYield: 12.8,
      profitMargin: 52.4,
      waterUsage: 82,
      activeTasks: 3,
      criticalAlerts: 0,
      revenue: 198000,
      expenses: 94000,
      soilMoisture: 72,
      weatherRisk: 'low',
      harvestDays: 28
    }
  ]

  const metrics: PortfolioMetrics = {
    totalRevenue: farms.reduce((sum, farm) => sum + farm.revenue, 0),
    totalProfit: farms.reduce((sum, farm) => sum + (farm.revenue - farm.expenses), 0),
    totalAcres: farms.reduce((sum, farm) => sum + farm.totalAcres, 0),
    averageYield: farms.reduce((sum, farm) => sum + farm.currentYield, 0) / farms.length,
    totalFarms: farms.length,
    criticalIssues: farms.reduce((sum, farm) => sum + farm.criticalAlerts, 0),
    resourceUtilization: farms.reduce((sum, farm) => sum + farm.waterUsage, 0) / farms.length,
    overallHealthScore: farms.reduce((sum, farm) => sum + farm.healthScore, 0) / farms.length
  }

  return { farms, metrics }
}

interface PortfolioDashboardProps {
  onFarmSelect?: (farmId: string) => void
}

export function PortfolioDashboard({ onFarmSelect }: PortfolioDashboardProps) {
  const [portfolioData, setPortfolioData] = useState(generatePortfolioData())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-accent/10 border-accent/20 text-accent'
      case 'attention':
        return 'bg-accent/10 border-accent/20 text-primary'
      case 'critical':
        return 'bg-destructive/10 border-destructive/20 text-destructive'
      default:
        return 'bg-muted/60 border-border text-muted-foreground'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent'
    if (score >= 60) return 'text-primary'
    return 'text-destructive'
  }

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 1000).toFixed(0)}K`
  }

  const criticalFarms = portfolioData.farms.filter((farm) => farm.status === 'critical')
  const attentionFarms = portfolioData.farms.filter((farm) => farm.status === 'attention')

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/60 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/60 rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted/60 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 pb-20">
      {/* Mobile-optimized header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground mb-1">Portfolio Overview</h1>
        <p className="text-sm text-muted-foreground">
          {portfolioData.metrics.totalFarms} farms • {portfolioData.metrics.totalAcres} acres
        </p>
      </div>

      {/* Critical Issues Alert - Mobile Optimized */}
      {portfolioData.metrics.criticalIssues > 0 && (
        <Card className="mb-4 border-destructive/20 bg-destructive/10">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-destructive mb-1">
                  {portfolioData.metrics.criticalIssues} Critical Issues
                </h3>
                <p className="text-xs text-destructive/80 leading-relaxed">
                  {criticalFarms.map((farm) => capitalize(farm.name)).join(', ')} need immediate
                  action
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio KPIs - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="touch-manipulation">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(portfolioData.metrics.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Profit</span>
            </div>
            <div className="text-lg font-bold text-accent">
              {formatCurrency(portfolioData.metrics.totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Health</span>
            </div>
            <div
              className={`text-lg font-bold ${getHealthScoreColor(portfolioData.metrics.overallHealthScore)}`}
            >
              {portfolioData.metrics.overallHealthScore.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Yield</span>
            </div>
            <div className="text-lg font-bold text-accent">
              {portfolioData.metrics.averageYield.toFixed(1)}T
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farm Health Matrix - Mobile Optimized */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Farm Health Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolioData.farms.map((farm) => (
              <div
                key={farm.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md active:scale-98 touch-manipulation ${getStatusColor(farm.status)}`}
                onClick={() => onFarmSelect?.(farm.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1 pr-3">
                    <h3 className="font-semibold text-base truncate">{capitalize(farm.name)}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{farm.location}</span>
                      <span>•</span>
                      <span className="flex-shrink-0">{farm.totalAcres}ac</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{farm.cropType}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getHealthScoreColor(farm.healthScore)}`}>
                        {farm.healthScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Health</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Mobile-optimized metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Yield Progress</div>
                      <div className="font-semibold text-sm">
                        {farm.currentYield}/{farm.expectedYield}T
                      </div>
                      <Progress
                        value={(farm.currentYield / farm.expectedYield) * 100}
                        className="h-1 mt-1"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Water Usage</div>
                      <div className="font-semibold text-sm">{farm.waterUsage}%</div>
                      <Progress value={farm.waterUsage} className="h-1 mt-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Profit Margin</div>
                      <div className="font-semibold text-sm text-accent">
                        {farm.profitMargin.toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Tasks/Harvest</div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{farm.activeTasks} tasks</span>
                        <span className="font-semibold text-sm text-primary">
                          {farm.harvestDays}d
                        </span>
                      </div>
                      {farm.criticalAlerts > 0 && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          {farm.criticalAlerts} urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Allocation Recommendations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolioData.metrics.criticalIssues > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Critical Action Required</span>
                </div>
                <p className="text-sm text-destructive/80">
                  Green Acres needs immediate irrigation - soil moisture at 28%. Consider
                  reallocating water resources from Highland Farms.
                </p>
              </div>
            )}

            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Tractor className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Equipment Optimization</span>
              </div>
              <p className="text-sm text-primary/80">
                Highland Farms harvest starts in 28 days. Plan to move harvesting equipment from
                Vineyard Valley after their completion.
              </p>
            </div>

            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="font-medium text-accent">Performance Insight</span>
              </div>
              <p className="text-sm text-accent/80">
                Vineyard Valley&apos;s irrigation efficiency is 15% better than portfolio average.
                Consider applying their practices to other farms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
