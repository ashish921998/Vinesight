"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Droplets,
  Zap,
  Settings,
  TrendingUp,
  IndianRupee,
  Wrench,
  BarChart3,
  Gauge,
  Pipette,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Calculator
} from 'lucide-react';
import { 
  SystemDischargeCalculator,
  type SystemDesignInputs,
  type SystemResults
} from '@/lib/system-discharge-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/types/types';

export function SystemDischargeCalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SystemResults | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'design' | 'specifications' | 'economics' | 'comparison'>('design');
  
  const [formData, setFormData] = useState({
    irrigationMethod: "drip" as const,
    soilType: "loamy" as const,
    slope: "",
    waterSource: "bore" as const,
    availablePressure: "",
    dailyIrrigationHours: "",
    peakETc: ""
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

  const handleCalculate = async () => {
    if (!selectedFarm) return;

    setLoading(true);
    try {
      const inputs: SystemDesignInputs = {
        farmId: selectedFarm.id!,
        farmArea: selectedFarm.area,
        vineSpacing: selectedFarm.vineSpacing || 3, // default 3 meters
        rowSpacing: selectedFarm.rowSpacing || 2, // default 2 meters
        irrigationMethod: formData.irrigationMethod,
        soilType: formData.soilType,
        slope: parseFloat(formData.slope) || 2,
        waterSource: formData.waterSource,
        availablePressure: parseFloat(formData.availablePressure) || 3,
        dailyIrrigationHours: parseFloat(formData.dailyIrrigationHours) || 8,
        peakETc: parseFloat(formData.peakETc) || 6
      };

      const calculationResults = SystemDischargeCalculator.calculateSystemDischarge(inputs);
      setResults(calculationResults);

      // Get comparison if requested
      if (formData.irrigationMethod === 'drip') {
        const comparisonResults = SystemDischargeCalculator.compareIrrigationSystems(inputs);
        setComparison(comparisonResults);
      }

      // Save calculation to history
      await SupabaseService.addCalculationHistory({
        farm_id: selectedFarm.id!,
        calculation_type: 'discharge',
        date: new Date().toISOString().split('T')[0],
        inputs: inputs,
        outputs: calculationResults
      });
    } catch (error) {
      console.error('Error calculating system discharge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getEfficiencyColor = (value: number) => {
    if (value >= 85) return 'text-green-600 bg-green-50';
    if (value >= 75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const emitterRecommendations = selectedFarm 
    ? SystemDischargeCalculator.getEmitterRecommendations(
        formData.soilType, 
        selectedFarm.vineSpacing || 3, 
        parseFloat(formData.slope) || 2
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          <h2 className="text-lg font-semibold text-green-800">System Flow Rate Calculator</h2>
        </div>
        <p className="text-xs text-gray-600">
          Design your irrigation system for optimal water delivery
        </p>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Data Source</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
              >
                My Farms
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {farms.length > 0 ? (
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
                      <p className="text-xs text-gray-500">{farm.area}ha • {farm.vineSpacing}×{farm.rowSpacing}m</p>
                    </div>
                    {selectedFarm?.id === farm.id && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <Info className="h-4 w-4" />
                <span className="font-medium text-sm">No Farms Available</span>
              </div>
              <p className="text-green-600 text-xs mt-1">
                Please add a farm first to design irrigation system
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedFarm ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">Please add a farm first to design irrigation system</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile-Optimized Input Sections */}
          <div className="mx-4 sm:mx-0 space-y-4 sm:space-y-3">
            
            {/* System Parameters Section */}
            <Card>
              <CardHeader 
                className="pb-4 sm:pb-3 cursor-pointer"
                onClick={() => setActiveSection(activeSection === 'design' ? 'design' : 'design')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <Settings className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">System Parameters</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </div>
                <CardDescription className="text-sm sm:text-xs">
                  Configure your irrigation system requirements
                </CardDescription>
              </CardHeader>
              {activeSection === 'design' && (
                <CardContent className="pt-0 space-y-6 sm:space-y-4">
                  
                  {/* Irrigation Method */}
                  <div>
                    <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Irrigation Method</Label>
                    <Select
                      value={formData.irrigationMethod}
                      onValueChange={(value: 'drip' | 'sprinkler' | 'surface') => handleInputChange('irrigationMethod', value)}
                    >
                      <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drip">Drip Irrigation</SelectItem>
                        <SelectItem value="sprinkler">Sprinkler System</SelectItem>
                        <SelectItem value="surface">Surface Irrigation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Soil Type and Water Source */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Soil Type</Label>
                      <Select
                        value={formData.soilType}
                        onValueChange={(value: 'sandy' | 'loamy' | 'clay') => handleInputChange('soilType', value)}
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandy">Sandy Soil</SelectItem>
                          <SelectItem value="loamy">Loamy Soil</SelectItem>
                          <SelectItem value="clay">Clay Soil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Water Source</Label>
                      <Select
                        value={formData.waterSource}
                        onValueChange={(value: 'bore' | 'canal' | 'tank' | 'river') => handleInputChange('waterSource', value)}
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bore">Bore Well</SelectItem>
                          <SelectItem value="canal">Canal Water</SelectItem>
                          <SelectItem value="tank">Storage Tank</SelectItem>
                          <SelectItem value="river">River/Stream</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Field Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Field Slope (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={formData.slope}
                        onChange={(e) => handleInputChange('slope', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Available Pressure (bar)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="3.5"
                        value={formData.availablePressure}
                        onChange={(e) => handleInputChange('availablePressure', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Water Requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Daily Irrigation Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="8"
                        value={formData.dailyIrrigationHours}
                        onChange={(e) => handleInputChange('dailyIrrigationHours', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Peak ETc (mm/day)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="6.5"
                        value={formData.peakETc}
                        onChange={(e) => handleInputChange('peakETc', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                      <p className="text-sm sm:text-xs text-green-600 mt-2">
                        Use ETc Calculator to determine this value
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Emitter Recommendations */}
            {emitterRecommendations && formData.irrigationMethod === 'drip' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-4 sm:pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-lg sm:text-base">
                    <Target className="h-6 w-6 sm:h-5 sm:w-5" />
                    Emitter Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 sm:space-y-3">
                    <div>
                      <span className="font-semibold text-green-900 text-base sm:text-sm">Recommended: </span>
                      <Badge className="bg-green-600 text-white text-sm">Standard Drip (4 L/hr)</Badge>
                    </div>
                    <div>
                      <span className="font-semibold text-green-900 text-base sm:text-sm">Alternatives: </span>
                      {emitterRecommendations.alternatives.map((alt, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2 text-sm">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-base sm:text-sm text-green-800">{emitterRecommendations.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Calculate Button */}
          <div className="px-4 sm:px-0 mt-6">
            <Button 
              onClick={handleCalculate}
              disabled={loading || !selectedFarm}
              className="w-full h-14 sm:h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-lg sm:text-base"
            >
              {loading ? (
                <>
                  <Calculator className="mr-3 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4 animate-pulse" />
                  Designing System...
                </>
              ) : (
                <>
                  <Calculator className="mr-3 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                  Design Irrigation System
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {results && (
            <div className="mx-4 space-y-4">
              
              {/* System Overview */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg text-green-800">System Design Results</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-xl font-bold text-green-700">
                        {results.designParameters.totalVines.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-green-600">Total Vines</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-xl font-bold text-green-700">
                        {results.designParameters.totalEmitters.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-green-600">Emitters/Sprinklers</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-xl font-bold text-green-700">
                        {results.designParameters.systemFlowRate.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-green-600">System Flow (L/hr)</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-xl font-bold text-green-700">
                        {results.designParameters.pumpCapacity}
                      </div>
                      <div className="text-xs font-medium text-green-600">Pump Capacity (HP)</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* System Efficiency */}
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-green-800">System Efficiency</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className={`p-3 rounded-lg ${getEfficiencyColor(results.efficiency.distributionUniformity)}`}>
                        <div className="font-semibold text-sm">Distribution Uniformity</div>
                        <div className="text-xl font-bold">{results.efficiency.distributionUniformity}%</div>
                      </div>
                      <div className={`p-3 rounded-lg ${getEfficiencyColor(results.efficiency.applicationEfficiency)}`}>
                        <div className="font-semibold text-sm">Application Efficiency</div>
                        <div className="text-xl font-bold">{results.efficiency.applicationEfficiency}%</div>
                      </div>
                      <div className={`p-3 rounded-lg ${getEfficiencyColor(results.efficiency.waterUseEfficiency)}`}>
                        <div className="font-semibold text-sm">Water Use Efficiency</div>
                        <div className="text-xl font-bold">{results.efficiency.waterUseEfficiency}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                    <CheckCircle className="h-5 w-5" />
                    Design Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {results.recommendations.systemDesign.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-green-700">
                        <Settings className="h-4 w-4 text-green-600" />
                        System Design
                      </h4>
                      <ul className="space-y-1">
                        {results.recommendations.systemDesign.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2 text-green-700">
                            <span className="text-green-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.recommendations.maintenance.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-green-700">
                        <Wrench className="h-4 w-4 text-green-600" />
                        Maintenance
                      </h4>
                      <ul className="space-y-1">
                        {results.recommendations.maintenance.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2 text-green-700">
                            <span className="text-green-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.recommendations.optimization.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-green-700">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Optimization
                      </h4>
                      <ul className="space-y-1">
                        {results.recommendations.optimization.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2 text-green-700">
                            <span className="text-green-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}