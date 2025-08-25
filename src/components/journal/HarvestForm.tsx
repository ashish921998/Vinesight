"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Grape, 
  Scale,
  Star,
  TrendingUp,
  IndianRupee,
  Truck,
  Award,
  BarChart3
} from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

interface HarvestFormProps {
  selectedFarm: Farm;
  onRecordAdded: () => void;
  onCancel: () => void;
}

export function HarvestForm({ selectedFarm, onRecordAdded, onCancel }: HarvestFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: "",
    grade: "",
    price_per_kg: "",
    buyer: "",
    notes: "",
    // Quality metrics
    brix_level: "",
    cluster_weight: "",
    berry_size: "",
    color_intensity: "",
    disease_damage: "",
    physical_damage: "",
    // Additional tracking
    harvest_crew_size: "",
    weather_during_harvest: "",
    time_of_harvest: "",
    storage_location: "",
    packaging_type: ""
  });

  const [loading, setLoading] = useState(false);

  const gradeOptions = [
    'Premium Export', 'Export Quality', 'Domestic Premium', 'Domestic Standard',
    'Processing Grade', 'Table Grape A+', 'Table Grape A', 'Table Grape B',
    'Wine Grape Premium', 'Wine Grape Standard', 'Raisin Grade'
  ];

  const colorIntensityOptions = [
    'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'
  ];

  const damageLevels = [
    'None (0%)', 'Minimal (1-5%)', 'Low (6-10%)', 'Moderate (11-20%)', 'High (>20%)'
  ];

  const packagingTypes = [
    'Crates', 'Boxes', 'Bags', 'Bulk', 'Baskets', 'Containers'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SupabaseService.addHarvestRecord({
        farm_id: selectedFarm.id!,
        date: formData.date,
        quantity: parseFloat(formData.quantity),
        grade: formData.grade,
        price_per_kg: formData.price_per_kg ? parseFloat(formData.price_per_kg) : undefined,
        buyer: formData.buyer,
        notes: formData.notes
      });

      onRecordAdded();
    } catch (error) {
      console.error('Error adding harvest record:', error);
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

  const calculateMetrics = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price_per_kg) || 0;
    const totalValue = quantity * price;
    const yieldPerHectare = quantity / selectedFarm.area;
    const revenuePerHectare = totalValue / selectedFarm.area;

    return {
      totalValue,
      yieldPerHectare,
      revenuePerHectare
    };
  };

  const metrics = calculateMetrics();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Harvest Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grape className="h-5 w-5" />
            Harvest Details
          </CardTitle>
          <CardDescription>Record harvest quantity and basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Harvest Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                placeholder="e.g., 1500"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time_of_harvest">Time of Harvest</Label>
              <Input
                id="time_of_harvest"
                type="time"
                value={formData.time_of_harvest}
                onChange={(e) => handleInputChange('time_of_harvest', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="harvest_crew_size">Crew Size</Label>
              <Input
                id="harvest_crew_size"
                type="number"
                placeholder="Number of workers"
                value={formData.harvest_crew_size}
                onChange={(e) => handleInputChange('harvest_crew_size', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weather_during_harvest">Weather Conditions</Label>
              <Input
                id="weather_during_harvest"
                placeholder="e.g., Clear, Cool morning"
                value={formData.weather_during_harvest}
                onChange={(e) => handleInputChange('weather_during_harvest', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Quality Metrics
          </CardTitle>
          <CardDescription>Record quality parameters and grade assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">Grade/Quality</Label>
              <select
                id="grade"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                required
              >
                <option value="">Select grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brix_level">Brix Level (°Bx)</Label>
              <Input
                id="brix_level"
                type="number"
                step="0.1"
                placeholder="e.g., 18.5"
                value={formData.brix_level}
                onChange={(e) => handleInputChange('brix_level', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cluster_weight">Average Cluster Weight (g)</Label>
              <Input
                id="cluster_weight"
                type="number"
                step="1"
                placeholder="e.g., 450"
                value={formData.cluster_weight}
                onChange={(e) => handleInputChange('cluster_weight', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="berry_size">Berry Size (mm)</Label>
              <Input
                id="berry_size"
                type="number"
                step="0.1"
                placeholder="e.g., 16.5"
                value={formData.berry_size}
                onChange={(e) => handleInputChange('berry_size', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="color_intensity">Color Intensity</Label>
              <select
                id="color_intensity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.color_intensity}
                onChange={(e) => handleInputChange('color_intensity', e.target.value)}
              >
                <option value="">Select intensity</option>
                {colorIntensityOptions.map(intensity => (
                  <option key={intensity} value={intensity}>
                    {intensity}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="disease_damage">Disease Damage</Label>
              <select
                id="disease_damage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.disease_damage}
                onChange={(e) => handleInputChange('disease_damage', e.target.value)}
              >
                <option value="">Select damage level</option>
                {damageLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="physical_damage">Physical/Mechanical Damage</Label>
              <select
                id="physical_damage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.physical_damage}
                onChange={(e) => handleInputChange('physical_damage', e.target.value)}
              >
                <option value="">Select damage level</option>
                {damageLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commercial Information */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            Commercial Details
          </CardTitle>
          <CardDescription>Pricing and buyer information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_per_kg">Price per kg (₹)</Label>
              <Input
                id="price_per_kg"
                type="number"
                step="0.01"
                placeholder="e.g., 45.50"
                value={formData.price_per_kg}
                onChange={(e) => handleInputChange('price_per_kg', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="buyer">Buyer/Customer</Label>
              <Input
                id="buyer"
                placeholder="e.g., ABC Export Co."
                value={formData.buyer}
                onChange={(e) => handleInputChange('buyer', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                id="storage_location"
                placeholder="e.g., Cold storage unit A"
                value={formData.storage_location}
                onChange={(e) => handleInputChange('storage_location', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="packaging_type">Packaging Type</Label>
              <select
                id="packaging_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.packaging_type}
                onChange={(e) => handleInputChange('packaging_type', e.target.value)}
              >
                <option value="">Select packaging</option>
                {packagingTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Metrics */}
      {(formData.quantity || formData.price_per_kg) && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Calculated Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ₹{metrics.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-green-700">Total Value</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.yieldPerHectare.toFixed(0)} kg
                </div>
                <div className="text-sm text-blue-700">Yield per Hectare</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{metrics.revenuePerHectare.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-purple-700">Revenue per Hectare</div>
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
          placeholder="Additional observations about harvest quality, market conditions, etc."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Record...' : 'Add Harvest Record'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}