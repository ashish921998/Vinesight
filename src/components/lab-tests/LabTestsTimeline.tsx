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
import { TestDetailsCard } from './TestDetailsCard'
import { type LabTestRecord } from '@/types/lab-tests'
import { Beaker, Calendar, Filter, Plus } from 'lucide-react'
import { subMonths, isAfter, isSameDay, startOfDay } from 'date-fns'

interface LabTestsTimelineProps {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
  farmId: number
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
  farmId,
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

      filtered = filtered.filter((item) => {
        const testDate = startOfDay(new Date(item.test.date))
        const cutoff = startOfDay(cutoffDate)
        return isAfter(testDate, cutoff) || isSameDay(testDate, cutoff)
      })
    }

    return filtered
  }, [allTests, testTypeFilter, dateFilter])

  // Get displayed tests (with "Show More" limit)
  const displayedTests = filteredTests.slice(0, showCount)
  const hasMore = filteredTests.length > showCount

  // Helper to find previous test of the same type
  const getPreviousTest = (
    currentTest: LabTestRecord,
    type: 'soil' | 'petiole'
  ): LabTestRecord | undefined => {
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
    <div className="space-y-2 sm:space-y-4">
      {/* Header with Actions */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Lab Test History</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track soil and petiole test results over time
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:flex">
          <Button
            onClick={onAddSoilTest}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 rounded-2xl"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Soil Test</span>
            <span className="sm:hidden">Soil</span>
          </Button>
          <Button
            onClick={onAddPetioleTest}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 rounded-2xl"
            variant="outline"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Petiole Test</span>
            <span className="sm:hidden">Petiole</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
        <Card className="border-blue-200 bg-blue-50 rounded-2xl">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Beaker className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-blue-700 leading-tight">
                  {allTests.length}
                </div>
                <div className="text-[10px] sm:text-xs text-blue-600 font-medium truncate">
                  Total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 rounded-2xl">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-xl">🌱</span>
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-green-700 leading-tight">
                  {soilTests.length}
                </div>
                <div className="text-[10px] sm:text-xs text-green-600 font-medium truncate">
                  Soil
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 rounded-2xl">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-xl">🍃</span>
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-emerald-700 leading-tight">
                  {petioleTests.length}
                </div>
                <div className="text-[10px] sm:text-xs text-emerald-600 font-medium truncate">
                  Petiole
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 rounded-2xl">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold text-purple-700 leading-tight">
                  {allTests.length > 0
                    ? `${Math.ceil((Date.now() - new Date(allTests[0].test.date).getTime()) / 86_400_000)}d`
                    : '—'}
                </div>
                <div className="text-[10px] sm:text-xs text-purple-600 font-medium truncate">
                  Since Last
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filters</span>
              </div>
              <Badge variant="secondary" className="text-[10px] sm:text-xs h-5">
                {filteredTests.length} results
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-3">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Type</span>
                <Select
                  value={testTypeFilter}
                  onValueChange={(v) => setTestTypeFilter(v as TestType)}
                >
                  <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    <SelectItem value="soil">Soil Only</SelectItem>
                    <SelectItem value="petiole">Petiole Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Period</span>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
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
          </div>
        </CardContent>
      </Card>

      {/* Tests Timeline */}
      {displayedTests.length > 0 ? (
        <div className="space-y-2 sm:space-y-4">
          {displayedTests.map((item) => (
            <TestDetailsCard
              key={`${item.type}-${item.test.id}`}
              test={item.test}
              testType={item.type}
              previousTest={getPreviousTest(item.test, item.type)}
              farmId={farmId}
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
