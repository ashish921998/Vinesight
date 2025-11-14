'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TestDetailsCard, type LabTestRecord } from './TestDetailsCard'
import { Beaker, Calendar, Filter, Plus } from 'lucide-react'
import { subMonths, isAfter, startOfDay } from 'date-fns'

interface LabTestsTimelineProps {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
  onAddSoilTest: () => void
  onAddPetioleTest: () => void
  onEditSoilTest: (test: LabTestRecord) => void
  onEditPetioleTest: (test: LabTestRecord) => void
  onDeleteSoilTest: (test: LabTestRecord) => void
  onDeletePetioleTest: (test: LabTestRecord) => void
}

type TestType = 'all' | 'soil' | 'petiole'
type DateFilter = 'all' | '6months' | '1year' | 'season'

export function LabTestsTimeline({
  soilTests,
  petioleTests,
  onAddSoilTest,
  onAddPetioleTest,
  onEditSoilTest,
  onEditPetioleTest,
  onDeleteSoilTest,
  onDeletePetioleTest
}: LabTestsTimelineProps) {
  const [testTypeFilter, setTestTypeFilter] = useState<TestType>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showCount, setShowCount] = useState(10)

  // Combine and sort all tests
  const allTests = useMemo(() => {
    const combined: Array<{ test: LabTestRecord; type: 'soil' | 'petiole' }> = [
      ...soilTests.map((test) => ({ test, type: 'soil' as const })),
      ...petioleTests.map((test) => ({ test, type: 'petiole' as const }))
    ]

    // Sort by date descending (newest first)
    return combined.sort((a, b) => {
      return new Date(b.test.date).getTime() - new Date(a.test.date).getTime()
    })
  }, [soilTests, petioleTests])

  // Apply filters
  const filteredTests = useMemo(() => {
    let filtered = allTests

    // Filter by test type
    if (testTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === testTypeFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoffDate =
        dateFilter === '6months'
          ? subMonths(now, 6)
          : dateFilter === '1year'
            ? subMonths(now, 12)
            : subMonths(now, 4) // season (approx 4 months)

      filtered = filtered.filter((item) =>
        isAfter(startOfDay(new Date(item.test.date)), startOfDay(cutoffDate))
      )
    }

    return filtered
  }, [allTests, testTypeFilter, dateFilter])

  // Get displayed tests (with "Show More" limit)
  const displayedTests = filteredTests.slice(0, showCount)
  const hasMore = filteredTests.length > showCount

  // Helper to find previous test of the same type
  const getPreviousTest = (currentTest: LabTestRecord, type: 'soil' | 'petiole'): LabTestRecord | undefined => {
    const testsOfType = type === 'soil' ? soilTests : petioleTests
    const sorted = [...testsOfType].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const currentIndex = sorted.findIndex((t) => t.id === currentTest.id)
    return currentIndex >= 0 && currentIndex < sorted.length - 1
      ? sorted[currentIndex + 1]
      : undefined
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lab Test History</h2>
          <p className="text-sm text-muted-foreground">
            Track soil and petiole test results over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddSoilTest} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Soil Test
          </Button>
          <Button onClick={onAddPetioleTest} className="flex items-center gap-2" variant="outline">
            <Plus className="h-4 w-4" />
            Petiole Test
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Beaker className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">{allTests.length}</div>
                <div className="text-xs text-blue-600 font-medium">Total Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-xl">🌱</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{soilTests.length}</div>
                <div className="text-xs text-green-600 font-medium">Soil Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <span className="text-xl">🍃</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">{petioleTests.length}</div>
                <div className="text-xs text-emerald-600 font-medium">Petiole Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-700">
                  {allTests.length > 0 ? `${Math.ceil((new Date().getTime() - new Date(allTests[allTests.length - 1].test.date).getTime()) / (1000 * 60 * 60 * 24))}d` : '—'}
                </div>
                <div className="text-xs text-purple-600 font-medium">Since First</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters:
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Test Type:</span>
                <Select value={testTypeFilter} onValueChange={(v) => setTestTypeFilter(v as TestType)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    <SelectItem value="soil">Soil Only</SelectItem>
                    <SelectItem value="petiole">Petiole Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="season">This Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Badge variant="secondary">{filteredTests.length} results</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tests Timeline */}
      {displayedTests.length > 0 ? (
        <div className="space-y-4">
          {displayedTests.map((item) => (
            <TestDetailsCard
              key={`${item.type}-${item.test.id}`}
              test={item.test}
              testType={item.type}
              previousTest={getPreviousTest(item.test, item.type)}
              onEdit={item.type === 'soil' ? onEditSoilTest : onEditPetioleTest}
              onDelete={item.type === 'soil' ? onDeleteSoilTest : onDeletePetioleTest}
            />
          ))}

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCount((prev) => prev + 10)}
                className="w-full sm:w-auto"
              >
                Show More ({filteredTests.length - showCount} remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Beaker className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">No tests found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {testTypeFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your filters to see more results'
                    : 'Add your first lab test to start tracking soil and plant health'}
                </p>
              </div>
              {testTypeFilter === 'all' && dateFilter === 'all' && (
                <div className="flex gap-2 mt-2">
                  <Button onClick={onAddSoilTest}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Soil Test
                  </Button>
                  <Button onClick={onAddPetioleTest} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Petiole Test
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
