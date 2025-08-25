"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Droplets, 
  ThermometerSun, 
  Wind, 
  CloudRain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  ETcCalculator,
  type ETcCalculationInputs,
  type ETcResults,
  type GrapeGrowthStage,
  type WeatherData
} from '@/lib/etc-calculator';
import { HybridDataService } from '@/lib/hybrid-data-service';
import type { Farm } from '@/lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export function ETcCalculatorComponent() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [useCustomData, setUseCustomData] = useState(!user);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ETcResults | null>(null);
  const [activeSection, setActiveSection] = useState<'weather' | 'crop' | 'location'>('weather');

  const [formData, setFormData] = useState({
    // Weather Data
    date: new Date().toISOString().split('T')[0],
    temperatureMax: '',
    temperatureMin: '',
    humidity: '',
    windSpeed: '',
    rainfall: '',
    
    // Growth Stage
    growthStage: 'fruit_set' as GrapeGrowthStage,
    
    // Location (optional)
    latitude: '',
    longitude: '',
    elevation: '',
    
    // Farm Details
    irrigationMethod: 'drip' as 'drip' | 'sprinkler' | 'surface',
    soilType: 'loamy' as 'sandy' | 'loamy' | 'clay'
  });

  const growthStages = [
    { value: 'dormant', label: 'Dormant', period: 'Dec-Jan' },
    { value: 'bud_break', label: 'Bud Break', period: 'Feb-Mar' },
    { value: 'flowering', label: 'Flowering', period: 'Apr-May' },
    { value: 'fruit_set', label: 'Fruit Set', period: 'May-Jun' },
    { value: 'veraison', label: 'Veraison', period: 'Jul-Aug' },
    { value: 'harvest', label: 'Harvest', period: 'Aug-Oct' },
    { value: 'post_harvest', label: 'Post Harvest', period: 'Oct-Nov' }
  ];

  useEffect(() => {
    if (user && !useCustomData) {
      loadFarms();
    }
  }, [user, useCustomData]);

  const loadFarms = async () => {
    try {
      const farmList = await HybridDataService.getAllFarms();
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
    if (!useCustomData && !selectedFarm) {
      alert('Please select a farm first or switch to custom data mode');
      return;
    }

    // Validate required fields
    if (!formData.temperatureMax || !formData.temperatureMin || !formData.humidity || !formData.windSpeed) {
      alert('Please fill in all required weather data fields');
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
        rainfall: formData.rainfall ? parseFloat(formData.rainfall) : undefined,
      };

      const inputs: ETcCalculationInputs = {
        weather: weatherData,
        growthStage: formData.growthStage,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        elevation: formData.elevation ? parseFloat(formData.elevation) : undefined,
        irrigationMethod: formData.irrigationMethod,
        soilType: formData.soilType
      };

      const calculationResults = ETcCalculator.calculate(inputs);
      setResults(calculationResults);
      
      // Scroll to results on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }

    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error performing calculation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      temperatureMax: '',
      temperatureMin: '',
      humidity: '',
      windSpeed: '',
      rainfall: '',
      growthStage: 'fruit_set',
      latitude: '',
      longitude: '',
      elevation: '',
      irrigationMethod: 'drip',
      soilType: 'loamy'
    });
    setResults(null);
    setActiveSection('weather');
  };

  const selectedGrowthStage = growthStages.find(stage => stage.value === formData.growthStage);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="text-center space-y-2 px-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Calculator className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">ETc Calculator</h2>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
          Calculate crop evapotranspiration and irrigation requirements for your vineyard
        </p>
      </div>

      {/* Data Source Toggle */}
      <Card className="mx-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Data Source</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={useCustomData ? "default" : "ghost"}
                size="sm"
                onClick={() => setUseCustomData(true)}
                className="text-xs px-3 py-1"
              >
                Manual
              </Button>
              {user && (
                <Button
                  variant={!useCustomData ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUseCustomData(false)}
                  className="text-xs px-3 py-1"
                >
                  My Farms
                </Button>
              )}
            </div>
          </div>

          {!useCustomData && user ? (
            <div className="space-y-2">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFarm?.id === farm.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFarm(farm)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{farm.name}</h4>
                      <p className="text-xs text-gray-500">{farm.region} • {farm.area}ha</p>
                    </div>
                    {selectedFarm?.id === farm.id && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
              {farms.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No farms found. Switch to Manual mode.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <Info className="h-4 w-4" />
                <span className="font-medium text-sm">Manual Entry Mode</span>
              </div>
              <p className="text-green-600 text-xs mt-1">
                {!user 
                  ? "No sign-in required - enter your data below."
                  : "Using manual data entry mode."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-Optimized Input Sections */}
      <div className="mx-4 space-y-3">
        
        {/* Weather Data Section */}
        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => setActiveSection(activeSection === 'weather' ? 'weather' : 'weather')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base">Weather Data</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </div>
            <CardDescription className="text-xs">
              Current weather conditions for your location
            </CardDescription>
          </CardHeader>
          {activeSection === 'weather' && (
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="h-11 text-base mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Max Temp (°C)</Label>
                    <Input
                      type="number"
                      placeholder="35"
                      value={formData.temperatureMax}
                      onChange={(e) => handleInputChange('temperatureMax', e.target.value)}
                      className="h-11 text-base mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Min Temp (°C)</Label>
                    <Input
                      type="number"
                      placeholder="22"
                      value={formData.temperatureMin}
                      onChange={(e) => handleInputChange('temperatureMin', e.target.value)}
                      className="h-11 text-base mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Humidity (%)</Label>
                    <Input
                      type="number"
                      placeholder="65"
                      min="0"
                      max="100"
                      value={formData.humidity}
                      onChange={(e) => handleInputChange('humidity', e.target.value)}
                      className="h-11 text-base mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Wind (m/s)</Label>
                    <Input
                      type="number"
                      placeholder="2.5"
                      step="0.1"
                      value={formData.windSpeed}
                      onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                      className="h-11 text-base mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Rainfall (mm) - Optional</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    step="0.1"
                    value={formData.rainfall}
                    onChange={(e) => handleInputChange('rainfall', e.target.value)}
                    className="h-11 text-base mt-1"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Crop Information Section */}
        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => setActiveSection(activeSection === 'crop' ? 'crop' : 'crop')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-green-500" />
                <CardTitle className="text-base">Crop Information</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </div>
            <CardDescription className="text-xs">
              Growth stage and farming method details
            </CardDescription>
          </CardHeader>
          {activeSection === 'crop' && (
            <CardContent className="pt-0 space-y-4">
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Growth Stage</Label>
                <Select
                  value={formData.growthStage}
                  onValueChange={(value) => handleInputChange('growthStage', value)}
                >
                  <SelectTrigger className="h-11 text-base mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {growthStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex flex-col">
                          <span>{stage.label}</span>
                          <span className="text-xs text-gray-500">{stage.period}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGrowthStage && (
                  <p className="text-xs text-green-600 mt-1">
                    {selectedGrowthStage.label} ({selectedGrowthStage.period})
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Irrigation Method</Label>
                <Select
                  value={formData.irrigationMethod}
                  onValueChange={(value: 'drip' | 'sprinkler' | 'surface') => handleInputChange('irrigationMethod', value)}
                >
                  <SelectTrigger className="h-11 text-base mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="surface">Surface Irrigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Soil Type</Label>
                <Select
                  value={formData.soilType}
                  onValueChange={(value: 'sandy' | 'loamy' | 'clay') => handleInputChange('soilType', value)}
                >
                  <SelectTrigger className="h-11 text-base mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandy">Sandy Soil</SelectItem>
                    <SelectItem value="loamy">Loamy Soil</SelectItem>
                    <SelectItem value="clay">Clay Soil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Location Section (Optional) */}
        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => setActiveSection(activeSection === 'location' ? 'location' : 'location')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base">Location (Optional)</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <CardDescription className="text-xs">
              Geographic coordinates for more accuracy
            </CardDescription>
          </CardHeader>
          {activeSection === 'location' && (
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Latitude</Label>
                  <Input
                    type="number"
                    placeholder="19.0760"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="h-11 text-base mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Longitude</Label>
                  <Input
                    type="number"
                    placeholder="72.8777"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="h-11 text-base mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Elevation (m)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.elevation}
                  onChange={(e) => handleInputChange('elevation', e.target.value)}
                  className="h-11 text-base mt-1"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Calculate Button */}
      <div className="px-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {loading ? (
              <>
                <Calculator className="mr-2 h-4 w-4 animate-pulse" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate ETc
              </>
            )}
          </Button>
          {results && (
            <Button
              variant="outline"
              onClick={resetForm}
              className="px-6 h-12"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div id="results-section" className="mx-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg text-green-800">ETc Results</CardTitle>
                </div>
                <Badge 
                  variant={results.confidence === 'high' ? 'default' : results.confidence === 'medium' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {results.confidence.toUpperCase()} CONFIDENCE
                </Badge>
              </div>
              <CardDescription className="text-green-700 text-sm">
                Evapotranspiration and irrigation recommendations for {formData.date}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{results.eto.toFixed(2)}</div>
                  <div className="text-xs font-medium text-green-600">ETo (mm/day)</div>
                  <div className="text-xs text-gray-600">Reference ET</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-blue-700">{results.etc.toFixed(2)}</div>
                  <div className="text-xs font-medium text-blue-600">ETc (mm/day)</div>
                  <div className="text-xs text-gray-600">Crop ET</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-purple-700">{results.kc.toFixed(2)}</div>
                  <div className="text-xs font-medium text-purple-600">Kc</div>
                  <div className="text-xs text-gray-600">Crop Coefficient</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-orange-700">{results.irrigationNeed.toFixed(2)}</div>
                  <div className="text-xs font-medium text-orange-600">Need (mm)</div>
                  <div className="text-xs text-gray-600">After Rainfall</div>
                </div>
              </div>

              {/* Irrigation Recommendation */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Irrigation Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-blue-600 text-white text-sm">
                          {results.shouldIrrigate ? 'IRRIGATE' : 'NO IRRIGATION'}
                        </Badge>
                      </div>
                      {results.shouldIrrigate && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{results.irrigationDuration.toFixed(2)} hours</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Frequency:</span>
                            <span className="font-medium">daily</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {results.notes && results.notes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-800 text-sm mb-2">Additional Notes:</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {results.notes.map((note, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}