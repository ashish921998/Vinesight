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
  Leaf,
  Beaker,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  BarChart3,
  Lightbulb,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  Sprout
} from "lucide-react";
import {
  SoilHealthAnalyzer,
  type SoilHealthInputs,
  type SoilHealthResults,
  type SoilTestData
} from "@/lib/soil-health";

export function SoilHealthMonitoringComponent() {
  const [inputs, setInputs] = useState<SoilHealthInputs>({
    testData: {
      testDate: new Date(),
      farmId: 'demo-farm-001',
      location: {
        fieldName: 'Block A - Main Vineyard',
        depth: 15
      },
      physical: {
        soilTexture: 'loam',
        bulkDensity: 1.35,
        porosity: 48,
        waterHoldingCapacity: 28,
        infiltrationRate: 12
      },
      chemical: {
        pH: 6.8,
        electricalConductivity: 0.8,
        organicMatter: 2.1,
        organicCarbon: 1.2,
        cationExchangeCapacity: 18.5,
        nitrogen: {
          total: 0.12,
          available: 245,
          nitrate: 35,
          ammonium: 15
        },
        phosphorus: {
          total: 450,
          available: 28,
          organic: 180
        },
        potassium: {
          total: 1800,
          available: 220,
          exchangeable: 180
        },
        calcium: 1850,
        magnesium: 180,
        sulfur: 22,
        iron: 12.5,
        manganese: 18,
        zinc: 2.1,
        copper: 1.2,
        boron: 0.8,
        molybdenum: 0.15
      },
      biological: {
        microbialBiomassCarbon: 285,
        soilRespiration: 42,
        enzymeActivity: {
          dehydrogenase: 35,
          phosphatase: 180,
          urease: 48
        },
        earthwormCount: 85,
        nematodeCount: 450
      }
    },
    farmContext: {
      cropType: 'grapes',
      variety: 'Cabernet Sauvignon',
      plantingYear: 2018,
      irrigationMethod: 'drip',
      previousCrops: ['cover crops', 'fallow'],
      managementHistory: {
        organicMatter: true,
        coverCrops: true,
        tillage: 'minimum_till',
        chemicalInputs: 'medium'
      }
    },
    climateData: {
      averageRainfall: 650,
      temperature: { min: 12, max: 35 },
      humidity: 65,
      windSpeed: 8
    }
  });

  const [results, setResults] = useState<SoilHealthResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('input');

  const analyzeSoilHealth = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const analysis = SoilHealthAnalyzer.analyzeSoilHealth(inputs);
      setResults(analysis);
      setIsAnalyzing(false);
      setActiveTab('results');
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 65) return 'text-blue-600 bg-blue-50';
    if (score >= 45) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreColorBar = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-blue-500';
    if (score >= 45) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      excellent: 'bg-green-600 text-white',
      good: 'bg-blue-600 text-white',
      fair: 'bg-orange-600 text-white',
      poor: 'bg-red-600 text-white'
    };
    return variants[category as keyof typeof variants] || variants.fair;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-gray-200';
      case 'moderate': return 'text-orange-700 bg-orange-50 border-gray-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Leaf className="h-6 w-6" />
            Soil Health Monitoring System
          </CardTitle>
          <CardDescription className="text-green-700">
            Comprehensive soil analysis for optimal grape production with scientific recommendations
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="input">Soil Data</TabsTrigger>
          <TabsTrigger value="physical">Physical</TabsTrigger>
          <TabsTrigger value="chemical">Chemical</TabsTrigger>
          <TabsTrigger value="biological">Biological</TabsTrigger>
          <TabsTrigger value="results">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Test Date</Label>
                  <Input
                    type="date"
                    value={inputs.testData.testDate.toISOString().split('T')[0]}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: { ...prev.testData, testDate: new Date(e.target.value) }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label>Field Name</Label>
                  <Input
                    value={inputs.testData.location.fieldName}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          location: { ...prev.testData.location, fieldName: e.target.value }
                        }
                      }))
                    }
                    placeholder="e.g., Block A - Main Vineyard"
                  />
                </div>
                
                <div>
                  <Label>Sampling Depth (cm)</Label>
                  <Select
                    value={inputs.testData.location.depth.toString()}
                    onValueChange={(value) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          location: { ...prev.testData.location, depth: parseInt(value) }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">0-15 cm (Surface)</SelectItem>
                      <SelectItem value="30">15-30 cm (Subsurface)</SelectItem>
                      <SelectItem value="60">30-60 cm (Deep)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Farm Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Grape Variety</Label>
                  <Select
                    value={inputs.farmContext.variety}
                    onValueChange={(value) => 
                      setInputs(prev => ({
                        ...prev,
                        farmContext: { ...prev.farmContext, variety: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cabernet Sauvignon">Cabernet Sauvignon</SelectItem>
                      <SelectItem value="Chardonnay">Chardonnay</SelectItem>
                      <SelectItem value="Pinot Noir">Pinot Noir</SelectItem>
                      <SelectItem value="Merlot">Merlot</SelectItem>
                      <SelectItem value="Sauvignon Blanc">Sauvignon Blanc</SelectItem>
                      <SelectItem value="Riesling">Riesling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Planting Year</Label>
                  <Input
                    type="number"
                    value={inputs.farmContext.plantingYear}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        farmContext: { ...prev.farmContext, plantingYear: parseInt(e.target.value) }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label>Irrigation Method</Label>
                  <Select
                    value={inputs.farmContext.irrigationMethod}
                    onValueChange={(value: any) => 
                      setInputs(prev => ({
                        ...prev,
                        farmContext: { ...prev.farmContext, irrigationMethod: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler System</SelectItem>
                      <SelectItem value="furrow">Furrow Irrigation</SelectItem>
                      <SelectItem value="none">Rain-fed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="physical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Physical Soil Properties
              </CardTitle>
              <CardDescription>
                Physical characteristics affecting water movement, root growth, and soil structure
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Soil Texture</Label>
                  <Select
                    value={inputs.testData.physical.soilTexture}
                    onValueChange={(value: any) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          physical: { ...prev.testData.physical, soilTexture: value }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sand">Sand</SelectItem>
                      <SelectItem value="loamy_sand">Loamy Sand</SelectItem>
                      <SelectItem value="sandy_loam">Sandy Loam</SelectItem>
                      <SelectItem value="loam">Loam</SelectItem>
                      <SelectItem value="silt_loam">Silt Loam</SelectItem>
                      <SelectItem value="silt">Silt</SelectItem>
                      <SelectItem value="clay_loam">Clay Loam</SelectItem>
                      <SelectItem value="silty_clay_loam">Silty Clay Loam</SelectItem>
                      <SelectItem value="sandy_clay">Sandy Clay</SelectItem>
                      <SelectItem value="silty_clay">Silty Clay</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Bulk Density (g/cm³)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.testData.physical.bulkDensity}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          physical: { ...prev.testData.physical, bulkDensity: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Optimal: 1.0-1.6 g/cm³
                  </div>
                </div>
                
                <div>
                  <Label>Porosity (%)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.physical.porosity}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          physical: { ...prev.testData.physical, porosity: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Optimal: 35-60%
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Water Holding Capacity (%)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.physical.waterHoldingCapacity}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          physical: { ...prev.testData.physical, waterHoldingCapacity: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Optimal: 20-40%
                  </div>
                </div>
                
                <div>
                  <Label>Infiltration Rate (mm/hr)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.physical.infiltrationRate}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          physical: { ...prev.testData.physical, infiltrationRate: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Good: &gt;10 mm/hr
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Physical Properties Guide</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Loam soils are ideal for grapes</li>
                    <li>• Low bulk density indicates good structure</li>
                    <li>• High porosity improves root growth</li>
                    <li>• Good infiltration prevents waterlogging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chemical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  Basic Chemical Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Soil pH</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.pH}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, pH: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Optimal for grapes: 6.0-7.5
                  </div>
                </div>
                
                <div>
                  <Label>Electrical Conductivity (dS/m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.electricalConductivity}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, electricalConductivity: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Low salinity: &lt;2.0 dS/m
                  </div>
                </div>
                
                <div>
                  <Label>Organic Matter (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.organicMatter}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, organicMatter: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Good: &gt;2.0%
                  </div>
                </div>
                
                <div>
                  <Label>Cation Exchange Capacity (cmol(+)/kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.cationExchangeCapacity}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, cationExchangeCapacity: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Good: 10-30 cmol(+)/kg
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Macronutrients (mg/kg)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Available Nitrogen (N)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.chemical.nitrogen.available}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: {
                            ...prev.testData.chemical,
                            nitrogen: { ...prev.testData.chemical.nitrogen, available: parseFloat(e.target.value) }
                          }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Adequate: 200-400 mg/kg
                  </div>
                </div>
                
                <div>
                  <Label>Available Phosphorus (P)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.chemical.phosphorus.available}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: {
                            ...prev.testData.chemical,
                            phosphorus: { ...prev.testData.chemical.phosphorus, available: parseFloat(e.target.value) }
                          }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Adequate: 15-50 mg/kg
                  </div>
                </div>
                
                <div>
                  <Label>Available Potassium (K)</Label>
                  <Input
                    type="number"
                    value={inputs.testData.chemical.potassium.available}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: {
                            ...prev.testData.chemical,
                            potassium: { ...prev.testData.chemical.potassium, available: parseFloat(e.target.value) }
                          }
                        }
                      }))
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Adequate: 150-350 mg/kg
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Secondary Nutrients & Micronutrients (mg/kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Calcium</Label>
                  <Input
                    type="number"
                    value={inputs.testData.chemical.calcium}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, calcium: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label>Magnesium</Label>
                  <Input
                    type="number"
                    value={inputs.testData.chemical.magnesium}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, magnesium: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label>Iron</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.iron}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, iron: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label>Zinc</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.testData.chemical.zinc}
                    onChange={(e) => 
                      setInputs(prev => ({
                        ...prev,
                        testData: {
                          ...prev.testData,
                          chemical: { ...prev.testData.chemical, zinc: parseFloat(e.target.value) }
                        }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biological" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Biological Soil Properties
              </CardTitle>
              <CardDescription>
                Indicators of soil biological activity and ecosystem health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Microbial Biomass Carbon (mg/kg)</Label>
                    <Input
                      type="number"
                      value={inputs.testData.biological.microbialBiomassCarbon}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          testData: {
                            ...prev.testData,
                            biological: { ...prev.testData.biological, microbialBiomassCarbon: parseFloat(e.target.value) }
                          }
                        }))
                      }
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Good: &gt;200 mg/kg
                    </div>
                  </div>
                  
                  <div>
                    <Label>Soil Respiration (mg CO₂/kg/day)</Label>
                    <Input
                      type="number"
                      value={inputs.testData.biological.soilRespiration}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          testData: {
                            ...prev.testData,
                            biological: { ...prev.testData.biological, soilRespiration: parseFloat(e.target.value) }
                          }
                        }))
                      }
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Active: &gt;30 mg/kg/day
                    </div>
                  </div>
                  
                  <div>
                    <Label>Earthworm Count (per m²)</Label>
                    <Input
                      type="number"
                      value={inputs.testData.biological.earthwormCount}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          testData: {
                            ...prev.testData,
                            biological: { ...prev.testData.biological, earthwormCount: parseFloat(e.target.value) }
                          }
                        }))
                      }
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Healthy: &gt;50 per m²
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Dehydrogenase Activity (μg TPF/g/24h)</Label>
                    <Input
                      type="number"
                      value={inputs.testData.biological.enzymeActivity.dehydrogenase}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          testData: {
                            ...prev.testData,
                            biological: {
                              ...prev.testData.biological,
                              enzymeActivity: {
                                ...prev.testData.biological.enzymeActivity,
                                dehydrogenase: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Phosphatase Activity (μg p-nitrophenol/g/h)</Label>
                    <Input
                      type="number"
                      value={inputs.testData.biological.enzymeActivity.phosphatase}
                      onChange={(e) => 
                        setInputs(prev => ({
                          ...prev,
                          testData: {
                            ...prev.testData,
                            biological: {
                              ...prev.testData.biological,
                              enzymeActivity: {
                                ...prev.testData.biological.enzymeActivity,
                                phosphatase: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Biological Health Indicators</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• High microbial activity = healthy soil</li>
                      <li>• Earthworms improve soil structure</li>
                      <li>• Enzymes indicate nutrient cycling</li>
                      <li>• Organic matter feeds soil life</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={analyzeSoilHealth}
              disabled={isAnalyzing}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              {isAnalyzing ? 'Analyzing Soil Health...' : 'Analyze Soil Health'}
            </Button>
          </div>

          {isAnalyzing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <span>Analyzing soil properties and generating recommendations...</span>
                </div>
                <Progress value={75} className="mt-4" />
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-6">
              {/* Overall Health Score */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Leaf className="h-6 w-6" />
                      Overall Soil Health Score
                    </span>
                    <Badge className={getCategoryBadge(results.healthMetrics.category)}>
                      {results.healthMetrics.category.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-green-600 mb-2">
                      {results.healthMetrics.overallScore}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      out of 100 points
                    </div>
                    <Progress 
                      value={results.healthMetrics.overallScore} 
                      className="mt-4 h-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(results.healthMetrics.subscores).map(([category, data]) => (
                      <div key={category} className={`p-4 rounded-lg border ${getScoreColor(data.score)}`}>
                        <div className="font-semibold capitalize mb-2">{category} Properties</div>
                        <div className="text-2xl font-bold mb-2">{data.score}/100</div>
                        <Progress 
                          value={data.score} 
                          className="mb-3 h-2"
                        />
                        <ul className="text-sm space-y-1">
                          {data.indicators.map((indicator, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3" />
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              {results.alerts.length > 0 && (
                <Card className="border-gray-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      Soil Health Alerts ({results.alerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.alerts.map((alert, index) => (
                      <Alert key={index} className={alert.type === 'critical' ? 'border-red-400 bg-red-50' : 'border-gray-400 bg-orange-50'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{alert.parameter}:</strong> {alert.message}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                Current: {alert.currentValue} | Optimal: {alert.optimalRange[0]}-{alert.optimalRange[1]}
                              </span>
                            </div>
                            {alert.actionRequired && (
                              <Badge variant="destructive">Action Required</Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Limitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Soil Limitations & Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.healthMetrics.limitations.map((limitation, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(limitation.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{limitation.factor}</h4>
                        <Badge variant="outline" className={getSeverityColor(limitation.severity)}>
                          {limitation.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">
                        <strong>Impact:</strong> {limitation.impact}
                      </p>
                      <p className="text-sm">
                        <strong>Recommendation:</strong> {limitation.recommendation}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Soil Health Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.healthMetrics.trends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {getTrendIcon(trend.direction)}
                          <div>
                            <div className="font-medium">{trend.parameter}</div>
                            <div className="text-sm text-muted-foreground">
                              {Math.abs(trend.rate)}% per year - {trend.significance.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          trend.direction === 'improving' ? 'text-green-600' : 
                          trend.direction === 'declining' ? 'text-red-600' : 'text-gray-600'
                        }>
                          {trend.direction.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Projections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Future Projections (1 Year)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(results.projections.scenarios).map(([scenario, data]) => (
                      <div key={scenario} className="text-center p-4 border rounded-lg">
                        <h4 className="font-semibold capitalize mb-3">
                          {scenario.replace('_', ' ')} Scenario
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Soil Score</div>
                            <div className="text-xl font-bold">{data.soilScore}/100</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Productivity</div>
                            <div className="text-lg font-semibold text-blue-600">{data.productivity}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Sustainability</div>
                            <div className="text-lg font-semibold text-green-600">{data.sustainability}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Confidence */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{results.confidence}%</span>
                    <Badge variant={results.confidence >= 80 ? 'default' : results.confidence >= 60 ? 'secondary' : 'destructive'}>
                      {results.confidence >= 80 ? 'High' : results.confidence >= 60 ? 'Medium' : 'Low'} Confidence
                    </Badge>
                  </div>
                  <Progress value={results.confidence} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on data completeness, testing methods, and soil sample quality
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {results && (
            <div className="space-y-6">
              {/* Immediate Actions */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Clock className="h-6 w-6" />
                    Immediate Actions Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.recommendations.immediate.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded border">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        action.priority === 'urgent' ? 'bg-red-600' :
                        action.priority === 'high' ? 'bg-orange-500' :
                        action.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">{action.action}</div>
                          <Badge variant={action.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {action.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Timeline:</strong> {action.timeframe} | 
                          <strong> Cost:</strong> ₹{action.expectedCost.toLocaleString()}/ha
                        </div>
                        <div className="text-sm">
                          <strong>Expected Benefit:</strong> {action.expectedBenefit}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Fertilizer Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-6 w-6" />
                    Fertilizer Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.recommendations.fertilizer.map((fert, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{fert.nutrient} Deficiency</h4>
                        <span className="text-sm text-muted-foreground">
                          Need: {fert.deficiency.toFixed(0)} kg/ha
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded">
                          <h5 className="font-medium text-green-800 mb-2">Organic Option</h5>
                          <div className="text-sm">
                            <strong>Source:</strong> {fert.recommendation.organic.source}<br />
                            <strong>Quantity:</strong> {fert.recommendation.organic.quantity}<br />
                            <strong>Timing:</strong> {fert.recommendation.organic.timing}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded">
                          <h5 className="font-medium text-blue-800 mb-2">Inorganic Option</h5>
                          <div className="text-sm">
                            <strong>Fertilizer:</strong> {fert.recommendation.inorganic.fertilizer}<br />
                            <strong>Quantity:</strong> {fert.recommendation.inorganic.quantity}<br />
                            <strong>Timing:</strong> {fert.recommendation.inorganic.timing}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <div className="text-sm">
                          <strong>Investment:</strong> ₹{fert.costBenefit.investment.toLocaleString()} | 
                          <strong> Expected Return:</strong> ₹{fert.costBenefit.expectedReturn.toLocaleString()} | 
                          <strong> ROI:</strong> {(((fert.costBenefit.expectedReturn - fert.costBenefit.investment) / fert.costBenefit.investment) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Seasonal Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Seasonal Management Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.recommendations.seasonal.map((season, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold capitalize mb-3">
                          {season.season.replace('_', ' ')} Season
                        </h4>
                        
                        <div className="mb-3">
                          <h5 className="font-medium mb-2">Actions:</h5>
                          <ul className="text-sm space-y-1">
                            {season.actions.map((action, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2">Materials & Costs:</h5>
                          <div className="text-sm space-y-1">
                            {season.materials.map((material, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{material.name} ({material.quantity})</span>
                                <span className="font-medium">₹{material.cost.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Long-term Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Long-term Soil Health Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.recommendations.longTerm.map((strategy, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{strategy.goal}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Timeline:</strong> {strategy.timeline}
                      </p>
                      <p className="text-sm mb-4">{strategy.strategy}</p>
                      
                      <div>
                        <h5 className="font-medium mb-2">Milestones:</h5>
                        <div className="space-y-2">
                          {strategy.milestones.map((milestone, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Year {milestone.year}: {milestone.target}</span>
                              <Badge variant="outline">{milestone.metric}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Integration Benefits */}
              {results.integrations && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Lightbulb className="h-6 w-6" />
                      System Integration Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Nutrient Calculator Integration</h4>
                      <p className="text-sm mb-2">Soil health data will automatically adjust fertilizer recommendations:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Nitrogen recommendations adjusted by soil availability</li>
                        <li>• Phosphorus rates optimized based on soil test results</li>
                        <li>• Organic matter bonus reduces synthetic fertilizer needs</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Disease Risk Integration</h4>
                      <p className="text-sm mb-2">Soil health influences disease susceptibility:</p>
                      <ul className="text-sm space-y-1">
                        {results.integrations.diseaseRisk.soilRelatedRisks.map((risk, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Yield Prediction Enhancement</h4>
                      <p className="text-sm">
                        Soil health score of <strong>{Math.round(results.integrations.yieldPrediction.soilHealthFactor * 100)}%</strong> will be 
                        applied as a yield adjustment factor in predictions, ensuring more accurate forecasts.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}