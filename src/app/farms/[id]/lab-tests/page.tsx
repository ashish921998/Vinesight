'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { LabTestsTimeline } from '@/components/lab-tests/LabTestsTimeline'
import { LabTestTrendCharts } from '@/components/lab-tests/LabTestTrendCharts'
import { LabTestComparisonTable } from '@/components/lab-tests/LabTestComparisonTable'
import { LabTestModal } from '@/components/lab-tests/LabTestModal'
import { type LabTestRecord } from '@/components/lab-tests/TestDetailsCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2, LineChart, Table2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function LabTestsPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [soilTests, setSoilTests] = useState<LabTestRecord[]>([])
  const [petioleTests, setPetioleTests] = useState<LabTestRecord[]>([])
  const [farmName, setFarmName] = useState<string>('')

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
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingTest, setDeletingTest] = useState<{
    test: LabTestRecord
    type: 'soil' | 'petiole'
  } | null>(null)

  // Edit mode states for LabTestModal
  const [editingTest, setEditingTest] = useState<{
    test: LabTestRecord
    type: 'soil' | 'petiole'
  } | null>(null)

  // Load data
  const loadLabTests = useCallback(async () => {
    try {
      setLoading(true)

      const [soilTestsData, petioleTestsData, farmData] = await Promise.all([
        SupabaseService.getSoilTestRecords(farmId),
        SupabaseService.getPetioleTestRecords(farmId),
        SupabaseService.getFarmById(farmId)
      ])

      setSoilTests(soilTestsData || [])
      setPetioleTests(petioleTestsData || [])
      setFarmName(farmData?.name || 'Farm')
    } catch (error) {
      console.error('Error loading lab tests:', error)
      toast.error('Failed to load lab tests')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    loadLabTests()
  }, [loadLabTests])

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
      setIsDeleting(true)

      if (deletingTest.type === 'soil') {
        await SupabaseService.deleteSoilTestRecord(deletingTest.test.id)
        setSoilTests((prev) => prev.filter((t) => t.id !== deletingTest.test.id))
        toast.success('Soil test deleted successfully')
      } else {
        await SupabaseService.deletePetioleTestRecord(deletingTest.test.id)
        setPetioleTests((prev) => prev.filter((t) => t.id !== deletingTest.test.id))
        toast.success('Petiole test deleted successfully')
      }

      setShowDeleteDialog(false)
      setDeletingTest(null)
    } catch (error) {
      console.error('Error deleting test:', error)
      toast.error('Failed to delete test')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle modal close and refresh
  const handleModalClose = async () => {
    setShowAddSoilModal(false)
    setShowAddPetioleModal(false)
    setEditingTest(null)

    // Reload tests to get the latest data
    await loadLabTests()
  }

  // Helper to transform LabTestRecord to modal format
  const transformTestForModal = (test: LabTestRecord) => {
    if (!test.id) return undefined
    return {
      id: test.id,
      date: test.date,
      date_of_pruning:
        test.date_of_pruning instanceof Date
          ? test.date_of_pruning.toISOString().split('T')[0]
          : test.date_of_pruning || null,
      parameters: test.parameters || {},
      notes: test.notes || null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading lab tests...</p>
        </div>
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
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between gap-2 px-1">
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? (
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
