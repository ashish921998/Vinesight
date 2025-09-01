"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, Calculator, Loader2 } from "lucide-react";
import { SupabaseService } from "@/lib/supabase-service";
import type { Farm } from "@/lib/supabase";

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
    refillTank: "",
    cropCoefficient: "",
    evapotranspiration: ""
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<number | null>(null);

  const handleCalculate = () => {
    if (!formData.refillTank || !formData.cropCoefficient || !formData.evapotranspiration) {
      return;
    }

    const refillTankValue = parseFloat(formData.refillTank);
    const cropCoefficientValue = parseFloat(formData.cropCoefficient);
    const evapotranspirationValue = parseFloat(formData.evapotranspiration);

    // Formula: refill_tank / (crop_coefficient * evapotranspiration)
    const result = refillTankValue / (cropCoefficientValue * evapotranspirationValue);
    setCalculationResult(result);
  };

  const handleSave = async () => {
    if (calculationResult === null || !farm.id) return;

    setIsCalculating(true);
    try {
      // Update farm with calculated remaining water and timestamp
      await SupabaseService.updateFarm(farm.id, {
        remaining_water: calculationResult,
        water_calculation_updated_at: new Date().toISOString()
      });

      onCalculationComplete();
      handleClose();
    } catch (error) {
      console.error("Error saving water calculation:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      refillTank: "",
      cropCoefficient: "",
      evapotranspiration: ""
    });
    setCalculationResult(null);
    onClose();
  };

  const isFormValid = formData.refillTank && formData.cropCoefficient && formData.evapotranspiration;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-blue-700">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Calculator className="h-5 w-5" />
            </div>
            Calculate Remaining Water
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Enter current values to calculate remaining water in soil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refill Tank Input */}
          <div>
            <Label htmlFor="refillTank" className="text-sm font-medium text-gray-700">
              Refill Tank (liters) *
            </Label>
            <Input
              id="refillTank"
              type="number"
              step="1"
              min="0"
              value={formData.refillTank}
              onChange={(e) => setFormData(prev => ({ ...prev, refillTank: e.target.value }))}
              placeholder="500"
              className="mt-1 h-11"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the current amount of water in your tank
            </p>
          </div>

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
                <SelectItem value="0.3">0.3 - Initial stage</SelectItem>
                <SelectItem value="0.6">0.6 - Development stage</SelectItem>
                <SelectItem value="0.8">0.8 - Mid-season</SelectItem>
                <SelectItem value="1.0">1.0 - Mid-season (full)</SelectItem>
                <SelectItem value="1.2">1.2 - Peak season</SelectItem>
                <SelectItem value="0.7">0.7 - Late season</SelectItem>
                <SelectItem value="0.5">0.5 - Maturity</SelectItem>
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
              className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Water Level
            </Button>
          </div>

          {/* Calculation Result */}
          {calculationResult !== null && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Calculation Result</span>
                </div>
                <div className="text-2xl font-bold text-blue-800 mb-1">
                  {calculationResult.toFixed(1)} mm
                </div>
                <div className="text-xs text-blue-600 mb-3">
                  Available water in soil
                </div>
                
                {/* Formula breakdown */}
                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded border">
                  <div className="font-medium mb-1">Calculation:</div>
                  <div>
                    {formData.refillTank}L ÷ ({formData.cropCoefficient} × {formData.evapotranspiration}) = {calculationResult.toFixed(1)} mm
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