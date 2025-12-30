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
import { LocationForm } from '@/components/calculators/ETc/LocationForm'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { getAllCrops, getVarietiesForCrop, getDefaultVariety } from '@/lib/crop-data'
import type { LocationResult } from '@/lib/open-meteo-geocoding'
import type { Farm } from '@/types/types'

export interface FarmDataSubmit {
  name: string
  region: string
  area: number
  crop: string
  cropVariety: string
  plantingDate: string
  vineSpacing?: number
  rowSpacing?: number
  totalTankCapacity?: number
  systemDischarge?: number
  dateOfPruning?: Date
  bulkDensity?: number
  cationExchangeCapacity?: number
  soilWaterRetention?: number
  soilTextureClass?: string
  sandPercentage?: number
  siltPercentage?: number
  clayPercentage?: number
  latitude?: number
  longitude?: number
  elevation?: number
  location_name?: string
  location_source?: 'search'
  location_updated_at?: string
}

interface FarmModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (farmData: FarmDataSubmit) => Promise<void>
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
  bulkDensity: string
  cationExchangeCapacity: string
  soilWaterRetention: string
  soilTextureClass: string
  sandPercentage: string
  siltPercentage: string
  clayPercentage: string
}

interface LocationData {
  latitude: string
  longitude: string
  elevation: string
  locationName: string
}

const SOIL_TEXTURE_OPTIONS = [
  'Sand',
  'Loamy sand',
  'Sandy loam',
  'Loam',
  'Silt loam',
  'Silt',
  'Sandy clay loam',
  'Clay loam',
  'Silty clay loam',
  'Sandy clay',
  'Silty clay',
  'Clay'
] as const

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
    bulkDensity: editingFarm?.bulkDensity?.toString() || '',
    cationExchangeCapacity: editingFarm?.cationExchangeCapacity?.toString() || '',
    soilWaterRetention: editingFarm?.soilWaterRetention?.toString() || '',
    soilTextureClass: editingFarm?.soilTextureClass || '',
    sandPercentage: editingFarm?.sandPercentage?.toString() || '',
    siltPercentage: editingFarm?.siltPercentage?.toString() || '',
    clayPercentage: editingFarm?.clayPercentage?.toString() || ''
  }))

  const [locationData, setLocationData] = useState<LocationData>(() => ({
    latitude: editingFarm?.latitude?.toString() || '',
    longitude: editingFarm?.longitude?.toString() || '',
    elevation: editingFarm?.elevation?.toString() || '',
    locationName: editingFarm?.locationName || ''
  }))

  const [cropError, setCropError] = useState<string | null>(null)
  const [areaError, setAreaError] = useState<string | null>(null)
  const [soilCompositionWarning, setSoilCompositionWarning] = useState<string | null>(null)
  const [cropVarietyQuery, setCropVarietyQuery] = useState('')
  const cropOptions = useMemo(() => getAllCrops(), [])
  const varietyBaseOptions = useMemo(() => getVarietiesForCrop(formData.crop), [formData.crop])
  const varietyOptions = useMemo(() => {
    const query = cropVarietyQuery.trim()
    if (query && !varietyBaseOptions.includes(query)) {
      return [...varietyBaseOptions, query]
    }
    return varietyBaseOptions
  }, [varietyBaseOptions, cropVarietyQuery])

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
        bulkDensity: editingFarm.bulkDensity?.toString() || '',
        cationExchangeCapacity: editingFarm.cationExchangeCapacity?.toString() || '',
        soilWaterRetention: editingFarm.soilWaterRetention?.toString() || '',
        soilTextureClass: editingFarm.soilTextureClass || '',
        sandPercentage: editingFarm.sandPercentage?.toString() || '',
        siltPercentage: editingFarm.siltPercentage?.toString() || '',
        clayPercentage: editingFarm.clayPercentage?.toString() || ''
      })

      setLocationData({
        latitude: editingFarm.latitude?.toString() || '',
        longitude: editingFarm.longitude?.toString() || '',
        elevation: editingFarm.elevation?.toString() || '',
        locationName: editingFarm.locationName || ''
      })

      setCropError(null)
      setCropVarietyQuery('')
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
        bulkDensity: '',
        cationExchangeCapacity: '',
        soilWaterRetention: '',
        soilTextureClass: '',
        sandPercentage: '',
        siltPercentage: '',
        clayPercentage: ''
      })

      setLocationData({
        latitude: '',
        longitude: '',
        elevation: '',
        locationName: ''
      })

      setCropError(null)
      setCropVarietyQuery('')
    }
  }, [editingFarm])

  const soilCompositionSum = useMemo(() => {
    const sand = parseFloat(formData.sandPercentage)
    const silt = parseFloat(formData.siltPercentage)
    const clay = parseFloat(formData.clayPercentage)
    if ([sand, silt, clay].some((value) => Number.isNaN(value))) {
      return null
    }
    return sand + silt + clay
  }, [formData.sandPercentage, formData.siltPercentage, formData.clayPercentage])

  useEffect(() => {
    if (soilCompositionSum === null) {
      setSoilCompositionWarning(null)
      return
    }
    if (soilCompositionSum < 95 || soilCompositionSum > 105) {
      setSoilCompositionWarning('Sand + silt + clay should total roughly 100%')
    } else {
      setSoilCompositionWarning(null)
    }
  }, [soilCompositionSum])

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
      if (field === 'crop') {
        setCropError(value.trim() ? null : 'Crop is required')
      }
      if (field === 'area') {
        const areaValue = parseFloat(value)
        setAreaError(
          isNaN(areaValue) || areaValue <= 0 ? 'Area must be a valid positive number' : null
        )
      }
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

    if (!formData.crop.trim()) {
      setCropError('Crop is required')
      return
    }
    setCropError(null)

    const areaValue = parseFloat(formData.area)
    if (isNaN(areaValue) || areaValue <= 0) {
      setAreaError('Area must be a valid positive number')
      return
    }
    setAreaError(null)

    const farmData: FarmDataSubmit = {
      name: formData.name,
      region: formData.region,
      area: areaValue,
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
      bulkDensity: formData.bulkDensity ? parseFloat(formData.bulkDensity) : undefined,
      cationExchangeCapacity: formData.cationExchangeCapacity
        ? parseFloat(formData.cationExchangeCapacity)
        : undefined,
      soilWaterRetention: formData.soilWaterRetention
        ? parseFloat(formData.soilWaterRetention)
        : undefined,
      soilTextureClass: formData.soilTextureClass || undefined,
      sandPercentage: formData.sandPercentage ? parseFloat(formData.sandPercentage) : undefined,
      siltPercentage: formData.siltPercentage ? parseFloat(formData.siltPercentage) : undefined,
      clayPercentage: formData.clayPercentage ? parseFloat(formData.clayPercentage) : undefined,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] mx-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {editingFarm ? 'Edit Farm' : 'Add New Farm'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
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
                Area *
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
              {areaError && <p className="mt-1 text-sm text-red-500">{areaError}</p>}
              <p className="text-xs text-gray-500 mt-1">Unit is set in your account preferences</p>
            </div>

            {/* Crop and Crop Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Crop *</Label>
                <Combobox
                  items={cropOptions}
                  value={formData.crop || null}
                  onValueChange={(nextValue) => {
                    const crop = nextValue ?? ''
                    handleInputChange('crop', crop)
                    setCropVarietyQuery('')

                    // Auto-set a sensible variety for the selected crop
                    const varieties = getVarietiesForCrop(crop)
                    if (varieties.length > 0) {
                      handleInputChange('cropVariety', varieties[0])
                    } else {
                      handleInputChange('cropVariety', '')
                    }
                  }}
                >
                  <ComboboxInput
                    className="mt-1 h-11 w-full"
                    placeholder="Select a crop"
                    required
                    aria-invalid={!!cropError}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No crops found.</ComboboxEmpty>
                    <ComboboxList>
                      {cropOptions.map((crop) => (
                        <ComboboxItem key={crop} value={crop}>
                          {crop}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {cropError && <p className="text-sm text-destructive mt-1">{cropError}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Crop Variety *
                </Label>
                <Combobox
                  items={varietyOptions}
                  value={formData.cropVariety || null}
                  onInputValueChange={(inputValue) => setCropVarietyQuery(inputValue)}
                  onValueChange={(nextValue) => {
                    const variety = nextValue ?? ''
                    handleInputChange('cropVariety', variety)
                    setCropVarietyQuery(variety)
                  }}
                >
                  <ComboboxInput
                    className="mt-1 h-11 w-full"
                    placeholder="Select a variety"
                    required
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No varieties found.</ComboboxEmpty>
                    <ComboboxList>
                      {varietyOptions.map((variety) => {
                        const showAddCustom =
                          cropVarietyQuery.trim().length > 0 &&
                          variety === cropVarietyQuery.trim() &&
                          !varietyBaseOptions.includes(cropVarietyQuery.trim())

                        return (
                          <ComboboxItem key={variety} value={variety}>
                            {showAddCustom ? `Add as custom variety: “${variety}”` : variety}
                          </ComboboxItem>
                        )
                      })}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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

            {/* Soil Physical Properties */}
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Soil Physical Properties (Optional)
                </h4>
                <p className="text-xs text-gray-500">
                  Capture key lab parameters to pre-fill soil profiling dashboards
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulkDensity" className="text-sm font-medium text-gray-700">
                    Bulk Density (g/mL)
                  </Label>
                  <Input
                    id="bulkDensity"
                    type="number"
                    step="0.0001"
                    min={0.5}
                    max={3}
                    value={formData.bulkDensity}
                    onChange={(e) => handleInputChange('bulkDensity', e.target.value)}
                    placeholder="1.06"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="cationExchangeCapacity"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cation Exchange Capacity (meq/100g)
                  </Label>
                  <Input
                    id="cationExchangeCapacity"
                    type="number"
                    step="0.1"
                    min={0}
                    max={200}
                    value={formData.cationExchangeCapacity}
                    onChange={(e) => handleInputChange('cationExchangeCapacity', e.target.value)}
                    placeholder="50"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="soilWaterRetention" className="text-sm font-medium text-gray-700">
                    Soil Water Retention (mm/m)
                  </Label>
                  <Input
                    id="soilWaterRetention"
                    type="number"
                    step="1"
                    min={0}
                    max={500}
                    value={formData.soilWaterRetention}
                    onChange={(e) => handleInputChange('soilWaterRetention', e.target.value)}
                    placeholder="170"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="soilTextureClass" className="text-sm font-medium text-gray-700">
                    Soil Texture Class
                  </Label>
                  <Select
                    value={formData.soilTextureClass}
                    onValueChange={(value) => handleInputChange('soilTextureClass', value)}
                  >
                    <SelectTrigger id="soilTextureClass" className="mt-1 h-11">
                      <SelectValue placeholder="Select texture class" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOIL_TEXTURE_OPTIONS.map((texture) => (
                        <SelectItem key={texture} value={texture}>
                          {texture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sandPercentage" className="text-sm font-medium text-gray-700">
                    Sand (%)
                  </Label>
                  <Input
                    id="sandPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.sandPercentage}
                    onChange={(e) => handleInputChange('sandPercentage', e.target.value)}
                    placeholder="27.5"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="siltPercentage" className="text-sm font-medium text-gray-700">
                    Silt (%)
                  </Label>
                  <Input
                    id="siltPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.siltPercentage}
                    onChange={(e) => handleInputChange('siltPercentage', e.target.value)}
                    placeholder="27.0"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="clayPercentage" className="text-sm font-medium text-gray-700">
                    Clay (%)
                  </Label>
                  <Input
                    id="clayPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.clayPercentage}
                    onChange={(e) => handleInputChange('clayPercentage', e.target.value)}
                    placeholder="45.5"
                    className="mt-1 h-11"
                  />
                  {soilCompositionWarning && (
                    <p className="text-xs text-amber-600 mt-1">{soilCompositionWarning}</p>
                  )}
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
              className="flex-1 h-11 order-1 sm:order-2 bg-accent text-accent-foreground hover:bg-accent/90"
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
