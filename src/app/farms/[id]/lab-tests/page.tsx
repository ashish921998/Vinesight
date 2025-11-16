'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { LabTestsTimeline } from '@/components/lab-tests/LabTestsTimeline'
import { LabTestTrendCharts } from '@/components/lab-tests/LabTestTrendCharts'
// Phase 3A - Commented out for initial launch
// import { SmartInsightsDashboard } from '@/components/lab-tests/SmartInsightsDashboard'
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
import { ArrowLeft, Loader2 } from 'lucide-react'
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
    if (!deletingTest) return

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
          <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
            Lab Tests
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
            Track and analyze soil and petiole test results
          </p>
        </div>
      </div>

      {/* Phase 3A - Commented out for initial launch */}
      {/* <SmartInsightsDashboard farmId={farmId} /> */}

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-2 sm:space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 rounded-2xl">
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

        <TabsContent value="trends" className="mt-0">
          <LabTestTrendCharts soilTests={soilTests} petioleTests={petioleTests} />
        </TabsContent>
      </Tabs>

      {/* Soil Test Modal */}
      <LabTestModal
        isOpen={showAddSoilModal}
        onClose={handleModalClose}
        testType="soil"
        farmId={farmId}
        mode={editingTest?.type === 'soil' ? 'edit' : 'add'}
        existingTest={editingTest?.type === 'soil' ? editingTest.test : undefined}
      />

      {/* Petiole Test Modal */}
      <LabTestModal
        isOpen={showAddPetioleModal}
        onClose={handleModalClose}
        testType="petiole"
        farmId={farmId}
        mode={editingTest?.type === 'petiole' ? 'edit' : 'add'}
        existingTest={editingTest?.type === 'petiole' ? editingTest.test : undefined}
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
