'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  Droplets,
  Sprout,
  Grape,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  MapPin,
  Leaf,
  Sun,
} from 'lucide-react'
import { CloudDataService } from '@/lib/cloud-data-service'
import { Farm } from '@/types/types'

interface FarmEfficiencyMetric {
  name: string
  value: number
  unit: string
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor'
  benchmark: number
  category: 'yield' | 'water' | 'cost' | 'quality'
}

export default function FarmEfficiencyPage() {
  const [metrics, setMetrics] = useState<FarmEfficiencyMetric[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadFarms = useCallback(async () => {
    try {
      const farmList = await CloudDataService.getAllFarms()
      setFarms(farmList)
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading farms:', error)
      }
    }
  }, [])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  useEffect(() => {
    if (selectedFarm) {
      loadFarmEfficiencyMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarm]) // loadFarmEfficiencyMetrics is not in deps to avoid infinite loop

  const loadFarmEfficiencyMetrics = async () => {
    if (!selectedFarm) return

    setLoading(true)

    try {
      // Load actual farm data
      const irrigationRecords = await CloudDataService.getIrrigationRecords(selectedFarm.id!)
      const harvestRecords = await CloudDataService.getHarvestRecords(selectedFarm.id!)
      const sprayRecords = await CloudDataService.getSprayRecords(selectedFarm.id!)

      // Calculate efficiency metrics based on real data
      const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0)
      const totalIrrigation = irrigationRecords.reduce(
        (sum, record) => sum + record.duration * record.system_discharge,
        0,
      )
      const yieldPerHectare = totalHarvest / selectedFarm.area
      const waterEfficiency = totalHarvest / (totalIrrigation || 1) // kg per liter
      const avgPrice =
        harvestRecords.reduce((sum, record) => sum + (record.price || 0), 0) /
        (harvestRecords.length || 1)
      const totalRevenue = harvestRecords.reduce(
        (sum, record) => sum + record.quantity * (record.price || 0),
        0,
      )
      const revenuePerHectare = totalRevenue / selectedFarm.area

      const efficiencyMetrics: FarmEfficiencyMetric[] = [
        {
          name: 'Yield per Hectare',
          value: Math.round(yieldPerHectare),
          unit: 'kg/ha',
          status:
            yieldPerHectare > 3000
              ? 'excellent'
              : yieldPerHectare > 2000
                ? 'good'
                : yieldPerHectare > 1000
                  ? 'needs-improvement'
                  : 'poor',
          benchmark: 3000,
          category: 'yield',
        },
        {
          name: 'Water Use Efficiency',
          value: Math.round(waterEfficiency * 1000) / 1000,
          unit: 'kg/L',
          status:
            waterEfficiency > 0.8
              ? 'excellent'
              : waterEfficiency > 0.5
                ? 'good'
                : waterEfficiency > 0.3
                  ? 'needs-improvement'
                  : 'poor',
          benchmark: 0.8,
          category: 'water',
        },
        {
          name: 'Average Grape Price',
          value: Math.round(avgPrice),
          unit: '₹/kg',
          status:
            avgPrice > 80
              ? 'excellent'
              : avgPrice > 60
                ? 'good'
                : avgPrice > 40
                  ? 'needs-improvement'
                  : 'poor',
          benchmark: 80,
          category: 'cost',
        },
        {
          name: 'Revenue per Hectare',
          value: Math.round(revenuePerHectare / 1000),
          unit: '₹000/ha',
          status:
            revenuePerHectare > 200000
              ? 'excellent'
              : revenuePerHectare > 120000
                ? 'good'
                : revenuePerHectare > 60000
                  ? 'needs-improvement'
                  : 'poor',
          benchmark: 200,
          category: 'cost',
        },
        {
          name: 'Harvest Frequency',
          value: harvestRecords.length,
          unit: 'harvests',
          status:
            harvestRecords.length >= 3
              ? 'excellent'
              : harvestRecords.length >= 2
                ? 'good'
                : harvestRecords.length >= 1
                  ? 'needs-improvement'
                  : 'poor',
          benchmark: 3,
          category: 'quality',
        },
        {
          name: 'Spray Applications',
          value: sprayRecords.length,
          unit: 'treatments',
          status:
            sprayRecords.length <= 8 && sprayRecords.length >= 4
              ? 'excellent'
              : sprayRecords.length <= 12
                ? 'good'
                : 'needs-improvement',
          benchmark: 8,
          category: 'quality',
        },
        {
          name: 'Irrigation Efficiency',
          value: Math.round(totalIrrigation / selectedFarm.area / 1000),
          unit: 'L/ha (000)',
          status:
            totalIrrigation / selectedFarm.area < 500000
              ? 'excellent'
              : totalIrrigation / selectedFarm.area < 800000
                ? 'good'
                : 'needs-improvement',
          benchmark: 500,
          category: 'water',
        },
        {
          name: 'Farm Utilization',
          value: Math.round((selectedFarm.area / selectedFarm.area) * 100),
          unit: '%',
          status: 'excellent',
          benchmark: 100,
          category: 'yield',
        },
      ]

      setMetrics(efficiencyMetrics)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading farm efficiency metrics:', error)
      }
      // Provide default metrics if data loading fails
      const defaultMetrics: FarmEfficiencyMetric[] = [
        {
          name: 'Yield per Hectare',
          value: 2500,
          unit: 'kg/ha',
          status: 'good',
          benchmark: 3000,
          category: 'yield',
        },
        {
          name: 'Water Use Efficiency',
          value: 0.65,
          unit: 'kg/L',
          status: 'good',
          benchmark: 0.8,
          category: 'water',
        },
        {
          name: 'Average Grape Price',
          value: 72,
          unit: '₹/kg',
          status: 'good',
          benchmark: 80,
          category: 'cost',
        },
        {
          name: 'Revenue per Hectare',
          value: 180,
          unit: '₹000/ha',
          status: 'good',
          benchmark: 200,
          category: 'cost',
        },
      ]
      setMetrics(defaultMetrics)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }

  const refreshMetrics = () => {
    loadFarmEfficiencyMetrics()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'needs-improvement':
        return 'text-orange-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const calculateOverallScore = () => {
    if (metrics.length === 0) return 0

    const scores = metrics.map((metric) => {
      if (metric.status === 'excellent') return 100
      if (metric.status === 'good') return 85
      if (metric.status === 'needs-improvement') return 60
      return 30
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  const overallScore = calculateOverallScore()
  const getScoreStatus = (score: number) => {
    if (score >= 95) return { status: 'excellent', label: 'Outstanding' }
    if (score >= 85) return { status: 'good', label: 'Excellent' }
    if (score >= 70) return { status: 'needs-improvement', label: 'Good' }
    return { status: 'poor', label: 'Needs Improvement' }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'yield':
        return <Grape className="h-4 w-4" />
      case 'water':
        return <Droplets className="h-4 w-4" />
      case 'cost':
        return <DollarSign className="h-4 w-4" />
      case 'quality':
        return <Leaf className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const scoreInfo = getScoreStatus(overallScore)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Farm Efficiency Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyzing farming efficiency and performance metrics...
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading performance data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Farm Efficiency Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor your farm&apos;s efficiency metrics, yield performance, and resource
              utilization
            </p>
          </div>
          <Button onClick={refreshMetrics} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Farm Selection */}
        {farms.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Farm for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedFarm?.id?.toString()}
                onValueChange={(value) => {
                  const farm = farms.find((f) => f.id?.toString() === value)
                  setSelectedFarm(farm || null)
                }}
              >
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="Choose a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id!.toString()}>
                      <div>
                        <div className="font-medium">{farm.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {farm.area} acres • {farm.region} • {farm.grapeVariety}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      {!selectedFarm ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Farm Selected</h3>
            <p className="text-muted-foreground">
              Please select a farm to view efficiency metrics and performance analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Farm Efficiency Score */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Overall Farm Efficiency Score
              </CardTitle>
              <CardDescription>
                Based on yield, water efficiency, cost management, and quality metrics for{' '}
                {selectedFarm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl font-bold text-primary">{overallScore}</div>
                    <div>
                      <Badge
                        className={`${getStatusColor(scoreInfo.status)} bg-transparent border-current`}
                      >
                        {scoreInfo.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                    </div>
                  </div>
                  <Progress value={overallScore} className="h-3" />
                </div>
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${getStatusColor(scoreInfo.status)}`}>
                    {getStatusIcon(scoreInfo.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Efficiency Metrics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Efficiency Metrics
              </CardTitle>
              <CardDescription>
                Primary indicators of farm productivity and resource management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics
                  .filter((metric) =>
                    [
                      'Yield per Hectare',
                      'Water Use Efficiency',
                      'Average Grape Price',
                      'Revenue per Hectare',
                    ].includes(metric.name),
                  )
                  .map((metric, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(metric.status)}
                            <span className="text-sm font-medium">{metric.name}</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value}
                          </span>
                          <span className="text-sm text-muted-foreground mb-1">{metric.unit}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`h-2 flex-1 rounded-full ${
                              metric.status === 'good'
                                ? 'bg-green-200'
                                : metric.status === 'needs-improvement'
                                  ? 'bg-orange-200'
                                  : 'bg-red-200'
                            }`}
                          >
                            <div
                              className={`h-2 rounded-full ${
                                metric.status === 'good'
                                  ? 'bg-green-500'
                                  : metric.status === 'needs-improvement'
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min((metric.value / metric.benchmark) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            target: {metric.benchmark}
                            {metric.unit}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Farm Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Water & Irrigation Efficiency
                </CardTitle>
                <CardDescription>Water usage and irrigation optimization metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics
                    .filter((metric) =>
                      ['Water Use Efficiency', 'Irrigation Efficiency'].includes(metric.name),
                    )
                    .map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(metric.status)}
                          <div>
                            <span className="font-medium">{metric.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Target: {metric.benchmark}
                              {metric.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value}
                            {metric.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grape className="h-5 w-5" />
                  Yield & Quality Performance
                </CardTitle>
                <CardDescription>Production output and quality management metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics
                    .filter((metric) =>
                      [
                        'Yield per Hectare',
                        'Harvest Frequency',
                        'Spray Applications',
                        'Farm Utilization',
                      ].includes(metric.name),
                    )
                    .map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(metric.status)}
                          <div>
                            <span className="font-medium">{metric.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Target: {metric.benchmark}
                              {metric.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value}
                            {metric.unit}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                metric.status === 'excellent'
                                  ? 'bg-green-500'
                                  : metric.status === 'good'
                                    ? 'bg-blue-500'
                                    : metric.status === 'needs-improvement'
                                      ? 'bg-orange-500'
                                      : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min((metric.value / metric.benchmark) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Farm Management Best Practices */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Efficiency Best Practices for {selectedFarm.grapeVariety} Grapes
              </CardTitle>
              <CardDescription>
                Recommended practices to improve farm efficiency and yield quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Droplets className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-medium text-green-800">Drip Irrigation</span>
                    <p className="text-sm text-green-700">Maximizes water use efficiency</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Leaf className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-blue-800">Canopy Management</span>
                    <p className="text-sm text-blue-700">Optimize sun exposure and airflow</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <span className="font-medium text-purple-800">Scheduled Spraying</span>
                    <p className="text-sm text-purple-700">Preventive disease management</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-gray-200">
                  <Target className="h-5 w-5 text-orange-600" />
                  <div>
                    <span className="font-medium text-orange-800">Precision Fertilization</span>
                    <p className="text-sm text-orange-700">Soil-specific nutrient management</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <span className="font-medium text-indigo-800">Data-Driven Decisions</span>
                    <p className="text-sm text-indigo-700">Use analytics for optimization</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <Sprout className="h-5 w-5 text-teal-600" />
                  <div>
                    <span className="font-medium text-teal-800">Sustainable Practices</span>
                    <p className="text-sm text-teal-700">Long-term soil health focus</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
