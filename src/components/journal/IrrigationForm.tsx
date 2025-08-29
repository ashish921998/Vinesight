"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Droplets, 
  Calculator, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { ETcCalculator, type GrapeGrowthStage, type ETcResults } from '@/lib/etc-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

interface IrrigationFormProps {
  selectedFarm: Farm;
  onRecordAdded: () => void;
  onCancel: () => void;
}

export function IrrigationForm({ selectedFarm, onRecordAdded, onCancel }: IrrigationFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: "",
    area: selectedFarm.area.toString(),
    growth_stage: "",
    moisture_status: "",
    system_discharge: "",
    notes: "",
    // Weather data for ETc calculation
    temperature_max: "",
    temperature_min: "",
    humidity: "",
    wind_speed: "",
    rainfall: ""
  });

  const [etcResults, setEtcResults] = useState<ETcResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEtcCalculation, setShowEtcCalculation] = useState(false);

  const growthStages: GrapeGrowthStage[] = [
    'dormant', 'budbreak', 'flowering', 'fruit_set', 'veraison', 'harvest', 'post_harvest'
  ];

  const moistureStatuses = [
    'Very Dry', 'Dry', 'Moderate', 'Adequate', 'Wet'
  ];

  // Memoized ETc calculation inputs
  const etcInputs = useMemo(() => {
    if (!formData.temperature_max || !formData.temperature_min || !formData.humidity || !formData.wind_speed) {
      return null;
    }

    return {
      farmId: selectedFarm.id!,
      weatherData: {
        date: formData.date,
        temperatureMax: parseFloat(formData.temperature_max),
        temperatureMin: parseFloat(formData.temperature_min),
        humidity: parseFloat(formData.humidity),
        windSpeed: parseFloat(formData.wind_speed),
        rainfall: formData.rainfall ? parseFloat(formData.rainfall) : 0
      },
      growthStage: formData.growth_stage as GrapeGrowthStage,
      plantingDate: selectedFarm.planting_date,
      location: {
        latitude: 19.1, // Default for Maharashtra, should be from farm data
        longitude: 73.7,
        elevation: 500
      },
      irrigationMethod: 'drip' as const,
      soilType: 'loamy' as const
    };
  }, [
    formData.temperature_max,
    formData.temperature_min,
    formData.humidity,
    formData.wind_speed,
    formData.rainfall,
    formData.growth_stage,
    formData.date,
    selectedFarm.id,
    selectedFarm.planting_date
  ]);

  const calculateETc = useCallback(() => {
    if (!etcInputs) return;

    try {
      const results = ETcCalculator.calculateETc(etcInputs);
      setEtcResults(results);
      setShowEtcCalculation(true);

      // Auto-fill duration based on ETc recommendation
      if (results.irrigationRecommendation.shouldIrrigate) {
        setFormData(prev => ({
          ...prev,
          duration: results.irrigationRecommendation.duration.toString()
        }));
      }
    } catch (error) {
      console.error('Error calculating ETc:', error);
    }
  }, [etcInputs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SupabaseService.addIrrigationRecord({
        farm_id: selectedFarm.id!,
        date: formData.date,
        duration: parseFloat(formData.duration),
        area: parseFloat(formData.area),
        growth_stage: formData.growth_stage,
        moisture_status: formData.moisture_status,
        system_discharge: parseFloat(formData.system_discharge),
        notes: formData.notes
      });

      // Save ETc calculation to history if available
      if (etcResults) {
        const inputs = {
          farmId: selectedFarm.id!,
          calculationType: 'ETc' as const,
          date: formData.date,
          inputs: {
            weather: {
              temperatureMax: parseFloat(formData.temperature_max),
              temperatureMin: parseFloat(formData.temperature_min),
              humidity: parseFloat(formData.humidity),
              windSpeed: parseFloat(formData.wind_speed),
              rainfall: formData.rainfall ? parseFloat(formData.rainfall) : 0
            },
            growthStage: formData.growth_stage
          },
          results: {
            eto: etcResults.eto,
            kc: etcResults.kc,
            etc: etcResults.etc,
            irrigationNeed: etcResults.irrigationNeed,
            confidence: etcResults.confidence
          }
        };

        await SupabaseService.addCalculationHistory({
          farm_id: selectedFarm.id!,
          calculation_type: 'etc',
          date: formData.date,
          inputs: inputs.inputs,
          outputs: inputs.results
        });
      }

      onRecordAdded();
    } catch (error) {
      console.error('Error adding irrigation record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Irrigation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Irrigation Details
          </CardTitle>
          <CardDescription>Record your irrigation application details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                step="0.1"
                placeholder="e.g., 4"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="area">Area Irrigated (ha)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="growth_stage">Growth Stage</Label>
              <select
                id="growth_stage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.growth_stage}
                onChange={(e) => handleInputChange('growth_stage', e.target.value)}
                required
              >
                <option value="">Select growth stage</option>
                {growthStages.map(stage => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="moisture_status">Moisture Status</Label>
              <select
                id="moisture_status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.moisture_status}
                onChange={(e) => handleInputChange('moisture_status', e.target.value)}
                required
              >
                <option value="">Select moisture status</option>
                {moistureStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="system_discharge">System Discharge (L/h)</Label>
              <Input
                id="system_discharge"
                type="number"
                placeholder="e.g., 150"
                value={formData.system_discharge}
                onChange={(e) => handleInputChange('system_discharge', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ETc Integration */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            ETc Calculator Integration
            <Badge variant="secondary">Scientific</Badge>
          </CardTitle>
          <CardDescription>
            Calculate irrigation requirements based on weather data and crop coefficient
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="temperature_max">Max Temperature (°C)</Label>
              <Input
                id="temperature_max"
                type="number"
                step="0.1"
                placeholder="e.g., 35"
                value={formData.temperature_max}
                onChange={(e) => handleInputChange('temperature_max', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="temperature_min">Min Temperature (°C)</Label>
              <Input
                id="temperature_min"
                type="number"
                step="0.1"
                placeholder="e.g., 22"
                value={formData.temperature_min}
                onChange={(e) => handleInputChange('temperature_min', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                step="1"
                placeholder="e.g., 65"
                value={formData.humidity}
                onChange={(e) => handleInputChange('humidity', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wind_speed">Wind Speed (m/s)</Label>
              <Input
                id="wind_speed"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={formData.wind_speed}
                onChange={(e) => handleInputChange('wind_speed', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rainfall">Rainfall (mm) - Optional</Label>
              <Input
                id="rainfall"
                type="number"
                step="0.1"
                placeholder="e.g., 0"
                value={formData.rainfall}
                onChange={(e) => handleInputChange('rainfall', e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={calculateETc}
            disabled={!formData.temperature_max || !formData.temperature_min || !formData.humidity || !formData.wind_speed || !formData.growth_stage}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate ETc and Get Irrigation Recommendation
          </Button>
        </CardContent>
      </Card>

      {/* ETc Results */}
      {showEtcCalculation && etcResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              ETc Calculation Results
              <Badge variant={etcResults.confidence === 'high' ? 'default' : etcResults.confidence === 'medium' ? 'secondary' : 'destructive'}>
                {etcResults.confidence} confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{etcResults.eto.toFixed(2)}</div>
                <div className="text-sm text-blue-700">ETo (mm/day)</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{etcResults.kc.toFixed(2)}</div>
                <div className="text-sm text-green-700">Kc (Crop Coeff.)</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{etcResults.etc.toFixed(2)}</div>
                <div className="text-sm text-purple-700">ETc (mm/day)</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{etcResults.irrigationNeed.toFixed(2)}</div>
                <div className="text-sm text-orange-700">Irrigation Need (mm/day)</div>
              </div>
            </div>

            <Separator />

            {/* Irrigation Recommendation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {etcResults.irrigationRecommendation.shouldIrrigate ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
                <span className="font-semibold">
                  {etcResults.irrigationRecommendation.shouldIrrigate ? 'Irrigation Recommended' : 'No Irrigation Needed'}
                </span>
              </div>

              {etcResults.irrigationRecommendation.shouldIrrigate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{etcResults.irrigationRecommendation.duration} hours</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-2 font-medium">{etcResults.irrigationRecommendation.frequency}</span>
                  </div>
                </div>
              )}

              {etcResults.irrigationRecommendation.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Recommendations:</span>
                  </div>
                  <ul className="text-sm space-y-1 ml-6">
                    {etcResults.irrigationRecommendation.notes.map((note, index) => (
                      <li key={index} className="list-disc">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Additional observations or remarks"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Record...' : 'Add Irrigation Record'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}