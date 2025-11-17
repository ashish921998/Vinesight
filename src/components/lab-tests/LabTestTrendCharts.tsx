'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { type LabTestRecord } from './TestDetailsCard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

interface LabTestTrendChartsProps {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
}

interface TrendData {
  date: string
  displayDate: string
  [key: string]: string | number
}

export function LabTestTrendCharts({ soilTests, petioleTests }: LabTestTrendChartsProps) {
  const [selectedSoilParams, setSelectedSoilParams] = useState<string[]>(['ph', 'ec'])
  const [selectedPetioleParams, setSelectedPetioleParams] = useState<string[]>([
    'total_nitrogen',
    'potassium'
  ])

  // Check if we have enough data for trends
  const hasSoilTrends = soilTests.length >= 2
  const hasPetioleTrends = petioleTests.length >= 2

  if (!hasSoilTrends && !hasPetioleTrends) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No trend data yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add at least 2 tests to see parameter trends over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare soil test data
  const soilTrendData: TrendData[] = [...soilTests]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => ({
      date: record.date,
      displayDate: format(new Date(record.date), 'MMM dd, yyyy'),
      // Primary parameters
      ph: record.parameters.ph ?? null,
      ec: record.parameters.ec ?? null,
      // Macronutrients
      nitrogen: record.parameters.nitrogen ?? null,
      phosphorus: record.parameters.phosphorus ?? null,
      potassium: record.parameters.potassium ?? null,
      // Secondary nutrients
      calcium: record.parameters.calcium ?? null,
      magnesium: record.parameters.magnesium ?? null,
      sulfur: record.parameters.sulfur ?? null,
      // Organic matter
      organicCarbon: record.parameters.organicCarbon ?? null,
      organicMatter: record.parameters.organicMatter ?? null,
      // Micronutrients
      iron: record.parameters.iron ?? null,
      manganese: record.parameters.manganese ?? null,
      zinc: record.parameters.zinc ?? null,
      copper: record.parameters.copper ?? null,
      boron: record.parameters.boron ?? null
    }))

  // Prepare petiole test data
  const petioleTrendData: TrendData[] = [...petioleTests]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => ({
      date: record.date,
      displayDate: format(new Date(record.date), 'MMM dd, yyyy'),
      // Major nutrients
      total_nitrogen: record.parameters.total_nitrogen ?? null,
      nitrate_nitrogen: record.parameters.nitrate_nitrogen ?? null,
      ammonical_nitrogen: record.parameters.ammonical_nitrogen ?? null,
      phosphorus: record.parameters.phosphorus ?? null,
      potassium: record.parameters.potassium ?? null,
      // Secondary nutrients
      calcium: record.parameters.calcium ?? null,
      magnesium: record.parameters.magnesium ?? null,
      sulfur: record.parameters.sulfur ?? null,
      // Micronutrients
      iron: record.parameters.iron ?? null,
      manganese: record.parameters.manganese ?? null,
      zinc: record.parameters.zinc ?? null,
      copper: record.parameters.copper ?? null,
      boron: record.parameters.boron ?? null,
      molybdenum: record.parameters.molybdenum ?? null,
      // Other elements
      sodium: record.parameters.sodium ?? null,
      chloride: record.parameters.chloride ?? null
    }))

  // Soil parameter options
  const soilParamOptions = [
    // Primary parameters
    { key: 'ph', label: 'pH', unit: '', color: '#3b82f6', optimalMin: 6.5, optimalMax: 7.5 },
    { key: 'ec', label: 'EC', unit: 'dS/m', color: '#10b981', optimalMin: 0.5, optimalMax: 2.0 },
    // Macronutrients
    {
      key: 'nitrogen',
      label: 'Nitrogen',
      unit: 'ppm',
      color: '#8b5cf6',
      optimalMin: 200,
      optimalMax: 400
    },
    {
      key: 'phosphorus',
      label: 'Phosphorus',
      unit: 'ppm',
      color: '#f59e0b',
      optimalMin: 30,
      optimalMax: 60
    },
    {
      key: 'potassium',
      label: 'Potassium',
      unit: 'ppm',
      color: '#ef4444',
      optimalMin: 250,
      optimalMax: 400
    },
    // Secondary nutrients
    {
      key: 'calcium',
      label: 'Calcium',
      unit: 'ppm',
      color: '#14b8a6',
      optimalMin: 800,
      optimalMax: 1500
    },
    {
      key: 'magnesium',
      label: 'Magnesium',
      unit: 'ppm',
      color: '#d946ef',
      optimalMin: 150,
      optimalMax: 300
    },
    {
      key: 'sulfur',
      label: 'Sulfur',
      unit: 'ppm',
      color: '#f97316',
      optimalMin: 15,
      optimalMax: 30
    },
    // Organic matter
    {
      key: 'organicCarbon',
      label: 'Organic Carbon',
      unit: '%',
      color: '#84cc16',
      optimalMin: 1.0,
      optimalMax: 2.5
    },
    {
      key: 'organicMatter',
      label: 'Organic Matter',
      unit: '%',
      color: '#06b6d4',
      optimalMin: 2.0,
      optimalMax: 5.0
    },
    // Micronutrients
    {
      key: 'iron',
      label: 'Iron',
      unit: 'ppm',
      color: '#dc2626',
      optimalMin: 4.5,
      optimalMax: 10.0
    },
    {
      key: 'manganese',
      label: 'Manganese',
      unit: 'ppm',
      color: '#7c3aed',
      optimalMin: 5,
      optimalMax: 15
    },
    { key: 'zinc', label: 'Zinc', unit: 'ppm', color: '#6366f1', optimalMin: 1.0, optimalMax: 3.0 },
    {
      key: 'copper',
      label: 'Copper',
      unit: 'ppm',
      color: '#ea580c',
      optimalMin: 0.5,
      optimalMax: 2.0
    },
    {
      key: 'boron',
      label: 'Boron',
      unit: 'ppm',
      color: '#ec4899',
      optimalMin: 0.5,
      optimalMax: 1.5
    }
  ]

  // Petiole parameter options
  const petioleParamOptions = [
    // Major nutrients
    {
      key: 'total_nitrogen',
      label: 'Total Nitrogen',
      unit: '%',
      color: '#3b82f6',
      optimalMin: 2.0,
      optimalMax: 3.5
    },
    {
      key: 'nitrate_nitrogen',
      label: 'Nitrate Nitrogen',
      unit: 'ppm',
      color: '#0ea5e9',
      optimalMin: 500,
      optimalMax: 1500
    },
    {
      key: 'ammonical_nitrogen',
      label: 'Ammonical Nitrogen',
      unit: 'ppm',
      color: '#38bdf8',
      optimalMin: 500,
      optimalMax: 1500
    },
    {
      key: 'phosphorus',
      label: 'Phosphorus',
      unit: '%',
      color: '#f59e0b',
      optimalMin: 0.3,
      optimalMax: 0.5
    },
    {
      key: 'potassium',
      label: 'Potassium',
      unit: '%',
      color: '#ef4444',
      optimalMin: 1.8,
      optimalMax: 2.5
    },
    // Secondary nutrients
    {
      key: 'calcium',
      label: 'Calcium',
      unit: '%',
      color: '#10b981',
      optimalMin: 1.5,
      optimalMax: 2.5
    },
    {
      key: 'magnesium',
      label: 'Magnesium',
      unit: '%',
      color: '#8b5cf6',
      optimalMin: 0.4,
      optimalMax: 0.8
    },
    {
      key: 'sulfur',
      label: 'Sulfur',
      unit: '%',
      color: '#f97316',
      optimalMin: 0.15,
      optimalMax: 0.3
    },
    // Micronutrients
    {
      key: 'iron',
      label: 'Iron',
      unit: 'ppm',
      color: '#06b6d4',
      optimalMin: 80,
      optimalMax: 120
    },
    {
      key: 'manganese',
      label: 'Manganese',
      unit: 'ppm',
      color: '#7c3aed',
      optimalMin: 50,
      optimalMax: 150
    },
    { key: 'zinc', label: 'Zinc', unit: 'ppm', color: '#6366f1', optimalMin: 50, optimalMax: 80 },
    {
      key: 'copper',
      label: 'Copper',
      unit: 'ppm',
      color: '#ea580c',
      optimalMin: 10,
      optimalMax: 25
    },
    {
      key: 'boron',
      label: 'Boron',
      unit: 'ppm',
      color: '#ec4899',
      optimalMin: 25,
      optimalMax: 50
    },
    {
      key: 'molybdenum',
      label: 'Molybdenum',
      unit: 'ppm',
      color: '#84cc16',
      optimalMin: 0.05,
      optimalMax: 0.5
    },
    // Other elements
    {
      key: 'sodium',
      label: 'Sodium',
      unit: '%',
      color: '#14b8a6',
      optimalMin: 0.1,
      optimalMax: 0.5
    },
    {
      key: 'chloride',
      label: 'Chloride',
      unit: '%',
      color: '#d946ef',
      optimalMin: 0.1,
      optimalMax: 0.5
    }
  ]

  // Calculate trend direction
  const getTrendDirection = (data: TrendData[], param: string) => {
    if (data.length < 2) return null
    const recent = data[data.length - 1][param]
    const previous = data[data.length - 2][param]
    if (recent === null || previous === null) return null
    const change = ((Number(recent) - Number(previous)) / Number(previous)) * 100
    return { change, direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable' }
  }

  const toggleSoilParam = (param: string) => {
    setSelectedSoilParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    )
  }

  const togglePetioleParam = (param: string) => {
    setSelectedPetioleParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={hasSoilTrends ? 'soil' : 'petiole'} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="soil" disabled={!hasSoilTrends}>
            🌱 Soil Trends {hasSoilTrends && `(${soilTests.length})`}
          </TabsTrigger>
          <TabsTrigger value="petiole" disabled={!hasPetioleTrends}>
            🍃 Petiole Trends {hasPetioleTrends && `(${petioleTests.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Soil Trends Tab */}
        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soil Parameter Trends</CardTitle>
              <CardDescription>
                Track how your soil health parameters change over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parameter Selection */}
              <div>
                <p className="text-sm font-medium mb-2">Select Parameters to Display:</p>
                <div className="flex flex-wrap gap-2">
                  {soilParamOptions.map((param) => {
                    const hasData = soilTrendData.some((d) => d[param.key] !== null)
                    const trend = getTrendDirection(soilTrendData, param.key)

                    return (
                      <Button
                        key={param.key}
                        variant={selectedSoilParams.includes(param.key) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleSoilParam(param.key)}
                        disabled={!hasData}
                        className="flex items-center gap-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: param.color }}
                        />
                        {param.label}
                        {trend && (
                          <span className="ml-1">
                            {trend.direction === 'up' && (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            )}
                            {trend.direction === 'down' && (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            {trend.direction === 'stable' && (
                              <Minus className="h-3 w-3 text-gray-600" />
                            )}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Chart */}
              {selectedSoilParams.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={soilTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {selectedSoilParams.map((paramKey) => {
                        const param = soilParamOptions.find((p) => p.key === paramKey)
                        if (!param) return null
                        return (
                          <Line
                            key={param.key}
                            type="monotone"
                            dataKey={param.key}
                            name={`${param.label}${param.unit ? ` (${param.unit})` : ''}`}
                            stroke={param.color}
                            strokeWidth={2}
                            dot={{ fill: param.color, r: 4 }}
                            connectNulls
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Select at least one parameter to view trends
                  </p>
                </div>
              )}

              {/* Optimal Ranges Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-900">
                    <p className="font-medium mb-1">Optimal Ranges for Grape Farming:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {soilParamOptions.map((param) => (
                        <div key={param.key}>
                          <strong>{param.label}:</strong> {param.optimalMin}-{param.optimalMax}{' '}
                          {param.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Petiole Trends Tab */}
        <TabsContent value="petiole" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Petiole Parameter Trends</CardTitle>
              <CardDescription>
                Monitor plant nutrient uptake and health indicators over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parameter Selection */}
              <div>
                <p className="text-sm font-medium mb-2">Select Parameters to Display:</p>
                <div className="flex flex-wrap gap-2">
                  {petioleParamOptions.map((param) => {
                    const hasData = petioleTrendData.some((d) => d[param.key] !== null)
                    const trend = getTrendDirection(petioleTrendData, param.key)

                    return (
                      <Button
                        key={param.key}
                        variant={selectedPetioleParams.includes(param.key) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePetioleParam(param.key)}
                        disabled={!hasData}
                        className="flex items-center gap-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: param.color }}
                        />
                        {param.label}
                        {trend && (
                          <span className="ml-1">
                            {trend.direction === 'up' && (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            )}
                            {trend.direction === 'down' && (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            {trend.direction === 'stable' && (
                              <Minus className="h-3 w-3 text-gray-600" />
                            )}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Chart */}
              {selectedPetioleParams.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={petioleTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {selectedPetioleParams.map((paramKey) => {
                        const param = petioleParamOptions.find((p) => p.key === paramKey)
                        if (!param) return null
                        return (
                          <Line
                            key={param.key}
                            type="monotone"
                            dataKey={param.key}
                            name={`${param.label}${param.unit ? ` (${param.unit})` : ''}`}
                            stroke={param.color}
                            strokeWidth={2}
                            dot={{ fill: param.color, r: 4 }}
                            connectNulls
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Select at least one parameter to view trends
                  </p>
                </div>
              )}

              {/* Optimal Ranges Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-medium mb-1">Optimal Ranges for Grape Petioles:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {petioleParamOptions.map((param) => (
                        <div key={param.key}>
                          <strong>{param.label}:</strong> {param.optimalMin}-{param.optimalMax}{' '}
                          {param.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
