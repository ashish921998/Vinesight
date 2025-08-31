"use client";

import { useState } from 'react';
import { 
  ETcCalculator,
  type ETcCalculationInputs,
  type ETcResults,
  type GrapeGrowthStage,
  type WeatherData
} from '@/lib/etc-calculator';
import type { Farm } from '@/lib/supabase';

export function useETcCalculator() {
  const [results, setResults] = useState<ETcResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    temperatureMax: '',
    temperatureMin: '',
    humidity: '',
    windSpeed: '',
    rainfall: '',
    solarRadiation: '',
    solarRadiationLux: '',
    sunshineHours: '',
    growthStage: 'fruit_set' as GrapeGrowthStage,
    latitude: '',
    longitude: '',
    elevation: '',
    irrigationMethod: 'drip' as 'drip' | 'sprinkler' | 'surface',
    soilType: 'loamy' as 'sandy' | 'loamy' | 'clay'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = (selectedFarm: Farm | null, useCustomData: boolean) => {
    setError(null);
    
    if (!useCustomData && !selectedFarm) {
      setError('Please select a farm first or switch to custom data mode');
      return;
    }

    if (!formData.temperatureMax || !formData.temperatureMin || !formData.humidity || !formData.windSpeed || formData.rainfall === '') {
      setError('Please fill in all required weather data fields (temperature, humidity, wind speed, rainfall)');
      return;
    }

    // Check if at least one solar radiation input is provided
    const hasSolarData = formData.solarRadiation || formData.solarRadiationLux || formData.sunshineHours;
    if (!hasSolarData) {
      setError('Please provide at least one form of solar radiation data (solar radiation, lux, or sunshine hours)');
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
        rainfall: parseFloat(formData.rainfall), // Now required
        solarRadiation: formData.solarRadiation ? parseFloat(formData.solarRadiation) : undefined,
        solarRadiationLux: formData.solarRadiationLux ? parseFloat(formData.solarRadiationLux) : undefined,
        sunshineHours: formData.sunshineHours ? parseFloat(formData.sunshineHours) : undefined,
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
      solarRadiation: '',
      solarRadiationLux: '',
      sunshineHours: '',
      growthStage: 'fruit_set',
      latitude: '',
      longitude: '',
      elevation: '',
      irrigationMethod: 'drip',
      soilType: 'loamy'
    });
    setResults(null);
    setError(null);
  };

  return {
    formData,
    results,
    error,
    loading,
    handleInputChange,
    handleCalculate,
    resetForm,
  };
}