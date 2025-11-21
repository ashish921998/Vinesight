'use client'

import { useState, useEffect } from 'react'
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
import { LocationForm } from '@/components/calculators/ETc/LocationForm'
import { Combobox } from '@/components/ui/combobox'
import { getAllCrops, getVarietiesForCrop, getDefaultVariety } from '@/lib/crop-data'
import type { LocationResult } from '@/lib/open-meteo-geocoding'
import type { Farm, SoilType } from '@/types/types'

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
  crop: string
  cropVariety: string
  plantingDate: string
  vineSpacing: string
  rowSpacing: string
  totalTankCapacity: string
  systemDischarge: string
  dateOfPruning?: Date
  soilType: string
  waterRetention: string
}

// Soil type options for dropdown
const SOIL_TYPE_OPTIONS: { value: SoilType; label: string }[] = [
  { value: 'sand', label: 'Sand' },
  { value: 'loamy_sand', label: 'Loamy Sand' },
  { value: 'sandy_loam', label: 'Sandy Loam' },
  { value: 'loam', label: 'Loam' },
  { value: 'silt_loam', label: 'Silt Loam' },
  { value: 'silt', label: 'Silt' },
  { value: 'clay_loam', label: 'Clay Loam' },
  { value: 'silty_clay_loam', label: 'Silty Clay Loam' },
  { value: 'sandy_clay', label: 'Sandy Clay' },
  { value: 'silty_clay', label: 'Silty Clay' },
  { value: 'clay', label: 'Clay' }
]

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
  const [formData, setFormData] = useState<FormData>(() => ({
    name: editingFarm?.name || '',
    region: editingFarm?.region || '',
    area: editingFarm?.area?.toString() || '',
    crop: editingFarm?.crop || 'Grapes',
    cropVariety: editingFarm?.cropVariety || getDefaultVariety('Grapes'),
    plantingDate: editingFarm?.plantingDate || '',
    vineSpacing: editingFarm?.vineSpacing?.toString() || '',
    rowSpacing: editingFarm?.rowSpacing?.toString() || '',
    totalTankCapacity: editingFarm?.totalTankCapacity?.toString() || '',
    systemDischarge: editingFarm?.systemDischarge?.toString() || '',
    dateOfPruning: editingFarm?.dateOfPruning || new Date(),
    soilType: editingFarm?.soilType || '',
    waterRetention: editingFarm?.waterRetention?.toString() || ''
  }))

  const [locationData, setLocationData] = useState<LocationData>(() => ({
    latitude: editingFarm?.latitude?.toString() || '',
    longitude: editingFarm?.longitude?.toString() || '',
    elevation: editingFarm?.elevation?.toString() || '',
    locationName: editingFarm?.locationName || ''
  }))

  // Update form data when editingFarm prop changes
  useEffect(() => {
    if (editingFarm) {
      setFormData({
        name: editingFarm.name || '',
        region: editingFarm.region || '',
        area: editingFarm.area?.toString() || '',
        crop: editingFarm.crop || 'Grapes',
        cropVariety: editingFarm.cropVariety || getDefaultVariety(editingFarm.crop || 'Grapes'),
        plantingDate: editingFarm.plantingDate || '',
        vineSpacing: editingFarm.vineSpacing?.toString() || '',
        rowSpacing: editingFarm.rowSpacing?.toString() || '',
        totalTankCapacity: editingFarm.totalTankCapacity?.toString() || '',
        systemDischarge: editingFarm.systemDischarge?.toString() || '',
        dateOfPruning: editingFarm.dateOfPruning || new Date(),
        soilType: editingFarm.soilType || '',
        waterRetention: editingFarm.waterRetention?.toString() || ''
      })

      setLocationData({
        latitude: editingFarm.latitude?.toString() || '',
        longitude: editingFarm.longitude?.toString() || '',
        elevation: editingFarm.elevation?.toString() || '',
        locationName: editingFarm.locationName || ''
      })
    } else {
      // Reset form when not editing (adding new farm)
      setFormData({
        name: '',
        region: '',
        area: '',
        crop: 'Grapes',
        cropVariety: getDefaultVariety('Grapes'),
        plantingDate: '',
        vineSpacing: '',
        rowSpacing: '',
        totalTankCapacity: '',
        systemDischarge: '',
        dateOfPruning: new Date(),
        soilType: '',
        waterRetention: ''
      })

      setLocationData({
        latitude: '',
        longitude: '',
        elevation: '',
        locationName: ''
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const farmData = {
      name: formData.name,
      region: formData.region,
      area: parseFloat(formData.area),
      crop: formData.crop,
      cropVariety: formData.cropVariety,
      plantingDate: formData.plantingDate,
      vineSpacing: formData.vineSpacing ? parseFloat(formData.vineSpacing) : undefined,
      rowSpacing: formData.rowSpacing ? parseFloat(formData.rowSpacing) : undefined,
      totalTankCapacity: formData.totalTankCapacity
        ? parseFloat(formData.totalTankCapacity)
        : undefined,
      systemDischarge: formData.systemDischarge ? parseFloat(formData.systemDischarge) : undefined,
      dateOfPruning: formData.dateOfPruning || undefined,
      soilType: formData.soilType || undefined,
      waterRetention: formData.waterRetention ? parseFloat(formData.waterRetention) : undefined,
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

  const resetAndClose = () => {
    // Form data will be reset by useEffect when editingFarm changes
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
            {editingFarm ? 'Update your vineyard details' : 'Enter your vineyard details'}
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

            {/* Area */}
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

            {/* Crop and Crop Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Crop *</Label>
                <Combobox
                  options={getAllCrops().map((crop) => ({
                    value: crop,
                    label: crop
                  }))}
                  value={formData.crop}
                  onValueChange={(value) => {
                    handleInputChange('crop', value)
                    // Auto-set the first variety for the selected crop
                    const varieties = getVarietiesForCrop(value)
                    if (varieties.length > 0) {
                      handleInputChange('cropVariety', varieties[0])
                    }
                  }}
                  placeholder="Select a crop"
                  searchPlaceholder="Search crops..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Crop Variety *
                </Label>
                <Combobox
                  options={getVarietiesForCrop(formData.crop).map((variety) => ({
                    value: variety,
                    label: variety
                  }))}
                  value={formData.cropVariety}
                  onValueChange={(value) => handleInputChange('cropVariety', value)}
                  placeholder="Select a variety"
                  searchPlaceholder="Search varieties..."
                  allowCustom={true}
                  customPlaceholder="Type to add custom variety..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Don&apos;t see your variety? Type it in and select &quot;Add as custom
                  variety&quot;
                </p>
              </div>
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
                  Vine Spacing (m)
                </Label>
                <Input
                  id="vineSpacing"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.vineSpacing}
                  onChange={(e) => handleInputChange('vineSpacing', e.target.value)}
                  placeholder="3.0"
                  className="mt-1 h-11"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Distance between vines</p>
              </div>
              <div>
                <Label htmlFor="rowSpacing" className="text-sm font-medium text-gray-700">
                  Row Spacing (m)
                </Label>
                <Input
                  id="rowSpacing"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.rowSpacing}
                  onChange={(e) => handleInputChange('rowSpacing', e.target.value)}
                  placeholder="9.0"
                  className="mt-1 h-11"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Distance between rows</p>
              </div>
            </div>

            <div>
              <Label htmlFor="totalTankCapacity" className="text-sm font-medium text-gray-700">
                Total Tank Capacity (mm)
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

            {/* Soil and Water Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Soil & Water Properties</h4>
                <p className="text-xs text-gray-500">
                  Soil characteristics help with irrigation and nutrient calculations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Soil Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Soil Type</Label>
                  <Combobox
                    options={SOIL_TYPE_OPTIONS}
                    value={formData.soilType}
                    onValueChange={(value) => handleInputChange('soilType', value)}
                    placeholder="Select soil type"
                    searchPlaceholder="Search soil types..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Type of soil in your farm</p>
                </div>

                {/* Water Retention */}
                <div>
                  <Label htmlFor="waterRetention" className="text-sm font-medium text-gray-700">
                    Water Retention (%)
                  </Label>
                  <Input
                    id="waterRetention"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.waterRetention}
                    onChange={(e) => handleInputChange('waterRetention', e.target.value)}
                    placeholder="25"
                    className="mt-1 h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Soil water holding capacity
                  </p>
                </div>
              </div>
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
