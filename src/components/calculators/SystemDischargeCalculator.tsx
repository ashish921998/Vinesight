"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle
} from 'lucide-react';
import { 
  SystemDischargeCalculator,
  type SystemDesignInputs,
  type SystemResults
} from '@/lib/system-discharge-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export function SystemDischargeCalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SystemResults | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  
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
        vineSpacing: selectedFarm.vine_spacing,
        rowSpacing: selectedFarm.row_spacing,
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
        calculation_type: 'System Discharge',
        date: new Date().toISOString().split('T')[0],
        inputs: JSON.stringify(inputs),
        results: JSON.stringify(calculationResults),
        confidence_level: 'high'
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
    if (value >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const emitterRecommendations = selectedFarm 
    ? SystemDischargeCalculator.getEmitterRecommendations(
        formData.soilType, 
        selectedFarm.vine_spacing, 
        parseFloat(formData.slope) || 2
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Farm Selection */}
      {farms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Select Farm
            </CardTitle>
            <CardDescription>Choose a farm for irrigation system design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {farms.map((farm) => (
                <Button
                  key={farm.id}
                  variant={selectedFarm?.id === farm.id ? "default" : "outline"}
                  onClick={() => setSelectedFarm(farm)}
                  className="flex items-center gap-2"
                >
                  {farm.name}
                  <Badge variant="secondary">
                    {farm.area}ha • {farm.vine_spacing}×{farm.row_spacing}m
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedFarm ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">Please add a farm first to design irrigation system</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="design" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="design">System Design</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="economics">Economics</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          {/* Main Design Tab */}
          <TabsContent value="design" className="space-y-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  System Parameters
                </CardTitle>
                <CardDescription>
                  Configure your irrigation system requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* System Type */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Irrigation Method
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="irrigationMethod">System Type</Label>
                      <select
                        id="irrigationMethod"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.irrigationMethod}
                        onChange={(e) => handleInputChange('irrigationMethod', e.target.value)}
                      >
                        <option value="drip">Drip Irrigation</option>
                        <option value="sprinkler">Sprinkler System</option>
                        <option value="surface">Surface Irrigation</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="soilType">Soil Type</Label>
                      <select
                        id="soilType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.soilType}
                        onChange={(e) => handleInputChange('soilType', e.target.value)}
                      >
                        <option value="sandy">Sandy Soil</option>
                        <option value="loamy">Loamy Soil</option>
                        <option value="clay">Clay Soil</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="waterSource">Water Source</Label>
                      <select
                        id="waterSource"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.waterSource}
                        onChange={(e) => handleInputChange('waterSource', e.target.value)}
                      >
                        <option value="bore">Bore Well</option>
                        <option value="canal">Canal Water</option>
                        <option value="tank">Storage Tank</option>
                        <option value="river">River/Stream</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Field Conditions */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Field Conditions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="slope">Field Slope (%)</Label>
                      <Input
                        id="slope"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        value={formData.slope}
                        onChange={(e) => handleInputChange('slope', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="availablePressure">Available Pressure (bar)</Label>
                      <Input
                        id="availablePressure"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 3.5"
                        value={formData.availablePressure}
                        onChange={(e) => handleInputChange('availablePressure', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dailyIrrigationHours">Daily Irrigation Hours</Label>
                      <Input
                        id="dailyIrrigationHours"
                        type="number"
                        step="0.5"
                        placeholder="e.g., 8"
                        value={formData.dailyIrrigationHours}
                        onChange={(e) => handleInputChange('dailyIrrigationHours', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Water Requirements */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Water Requirements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="peakETc">Peak ETc (mm/day)</Label>
                      <Input
                        id="peakETc"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 6.5"
                        value={formData.peakETc}
                        onChange={(e) => handleInputChange('peakETc', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use ETc Calculator to determine this value
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCalculate}
                  disabled={loading || !selectedFarm}
                  className="w-full"
                >
                  {loading ? 'Designing System...' : 'Design Irrigation System'}
                </Button>
              </CardContent>
            </Card>

            {/* Emitter Recommendations */}
            {emitterRecommendations && formData.irrigationMethod === 'drip' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Target className="h-5 w-5" />
                    Emitter Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-blue-900">Recommended: </span>
                      <Badge className="bg-blue-600 text-white">{emitterRecommendations.recommended}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-900">Alternatives: </span>
                      {emitterRecommendations.alternatives.map((alt, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-blue-800">{emitterRecommendations.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-6">
                {/* System Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      System Design Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {results.designParameters.totalVines.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-700">Total Vines</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {results.designParameters.totalEmitters.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">Emitters/Sprinklers</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {results.designParameters.systemFlowRate.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-700">System Flow (L/hr)</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {results.designParameters.pumpCapacity}
                        </div>
                        <div className="text-sm text-orange-700">Pump Capacity (HP)</div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* System Efficiency */}
                    <div>
                      <h4 className="font-semibold mb-4">System Efficiency</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg ${getEfficiencyColor(results.efficiency.distributionUniformity)}`}>
                          <div className="font-semibold">Distribution Uniformity</div>
                          <div className="text-2xl font-bold">{results.efficiency.distributionUniformity}%</div>
                        </div>
                        <div className={`p-4 rounded-lg ${getEfficiencyColor(results.efficiency.applicationEfficiency)}`}>
                          <div className="font-semibold">Application Efficiency</div>
                          <div className="text-2xl font-bold">{results.efficiency.applicationEfficiency}%</div>
                        </div>
                        <div className={`p-4 rounded-lg ${getEfficiencyColor(results.efficiency.waterUseEfficiency)}`}>
                          <div className="font-semibold">Water Use Efficiency</div>
                          <div className="text-2xl font-bold">{results.efficiency.waterUseEfficiency}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Design Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.recommendations.systemDesign.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-600" />
                          System Design
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.systemDesign.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.recommendations.maintenance.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-green-600" />
                          Maintenance
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.maintenance.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.recommendations.optimization.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          Optimization
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.optimization.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-purple-600">•</span>
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
          </TabsContent>

          {/* Technical Specifications Tab */}
          <TabsContent value="specifications">
            {results ? (
              <div className="space-y-6">
                {/* Pump Specifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Pump Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{results.technicalSpecs.pumpSpecifications.capacity.toLocaleString()} L/hr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Head:</span>
                          <span className="font-medium">{results.technicalSpecs.pumpSpecifications.head} meters</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Power Required:</span>
                          <span className="font-medium">{results.technicalSpecs.pumpSpecifications.powerRequired} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Efficiency:</span>
                          <span className="font-medium">{results.technicalSpecs.pumpSpecifications.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pipe Network */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pipe className="h-5 w-5" />
                      Pipe Network Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Main Line</h4>
                          <div className="space-y-1 text-sm">
                            <div>Diameter: {results.technicalSpecs.pipeNetwork.mainline.diameter}mm</div>
                            <div>Material: {results.technicalSpecs.pipeNetwork.mainline.material}</div>
                            <div>Pressure: {results.technicalSpecs.pipeNetwork.mainline.pressure} bar</div>
                            <div>Length: {results.technicalSpecs.pipeNetwork.mainline.length}m</div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Sub-Main</h4>
                          <div className="space-y-1 text-sm">
                            <div>Diameter: {results.technicalSpecs.pipeNetwork.submain.diameter}mm</div>
                            <div>Material: {results.technicalSpecs.pipeNetwork.submain.material}</div>
                            <div>Pressure: {results.technicalSpecs.pipeNetwork.submain.pressure} bar</div>
                            <div>Length: {results.technicalSpecs.pipeNetwork.submain.length}m</div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Laterals</h4>
                          <div className="space-y-1 text-sm">
                            <div>Diameter: {results.technicalSpecs.pipeNetwork.lateral.diameter}mm</div>
                            <div>Material: {results.technicalSpecs.pipeNetwork.lateral.material}</div>
                            <div>Pressure: {results.technicalSpecs.pipeNetwork.lateral.pressure} bar</div>
                            <div>Total Length: {results.technicalSpecs.pipeNetwork.lateral.length.toLocaleString()}m</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Systems */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Additional Systems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold">Filtration System</h4>
                        <div className="text-sm space-y-1">
                          <div>Type: {results.technicalSpecs.filtrationSystem.type}</div>
                          <div>Capacity: {results.technicalSpecs.filtrationSystem.capacity.toLocaleString()} L/hr</div>
                          <div>Cost: {formatCurrency(results.technicalSpecs.filtrationSystem.cost)}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold">Fertigation System</h4>
                        <div className="text-sm space-y-1">
                          <div>Tank Capacity: {results.technicalSpecs.fertigation.tankCapacity} L</div>
                          <div>Injection Rate: {results.technicalSpecs.fertigation.injectionRate} L/hr</div>
                          <div>Cost: {formatCurrency(results.technicalSpecs.fertigation.cost)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Specifications Available</h3>
                  <p className="text-muted-foreground">Design your irrigation system first to see technical specifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Economics Tab */}
          <TabsContent value="economics">
            {results ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      Economic Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">
                            {formatCurrency(results.economics.initialCost)}
                          </div>
                          <div className="text-sm text-green-700">Initial Investment</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-3xl font-bold text-blue-600">
                            {formatCurrency(results.economics.annualOperatingCost)}
                          </div>
                          <div className="text-sm text-blue-700">Annual Operating Cost</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600">
                            {formatCurrency(results.economics.costPerHectare)}
                          </div>
                          <div className="text-sm text-purple-700">Cost per Hectare</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-3xl font-bold text-orange-600">
                            {results.economics.paybackPeriod}
                          </div>
                          <div className="text-sm text-orange-700">Payback Period (years)</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Cost Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Equipment & Materials:</span>
                            <span>{formatCurrency(results.economics.initialCost * 0.75)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Installation:</span>
                            <span>{formatCurrency(results.economics.initialCost * 0.15)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Design & Engineering:</span>
                            <span>{formatCurrency(results.economics.initialCost * 0.10)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Annual Savings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Water Savings:</span>
                            <span className="text-green-600">{formatCurrency(selectedFarm!.area * 25000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Labor Reduction:</span>
                            <span className="text-green-600">{formatCurrency(selectedFarm!.area * 15000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Yield Improvement:</span>
                            <span className="text-green-600">{formatCurrency(selectedFarm!.area * 35000)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Economic Analysis Available</h3>
                  <p className="text-muted-foreground">Design your irrigation system first to see cost analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            {comparison ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      System Comparison: Drip vs Sprinkler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Drip Irrigation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Water Use Efficiency:</span>
                            <span className="font-medium">{comparison.drip.efficiency.waterUseEfficiency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Initial Cost:</span>
                            <span className="font-medium">{formatCurrency(comparison.drip.economics.initialCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Distribution Uniformity:</span>
                            <span className="font-medium">{comparison.drip.efficiency.distributionUniformity}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Sprinkler System</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Water Use Efficiency:</span>
                            <span className="font-medium">{comparison.sprinkler.efficiency.waterUseEfficiency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Initial Cost:</span>
                            <span className="font-medium">{formatCurrency(comparison.sprinkler.economics.initialCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Distribution Uniformity:</span>
                            <span className="font-medium">{comparison.sprinkler.efficiency.distributionUniformity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Winner Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Most Efficient:</strong> {comparison.comparison.efficiency.winner} 
                            ({comparison.comparison.efficiency.difference.toFixed(1)}% advantage)
                          </div>
                          <div>
                            <strong>Most Cost-Effective:</strong> {comparison.comparison.cost.winner} 
                            ({formatCurrency(comparison.comparison.cost.difference)} difference)
                          </div>
                          <div>
                            <strong>Easiest Maintenance:</strong> {comparison.comparison.maintenance.winner}
                          </div>
                          <div>
                            <strong>Best Suited:</strong> {comparison.comparison.suitability.winner}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold mb-2 text-blue-900">Recommendation</h4>
                        <p className="text-sm text-blue-800">{comparison.comparison.suitability.reasoning}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Comparison Available</h3>
                  <p className="text-muted-foreground">Select drip irrigation and calculate to see system comparison</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}