"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Calendar,
  AlertTriangle,
  Target,
  Lightbulb,
  Database,
  Activity,
  Leaf,
  Grape,
  CloudRain,
  Thermometer
} from "lucide-react";
import {
  YieldPredictionEngine,
  type YieldPredictionInputs,
  type YieldPredictionResults,
  type HistoricalYieldData
} from "@/lib/yield-prediction";

export function YieldPredictionComponent() {
  const [inputs, setInputs] = useState<YieldPredictionInputs>({
    historicalData: [],
    currentSeasonData: {
      vineAge: 8,
      grapeVariety: 'cabernet_sauvignon',
      plantingDensity: 3000,
      targetQuality: 'premium',
      currentWeather: {
        growingSeason: {
          averageTemp: 22.5,
          totalRainfall: 450,
          sunlightHours: 2800,
          extremeWeatherEvents: 2
        },
        floweringPeriod: {
          averageTemp: 18.5,
          rainfall: 45,
          windSpeed: 3.2
        },
        ripening: {
          averageTemp: 26.8,
          rainfall: 28,
          heatWavesDays: 8
        }
      },
      plannedManagement: {
        pruningIntensity: 'moderate',
        irrigationAmount: 350,
        fertilizationProgram: 'standard',
        canopyManagement: 'standard',
        pestControl: 4
      },
      currentSoil: {
        organicMatter: 3.2,
        nitrogen: 140,
        phosphorus: 45,
        potassium: 180,
        pH: 6.3,
        drainage: 'good'
      },
      budBreakDate: new Date('2024-03-15'),
      floweringDate: new Date('2024-05-10'),
      veraison: null
    },
    economicFactors: {
      targetPrice: 8.50,
      productionCost: 12000,
      laborCost: 25,
      inputCosts: {
        fertilizer: 800,
        pesticides: 600,
        water: 400
      }
    }
  });

  const [historicalInput, setHistoricalInput] = useState<Partial<HistoricalYieldData>>({
    year: 2023,
    yieldPerHectare: 12000,
    averageClusterWeight: 150,
    clustersPerVine: 32,
    berrySize: 'medium',
    sugarContent: 24.2,
    acidity: 6.5,
    pH: 3.6,
    harvestDate: new Date('2023-09-15'),
    weatherConditions: {
      growingSeason: {
        averageTemp: 21.8,
        totalRainfall: 380,
        sunlightHours: 2650,
        extremeWeatherEvents: 1
      },
      floweringPeriod: {
        averageTemp: 17.2,
        rainfall: 32,
        windSpeed: 2.8
      },
      ripening: {
        averageTemp: 25.4,
        rainfall: 15,
        heatWavesDays: 5
      }
    },
    managementPractices: {
      pruningIntensity: 'moderate',
      irrigationAmount: 320,
      fertilizationProgram: 'standard',
      canopyManagement: 'standard',
      pestControl: 3
    },
    soilConditions: {
      organicMatter: 3.0,
      nitrogen: 135,
      phosphorus: 42,
      potassium: 175,
      pH: 6.2,
      drainage: 'good'
    }
  });

  const [results, setResults] = useState<YieldPredictionResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeHistoricalYear, setActiveHistoricalYear] = useState<number>(2023);

  // Add sample historical data
  useEffect(() => {
    const sampleData: HistoricalYieldData[] = [
      {
        year: 2023,
        yieldPerHectare: 11800,
        averageClusterWeight: 148,
        clustersPerVine: 31,
        berrySize: 'medium',
        sugarContent: 24.1,
        acidity: 6.4,
        pH: 3.62,
        harvestDate: new Date('2023-09-12'),
        weatherConditions: {
          growingSeason: { averageTemp: 21.5, totalRainfall: 390, sunlightHours: 2680, extremeWeatherEvents: 1 },
          floweringPeriod: { averageTemp: 17.8, rainfall: 35, windSpeed: 2.9 },
          ripening: { averageTemp: 25.2, rainfall: 18, heatWavesDays: 6 }
        },
        managementPractices: {
          pruningIntensity: 'moderate',
          irrigationAmount: 315,
          fertilizationProgram: 'standard',
          canopyManagement: 'standard',
          pestControl: 3
        },
        soilConditions: {
          organicMatter: 2.9,
          nitrogen: 138,
          phosphorus: 41,
          potassium: 172,
          pH: 6.1,
          drainage: 'good'
        }
      },
      {
        year: 2022,
        yieldPerHectare: 10950,
        averageClusterWeight: 142,
        clustersPerVine: 29,
        berrySize: 'medium',
        sugarContent: 23.8,
        acidity: 6.8,
        pH: 3.58,
        harvestDate: new Date('2022-09-18'),
        weatherConditions: {
          growingSeason: { averageTemp: 20.2, totalRainfall: 520, sunlightHours: 2420, extremeWeatherEvents: 3 },
          floweringPeriod: { averageTemp: 16.5, rainfall: 85, windSpeed: 4.2 },
          ripening: { averageTemp: 23.8, rainfall: 45, heatWavesDays: 3 }
        },
        managementPractices: {
          pruningIntensity: 'moderate',
          irrigationAmount: 280,
          fertilizationProgram: 'standard',
          canopyManagement: 'minimal',
          pestControl: 4
        },
        soilConditions: {
          organicMatter: 2.7,
          nitrogen: 125,
          phosphorus: 38,
          potassium: 165,
          pH: 6.0,
          drainage: 'moderate'
        }
      },
      {
        year: 2021,
        yieldPerHectare: 12400,
        averageClusterWeight: 155,
        clustersPerVine: 34,
        berrySize: 'large',
        sugarContent: 24.6,
        acidity: 6.2,
        pH: 3.68,
        harvestDate: new Date('2021-09-08'),
        weatherConditions: {
          growingSeason: { averageTemp: 23.1, totalRainfall: 285, sunlightHours: 2890, extremeWeatherEvents: 0 },
          floweringPeriod: { averageTemp: 19.2, rainfall: 12, windSpeed: 2.1 },
          ripening: { averageTemp: 27.5, rainfall: 8, heatWavesDays: 12 }
        },
        managementPractices: {
          pruningIntensity: 'light',
          irrigationAmount: 420,
          fertilizationProgram: 'intensive',
          canopyManagement: 'intensive',
          pestControl: 5
        },
        soilConditions: {
          organicMatter: 3.4,
          nitrogen: 165,
          phosphorus: 52,
          potassium: 195,
          pH: 6.4,
          drainage: 'good'
        }
      }
    ];
    
    setInputs(prev => ({ ...prev, historicalData: sampleData }));
  }, []);

  const addHistoricalData = () => {
    if (historicalInput.year && historicalInput.yieldPerHectare) {
      const newData: HistoricalYieldData = historicalInput as HistoricalYieldData;
      setInputs(prev => ({
        ...prev,
        historicalData: [...prev.historicalData, newData].sort((a, b) => b.year - a.year)
      }));
      
      // Reset form
      setHistoricalInput({
        year: new Date().getFullYear(),
        yieldPerHectare: 12000,
        averageClusterWeight: 150,
        clustersPerVine: 32,
        berrySize: 'medium',
        sugarContent: 24.2,
        acidity: 6.5,
        pH: 3.6
      });
    }
  };

  const predictYield = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const prediction = YieldPredictionEngine.predictYield(inputs);
      setResults(prediction);
      setIsCalculating(false);
    }, 2000);
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return 'text-green-600';
      case 'realistic': return 'text-blue-600';
      case 'pessimistic': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getRiskColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-6 w-6" />
            Yield Prediction System
          </CardTitle>
          <CardDescription className="text-blue-700">
            AI-powered yield forecasting using historical data, weather patterns, and vineyard conditions
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="current">Current Season</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grape className="h-5 w-5" />
                  Vineyard Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Grape Variety</Label>
                  <Select
                    value={inputs.currentSeasonData.grapeVariety}
                    onValueChange={(value: any) => 
                      setInputs(prev => ({
                        ...prev,
                        currentSeasonData: { ...prev.currentSeasonData, grapeVariety: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabernet_sauvignon">Cabernet Sauvignon</SelectItem>
                      <SelectItem value="chardonnay">Chardonnay</SelectItem>
                      <SelectItem value="pinot_noir">Pinot Noir</SelectItem>
                      <SelectItem value="merlot">Merlot</SelectItem>
                      <SelectItem value="sauvignon_blanc">Sauvignon Blanc</SelectItem>
                      <SelectItem value="riesling">Riesling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vine Age (years)</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.vineAge}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: { ...prev.currentSeasonData, vineAge: parseInt(e.target.value) }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Planting Density (vines/ha)</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.plantingDensity}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: { ...prev.currentSeasonData, plantingDensity: parseInt(e.target.value) }
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Target Quality</Label>
                  <Select
                    value={inputs.currentSeasonData.targetQuality}
                    onValueChange={(value: any) => 
                      setInputs(prev => ({
                        ...prev,
                        currentSeasonData: { ...prev.currentSeasonData, targetQuality: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="bulk">Bulk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Economic Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Price ($/kg)</Label>
                    <Input
                      type="number"
                      step="0.10"
                      value={inputs.economicFactors.targetPrice}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { ...prev.economicFactors, targetPrice: parseFloat(e.target.value) }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Production Cost ($/ha)</Label>
                    <Input
                      type="number"
                      value={inputs.economicFactors.productionCost}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { ...prev.economicFactors, productionCost: parseFloat(e.target.value) }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Labor Cost ($/hour)</Label>
                    <Input
                      type="number"
                      value={inputs.economicFactors.laborCost}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { ...prev.economicFactors, laborCost: parseFloat(e.target.value) }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Fertilizer Cost ($)</Label>
                    <Input
                      type="number"
                      value={inputs.economicFactors.inputCosts.fertilizer}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { 
                            ...prev.economicFactors, 
                            inputCosts: { 
                              ...prev.economicFactors.inputCosts, 
                              fertilizer: parseFloat(e.target.value) 
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pesticide Cost ($)</Label>
                    <Input
                      type="number"
                      value={inputs.economicFactors.inputCosts.pesticides}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { 
                            ...prev.economicFactors, 
                            inputCosts: { 
                              ...prev.economicFactors.inputCosts, 
                              pesticides: parseFloat(e.target.value) 
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Water Cost ($)</Label>
                    <Input
                      type="number"
                      value={inputs.economicFactors.inputCosts.water}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          economicFactors: { 
                            ...prev.economicFactors, 
                            inputCosts: { 
                              ...prev.economicFactors.inputCosts, 
                              water: parseFloat(e.target.value) 
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Add Historical Data
                </CardTitle>
                <CardDescription>
                  Enter yield and quality data from previous seasons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={historicalInput.year || ''}
                      onChange={(e) => setHistoricalInput(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Yield (kg/ha)</Label>
                    <Input
                      type="number"
                      value={historicalInput.yieldPerHectare || ''}
                      onChange={(e) => setHistoricalInput(prev => ({ ...prev, yieldPerHectare: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Sugar Content (Brix)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={historicalInput.sugarContent || ''}
                      onChange={(e) => setHistoricalInput(prev => ({ ...prev, sugarContent: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Acidity (g/L)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={historicalInput.acidity || ''}
                      onChange={(e) => setHistoricalInput(prev => ({ ...prev, acidity: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label>pH</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={historicalInput.pH || ''}
                      onChange={(e) => setHistoricalInput(prev => ({ ...prev, pH: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <Button onClick={addHistoricalData} className="w-full">
                  Add Historical Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Historical Overview
                </CardTitle>
                <CardDescription>
                  {inputs.historicalData.length} years of data available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {inputs.historicalData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{data.year}</span>
                        <div className="text-xs text-muted-foreground">
                          {data.yieldPerHectare.toLocaleString()} kg/ha
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{data.sugarContent}° Brix</div>
                        <div className="text-xs text-muted-foreground">pH {data.pH}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" />
                  Weather Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Growing Season Temp (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={inputs.currentSeasonData.currentWeather.growingSeason.averageTemp}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            currentWeather: {
                              ...prev.currentSeasonData.currentWeather,
                              growingSeason: {
                                ...prev.currentSeasonData.currentWeather.growingSeason,
                                averageTemp: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Total Rainfall (mm)</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.currentWeather.growingSeason.totalRainfall}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            currentWeather: {
                              ...prev.currentSeasonData.currentWeather,
                              growingSeason: {
                                ...prev.currentSeasonData.currentWeather.growingSeason,
                                totalRainfall: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sunlight Hours</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.currentWeather.growingSeason.sunlightHours}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            currentWeather: {
                              ...prev.currentSeasonData.currentWeather,
                              growingSeason: {
                                ...prev.currentSeasonData.currentWeather.growingSeason,
                                sunlightHours: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Extreme Weather Events</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.currentWeather.growingSeason.extremeWeatherEvents}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            currentWeather: {
                              ...prev.currentSeasonData.currentWeather,
                              growingSeason: {
                                ...prev.currentSeasonData.currentWeather.growingSeason,
                                extremeWeatherEvents: parseInt(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Management Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pruning Intensity</Label>
                  <Select
                    value={inputs.currentSeasonData.plannedManagement.pruningIntensity}
                    onValueChange={(value: any) => 
                      setInputs(prev => ({
                        ...prev,
                        currentSeasonData: {
                          ...prev.currentSeasonData,
                          plannedManagement: {
                            ...prev.currentSeasonData.plannedManagement,
                            pruningIntensity: value
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Irrigation Amount (mm)</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.plannedManagement.irrigationAmount}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            plannedManagement: {
                              ...prev.currentSeasonData.plannedManagement,
                              irrigationAmount: parseFloat(e.target.value)
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Pest Control Applications</Label>
                    <Input
                      type="number"
                      value={inputs.currentSeasonData.plannedManagement.pestControl}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          currentSeasonData: {
                            ...prev.currentSeasonData,
                            plannedManagement: {
                              ...prev.currentSeasonData.plannedManagement,
                              pestControl: parseInt(e.target.value)
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={predictYield}
              disabled={isCalculating || inputs.historicalData.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              {isCalculating ? 'Predicting Yield...' : 'Generate Yield Prediction'}
            </Button>
          </div>

          {isCalculating && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Analyzing historical patterns and current conditions...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-6">
              {/* Prediction Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(results.prediction.scenarios).map(([scenario, data]) => (
                  <Card key={scenario} className="border-l-4" style={{ borderLeftColor: scenario === 'optimistic' ? '#16a34a' : scenario === 'realistic' ? '#2563eb' : '#ea580c' }}>
                    <CardHeader>
                      <CardTitle className={`text-lg capitalize ${getScenarioColor(scenario)}`}>
                        {scenario} Scenario
                      </CardTitle>
                      <CardDescription>
                        {data.probability}% probability
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {data.yield.toLocaleString()} kg/ha
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(data.yield / inputs.currentSeasonData.plantingDensity * 1000)} kg/vine
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quality Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Quality Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Quality</span>
                        <Badge variant="outline" className={getQualityColor(results.quality.overallQuality)}>
                          {results.quality.overallQuality.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Quality Score</span>
                          <span className="font-medium">{results.quality.qualityScore}/100</span>
                        </div>
                        <Progress value={results.quality.qualityScore} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Sugar Content:</span>
                        <span className="font-medium">
                          {results.quality.sugarContent.predicted.toFixed(1)}° Brix
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Acidity:</span>
                        <span className="font-medium">
                          {results.quality.acidity.predicted.toFixed(1)} g/L
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>pH:</span>
                        <span className="font-medium">
                          {results.quality.pH.predicted.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm font-medium mb-2">Optimal Harvest Window</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Earliest</div>
                        <div>{results.quality.harvestWindow.earliest.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Optimal</div>
                        <div className="font-medium">{results.quality.harvestWindow.optimal.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Latest</div>
                        <div>{results.quality.harvestWindow.latest.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              {results.riskFactors.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded">
                        <Badge variant="outline" className={getRiskColor(risk.impact)}>
                          {risk.impact.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{risk.factor}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded">
                      <Badge variant="outline" className="capitalize">
                        {rec.category}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rec.action}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Timing:</strong> {rec.timing} | <strong>Impact:</strong> {rec.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Confidence & Data Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prediction Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold">{results.confidence}%</span>
                      <Badge variant={results.confidence >= 80 ? 'default' : results.confidence >= 60 ? 'secondary' : 'destructive'}>
                        {results.confidence >= 80 ? 'High' : results.confidence >= 60 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                    <Progress value={results.confidence} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Quality</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Historical Years:</span>
                      <span className="font-medium">{results.dataQuality.historicalYears}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completeness:</span>
                      <span className="font-medium">{results.dataQuality.completeness}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Relevance:</span>
                      <span className="font-medium">{results.dataQuality.relevance}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          {results && (
            <div className="space-y-6">
              {/* Revenue Projections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(results.economics.revenue).map(([scenario, revenue]) => (
                  <Card key={scenario} className="text-center">
                    <CardHeader>
                      <CardTitle className={`text-lg capitalize ${getScenarioColor(scenario)}`}>
                        {scenario} Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatCurrency(revenue)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per hectare
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Total Costs</span>
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(results.economics.costs.total)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cost per kg</span>
                        <span className="font-medium">
                          {formatCurrency(results.economics.costs.perKg)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Break-even yield</span>
                        <span className="font-medium">
                          {Math.round(results.economics.breakEvenYield).toLocaleString()} kg/ha
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm font-medium mb-2">Cost Breakdown</div>
                      {Object.entries(results.economics.costs.breakdown).map(([category, cost]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="capitalize">{category}:</span>
                          <span className="font-medium">{formatCurrency(cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profitability Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(results.economics.profitability).map(([scenario, profit]) => (
                  <Card key={scenario} className="text-center">
                    <CardHeader>
                      <CardTitle className={`text-lg capitalize ${getScenarioColor(scenario)}`}>
                        {scenario} Profit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold mb-2 ${profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit.profit)}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {profit.margin.toFixed(1)}% margin
                      </div>
                      <div className="text-xs">
                        per hectare
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ROI Summary */}
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Return on Investment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold mb-2 ${results.economics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.economics.roi.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">
                    Expected annual return based on realistic scenario
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}