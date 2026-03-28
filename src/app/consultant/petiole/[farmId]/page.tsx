'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Sprout,
  Calendar,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Farm {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  soil_texture_class: string | null
  area: number | null
  user_id: string
}

interface PetioleTest {
  id: number
  date: string
  parameters: Record<string, any> | null
}

interface ChartDataPoint {
  date: string
  displayDate: string
  n: number | null
  p: number | null
  k: number | null
}

interface Anomaly {
  date: string
  nutrient: string
  previousValue: number
  currentValue: number
  changePercent: number
}

function extractNPK(params: Record<string, any>): {
  n: number | null
  p: number | null
  k: number | null
} {
  const get = (keys: string[]) => {
    for (const key of keys) {
      const val = params[key]
      if (val !== undefined && val !== null) return typeof val === 'number' ? val : parseFloat(val)
    }
    return null
  }
  return {
    n: get(['N', 'Nitrogen', 'nitrogen', 'n', 'total_nitrogen']),
    p: get(['P', 'Phosphorus', 'phosphorus', 'p']),
    k: get(['K', 'Potassium', 'potassium', 'k'])
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export default function PetioleComparisonPage() {
  const params = useParams()
  const farmId = params.farmId as string

  const [farm, setFarm] = useState<Farm | null>(null)
  const [tests, setTests] = useState<PetioleTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [farmId])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', parseInt(farmId))
        .single()

      if (farmError || !farmData) {
        toast.error('Farm not found')
        return
      }

      setFarm(farmData as Farm)

      const { data: testData, error: testError } = await supabase
        .from('petiole_test_records')
        .select('id, date, parameters')
        .eq('farm_id', parseInt(farmId))
        .order('date', { ascending: true })

      if (testError) {
        toast.error('Failed to load petiole tests')
        return
      }

      setTests((testData as PetioleTest[]) || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load petiole data')
    } finally {
      setLoading(false)
    }
  }

  const chartData: ChartDataPoint[] = tests
    .filter((t) => t.parameters)
    .map((t) => {
      const npk = extractNPK(t.parameters!)
      return {
        date: t.date,
        displayDate: formatDate(t.date),
        n: npk.n,
        p: npk.p,
        k: npk.k
      }
    })

  const anomalies: Anomaly[] = []
  for (let i = 1; i < chartData.length; i++) {
    const prev = chartData[i - 1]
    const curr = chartData[i]

    const nutrients = [
      { key: 'n' as const, label: 'Nitrogen (N)' },
      { key: 'p' as const, label: 'Phosphorus (P)' },
      { key: 'k' as const, label: 'Potassium (K)' }
    ]

    for (const { key, label } of nutrients) {
      const prevVal = prev[key]
      const currVal = curr[key]
      if (prevVal !== null && currVal !== null && prevVal !== 0) {
        const changePercent = ((currVal - prevVal) / prevVal) * 100
        if (Math.abs(changePercent) > 20) {
          anomalies.push({
            date: curr.date,
            nutrient: label,
            previousValue: prevVal,
            currentValue: currVal,
            changePercent
          })
        }
      }
    }
  }

  const latestTest = chartData.length >= 1 ? chartData[chartData.length - 1] : null
  const previousTest = chartData.length >= 2 ? chartData[chartData.length - 2] : null

  const getDelta = (
    current: number | null,
    previous: number | null
  ): { value: number; percent: number } | null => {
    if (current === null || previous === null || previous === 0) return null
    const percent = ((current - previous) / previous) * 100
    return { value: current - previous, percent }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading petiole data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/consultant/farmers">
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-accent" />
            {farm?.name || 'Unknown Farm'}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {farm?.region && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {farm.region}
              </span>
            )}
            {farm?.crop_variety && <Badge variant="secondary">{farm.crop_variety}</Badge>}
          </div>
        </div>
      </div>

      {/* No Tests State */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Petiole Tests</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              No petiole test records found for this farm. Tests will appear here once recorded.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrient Trends (N, P, K)</CardTitle>
              <CardDescription>
                Historical nutrient values across {tests.length} petiole{' '}
                {tests.length === 1 ? 'test' : 'tests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length >= 2 ? (
                <div className="h-64 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
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
                      <Line
                        type="monotone"
                        dataKey="n"
                        name="Nitrogen (N) %"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--chart-1)', r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="p"
                        name="Phosphorus (P) %"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--chart-2)', r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="k"
                        name="Potassium (K) %"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--chart-3)', r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    At least 2 tests needed to display trends
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side-by-Side Comparison */}
          {latestTest && previousTest && (
            <Card>
              <CardHeader>
                <CardTitle>Latest vs Previous Comparison</CardTitle>
                <CardDescription>
                  {formatDate(previousTest.date)} → {formatDate(latestTest.date)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Nitrogen (N)',
                      current: latestTest.n,
                      previous: previousTest.n,
                      bgClass: 'bg-chart-1/10'
                    },
                    {
                      label: 'Phosphorus (P)',
                      current: latestTest.p,
                      previous: previousTest.p,
                      bgClass: 'bg-chart-2/10'
                    },
                    {
                      label: 'Potassium (K)',
                      current: latestTest.k,
                      previous: previousTest.k,
                      bgClass: 'bg-chart-3/10'
                    }
                  ].map(({ label, current, previous, bgClass }) => {
                    const delta = getDelta(current, previous)
                    return (
                      <div key={label} className={cn('rounded-lg p-4 text-center', bgClass)}>
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="text-2xl font-bold">
                          {current !== null ? `${current.toFixed(2)}%` : '—'}
                        </p>
                        {delta && (
                          <div
                            className={cn(
                              'flex items-center justify-center gap-1 mt-2 text-sm font-medium',
                              delta.percent > 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {delta.percent > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {delta.percent > 0 ? '↑' : '↓'} {Math.abs(delta.percent).toFixed(1)}%
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          prev: {previous !== null ? `${previous.toFixed(2)}%` : '—'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomaly Detection */}
          {anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Anomalies Detected
                </CardTitle>
                <CardDescription>
                  Nutrients with &gt;20% change between consecutive tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {anomalies.map((anomaly, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                    >
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{anomaly.nutrient}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(anomaly.date)}</p>
                        <p className="text-sm mt-1">
                          {anomaly.previousValue.toFixed(2)}% → {anomaly.currentValue.toFixed(2)}%
                          <span
                            className={cn(
                              'ml-2 font-medium',
                              anomaly.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            ({anomaly.changePercent > 0 ? '+' : ''}
                            {anomaly.changePercent.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Test History
              </CardTitle>
              <CardDescription>All petiole test records for this farm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        N (%)
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        P (%)
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        K (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...tests].reverse().map((test) => {
                      const npk = test.parameters
                        ? extractNPK(test.parameters)
                        : { n: null, p: null, k: null }
                      return (
                        <tr key={test.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="py-3 px-2 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(test.date)}
                          </td>
                          <td className="text-right py-3 px-2">
                            {npk.n !== null ? npk.n.toFixed(2) : '—'}
                          </td>
                          <td className="text-right py-3 px-2">
                            {npk.p !== null ? npk.p.toFixed(2) : '—'}
                          </td>
                          <td className="text-right py-3 px-2">
                            {npk.k !== null ? npk.k.toFixed(2) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
