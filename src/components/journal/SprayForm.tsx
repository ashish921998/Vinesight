"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Bug, 
  AlertTriangle,
  Shield
} from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export interface SprayFormProps {
  selectedFarm: Farm;
  onRecordAdded: () => void;
  onCancel: () => void;
}

export function SprayForm({ selectedFarm, onRecordAdded, onCancel }: SprayFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pest_disease: "",
    chemical: "",
    dose: "",
    area: selectedFarm.area.toString(),
    weather_conditions: "",
    operator: "",
    notes: "",
    // Additional fields for enhanced tracking
    application_method: "",
    concentration: "",
    tank_mix: "",
    re_entry_period: "",
    harvest_interval: ""
  });

  const [loading, setLoading] = useState(false);

  const commonPestsAndDiseases = [
    'Powdery Mildew', 'Downy Mildew', 'Black Rot', 'Anthracnose',
    'Thrips', 'Mealybugs', 'Scale Insects', 'Spider Mites',
    'Aphids', 'Leaf Hoppers', 'Bunch Rot', 'Crown Gall'
  ];

  const applicationMethods = [
    'Foliar Spray', 'Drench', 'Spot Treatment', 'Broadcast',
    'Systemic Application', 'Soil Application'
  ];

  const weatherConditions = [
    'Calm, No Wind', 'Light Breeze', 'Moderate Wind', 'High Humidity',
    'Low Humidity', 'Overcast', 'Clear Sky', 'Early Morning',
    'Late Evening', 'Cool Temperature', 'Warm Temperature'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SupabaseService.addSprayRecord({
        farm_id: selectedFarm.id!,
        date: formData.date,
        pest_disease: formData.pest_disease,
        chemical: formData.chemical,
        dose: formData.dose,
        area: parseFloat(formData.area),
        weather: formData.weather_conditions,
        operator: formData.operator,
        notes: formData.notes
      });

      onRecordAdded();
    } catch (error) {
      console.error('Error adding spray record:', error);
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

  const getRecommendedREI = (chemical: string): string => {
    // Basic REI recommendations based on common chemicals
    const reiMap: Record<string, string> = {
      'copper': '24 hours',
      'sulfur': '24 hours',
      'mancozeb': '24 hours',
      'chlorothalonil': '12 hours',
      'imidacloprid': '12 hours',
      'thiamethoxam': '12 hours',
      'lambda-cyhalothrin': '24 hours',
      'cypermethrin': '12 hours'
    };

    const lowerChemical = chemical.toLowerCase();
    for (const key in reiMap) {
      if (lowerChemical.includes(key)) {
        return reiMap[key];
      }
    }
    return 'Check label';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Spray Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Spray Application Details
          </CardTitle>
          <CardDescription>Record pesticide, fungicide, or other spray treatments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="area">Area Treated (ha)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pest/Disease Information */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Target Pest/Disease
          </CardTitle>
          <CardDescription>Identify the pest or disease being treated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pest_disease">Pest/Disease</Label>
            <Input
              id="pest_disease"
              placeholder="e.g., Powdery Mildew"
              value={formData.pest_disease}
              onChange={(e) => handleInputChange('pest_disease', e.target.value)}
              list="pest-suggestions"
              required
            />
            <datalist id="pest-suggestions">
              {commonPestsAndDiseases.map(pest => (
                <option key={pest} value={pest} />
              ))}
            </datalist>
          </div>
        </CardContent>
      </Card>

      {/* Chemical Information */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Chemical Treatment
          </CardTitle>
          <CardDescription>Details about the chemical or biological agent used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chemical">Chemical/Product Name</Label>
              <Input
                id="chemical"
                placeholder="e.g., Sulfur WP 80%"
                value={formData.chemical}
                onChange={(e) => handleInputChange('chemical', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dose">Dose/Rate</Label>
              <Input
                id="dose"
                placeholder="e.g., 2kg/acre or 300ml/100L"
                value={formData.dose}
                onChange={(e) => handleInputChange('dose', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="concentration">Concentration (%)</Label>
              <Input
                id="concentration"
                type="number"
                step="0.1"
                placeholder="e.g., 0.3"
                value={formData.concentration}
                onChange={(e) => handleInputChange('concentration', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="application_method">Application Method</Label>
              <select
                id="application_method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.application_method}
                onChange={(e) => handleInputChange('application_method', e.target.value)}
              >
                <option value="">Select method</option>
                {applicationMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="tank_mix">Tank Mix Partners (if any)</Label>
            <Input
              id="tank_mix"
              placeholder="e.g., Sticker/Spreader, Micronutrients"
              value={formData.tank_mix}
              onChange={(e) => handleInputChange('tank_mix', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety and Environmental Conditions */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Safety & Environmental Conditions
          </CardTitle>
          <CardDescription>Weather conditions and safety information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weather_conditions">Weather Conditions</Label>
              <Input
                id="weather_conditions"
                placeholder="e.g., Calm, Low humidity"
                value={formData.weather_conditions}
                onChange={(e) => handleInputChange('weather_conditions', e.target.value)}
                list="weather-suggestions"
                required
              />
              <datalist id="weather-suggestions">
                {weatherConditions.map(condition => (
                  <option key={condition} value={condition} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="operator">Operator Name</Label>
              <Input
                id="operator"
                placeholder="e.g., Ramesh Kumar"
                value={formData.operator}
                onChange={(e) => handleInputChange('operator', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="re_entry_period">
                Re-entry Period
                {formData.chemical && (
                  <Badge variant="outline" className="ml-2">
                    Suggested: {getRecommendedREI(formData.chemical)}
                  </Badge>
                )}
              </Label>
              <Input
                id="re_entry_period"
                placeholder="e.g., 24 hours"
                value={formData.re_entry_period}
                onChange={(e) => handleInputChange('re_entry_period', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="harvest_interval">Pre-harvest Interval (PHI)</Label>
              <Input
                id="harvest_interval"
                placeholder="e.g., 7 days"
                value={formData.harvest_interval}
                onChange={(e) => handleInputChange('harvest_interval', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div>
        <Label htmlFor="notes">Notes & Observations</Label>
        <Input
          id="notes"
          placeholder="Additional observations, mixing instructions, or remarks"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Safety Reminders */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-blue-900">Safety Reminders:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Ensure proper PPE is worn during application</li>
                <li>• Check wind conditions before spraying</li>
                <li>• Maintain buffer zones near water sources</li>
                <li>• Record re-entry and pre-harvest intervals</li>
                <li>• Dispose of empty containers safely</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Record...' : 'Add Spray Record'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}