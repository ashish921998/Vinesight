'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SupabaseService } from '@/lib/supabase-service'
import { LabTestsTimeline } from '@/components/lab-tests/LabTestsTimeline'
import { LabTestTrendCharts } from '@/components/lab-tests/LabTestTrendCharts'
import { SmartInsightsDashboard } from '@/components/lab-tests/SmartInsightsDashboard'
import { UnifiedDataLogsModal } from '@/components/farm-details/UnifiedDataLogsModal'
import { type LabTestRecord } from '@/components/lab-tests/TestDetailsCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  // Edit mode states for UnifiedDataLogsModal
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
  const handleModalClose = async (testType: 'soil' | 'petiole') => {
    if (testType === 'soil') {
      setShowAddSoilModal(false)
    } else {
      setShowAddPetioleModal(false)
    }
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
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/farms/${farmId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {farmName}
        </Button>
      </div>

      {/* Smart Insights Dashboard */}
      <SmartInsightsDashboard farmId={farmId} />

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
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

        <TabsContent value="trends" className="space-y-4">
          <LabTestTrendCharts soilTests={soilTests} petioleTests={petioleTests} />
        </TabsContent>
      </Tabs>

      {/* Soil Test Modal */}
      {showAddSoilModal && (
        <UnifiedDataLogsModal
          farmId={farmId}
          isOpen={showAddSoilModal}
          onClose={() => handleModalClose('soil')}
          mode={editingTest ? 'edit' : 'add'}
          initialDate={editingTest?.test.date || new Date().toISOString().split('T')[0]}
          initialLogs={
            editingTest
              ? [
                  {
                    type: 'soil_test',
                    data: {
                      ...editingTest.test.parameters,
                      notes: editingTest.test.notes || '',
                      date_of_pruning: editingTest.test.date_of_pruning || undefined
                    },
                    id: editingTest.test.id
                  }
                ]
              : [{ type: 'soil_test', data: {} }]
          }
          initialDayNote={null}
          allowedLogTypes={['soil_test']}
        />
      )}

      {/* Petiole Test Modal */}
      {showAddPetioleModal && (
        <UnifiedDataLogsModal
          farmId={farmId}
          isOpen={showAddPetioleModal}
          onClose={() => handleModalClose('petiole')}
          mode={editingTest ? 'edit' : 'add'}
          initialDate={editingTest?.test.date || new Date().toISOString().split('T')[0]}
          initialLogs={
            editingTest
              ? [
                  {
                    type: 'petiole_test',
                    data: {
                      ...editingTest.test.parameters,
                      notes: editingTest.test.notes || '',
                      date_of_pruning: editingTest.test.date_of_pruning || undefined
                    },
                    id: editingTest.test.id
                  }
                ]
              : [{ type: 'petiole_test', data: {} }]
          }
          initialDayNote={null}
          allowedLogTypes={['petiole_test']}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lab Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deletingTest?.type === 'soil' ? 'soil' : 'petiole'} test? This action cannot be undone.
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
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
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
