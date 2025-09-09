"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, Calculator, Loader2 } from "lucide-react";
import { SupabaseService } from "@/lib/supabase-service";
import { NotificationService } from "@/lib/notification-service";
import type { Farm } from "@/types/types";

interface WaterCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: Farm;
  onCalculationComplete: () => void;
}

export function WaterCalculationModal({ 
  isOpen, 
  onClose, 
  farm, 
  onCalculationComplete 
}: WaterCalculationModalProps) {
  const [formData, setFormData] = useState({
    cropCoefficient: "",
    evapotranspiration: ""
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<number | null>(null);

  const handleCalculate = () => {
    if (!formData.cropCoefficient || !formData.evapotranspiration) {
      return;
    }

    const cropCoefficientValue = parseFloat(formData.cropCoefficient);
    const evapotranspirationValue = parseFloat(formData.evapotranspiration);
    const currentRemainingWater = farm.remainingWater || 0;

    // Formula: current remaining water - (crop_coefficient * evapotranspiration)
    const result = currentRemainingWater - (cropCoefficientValue * evapotranspirationValue);
    setCalculationResult(result);
  };

  const handleSave = async () => {
    if (calculationResult === null) return;

    // Ensure farm.id exists and is valid
    if (!farm.id || typeof farm.id !== 'number') {
      console.error("Invalid farm ID:", farm.id);
      return;
    }

    setIsCalculating(true);
    try {
      // Update farm with calculated remaining water and timestamp
      await SupabaseService.updateFarm(farm.id, {
        remainingWater: calculationResult,
        waterCalculationUpdatedAt: new Date().toISOString()
      });

      // Check water level and send notification if needed
      const notificationService = NotificationService.getInstance();
      notificationService.checkWaterLevelAndAlert(farm.name, calculationResult);

      onCalculationComplete();
      handleClose();
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error saving water calculation:", error);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      cropCoefficient: "",
      evapotranspiration: ""
    });
    setCalculationResult(null);
    onClose();
  };

  const isFormValid = formData.cropCoefficient && formData.evapotranspiration;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-green-700">
            <div className="p-2 bg-green-100 rounded-xl">
              <Calculator className="h-5 w-5" />
            </div>
            Calculate Remaining Water
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Enter current values to calculate daily water reduction
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

          {/* Crop Coefficient */}
          <div>
            <Label htmlFor="cropCoefficient" className="text-sm font-medium text-gray-700">
              Crop Coefficient (Kc) *
            </Label>
            <Select value={formData.cropCoefficient} onValueChange={(value) => setFormData(prev => ({ ...prev, cropCoefficient: value }))}>
              <SelectTrigger className="mt-1 h-11">
                <SelectValue placeholder="Select growth stage" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="0.25">0.25 - Beginning budbreak</SelectItem>
                <SelectItem value="0.3">0.3 - Shoot 30cm</SelectItem>
                <SelectItem value="0.4">0.4 - Shoot 50cm</SelectItem>
                <SelectItem value="0.5">0.5 - Shoot 80cm</SelectItem>
                <SelectItem value="0.6">0.6 - Beginning Bloom</SelectItem>
                <SelectItem value="0.7">0.7 - Fruit set</SelectItem>
                <SelectItem value="0.80">0.8 - Berry size(6mm - 8mm)</SelectItem>
                <SelectItem value="0.85">0.85 - Berry size(12mm)</SelectItem>
                <SelectItem value="1.0">1 - Closing bunches</SelectItem>
                <SelectItem value="1">1 - Beginning veraison(softening)</SelectItem>
                <SelectItem value="0.801">0.8 - Beginning harvest</SelectItem>
                <SelectItem value="0.601">0.6 - End harvest</SelectItem>
                <SelectItem value="0.501">0.5 - After harvest</SelectItem>
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
              onChange={(e) => setFormData(prev => ({ ...prev, evapotranspiration: e.target.value }))}
              placeholder="4.5"
              className="mt-1 h-11"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Daily water loss rate from your crop and soil
            </p>
          </div>

          {/* Calculate Button */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={!isFormValid}
              className="w-full h-11 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Water Level
            </Button>
          </div>

          {/* Calculation Result */}
          {calculationResult !== null && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Calculation Result</span>
                </div>
                <div className="text-2xl font-bold text-green-800 mb-1">
                  {calculationResult.toFixed(1)} mm
                </div>
                <div className="text-xs text-green-600 mb-3">
                  Available water in soil
                </div>
                
                {/* Formula breakdown */}
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded border">
                  <div className="font-medium mb-1">Calculation:</div>
                  <div>
                    {(farm.remainingWater || 0).toFixed(1)} - {(parseFloat(formData.cropCoefficient) * parseFloat(formData.evapotranspiration)).toFixed(1)} = {calculationResult.toFixed(1)} mm
                  </div>
                </div>
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
            className="flex-1 h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={calculationResult === null || isCalculating}
            className="flex-1 h-11 bg-green-600 hover:bg-green-700"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Droplets className="h-4 w-4 mr-2" />
                Save Result
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}