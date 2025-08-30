"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowLeft, ArrowRight } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { WeatherDataForm } from './ETc/WeatherDataForm';
import { DataSourceSelector } from './ETc/DataSourceSelector';
import { CropInformationForm } from './ETc/CropInformationForm';
import { LocationForm } from './ETc/LocationForm';
import { ResultsDisplay } from './ETc/ResultsDisplay';
import { useETcCalculator } from '@/hooks/useETcCalculator';
import { Progress } from '@/components/ui/progress';

const steps = ['weather', 'crop', 'location'];

export function ETcCalculatorComponent() {
  const { user } = useSupabaseAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [useCustomData, setUseCustomData] = useState(!user);
  const [currentStep, setCurrentStep] = useState(0);

  const {
    formData,
    results,
    error,
    loading,
    handleInputChange,
    handleCalculate,
    resetForm,
  } = useETcCalculator();

  useEffect(() => {
    if (user && !useCustomData) {
      loadFarms();
    }
  }, [user, useCustomData]);

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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onCalculate = () => {
    handleCalculate(selectedFarm, useCustomData);
  };
  
  const onReset = () => {
    resetForm();
    setCurrentStep(0);
  }

  if (results) {
    return (
      <div className="space-y-4">
        <ResultsDisplay results={results} date={formData.date} />
        <Button onClick={onReset} variant="outline" className="w-full">
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <DataSourceSelector
        user={user}
        farms={farms}
        selectedFarm={selectedFarm}
        useCustomData={useCustomData}
        onFarmSelect={setSelectedFarm}
        onDataSourceChange={setUseCustomData}
      />
      
      <div className="px-4">
        <Progress value={(currentStep + 1) / steps.length * 100} className="w-full h-2" />
        <p className="text-center text-sm text-gray-500 mt-2">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      <div className="mx-4">
        {steps[currentStep] === 'weather' && (
          <WeatherDataForm
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}
        {steps[currentStep] === 'crop' && (
          <CropInformationForm
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}
        {steps[currentStep] === 'location' && (
          <LocationForm
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}
      </div>

      {error && (
        <div className="mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="h-12">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="flex-1 h-12">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onCalculate}
              disabled={loading}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Calculating...' : 'Calculate ETc'}
              <Calculator className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}