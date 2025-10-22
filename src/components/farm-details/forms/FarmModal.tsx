'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { SearchableCombobox } from '@/components/ui/searchable-combobox'
import { cropOptions, getVarietiesForCrop, addCustomVariety, normalizeCropName } from '@/data/crops'
import { cn } from '@/lib/utils'
import { LocationForm } from '@/components/calculators/ETc/LocationForm'
import type { LocationResult } from '@/lib/open-meteo-geocoding'
import type { Farm } from '@/types/types'

interface FarmModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (farmData: any) => Promise<void>
  editingFarm?: Farm | null
  isSubmitting?: boolean
}

interface FormData {
  name: string
  region: string
  area: string
  cropName: string
  cropVariety: string
  plantingDate: string
  vineSpacing: string
  rowSpacing: string
  totalTankCapacity: string
  systemDischarge: string
  dateOfPruning?: Date
}

interface LocationData {
  latitude: string
  longitude: string
  elevation: string
  locationName: string
}

export function FarmModal({
  isOpen,
  onClose,
  onSubmit,
  editingFarm = null,
  isSubmitting = false
}: FarmModalProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    const initialCropVariety = editingFarm?.cropVariety || editingFarm?.grapeVariety || ''
    const initialCropName =
      editingFarm?.cropName || (initialCropVariety ? 'Grapes' : '')

    return {
      name: editingFarm?.name || '',
      region: editingFarm?.region || '',
      area: editingFarm?.area?.toString() || '',
      cropName: initialCropName,
      cropVariety: initialCropVariety,
      plantingDate: editingFarm?.plantingDate || '',
      vineSpacing: editingFarm?.vineSpacing?.toString() || '',
      rowSpacing: editingFarm?.rowSpacing?.toString() || '',
      totalTankCapacity: editingFarm?.totalTankCapacity?.toString() || '',
      systemDischarge: editingFarm?.systemDischarge?.toString() || '',
      dateOfPruning: editingFarm?.dateOfPruning || new Date()
    }
  })

  const [locationData, setLocationData] = useState<LocationData>(() => ({
    latitude: editingFarm?.latitude?.toString() || '',
    longitude: editingFarm?.longitude?.toString() || '',
    elevation: editingFarm?.elevation?.toString() || '',
    locationName: editingFarm?.locationName || ''
  }))
  const [formError, setFormError] = useState<string | null>(null)

  const varietyOptions = useMemo(() => {
    return getVarietiesForCrop(formData.cropName).map((variety) => ({
      value: variety,
      label: variety
    }))
  }, [formData.cropName])

  // Update form data when editingFarm prop changes
  useEffect(() => {
    if (editingFarm) {
      const updatedCropVariety = editingFarm.cropVariety || editingFarm.grapeVariety || ''
      const updatedCropName = editingFarm.cropName || (updatedCropVariety ? 'Grapes' : '')

      setFormData({
        name: editingFarm.name || '',
        region: editingFarm.region || '',
        area: editingFarm.area?.toString() || '',
        cropName: updatedCropName,
        cropVariety: updatedCropVariety,
        plantingDate: editingFarm.plantingDate || '',
        vineSpacing: editingFarm.vineSpacing?.toString() || '',
        rowSpacing: editingFarm.rowSpacing?.toString() || '',
        totalTankCapacity: editingFarm.totalTankCapacity?.toString() || '',
        systemDischarge: editingFarm.systemDischarge?.toString() || '',
        dateOfPruning: editingFarm.dateOfPruning || new Date()
      })

      setLocationData({
        latitude: editingFarm.latitude?.toString() || '',
        longitude: editingFarm.longitude?.toString() || '',
        elevation: editingFarm.elevation?.toString() || '',
        locationName: editingFarm.locationName || ''
      })
      setFormError(null)
    } else {
      // Reset form when not editing (adding new farm)
      setFormData({
        name: '',
        region: '',
        area: '',
        cropName: '',
        cropVariety: '',
        plantingDate: '',
        vineSpacing: '',
        rowSpacing: '',
        totalTankCapacity: '',
        systemDischarge: '',
        dateOfPruning: new Date()
      })

      setLocationData({
        latitude: '',
        longitude: '',
        elevation: '',
        locationName: ''
      })
      setFormError(null)
    }
  }, [editingFarm])

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'dateOfPruning') {
      setFormData((prev) => ({
        ...prev,
        [field]: value ? new Date(value) : undefined
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleLocationChange = (field: string, value: string) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationSelect = (location: LocationResult) => {
    setLocationData({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      elevation: location.elevation.toString(),
      locationName: `${location.name}, ${location.admin1 || ''} ${location.country}`.trim()
    })

    // Also update the region if it's empty
    if (!formData.region) {
      const regionName = location.admin1 ? `${location.name}, ${location.admin1}` : location.name
      handleInputChange('region', regionName)
    }
  }

  const handleCropNameSelect = (selected: string) => {
    const normalizedName = normalizeCropName(selected)
    const availableForCrop = getVarietiesForCrop(normalizedName)

    setFormData((prev) => ({
      ...prev,
      cropName: normalizedName,
      cropVariety: availableForCrop.includes(prev.cropVariety) ? prev.cropVariety : ''
    }))
    setFormError(null)
  }

  const handleCropVarietySelect = (selected: string) => {
    const normalizedVariety = normalizeCropName(selected)

    if (formData.cropName) {
      addCustomVariety(formData.cropName, normalizedVariety)
    }

    setFormData((prev) => ({
      ...prev,
      cropVariety: normalizedVariety
    }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cropNameMissing = !formData.cropName.trim()
    const cropVarietyMissing = !formData.cropVariety.trim()

    if (cropNameMissing || cropVarietyMissing) {
      setFormError(
        cropNameMissing && cropVarietyMissing
          ? 'Please select a crop name and crop variety.'
          : cropNameMissing
            ? 'Please select a crop name.'
            : 'Please select a crop variety.'
      )
      return
    }

    const normalizedCropName = normalizeCropName(formData.cropName)
    const normalizedCropVariety = normalizeCropName(formData.cropVariety)
    setFormError(null)

    const farmData = {
      name: formData.name,
      region: formData.region,
      area: parseFloat(formData.area),
      cropName: normalizedCropName,
      cropVariety: normalizedCropVariety,
      grapeVariety: normalizedCropVariety,
      plantingDate: formData.plantingDate,
      vineSpacing: parseFloat(formData.vineSpacing),
      rowSpacing: parseFloat(formData.rowSpacing),
      totalTankCapacity: formData.totalTankCapacity
        ? parseFloat(formData.totalTankCapacity)
        : undefined,
      systemDischarge: formData.systemDischarge ? parseFloat(formData.systemDischarge) : undefined,
      dateOfPruning: formData.dateOfPruning || undefined,
      latitude: locationData.latitude ? parseFloat(locationData.latitude) : undefined,
      longitude: locationData.longitude ? parseFloat(locationData.longitude) : undefined,
      elevation: locationData.elevation ? parseInt(locationData.elevation) : undefined,
      location_name: locationData.locationName || undefined,
      location_source:
        locationData.latitude && locationData.longitude ? ('search' as const) : undefined,
      location_updated_at:
        locationData.latitude && locationData.longitude ? new Date().toISOString() : undefined
    }
    await onSubmit(farmData)
  }

  const cropNameHasError = !!formError && !formData.cropName.trim()
  const cropVarietyHasError = !!formError && !formData.cropVariety.trim()

  const resetAndClose = () => {
    // Form data will be reset by useEffect when editingFarm changes
    setFormError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] w-[95vw] mx-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {editingFarm ? 'Edit Farm' : 'Add New Farm'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {editingFarm ? 'Update your farm details' : 'Enter your farm details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-4">
            {/* Farm Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Farm Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Nashik Vineyard"
                required
                className="mt-1 h-11"
              />
            </div>

            {/* Region */}
            <div>
              <Label htmlFor="region" className="text-sm font-medium text-gray-700">
                Region *
              </Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                placeholder="e.g., Nashik, Maharashtra"
                required
                className="mt-1 h-11"
              />
            </div>

            {/* Area and Crop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                  Area (acres) *
                </Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="6.2"
                  required
                  className="mt-1 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Primary Crop *</Label>
                <SearchableCombobox
                  value={formData.cropName}
                  onSelect={handleCropNameSelect}
                  options={cropOptions}
                  placeholder="Select crop"
                  searchPlaceholder="Search crops..."
                  allowCustom
                  className="mt-1"
                  buttonClassName={cn(
                    'h-11',
                    cropNameHasError && 'border-red-500 focus-visible:ring-red-500 focus-visible:ring-offset-0'
                  )}
                  createLabel={(value) => `Add "${normalizeCropName(value)}"`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search the global crop list or add your own crop name.
                </p>
                {cropNameHasError && (
                  <p className="text-xs text-red-600 mt-1">Crop name is required.</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Crop Variety *</Label>
              <SearchableCombobox
                value={formData.cropVariety}
                onSelect={handleCropVarietySelect}
                options={varietyOptions}
                placeholder={
                  formData.cropName ? `Select ${formData.cropName} variety` : 'Select crop first'
                }
                searchPlaceholder="Search varieties..."
                allowCustom
                disabled={!formData.cropName}
                className="mt-1"
                buttonClassName={cn(
                  'h-11',
                  !formData.cropName && 'bg-muted text-muted-foreground cursor-not-allowed',
                  cropVarietyHasError &&
                    'border-red-500 focus-visible:ring-red-500 focus-visible:ring-offset-0'
                )}
                createLabel={(value) => `Add "${normalizeCropName(value)}"`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a listed variety or add a custom entry.
              </p>
              {cropVarietyHasError && (
                <p className="text-xs text-red-600 mt-1">Crop variety is required.</p>
              )}
            </div>

            {/* Planting Date */}
            <div>
              <Label htmlFor="plantingDate" className="text-sm font-medium text-gray-700">
                Planting Date *
              </Label>
              <Input
                id="plantingDate"
                type="date"
                value={formData.plantingDate}
                onChange={(e) => handleInputChange('plantingDate', e.target.value)}
                required
                className="mt-1 h-11"
              />
            </div>

            {/* Vine and Row Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vineSpacing" className="text-sm font-medium text-gray-700">
                  Vine Spacing (m) *
                </Label>
                <Input
                  id="vineSpacing"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.vineSpacing}
                  onChange={(e) => handleInputChange('vineSpacing', e.target.value)}
                  placeholder="3.0"
                  required
                  className="mt-1 h-11"
                />
              </div>
              <div>
                <Label htmlFor="rowSpacing" className="text-sm font-medium text-gray-700">
                  Row Spacing (m) *
                </Label>
                <Input
                  id="rowSpacing"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.rowSpacing}
                  onChange={(e) => handleInputChange('rowSpacing', e.target.value)}
                  placeholder="9.0"
                  required
                  className="mt-1 h-11"
                />
              </div>
            </div>

            {/* Total Tank Capacity */}
            <div>
              <Label htmlFor="totalTankCapacity" className="text-sm font-medium text-gray-700">
                Total Tank Capacity (liters)
              </Label>
              <Input
                id="totalTankCapacity"
                type="number"
                step="1"
                min="0"
                value={formData.totalTankCapacity}
                onChange={(e) => handleInputChange('totalTankCapacity', e.target.value)}
                placeholder="1000"
                className="mt-1 h-11"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Enter tank capacity for water calculations
              </p>
            </div>

            {/* System Discharge */}
            <div>
              <Label htmlFor="systemDischarge" className="text-sm font-medium text-gray-700">
                System Discharge
              </Label>
              <Input
                id="systemDischarge"
                type="number"
                step="0.0001"
                min="0"
                value={formData.systemDischarge}
                onChange={(e) => handleInputChange('systemDischarge', e.target.value)}
                placeholder="100.5000"
                className="mt-1 h-11"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Default irrigation system discharge rate
              </p>
            </div>

            {/* Pruning Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Pruning (Optional)</h4>
                <p className="text-xs text-gray-500">Track pruning activities for your vineyard</p>
              </div>

              {/* Pruning Fields */}
              <div>
                <Label htmlFor="dateOfPruning" className="text-sm font-medium text-gray-700">
                  Date of Pruning
                </Label>
                <Input
                  id="dateOfPruning"
                  type="date"
                  value={
                    formData.dateOfPruning ? formData.dateOfPruning.toISOString().split('T')[0] : ''
                  }
                  onChange={(e) => handleInputChange('dateOfPruning', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1 h-11"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Location (Optional)</h4>
                <p className="text-xs text-gray-500">
                  Add precise location for weather data and mapping features
                </p>
              </div>
              <LocationForm
                formData={locationData}
                onInputChange={handleLocationChange}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="flex-1 h-11 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 order-1 sm:order-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingFarm ? 'Updating...' : 'Adding...'}
                </>
              ) : editingFarm ? (
                'Update Farm'
              ) : (
                'Add Farm'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
