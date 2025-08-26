"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calculator
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
import { WeatherDataForm } from './ETc/WeatherDataForm';
import { DataSourceSelector } from './ETc/DataSourceSelector';
import { CropInformationForm } from './ETc/CropInformationForm';
import { LocationForm } from './ETc/LocationForm';
import { ResultsDisplay } from './ETc/ResultsDisplay';

export function ETcCalculatorComponent() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [useCustomData, setUseCustomData] = useState(!user);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ETcResults | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    
    if (!useCustomData && !selectedFarm) {
      setError('Please select a farm first or switch to custom data mode');
      return;
    }

    // Validate required fields
    if (!formData.temperatureMax || !formData.temperatureMin || !formData.humidity || !formData.windSpeed) {
      setError('Please fill in all required weather data fields');
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
        farmId: selectedFarm?.id || 0,
        weatherData: weatherData,
        growthStage: formData.growthStage,
        plantingDate: selectedFarm?.planting_date || '2024-01-01',
        location: {
          latitude: formData.latitude ? parseFloat(formData.latitude) : (selectedFarm?.latitude || 19.0760),
          longitude: formData.longitude ? parseFloat(formData.longitude) : (selectedFarm?.longitude || 72.8777),
          elevation: formData.elevation ? parseFloat(formData.elevation) : 500
        },
        irrigationMethod: formData.irrigationMethod,
        soilType: formData.soilType
      };

      const calculationResults = ETcCalculator.calculateETc(inputs);
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
      setError('Error performing calculation. Please check your inputs.');
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
    setError(null);
    setActiveSection('weather');
  };


  return (
    <div className="space-y-3 pb-16">
      {/* Header */}
      <div className="text-center space-y-1 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Calculator className="h-4 w-4 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">ETc Calculator</h2>
        </div>
        <p className="text-gray-600 text-xs leading-relaxed max-w-xl mx-auto">
          Calculate crop evapotranspiration and irrigation requirements for your vineyard
        </p>
      </div>

      {/* Data Source Toggle */}
      <DataSourceSelector
        user={user}
        farms={farms}
        selectedFarm={selectedFarm}
        useCustomData={useCustomData}
        onFarmSelect={setSelectedFarm}
        onDataSourceChange={setUseCustomData}
      />

      {/* Mobile-Optimized Input Sections */}
      <div className="mx-4 space-y-3">
        <WeatherDataForm
          formData={{
            date: formData.date,
            temperatureMax: formData.temperatureMax,
            temperatureMin: formData.temperatureMin,
            humidity: formData.humidity,
            windSpeed: formData.windSpeed,
            rainfall: formData.rainfall
          }}
          activeSection={activeSection}
          onInputChange={handleInputChange}
          onSectionToggle={setActiveSection}
        />
        
        <CropInformationForm
          formData={{
            growthStage: formData.growthStage,
            irrigationMethod: formData.irrigationMethod,
            soilType: formData.soilType
          }}
          activeSection={activeSection}
          onInputChange={handleInputChange}
          onSectionToggle={setActiveSection}
        />
        
        <LocationForm
          formData={{
            latitude: formData.latitude,
            longitude: formData.longitude,
            elevation: formData.elevation
          }}
          activeSection={activeSection}
          onInputChange={handleInputChange}
          onSectionToggle={setActiveSection}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

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
        <ResultsDisplay results={results} date={formData.date} />
      )}
    </div>
  );
}