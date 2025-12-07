import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConsultantService } from '@/lib/consultant-service'
import { logger } from '@/lib/logger'
import {
  type FertilizerRecommendation,
  type FertilizerRecommendationInsert,
  type FertilizerRecommendationItem,
  type ConsultantClient,
  FERTILIZER_UNITS,
  APPLICATION_METHODS
} from '@/types/consultant'

export interface FertilizerItemForm {
  id?: number
  tempId: string
  fertilizerName: string
  quantity: string
  unit: string
  brand?: string
  applicationMethod?: string
  frequency?: string
  timing?: string
  estimatedCost?: string
  notes?: string
}

export function createEmptyItem(): FertilizerItemForm {
  return {
    tempId: Math.random().toString(36).substring(7),
    fertilizerName: '',
    quantity: '',
    unit: FERTILIZER_UNITS[0].value,
    brand: '',
    applicationMethod: APPLICATION_METHODS[0].value,
    frequency: '',
    timing: '',
    estimatedCost: '',
    notes: ''
  }
}

export function useRecommendationForm(clientId: number) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<FertilizerItemForm[]>([createEmptyItem()])
  const [client, setClient] = useState<ConsultantClient | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientFarmId: undefined as number | undefined
  })

  // Load client details
  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ConsultantService.getClientWithDetails(clientId)
      setClient(data)
    } catch (error) {
      logger.error('Error loading client:', error)
      toast.error('Failed to load client details')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  // Item management
  const addItem = () => {
    setItems([...items, createEmptyItem()])
  }

  const removeItem = (tempId: string) => {
    if (items.length === 1) {
      toast.error('You must have at least one fertilizer recommendation item')
      return
    }
    setItems(items.filter((item) => item.tempId !== tempId))
  }

  const updateItem = (tempId: string, field: keyof FertilizerItemForm, value: string) => {
    setItems(items.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item)))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return
    }

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const [movedItem] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, movedItem)
    setItems(newItems)
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title for the recommendation')
      return false
    }

    for (const item of items) {
      if (!item.fertilizerName.trim()) {
        toast.error('All items must have a fertilizer name')
        return false
      }
      if (!item.quantity.trim()) {
        toast.error(`Please enter quantity for ${item.fertilizerName}`)
        return false
      }
    }

    return true
  }

  const handleSave = async (sendImmediately: boolean = false) => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // 1. Create recommendation
      const recommendationData: FertilizerRecommendationInsert = {
        clientId,
        clientFarmId: formData.clientFarmId,
        title: formData.title,
        description: formData.description,
        status: sendImmediately ? 'sent' : 'draft'
        // validUntil: formData.validUntil, // TODO: Check if type supports this
        // sentAt: sendImmediately ? new Date().toISOString() : undefined,
        // totalCost: calculateTotalCost()
      }

      const recommendation = await ConsultantService.createRecommendation(recommendationData)

      // 2. Create items
      const itemsData = items.map((item, index) => ({
        recommendationId: recommendation.id,
        fertilizerName: item.fertilizerName,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        brand: item.brand,
        applicationMethod: item.applicationMethod,
        frequency: item.frequency,
        timing: item.timing,
        estimatedCost: parseFloat(item.estimatedCost || '0'),
        notes: item.notes,
        sortOrder: index
      }))

      await ConsultantService.bulkCreateRecommendationItems(recommendation.id, itemsData)

      toast.success(
        sendImmediately ? 'Recommendation sent successfully' : 'Recommendation saved successfully'
      )

      router.push(`/clients/${clientId}`)
    } catch (error) {
      logger.error('Error saving recommendation:', error)
      toast.error('Failed to save recommendation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateTotalCost = (): number => {
    return items.reduce((sum, item) => sum + (parseFloat(item.estimatedCost || '0') || 0), 0)
  }

  return {
    client,
    loading,
    isSubmitting,
    items,
    formData,
    setFormData,
    loadClient,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    handleSave,
    calculateTotalCost
  }
}
