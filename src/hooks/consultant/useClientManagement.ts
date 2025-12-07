import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConsultantService } from '@/lib/consultant-service'
import { logger } from '@/lib/logger'
import type { ConsultantClient, ConsultantClientInsert, ClientSummary } from '@/types/consultant'

export function useClientManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ConsultantService.getClientsSummary()
      setClients(data)
    } catch (error) {
      logger.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleAddClient = async (formData: ConsultantClientInsert) => {
    try {
      setIsSubmitting(true)
      await ConsultantService.createConsultantClient(formData)
      toast.success('Client added successfully')
      setShowAddModal(false)
      fetchClients()
    } catch (error) {
      logger.error('Error creating client:', error)
      toast.error('Failed to create client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this client? This will delete all associated farms, reports and recommendations.'
      )
    )
      return

    try {
      await ConsultantService.deleteClient(id)
      toast.success('Client deleted successfully')
      fetchClients()
    } catch (error) {
      logger.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.clientEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return {
    clients,
    loading,
    showAddModal,
    setShowAddModal,
    isSubmitting,
    searchTerm,
    setSearchTerm,
    filteredClients,
    handleAddClient,
    handleDeleteClient,
    refreshClients: fetchClients
  }
}
