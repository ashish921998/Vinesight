import { useState } from 'react'
import { toast } from 'sonner'
import { ConsultantService } from '@/lib/consultant-service'
import { logger } from '@/lib/logger'
import type { ClientFarm, ClientFarmInsert } from '@/types/consultant'

export function useFarmManagement(clientId: number, onSuccess: () => void) {
  const [showFarmModal, setShowFarmModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState<ClientFarm | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [farmForm, setFarmForm] = useState<ClientFarmInsert>({
    clientId: clientId,
    farmName: '',
    area: undefined,
    areaUnit: 'acres',
    grapeVariety: '',
    village: '',
    district: '',
    soilType: '',
    irrigationType: ''
  })

  const resetFarmForm = () => {
    setFarmForm({
      clientId: clientId,
      farmName: '',
      area: undefined,
      areaUnit: 'acres',
      grapeVariety: '',
      village: '',
      district: '',
      soilType: '',
      irrigationType: ''
    })
  }

  const openEditFarm = (farm: ClientFarm) => {
    setEditingFarm(farm)
    setFarmForm({
      clientId: farm.clientId,
      farmName: farm.farmName,
      area: farm.area || undefined,
      areaUnit: farm.areaUnit || 'acres',
      grapeVariety: farm.grapeVariety || '',
      village: farm.village || '',
      district: farm.district || '',
      soilType: farm.soilType || '',
      irrigationType: farm.irrigationType || ''
    })
    setShowFarmModal(true)
  }

  const handleAddFarm = async () => {
    if (!farmForm.farmName.trim()) {
      toast.error('Farm name is required')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingFarm) {
        await ConsultantService.updateClientFarm(editingFarm.id, farmForm)
        toast.success('Farm updated successfully')
      } else {
        await ConsultantService.createClientFarm({ ...farmForm, clientId })
        toast.success('Farm added successfully')
      }
      setShowFarmModal(false)
      setEditingFarm(null)
      resetFarmForm()
      onSuccess()
    } catch (error) {
      logger.error('Error saving farm:', error)
      toast.error('Failed to save farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFarm = async (farmId: number) => {
    if (!confirm('Are you sure you want to delete this farm?')) return

    try {
      await ConsultantService.deleteClientFarm(farmId)
      toast.success('Farm deleted successfully')
      onSuccess()
    } catch (error) {
      logger.error('Error deleting farm:', error)
      toast.error('Failed to delete farm')
    }
  }

  return {
    showFarmModal,
    setShowFarmModal,
    editingFarm,
    setEditingFarm,
    isSubmitting,
    farmForm,
    setFarmForm,
    handleAddFarm,
    handleDeleteFarm,
    openEditFarm,
    resetFarmForm
  }
}
