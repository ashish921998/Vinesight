"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Droplets, 
  ThermometerSun, 
  Wind, 
  CloudRain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  ETcCalculator,
  type ETcCalculationInputs,
  type ETcResults,
  type GrapeGrowthStage,
  type WeatherData
} from '@/lib/etc-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export function ETcCalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ETcResults | null>(null);
  const [showSeasonal, setShowSeasonal] = useState(false);

  const [formData, setFormData] = useState({
    // Weather Data
    date: new Date().toISOString().split('T')[0],
    temperatureMax: '',
    temperatureMin: '',
    humidity: '',
    windSpeed: '',
    solarRadiation: '',
    rainfall: '',
    
    // Growth Stage
    growthStage: 'fruit_set' as GrapeGrowthStage,
    
    // Location (will be filled from farm data)
    latitude: '',
    longitude: '',
    elevation: '',
    
    // Farm Details
    irrigationMethod: 'drip' as 'drip' | 'sprinkler' | 'surface',
    soilType: 'loamy' as 'sandy' | 'loamy' | 'clay'
  });

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const farmList = await SupabaseService.getAllFarms();
      setFarms(farmList);
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0]);
      }
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = () => {
    if (!selectedFarm) {
      alert('Please select a farm first');
      return;
    }

    setLoading(true);
    
    try {
      const weatherData: WeatherData = {
        date: formData.date,
        temperatureMax: parseFloat(formData.temperatureMax),
        temperatureMin: parseFloat(formData.temperatureMin),
        humidity: parseFloat(formData.humidity),
        windSpeed: parseFloat(formData.windSpeed),
        solarRadiation: formData.solarRadiation ? parseFloat(formData.solarRadiation) : undefined,
        rainfall: formData.rainfall ? parseFloat(formData.rainfall) : undefined,
      };

      const inputs: ETcCalculationInputs = {
        farmId: selectedFarm.id!,
        weatherData,
        growthStage: formData.growthStage,
        plantingDate: selectedFarm.planting_date,
        location: {
          latitude: formData.latitude ? parseFloat(formData.latitude) : 19.0760, // Default to Nashik
          longitude: formData.longitude ? parseFloat(formData.longitude) : 73.8777,
          elevation: formData.elevation ? parseFloat(formData.elevation) : 500,
        },
        irrigationMethod: formData.irrigationMethod,
        soilType: formData.soilType,
      };

      const calculationResults = ETcCalculator.calculateETc(inputs);
      setResults(calculationResults);

      // Save to calculation history
      saveCalculationHistory(inputs, calculationResults);
      
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error in calculation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const saveCalculationHistory = async (inputs: ETcCalculationInputs, results: ETcResults) => {
    try {
      await SupabaseService.addCalculationHistory({
        farm_id: inputs.farmId,
        calculation_type: 'etc',
        inputs: {
          weather: inputs.weatherData,
          growthStage: inputs.growthStage,
          location: inputs.location,
          irrigationMethod: inputs.irrigationMethod,
          soilType: inputs.soilType
        },
        outputs: {
          eto: results.eto,
          kc: results.kc,
          etc: results.etc,
          irrigationNeed: results.irrigationNeed,
          recommendation: results.irrigationRecommendation,
          confidence: results.confidence
        },
        date: inputs.weatherData.date
      });
    } catch (error) {
      console.error('Error saving calculation history:', error);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary', 
      low: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[confidence as keyof typeof variants] || 'secondary'}>
        {confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  const getGrowthStageDescription = (stage: GrapeGrowthStage) => {
    const descriptions = {
      dormant: "Dormant Season (Dec-Feb)",
      budbreak: "Bud Break (Mar)",
      flowering: "Flowering (Apr)",
      fruit_set: "Fruit Set (May-Jun)",
      veraison: "Veraison (Jul-Aug)",
      harvest: "Harvest (Sep-Oct)",
      post_harvest: "Post Harvest (Nov)"
    };
    return descriptions[stage] || stage;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          ETc Calculator
        </h2>
        <p className="text-muted-foreground mt-2">
          Calculate crop evapotranspiration and irrigation requirements for your vineyard
        </p>
      </div>

      {/* Farm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Farm</CardTitle>
          <CardDescription>Choose the farm for ETc calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <Card 
                key={farm.id}
                className={`cursor-pointer transition-colors ${
                  selectedFarm?.id === farm.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedFarm(farm)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold">{farm.name}</h3>
                  <p className="text-sm text-muted-foreground">{farm.region}</p>
                  <p className="text-sm">
                    {farm.area} ha • {farm.grape_variety}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Weather & Farm Parameters</CardTitle>
          <CardDescription>Enter current weather conditions and farm details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Weather Data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <ThermometerSun className="h-4 w-4" />
                Weather Data
              </h3>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="temperatureMax">Max Temperature (°C)</Label>
                <Input
                  id="temperatureMax"
                  type="number"
                  placeholder="35"
                  value={formData.temperatureMax}
                  onChange={(e) => handleInputChange('temperatureMax', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="temperatureMin">Min Temperature (°C)</Label>
                <Input
                  id="temperatureMin"
                  type="number"
                  placeholder="22"
                  value={formData.temperatureMin}
                  onChange={(e) => handleInputChange('temperatureMin', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  placeholder="65"
                  min="0"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="windSpeed">Wind Speed (m/s)</Label>
                <Input
                  id="windSpeed"
                  type="number"
                  placeholder="2.5"
                  step="0.1"
                  value={formData.windSpeed}
                  onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="rainfall">Rainfall (mm) - Optional</Label>
                <Input
                  id="rainfall"
                  type="number"
                  placeholder="0"
                  step="0.1"
                  value={formData.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                />
              </div>
            </div>

            {/* Growth Stage */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Crop Information
              </h3>
              
              <div>
                <Label htmlFor="growthStage">Growth Stage</Label>
                <select
                  id="growthStage"
                  className="w-full p-2 border border-input rounded-md"
                  value={formData.growthStage}
                  onChange={(e) => handleInputChange('growthStage', e.target.value)}
                >
                  <option value="dormant">Dormant</option>
                  <option value="budbreak">Bud Break</option>
                  <option value="flowering">Flowering</option>
                  <option value="fruit_set">Fruit Set</option>
                  <option value="veraison">Veraison</option>
                  <option value="harvest">Harvest</option>
                  <option value="post_harvest">Post Harvest</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getGrowthStageDescription(formData.growthStage)}
                </p>
              </div>

              <div>
                <Label htmlFor="irrigationMethod">Irrigation Method</Label>
                <select
                  id="irrigationMethod"
                  className="w-full p-2 border border-input rounded-md"
                  value={formData.irrigationMethod}
                  onChange={(e) => handleInputChange('irrigationMethod', e.target.value)}
                >
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="surface">Surface Irrigation</option>
                </select>
              </div>

              <div>
                <Label htmlFor="soilType">Soil Type</Label>
                <select
                  id="soilType"
                  className="w-full p-2 border border-input rounded-md"
                  value={formData.soilType}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                >
                  <option value="sandy">Sandy Soil</option>
                  <option value="loamy">Loamy Soil</option>
                  <option value="clay">Clay Soil</option>
                </select>
              </div>
            </div>

            {/* Location (Optional) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Location (Optional)</h3>
              
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  placeholder="19.0760"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  placeholder="73.8777"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="elevation">Elevation (m)</Label>
                <Input
                  id="elevation"
                  type="number"
                  placeholder="500"
                  value={formData.elevation}
                  onChange={(e) => handleInputChange('elevation', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button 
              onClick={handleCalculate}
              disabled={loading || !selectedFarm}
              className="flex items-center gap-2"
            >
              {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {loading ? 'Calculating...' : 'Calculate ETc'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  ETc Calculation Results
                </CardTitle>
                <CardDescription>
                  Evapotranspiration and irrigation recommendations for {results.date}
                </CardDescription>
              </div>
              {getConfidenceBadge(results.confidence)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              
              {/* Key Metrics */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.eto.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">ETo (mm/day)</div>
                    <div className="text-xs mt-1">Reference Evapotranspiration</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.kc.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Kc</div>
                    <div className="text-xs mt-1">Crop Coefficient</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.etc.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">ETc (mm/day)</div>
                    <div className="text-xs mt-1">Crop Evapotranspiration</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{results.irrigationNeed.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Irrigation Need (mm)</div>
                    <div className="text-xs mt-1">After Rainfall</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Irrigation Recommendation */}
            <Card className={`${results.irrigationRecommendation.shouldIrrigate ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.irrigationRecommendation.shouldIrrigate ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  Irrigation Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={results.irrigationRecommendation.shouldIrrigate ? "destructive" : "default"}>
                      {results.irrigationRecommendation.shouldIrrigate ? "IRRIGATE" : "NO IRRIGATION NEEDED"}
                    </Badge>
                    {results.irrigationRecommendation.shouldIrrigate && (
                      <>
                        <span className="text-sm">
                          Duration: <strong>{results.irrigationRecommendation.duration} hours</strong>
                        </span>
                        <span className="text-sm">
                          Frequency: <strong>{results.irrigationRecommendation.frequency}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  
                  {results.irrigationRecommendation.notes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Additional Notes:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {results.irrigationRecommendation.notes.map((note, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}