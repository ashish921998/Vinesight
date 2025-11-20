'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { type LabTestRecord } from '@/types/lab-tests'
import { soilParamOptions, petioleParamOptions } from '@/constants/lab-test-parameters'
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
  [key: string]: string | number | null
}

// Helper function to format values with appropriate decimal places
function formatValue(value: number, unit: string): string {
  return value.toFixed(unit === '%' ? 2 : 1)
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
        <CardContent className="p-6 sm:p-12 text-center">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                No trend data yet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
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
      ph: record.parameters?.ph ?? null,
      ec: record.parameters?.ec ?? null,
      // Macronutrients
      nitrogen: record.parameters?.nitrogen ?? null,
      phosphorus: record.parameters?.phosphorus ?? null,
      potassium: record.parameters?.potassium ?? null,
      // Secondary nutrients
      calcium: record.parameters?.calcium ?? null,
      magnesium: record.parameters?.magnesium ?? null,
      sulfur: record.parameters?.sulfur ?? null,
      // Organic matter
      organicCarbon: record.parameters?.organicCarbon ?? null,
      organicMatter: record.parameters?.organicMatter ?? null,
      // Micronutrients
      iron: record.parameters?.iron ?? null,
      manganese: record.parameters?.manganese ?? null,
      zinc: record.parameters?.zinc ?? null,
      copper: record.parameters?.copper ?? null,
      boron: record.parameters?.boron ?? null
    }))

  // Prepare petiole test data
  const petioleTrendData: TrendData[] = [...petioleTests]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => ({
      date: record.date,
      displayDate: format(new Date(record.date), 'MMM dd, yyyy'),
      // Major nutrients
      total_nitrogen: record.parameters?.total_nitrogen ?? null,
      nitrate_nitrogen: record.parameters?.nitrate_nitrogen ?? null,
      ammonical_nitrogen: record.parameters?.ammonical_nitrogen ?? null,
      phosphorus: record.parameters?.phosphorus ?? null,
      potassium: record.parameters?.potassium ?? null,
      // Secondary nutrients
      calcium: record.parameters?.calcium ?? null,
      magnesium: record.parameters?.magnesium ?? null,
      sulfur: record.parameters?.sulfur ?? null,
      // Micronutrients
      iron: record.parameters?.iron ?? null,
      manganese: record.parameters?.manganese ?? null,
      zinc: record.parameters?.zinc ?? null,
      copper: record.parameters?.copper ?? null,
      boron: record.parameters?.boron ?? null,
      molybdenum: record.parameters?.molybdenum ?? null,
      // Other elements
      sodium: record.parameters?.sodium ?? null,
      chloride: record.parameters?.chloride ?? null
    }))

  // Calculate trend direction
  const getTrendDirection = (data: TrendData[], param: string) => {
    if (data.length < 2) return null
    const recent = data[data.length - 1][param]
    const previous = data[data.length - 2][param]
    if (recent === null || previous === null) return null
    const prevNum = Number(previous)
    if (prevNum === 0) {
      const recentNum = Number(recent)
      return { change: recentNum === 0 ? 0 : 100, direction: recentNum > 0 ? 'up' : 'stable' }
    }
    const change = ((Number(recent) - prevNum) / prevNum) * 100
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
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger
            value="soil"
            disabled={!hasSoilTrends}
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5 flex items-center justify-center gap-1"
          >
            <span className="text-base sm:text-lg">🌱</span>
            <span className="hidden sm:inline">Soil Trends</span>
            <span className="sm:hidden">Soil</span>
            {hasSoilTrends && <span className="ml-1">({soilTests.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="petiole"
            disabled={!hasPetioleTrends}
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5 flex items-center justify-center gap-1"
          >
            <span className="text-base sm:text-lg">🍃</span>
            <span className="hidden sm:inline">Petiole Trends</span>
            <span className="sm:hidden">Petiole</span>
            {hasPetioleTrends && <span className="ml-1">({petioleTests.length})</span>}
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
            <CardContent className="space-y-4 p-3 sm:p-6">
              {/* Parameter Selection */}
              <div>
                <p className="text-xs sm:text-sm font-medium mb-2">Select Parameters:</p>
                <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="flex gap-2 pb-2 min-w-max sm:flex-wrap sm:min-w-0">
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
                          className="flex items-center gap-1 text-xs whitespace-nowrap"
                        >
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: param.color }}
                          />
                          <span className="hidden sm:inline">{param.label}</span>
                          <span className="sm:hidden">{param.shortLabel}</span>
                          {trend && (
                            <span className="ml-1 flex-shrink-0">
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
              </div>

              {/* Chart */}
              {selectedSoilParams.length > 0 ? (
                <div className="h-64 sm:h-80 w-full -mx-3 sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={soilTrendData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 10 }} width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
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
                            dot={{ fill: param.color, r: 3 }}
                            connectNulls
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 sm:h-80 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground px-4 text-center">
                    Select at least one parameter to view trends
                  </p>
                </div>
              )}

              {/* Optimal Ranges Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-900 min-w-0">
                    <p className="font-medium mb-1.5 sm:mb-1">Optimal Ranges:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                      {soilParamOptions.map((param) => (
                        <div key={param.key} className="truncate">
                          <strong className="text-[11px] sm:text-xs">{param.label}:</strong>{' '}
                          <span className="text-[11px] sm:text-xs">
                            {formatValue(param.optimalMin, param.unit)}-{formatValue(param.optimalMax, param.unit)} {param.unit}
                          </span>
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
            <CardContent className="space-y-4 p-3 sm:p-6">
              {/* Parameter Selection */}
              <div>
                <p className="text-xs sm:text-sm font-medium mb-2">Select Parameters:</p>
                <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="flex gap-2 pb-2 min-w-max sm:flex-wrap sm:min-w-0">
                    {petioleParamOptions.map((param) => {
                      const hasData = petioleTrendData.some((d) => d[param.key] !== null)
                      const trend = getTrendDirection(petioleTrendData, param.key)

                      return (
                        <Button
                          key={param.key}
                          variant={
                            selectedPetioleParams.includes(param.key) ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => togglePetioleParam(param.key)}
                          disabled={!hasData}
                          className="flex items-center gap-1 text-xs whitespace-nowrap"
                        >
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: param.color }}
                          />
                          <span className="hidden sm:inline">{param.label}</span>
                          <span className="sm:hidden">{param.shortLabel}</span>
                          {trend && (
                            <span className="ml-1 flex-shrink-0">
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
              </div>

              {/* Chart */}
              {selectedPetioleParams.length > 0 ? (
                <div className="h-64 sm:h-80 w-full -mx-3 sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={petioleTrendData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 10 }} width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
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
                            dot={{ fill: param.color, r: 3 }}
                            connectNulls
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 sm:h-80 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground px-4 text-center">
                    Select at least one parameter to view trends
                  </p>
                </div>
              )}

              {/* Optimal Ranges Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-emerald-900 min-w-0">
                    <p className="font-medium mb-1.5 sm:mb-1">Optimal Ranges:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                      {petioleParamOptions.map((param) => (
                        <div key={param.key} className="truncate">
                          <strong className="text-[11px] sm:text-xs">{param.label}:</strong>{' '}
                          <span className="text-[11px] sm:text-xs">
                            {formatValue(param.optimalMin, param.unit)}-{formatValue(param.optimalMax, param.unit)} {param.unit}
                          </span>
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
