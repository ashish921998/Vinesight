'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { type LabTestRecord } from '@/types/lab-tests'
import {
  type ParamOption,
  soilParamOptions,
  petioleParamOptions
} from '@/constants/lab-test-parameters'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface LabTestComparisonTableProps {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
}

// Legend component for color and trend guide
function Legend() {
  return (
    <div className="p-3 border-t bg-gray-50">
      <div className="flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
        <div className="text-[10px] text-gray-700 space-y-1.5">
          <p className="font-medium">Color Guide:</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded" />
              <span>Optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
              <span>Critical</span>
            </div>
          </div>
          <p className="mt-1.5">
            <span className="font-medium">Trend:</span>{' '}
            <TrendingUp className="h-3 w-3 text-green-600 inline" /> Increase{' '}
            <TrendingDown className="h-3 w-3 text-red-600 inline mx-1" /> Decrease{' '}
            <Minus className="h-3 w-3 text-gray-500 inline" /> Stable
          </p>
        </div>
      </div>
    </div>
  )
}

export function LabTestComparisonTable({ soilTests, petioleTests }: LabTestComparisonTableProps) {
  // Check if we have enough data for comparison
  const hasSoilTests = soilTests.length >= 1
  const hasPetioleTests = petioleTests.length >= 1

  if (!hasSoilTests && !hasPetioleTests) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No comparison data yet</h3>
              <p className="text-xs text-muted-foreground px-4">
                Add at least 1 test to see parameter comparison
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Helper function to get cell color based on value and optimal range
  const getCellColor = (value: number | null | undefined, param: ParamOption): string => {
    if (value == null) return 'bg-gray-100'

    const { optimalMin, optimalMax } = param
    const warningThreshold = 0.2 // 20% outside optimal range

    if (value >= optimalMin && value <= optimalMax) {
      return 'bg-green-50 text-green-900'
    }

    const lowerWarning = optimalMin * (1 - warningThreshold)
    const upperWarning = optimalMax * (1 + warningThreshold)

    if (value >= lowerWarning && value <= upperWarning) {
      return 'bg-yellow-50 text-yellow-900'
    }

    return 'bg-red-50 text-red-900'
  }

  // Helper function to get trend indicator
  const getTrendIndicator = (
    currentValue: number | null | undefined,
    previousValue: number | null | undefined
  ): JSX.Element | null => {
    if (currentValue == null || previousValue == null) return null

    // Handle division by zero case
    if (previousValue === 0) {
      if (currentValue === 0) {
        return <Minus className="h-3 w-3 text-gray-500 inline ml-1" />
      }
      if (currentValue > 0) {
        return <TrendingUp className="h-3 w-3 text-green-600 inline ml-1" />
      }
      return <TrendingDown className="h-3 w-3 text-red-600 inline ml-1" />
    }

    const change = ((currentValue - previousValue) / previousValue) * 100

    if (Math.abs(change) < 5) {
      return <Minus className="h-3 w-3 text-gray-500 inline ml-1" />
    }

    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600 inline ml-1" />
    }

    return <TrendingDown className="h-3 w-3 text-red-600 inline ml-1" />
  }

  // Render comparison table
  const renderComparisonTable = (tests: LabTestRecord[], params: ParamOption[]) => {
    // Sort tests by date (oldest to newest)
    const sortedTests = [...tests].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Filter params that have at least one non-null value
    const availableParams = params.filter((param) =>
      sortedTests.some((test) => test.parameters?.[param.key] != null)
    )

    if (availableParams.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No parameters available for comparison
        </div>
      )
    }

    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 px-2 py-2 text-left text-[10px] font-semibold text-gray-900 border-r-2 border-gray-300 min-w-[80px] sm:min-w-[100px]">
                Parameter
              </th>
              {sortedTests.map((test, idx) => {
                const dateKey = typeof test.date === 'string' ? test.date : test.date.toISOString()
                return (
                  <th
                    key={test.id ?? `test-${idx}-${dateKey}`}
                    className="px-2 py-2 text-center text-[10px] font-semibold text-gray-900 min-w-[90px] sm:min-w-[110px]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{format(new Date(test.date), 'MMM dd')}</span>
                      <span className="font-normal text-gray-600">
                        {format(new Date(test.date), 'yyyy')}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {availableParams.map((param) => (
              <tr key={param.key} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-2 py-2.5 text-[11px] font-medium text-gray-900 border-r-2 border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-semibold">{param.shortLabel}</span>
                    <span className="text-[9px] text-gray-600 font-normal">
                      {param.unit || '-'}
                    </span>
                  </div>
                </td>
                {sortedTests.map((test, idx) => {
                  const value = test.parameters?.[param.key] as number | null | undefined
                  const prevValue =
                    idx > 0
                      ? (sortedTests[idx - 1].parameters?.[param.key] as number | null | undefined)
                      : null
                  const cellColor = getCellColor(value, param)
                  const trend = getTrendIndicator(value, prevValue)
                  const dateKey =
                    typeof test.date === 'string' ? test.date : test.date.toISOString()

                  return (
                    <td
                      key={test.id ?? `test-${idx}-${dateKey}`}
                      className={cn(
                        'px-2 py-2.5 text-center text-[11px] font-medium whitespace-nowrap',
                        cellColor
                      )}
                    >
                      {value != null ? (
                        <div className="flex items-center justify-center">
                          <span>{value.toFixed(param.unit === '%' ? 2 : 1)}</span>
                          {trend}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={hasSoilTests ? 'soil' : 'petiole'} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger
            value="soil"
            disabled={!hasSoilTests}
            className="text-xs px-2 py-2 flex items-center justify-center gap-1"
          >
            <span className="text-base">🌱</span>
            <span>Soil</span>
            {hasSoilTests && <span className="ml-1">({soilTests.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="petiole"
            disabled={!hasPetioleTests}
            className="text-xs px-2 py-2 flex items-center justify-center gap-1"
          >
            <span className="text-base">🍃</span>
            <span>Petiole</span>
            {hasPetioleTests && <span className="ml-1">({petioleTests.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* Soil Comparison Tab */}
        <TabsContent value="soil" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Soil Test Comparison</CardTitle>
              <CardDescription className="text-xs">
                Compare soil parameters across all test dates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                {renderComparisonTable(soilTests, soilParamOptions)}
              </div>
              <Legend />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Petiole Comparison Tab */}
        <TabsContent value="petiole" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Petiole Test Comparison</CardTitle>
              <CardDescription className="text-xs">
                Compare petiole parameters across all test dates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                {renderComparisonTable(petioleTests, petioleParamOptions)}
              </div>
              <Legend />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
