'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Droplets, Calculator, Loader2, Edit3 } from 'lucide-react'
import { SupabaseService } from '@/lib/supabase-service'
import { NotificationService } from '@/lib/notification-service'
import type { Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'

interface WaterCalculationModalProps {
  isOpen: boolean
  onClose: () => void
  farm: Farm
  onCalculationComplete: () => void
}

// Growth stage data structure with unique IDs
const GROWTH_STAGES = [
  { id: 'beginning_budbreak', value: 0.25, label: 'Beginning budbreak' },
  { id: 'shoot_30cm', value: 0.3, label: 'Shoot 30cm' },
  { id: 'shoot_50cm', value: 0.4, label: 'Shoot 50cm' },
  { id: 'shoot_80cm', value: 0.5, label: 'Shoot 80cm' },
  { id: 'beginning_bloom', value: 0.6, label: 'Beginning Bloom' },
  { id: 'fruit_set', value: 0.7, label: 'Fruit set' },
  { id: 'berry_6_8mm', value: 0.8, label: 'Berry size 6-8mm' },
  { id: 'berry_12mm', value: 0.85, label: 'Berry size 12mm' },
  { id: 'closing_bunches', value: 1.0, label: 'Closing bunches' },
  { id: 'beginning_veraison', value: 1.0, label: 'Beginning veraison' },
  { id: 'beginning_harvest', value: 0.8, label: 'Beginning harvest' },
  { id: 'end_harvest', value: 0.6, label: 'End harvest' },
  { id: 'after_harvest', value: 0.5, label: 'After harvest' }
] as const

export function WaterCalculationModal({
  isOpen,
  onClose,
  farm,
  onCalculationComplete
}: WaterCalculationModalProps) {
  const [formData, setFormData] = useState({
    cropCoefficient: '',
    evapotranspiration: '',
    rainfall: ''
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationResult, setCalculationResult] = useState<number | null>(null)
  const [manualWaterLevel, setManualWaterLevel] = useState('')
  const [useManualMode, setUseManualMode] = useState(false)

  const handleCalculate = () => {
    if (!formData.cropCoefficient || !formData.evapotranspiration) {
      return
    }

    // Resolve crop coefficient value from selected stage ID
    const selectedStage = GROWTH_STAGES.find((stage) => stage.id === formData.cropCoefficient)
    const cropCoefficientValue = selectedStage?.value ?? 0

    if (cropCoefficientValue === 0) {
      toast.error('Invalid crop coefficient selected')
      return
    }

    // Parse and validate other values
    const evapotranspirationValue = parseFloat(formData.evapotranspiration)
    const rainfallValue = formData.rainfall ? parseFloat(formData.rainfall) : 0
    const currentRemainingWater = farm.remainingWater || 0

    // Validate parsed values to prevent NaN propagation
    if (!Number.isFinite(evapotranspirationValue)) {
      toast.error('Invalid evapotranspiration value')
      return
    }
    // Validate rainfall even when empty string defaults to 0, catch any invalid parsed values
    if (!Number.isFinite(rainfallValue)) {
      toast.error('Invalid rainfall value')
      return
    }

    // Updated Formula: current remaining water + rainfall - (crop_coefficient * evapotranspiration)
    const result =
      currentRemainingWater + rainfallValue - cropCoefficientValue * evapotranspirationValue

    // Validate result
    if (!Number.isFinite(result)) {
      toast.error('Calculation resulted in invalid value')
      return
    }

    setCalculationResult(result)
    setUseManualMode(false)
    setManualWaterLevel(result.toString())
  }

  const handleSave = async () => {
    let finalWaterLevel: number | null = null
    let errorMessage = ''

    // Validate input based on mode
    if (useManualMode) {
      if (!manualWaterLevel.trim()) {
        errorMessage = 'Please enter a water level value'
        toast.error(errorMessage)
        return
      }
      finalWaterLevel = parseFloat(manualWaterLevel)
      if (isNaN(finalWaterLevel)) {
        errorMessage = 'Please enter a valid number for water level'
        toast.error(errorMessage)
        return
      }
    } else {
      if (calculationResult === null) {
        errorMessage = 'Please calculate water level first'
        toast.error(errorMessage)
        return
      }
      finalWaterLevel = calculationResult
    }

    // Additional validation
    if (finalWaterLevel === null || isNaN(finalWaterLevel)) {
      errorMessage = 'Invalid water level value'
      toast.error(errorMessage)
      return
    }

    // Ensure farm.id exists and is valid
    if (!farm.id || typeof farm.id !== 'number') {
      errorMessage = 'Invalid farm ID. Please try again.'
      toast.error(errorMessage)
      console.error('Invalid farm ID:', farm.id)
      return
    }

    setIsCalculating(true)
    try {
      // Update farm with calculated or manual remaining water and timestamp
      await SupabaseService.updateFarm(farm.id, {
        remainingWater: finalWaterLevel,
        waterCalculationUpdatedAt: new Date().toISOString()
      })

      // Check water level and send notification if needed
      // const notificationService = NotificationService.getInstance()
      // notificationService.checkWaterLevelAndAlert(capitalize(farm.name), finalWaterLevel)

      // Show success toast
      toast.success(`${useManualMode ? 'Manual' : 'Calculated'} water level saved successfully!`)

      onCalculationComplete()
      handleClose()
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : 'Failed to save water level. Please try again.'

      // Show error toast
      toast.error(errorMessage)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleClose = () => {
    setFormData({
      cropCoefficient: '',
      evapotranspiration: '',
      rainfall: ''
    })
    setCalculationResult(null)
    setManualWaterLevel('')
    setUseManualMode(false)
    onClose()
  }

  const isFormValid = formData.cropCoefficient && formData.evapotranspiration
  const canSave =
    (useManualMode && manualWaterLevel.trim()) || (!useManualMode && calculationResult !== null)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[350px] w-[90vw] mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-3 text-green-700 break-words">
            <div className="p-2 bg-green-100 rounded-xl flex-shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <span className="text-wrap">Calculate Water</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 break-words">
            Enter current values to calculate daily water reduction or manually set water level
          </DialogDescription>
          {(!farm.remainingWater || farm.remainingWater === 0) && (
            <div className="text-amber-600 text-xs mt-1 font-medium">
              ⚠️ No current water level data. Please log irrigation first to establish baseline.
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Water Level Display */}
          {farm.remainingWater && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-blue-700 mb-1">Current Water Level</div>
                <div className="text-2xl font-bold text-blue-800">
                  {farm.remainingWater.toFixed(1)} mm
                </div>
                <div className="text-xs text-blue-600">Available water in soil</div>
              </div>
            </div>
          )}

          {/* Mode Selection - Always show */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Label className="text-sm font-medium text-gray-700 mb-2 block break-words">
              Water Level Entry Method
            </Label>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant={!useManualMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseManualMode(false)
                }}
                className="text-xs h-10 flex-1 min-h-[44px] touch-manipulation text-wrap"
              >
                <Calculator className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="text-wrap">Calculate</span>
              </Button>
              <Button
                type="button"
                variant={useManualMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUseManualMode(true)
                }}
                className="text-xs h-10 flex-1 min-h-[44px] touch-manipulation text-wrap"
              >
                <Edit3 className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="text-wrap">Manual</span>
              </Button>
            </div>
          </div>

          {/* Manual Water Level Entry - Always show when manual mode is selected */}
          {useManualMode && (
            <div>
              <Label htmlFor="manualWaterLevel" className="text-sm font-medium text-gray-700">
                Water Level (mm) *
              </Label>
              <Input
                id="manualWaterLevel"
                type="number"
                step="0.1"
                value={manualWaterLevel}
                onChange={(e) => {
                  setManualWaterLevel(e.target.value)
                }}
                placeholder="Enter water level in mm"
                className="mt-1 h-12 text-base touch-manipulation w-full"
                inputMode="decimal"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the current water level in your soil
              </p>
            </div>
          )}

          {/* Calculation Fields - Only show when not in manual mode */}
          {!useManualMode && (
            <>
              {/* Crop Coefficient */}
              <div>
                <Label htmlFor="cropCoefficient" className="text-sm font-medium text-gray-700">
                  Crop Coefficient (Kc) *
                </Label>
                <Select
                  value={formData.cropCoefficient}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, cropCoefficient: value }))
                  }}
                >
                  <SelectTrigger className="mt-1 h-12 text-base touch-manipulation w-full text-left">
                    <SelectValue placeholder="Select growth stage" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {GROWTH_STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex flex-col items-start">
                          <span>{stage.value}</span>
                          <span className="text-xs text-gray-500">{stage.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Evapotranspiration */}
              <div>
                <Label htmlFor="evapotranspiration" className="text-sm font-medium text-gray-700">
                  Evapotranspiration (mm/day) *
                </Label>
                <Input
                  id="evapotranspiration"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.evapotranspiration}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, evapotranspiration: e.target.value }))
                  }}
                  placeholder="4.5"
                  className="mt-1 h-12 text-base touch-manipulation w-full"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Daily water loss rate from your crop and soil
                </p>
              </div>

              {/* Rainfall */}
              <div>
                <Label htmlFor="rainfall" className="text-sm font-medium text-gray-700">
                  Rainfall (mm)
                </Label>
                <Input
                  id="rainfall"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.rainfall}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, rainfall: e.target.value }))
                  }}
                  placeholder="0.0"
                  className="mt-1 h-12 text-base touch-manipulation w-full"
                  inputMode="decimal"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rain received in the last 24 hours (leave 0 if no rain)
                </p>
              </div>

              {/* Calculate Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-base min-h-[44px] touch-manipulation text-wrap"
                >
                  <Calculator className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-wrap">Calculate Water Level</span>
                </Button>
              </div>
            </>
          )}

          {/* Water Level Result Section */}
          {(calculationResult !== null || manualWaterLevel) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700">Water Level Result</span>
                </div>

                {/* Water Level Display */}
                <div className="text-2xl font-bold text-green-800 mb-1">
                  {useManualMode
                    ? (parseFloat(manualWaterLevel) || 0).toFixed(1)
                    : (calculationResult || 0).toFixed(1)}{' '}
                  mm
                </div>
                <div className="text-xs text-green-600 mb-3">
                  {useManualMode ? 'Manually entered water level' : 'Available water in soil'}
                </div>

                {/* Formula breakdown - only show in calculated mode */}
                {!useManualMode && calculationResult !== null && (
                  <div className="text-xs text-green-700 bg-green-100 p-2 rounded border break-words overflow-hidden">
                    <div className="font-medium mb-1">Calculation:</div>
                    <div className="flex flex-col space-y-1 text-center">
                      <div className="break-all">
                        {(farm.remainingWater || 0).toFixed(1)} +{' '}
                        {(parseFloat(formData.rainfall) || 0).toFixed(1)} - (
                        {GROWTH_STAGES.find((s) => s.id === formData.cropCoefficient)?.value ?? 0} ×{' '}
                        {parseFloat(formData.evapotranspiration)})
                      </div>
                      <div>= {calculationResult.toFixed(1)} mm</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-12 text-sm min-h-[44px] touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isCalculating}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-sm min-h-[44px] touch-manipulation px-2"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin flex-shrink-0" />
                Saving...
              </>
            ) : (
              <>
                <Droplets className="h-4 w-4 mr-1 flex-shrink-0" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
