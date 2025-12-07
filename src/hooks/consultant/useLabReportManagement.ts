import { useState } from 'react'
import { toast } from 'sonner'
import { ConsultantService } from '@/lib/consultant-service'
import { logger } from '@/lib/logger'
import type { ClientLabReportInsert } from '@/types/consultant'

export function useLabReportManagement(clientId: number, onSuccess: () => void) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reportForm, setReportForm] = useState<ClientLabReportInsert>({
    clientId: clientId,
    reportType: 'soil',
    testDate: new Date().toISOString().split('T')[0],
    labName: '',
    parameters: {},
    notes: ''
  })

  const resetReportForm = () => {
    setReportForm({
      clientId: clientId,
      reportType: 'soil',
      testDate: new Date().toISOString().split('T')[0],
      labName: '',
      parameters: {},
      notes: ''
    })
  }

  const handleAddReport = async () => {
    try {
      setIsSubmitting(true)
      await ConsultantService.createLabReport({ ...reportForm, clientId })
      toast.success('Report added successfully')
      setShowReportModal(false)
      resetReportForm()
      onSuccess()
    } catch (error) {
      logger.error('Error saving report:', error)
      toast.error('Failed to save report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      await ConsultantService.deleteLabReport(reportId)
      toast.success('Report deleted successfully')
      onSuccess()
    } catch (error) {
      logger.error('Error deleting report:', error)
      toast.error('Failed to delete report')
    }
  }

  return {
    showReportModal,
    setShowReportModal,
    isSubmitting,
    reportForm,
    setReportForm,
    handleAddReport,
    handleDeleteReport,
    resetReportForm
  }
}
