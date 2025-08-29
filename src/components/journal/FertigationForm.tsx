"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Beaker, 
  Droplets,
  Leaf,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export interface FertigationFormProps {
  selectedFarm: Farm;
  onRecordAdded: () => void;
  onCancel: () => void;
}

export function FertigationForm({ selectedFarm, onRecordAdded, onCancel }: FertigationFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fertilizer_type: "",
    quantity: "",
    area: selectedFarm.area.toString(),
    irrigation_duration: "",
    concentration: "",
    ec_level: "",
    ph_level: "",
    growth_stage: "",
    notes: "",
    // Nutrient composition
    nitrogen_content: "",
    phosphorus_content: "",
    potassium_content: "",
    micronutrients: "",
    // Application details
    injection_method: "",
    flow_rate: "",
    mixing_tank_volume: ""
  });

  const [loading, setLoading] = useState(false);

  const fertilizerTypes = [
    '19-19-19 (NPK)', '20-20-20 (NPK)', '13-40-13 (NPK)', '12-61-0 (MAP)',
    '0-52-34 (MKP)', '13-0-45 (Potassium Nitrate)', '15.5-0-0 (Calcium Nitrate)',
    'Urea (46-0-0)', 'Magnesium Sulfate', 'Chelated Iron', 'Micronutrient Mix',
    'Humic Acid', 'Fulvic Acid', 'Seaweed Extract', 'Custom Blend'
  ];

  const growthStages = [
    'Dormant', 'Bud Break', 'Flowering', 'Fruit Set', 'Veraison', 'Harvest', 'Post Harvest'
  ];

  const injectionMethods = [
    'Venturi System', 'Electric Injector', 'Pressure Tank', 'Dosing Pump', 'Manual Injection'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Temporarily disabled for deployment
      console.log('Fertigation form submission disabled for deployment');

      onRecordAdded();
    } catch (error) {
      console.error('Error adding fertigation record:', error);
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

  const calculateApplicationRate = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const area = parseFloat(formData.area) || 1;
    return quantity / area;
  };

  const calculateTotalCost = () => {
    // This would be connected to a fertilizer cost database
    const quantity = parseFloat(formData.quantity) || 0;
    const estimatedCostPerKg = 50; // Example cost
    return quantity * estimatedCostPerKg;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Fertigation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Fertigation Details
          </CardTitle>
          <CardDescription>Record fertilizer application through irrigation system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Application Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="area">Area Fertigated (ha)</Label>
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
              <Label htmlFor="irrigation_duration">Irrigation Duration (hours)</Label>
              <Input
                id="irrigation_duration"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={formData.irrigation_duration}
                onChange={(e) => handleInputChange('irrigation_duration', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="injection_method">Injection Method</Label>
              <select
                id="injection_method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.injection_method}
                onChange={(e) => handleInputChange('injection_method', e.target.value)}
              >
                <option value="">Select method</option>
                {injectionMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fertilizer Information */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Fertilizer Information
          </CardTitle>
          <CardDescription>Details about the fertilizer used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fertilizer_type">Fertilizer Type</Label>
              <Input
                id="fertilizer_type"
                placeholder="e.g., 19-19-19 NPK"
                value={formData.fertilizer_type}
                onChange={(e) => handleInputChange('fertilizer_type', e.target.value)}
                list="fertilizer-suggestions"
                required
              />
              <datalist id="fertilizer-suggestions">
                {fertilizerTypes.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                placeholder="e.g., 25"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="concentration">Concentration (%)</Label>
              <Input
                id="concentration"
                type="number"
                step="0.01"
                placeholder="e.g., 0.2"
                value={formData.concentration}
                onChange={(e) => handleInputChange('concentration', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mixing_tank_volume">Mixing Tank Volume (L)</Label>
              <Input
                id="mixing_tank_volume"
                type="number"
                placeholder="e.g., 1000"
                value={formData.mixing_tank_volume}
                onChange={(e) => handleInputChange('mixing_tank_volume', e.target.value)}
              />
            </div>
          </div>

          {/* Nutrient Composition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nitrogen_content">Nitrogen (N) %</Label>
              <Input
                id="nitrogen_content"
                type="number"
                step="0.1"
                placeholder="e.g., 19"
                value={formData.nitrogen_content}
                onChange={(e) => handleInputChange('nitrogen_content', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phosphorus_content">Phosphorus (P) %</Label>
              <Input
                id="phosphorus_content"
                type="number"
                step="0.1"
                placeholder="e.g., 19"
                value={formData.phosphorus_content}
                onChange={(e) => handleInputChange('phosphorus_content', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="potassium_content">Potassium (K) %</Label>
              <Input
                id="potassium_content"
                type="number"
                step="0.1"
                placeholder="e.g., 19"
                value={formData.potassium_content}
                onChange={(e) => handleInputChange('potassium_content', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="micronutrients">Micronutrients</Label>
            <Input
              id="micronutrients"
              placeholder="e.g., Fe, Mn, Zn, B, Cu, Mo"
              value={formData.micronutrients}
              onChange={(e) => handleInputChange('micronutrients', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Water Quality Parameters */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Water Quality Parameters
          </CardTitle>
          <CardDescription>Monitor solution quality during application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ph_level">pH Level</Label>
              <Input
                id="ph_level"
                type="number"
                step="0.1"
                placeholder="e.g., 6.5"
                value={formData.ph_level}
                onChange={(e) => handleInputChange('ph_level', e.target.value)}
              />
              {formData.ph_level && (
                <div className="mt-1">
                  {parseFloat(formData.ph_level) < 6.0 && (
                    <Badge variant="destructive" className="text-xs">Acidic - Consider pH adjustment</Badge>
                  )}
                  {parseFloat(formData.ph_level) >= 6.0 && parseFloat(formData.ph_level) <= 7.5 && (
                    <Badge variant="default" className="text-xs">Optimal pH range</Badge>
                  )}
                  {parseFloat(formData.ph_level) > 7.5 && (
                    <Badge variant="secondary" className="text-xs">Alkaline - Monitor nutrient uptake</Badge>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="ec_level">EC Level (dS/m)</Label>
              <Input
                id="ec_level"
                type="number"
                step="0.1"
                placeholder="e.g., 1.2"
                value={formData.ec_level}
                onChange={(e) => handleInputChange('ec_level', e.target.value)}
              />
              {formData.ec_level && (
                <div className="mt-1">
                  {parseFloat(formData.ec_level) > 2.0 && (
                    <Badge variant="destructive" className="text-xs">High salinity - Risk of salt stress</Badge>
                  )}
                  {parseFloat(formData.ec_level) <= 2.0 && parseFloat(formData.ec_level) >= 0.8 && (
                    <Badge variant="default" className="text-xs">Good EC level</Badge>
                  )}
                  {parseFloat(formData.ec_level) < 0.8 && (
                    <Badge variant="secondary" className="text-xs">Low EC - May need more nutrients</Badge>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="flow_rate">Flow Rate (L/hr)</Label>
              <Input
                id="flow_rate"
                type="number"
                placeholder="e.g., 500"
                value={formData.flow_rate}
                onChange={(e) => handleInputChange('flow_rate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Information */}
      {formData.quantity && formData.area && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Calculated Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {calculateApplicationRate().toFixed(1)} kg/ha
                </div>
                <div className="text-sm text-green-700">Application Rate</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{calculateTotalCost().toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-blue-700">Estimated Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes & Observations</Label>
        <Input
          id="notes"
          placeholder="Additional observations, mixing instructions, or remarks"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Recommendations */}
      <Card className="border-gray-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-orange-900">Fertigation Best Practices:</h4>
              <ul className="space-y-1 text-orange-800">
                <li>• Check system pressure and flow rates before application</li>
                <li>• Monitor EC and pH levels throughout the process</li>
                <li>• Flush system with clean water after fertigation</li>
                <li>• Apply during cooler parts of the day</li>
                <li>• Keep detailed records for nutrient management planning</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Record...' : 'Add Fertigation Record'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}