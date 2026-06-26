'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { LabTestsTimeline } from '@/components/lab-tests/LabTestsTimeline'
import { LabTestTrendCharts } from '@/components/lab-tests/LabTestTrendCharts'
import { LabTestComparisonTable } from '@/components/lab-tests/LabTestComparisonTable'
import { LabTestModal } from '@/components/lab-tests/LabTestModal'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2, LineChart, Table2, Droplets } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { farmKeys } from '@/lib/farm-query-keys'
import { useDeleteFarmLabTest, useFarm, useFarmLabTests } from '@/hooks/farms/useFarmQueries'
import { LabTestRecord } from '@/types/lab-tests'

function LabTestsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const parsedFarmId = Number(params.id)
  const farmId = Number.isSafeInteger(parsedFarmId) && parsedFarmId > 0 ? parsedFarmId : NaN
  const farmIdValid = Number.isFinite(farmId)
  const queryFarmId = farmIdValid ? farmId : null
  const labTestsQuery = useFarmLabTests(queryFarmId)
  const farmQuery = useFarm(queryFarmId)
  const deleteLabTestMutation = useDeleteFarmLabTest(farmId)
  const soilTests = labTestsQuery.data?.soilTests ?? []
  const petioleTests = labTestsQuery.data?.petioleTests ?? []
  const farmName = farmQuery.data?.name || 'Farm'
  // Gate on farmIdValid: a disabled React Query v5 query stays `pending` forever,
  // so without this an invalid route would render the skeleton indefinitely.
  const loading = farmIdValid && labTestsQuery.isPending

  // View mode state - initialize with server-safe default
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [userSelected, setUserSelected] = useState(false)

  // Set initial view mode based on screen size (client-side only)
  useEffect(() => {
    const handleResize = () => {
      // Only update viewMode based on window size if user hasn't manually selected
      if (!userSelected) {
        setViewMode(window.innerWidth < 640 ? 'table' : 'chart')
      }
    }

    // Set initial value
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [userSelected])

  // Modal states
  const [showAddSoilModal, setShowAddSoilModal] = useState(false)
  const [showAddPetioleModal, setShowAddPetioleModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingTest, setDeletingTest] = useState<{
    test: LabTestRecord
    type: 'soil' | 'petiole'
  } | null>(null)

  // Edit mode states for LabTestModal
  const [editingTest, setEditingTest] = useState<{
    test: LabTestRecord
    type: 'soil' | 'petiole'
  } | null>(null)

  useEffect(() => {
    if (labTestsQuery.isError) {
      toast.error('Failed to load lab tests')
    }
  }, [labTestsQuery.isError])

  const invalidateLabTestState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: farmKeys.labTests(farmId) }),
      queryClient.invalidateQueries({ queryKey: farmKeys.summary(farmId) })
    ])
  }

  // Handle adding new tests
  const handleAddSoilTest = () => {
    setEditingTest(null)
    setShowAddSoilModal(true)
  }

  const handleAddPetioleTest = () => {
    setEditingTest(null)
    setShowAddPetioleModal(true)
  }

  // Handle editing tests
  const handleEditSoilTest = (test: LabTestRecord) => {
    setEditingTest({ test, type: 'soil' })
    setShowAddSoilModal(true)
  }

  const handleEditPetioleTest = (test: LabTestRecord) => {
    setEditingTest({ test, type: 'petiole' })
    setShowAddPetioleModal(true)
  }

  // Handle delete
  const handleDeleteRequest = (test: LabTestRecord, type: 'soil' | 'petiole') => {
    setDeletingTest({ test, type })
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTest || !deletingTest.test.id) return

    try {
      await deleteLabTestMutation.mutateAsync({
        id: deletingTest.test.id,
        type: deletingTest.type
      })
      toast.success(
        deletingTest.type === 'soil'
          ? 'Soil test deleted successfully'
          : 'Petiole test deleted successfully'
      )
      setShowDeleteDialog(false)
      setDeletingTest(null)
    } catch (error) {
      console.error('Error deleting test:', error)
      toast.error('Failed to delete test')
    }
  }

  // Handle modal close and refresh
  const handleModalClose = async () => {
    setShowAddSoilModal(false)
    setShowAddPetioleModal(false)
    setEditingTest(null)

    // Reload tests to get the latest data
    await invalidateLabTestState()
  }

  // Helper to transform LabTestRecord to modal format
  const transformTestForModal = (test: LabTestRecord) => {
    if (!test.id) return undefined
    return {
      id: test.id,
      date: typeof test.date === 'string' ? test.date : test.date.toISOString().split('T')[0],
      date_of_pruning:
        typeof test.date_of_pruning === 'string'
          ? test.date_of_pruning
          : (test.date_of_pruning?.toISOString().split('T')[0] ?? null),
      parameters: test.parameters ?? {},
      notes: test.notes
    }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-3 sm:p-6 space-y-2 sm:space-y-6">
        <output className="sr-only" aria-live="polite">
          Loading lab tests...
        </output>
        {/* Header */}
        <div className="space-y-1.5 sm:space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72 hidden sm:block" />
          </div>
        </div>

        {/* Tabs */}
        <Skeleton className="h-14 w-full max-w-md rounded-2xl" />

        {/* Content */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!farmIdValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="p-6">
          <CardTitle className="text-base">Invalid farm</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Please return and select a farm.</p>
          <Button className="mt-3" onClick={() => router.push('/farms')}>
            Back to farms
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-3 sm:p-6 space-y-2 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1.5 sm:space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/farms/${farmId}`)}
          className="flex items-center gap-2 -ml-2 h-8 sm:h-9"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Back to {farmName}</span>
          <span className="sm:hidden text-xs">Back</span>
        </Button>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">Lab Tests</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
            Track and analyze soil and petiole test results
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-2 sm:space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-14 rounded-2xl">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm rounded-2xl">
            <span className="hidden sm:inline">Timeline View</span>
            <span className="sm:hidden">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm rounded-2xl">
            <span className="hidden sm:inline">Trend Analysis</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-0">
          <LabTestsTimeline
            soilTests={soilTests}
            petioleTests={petioleTests}
            farmId={farmId}
            onAddSoilTest={handleAddSoilTest}
            onAddPetioleTest={handleAddPetioleTest}
            onEditSoilTest={handleEditSoilTest}
            onEditPetioleTest={handleEditPetioleTest}
            onDeleteSoilTest={(test) => handleDeleteRequest(test, 'soil')}
            onDeletePetioleTest={(test) => handleDeleteRequest(test, 'petiole')}
          />
        </TabsContent>

        <TabsContent value="trends" className="mt-0 space-y-3">
          <section className="px-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-semibold">Lab Tests</h1>
                <p className="text-sm text-muted-foreground">
                  Compare soil and petiole results. Link photos and reports.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2"
                onClick={() => router.push(`/farms/${farmId}/soil-profiling`)}
              >
                <Droplets className="h-4 w-4" />
                Soil profiling
              </Button>
            </div>
          </section>
          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Choose your preferred view:</p>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant={viewMode === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('chart')
                  setUserSelected(true)
                }}
                className="flex items-center gap-1.5 h-8 sm:h-9 text-xs"
              >
                <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Charts</span>
                <span className="sm:hidden">Chart</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('table')
                  setUserSelected(true)
                }}
                className="flex items-center gap-1.5 h-8 sm:h-9 text-xs"
              >
                <Table2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Table</span>
                <span className="sm:hidden">Table</span>
              </Button>
            </div>
          </div>

          {/* Conditional Rendering based on view mode */}
          {viewMode === 'chart' ? (
            <LabTestTrendCharts soilTests={soilTests} petioleTests={petioleTests} />
          ) : (
            <LabTestComparisonTable soilTests={soilTests} petioleTests={petioleTests} />
          )}
        </TabsContent>
      </Tabs>

      {/* Soil Test Modal */}
      <LabTestModal
        isOpen={showAddSoilModal}
        onClose={handleModalClose}
        testType="soil"
        farmId={farmId}
        mode={editingTest?.type === 'soil' ? 'edit' : 'add'}
        existingTest={
          editingTest?.type === 'soil' ? transformTestForModal(editingTest.test) : undefined
        }
      />

      {/* Petiole Test Modal */}
      <LabTestModal
        isOpen={showAddPetioleModal}
        onClose={handleModalClose}
        testType="petiole"
        farmId={farmId}
        mode={editingTest?.type === 'petiole' ? 'edit' : 'add'}
        existingTest={
          editingTest?.type === 'petiole' ? transformTestForModal(editingTest.test) : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lab Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{' '}
              {deletingTest?.type === 'soil' ? 'soil' : 'petiole'} test? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLabTestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLabTestMutation.isPending}
            >
              {deleteLabTestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Test'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LabTestsPageWithAuth() {
  return (
    <ProtectedRoute>
      <LabTestsPage />
    </ProtectedRoute>
  )
}
