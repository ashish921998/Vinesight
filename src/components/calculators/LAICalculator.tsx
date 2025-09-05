"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Leaf, 
  TreePine,
  Sun,
  Wind,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  BarChart3,
  Calculator
} from 'lucide-react';
import { 
  LAICalculator,
  type LAICalculationInputs,
  type LAIResults
} from '@/lib/lai-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/types/types';

export function LAICalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LAIResults | null>(null);
  const [activeSection, setActiveSection] = useState<'measurement' | 'results' | 'analysis'>('measurement');
  
  const [formData, setFormData] = useState({
    leavesPerShoot: "",
    shootsPerVine: "",
    avgLeafLength: "",
    avgLeafWidth: "",
    canopyHeight: "",
    canopyWidth: "",
    leafShape: "heart" as const,
    trellisSystem: "vsp" as const,
    season: "summer" as const,
    productionGoal: "wine" as const
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
      const inputs: LAICalculationInputs = {
        farmId: selectedFarm.id!,
        vineSpacing: selectedFarm.vineSpacing || 3, // default 3 meters
        rowSpacing: selectedFarm.rowSpacing || 2, // default 2 meters
        leavesPerShoot: parseInt(formData.leavesPerShoot),
        shootsPerVine: parseInt(formData.shootsPerVine),
        avgLeafLength: parseFloat(formData.avgLeafLength),
        avgLeafWidth: parseFloat(formData.avgLeafWidth),
        canopyHeight: parseFloat(formData.canopyHeight),
        canopyWidth: parseFloat(formData.canopyWidth),
        leafShape: formData.leafShape,
        trellisSystem: formData.trellisSystem,
        season: formData.season
      };

      const calculationResults = LAICalculator.calculateLAI(inputs);
      setResults(calculationResults);

      // Save calculation to history
      await SupabaseService.addCalculationHistory({
        farm_id: selectedFarm.id!,
        calculation_type: 'lai',
        date: new Date().toISOString().split('T')[0],
        inputs: inputs,
        outputs: calculationResults
      });
    } catch (error) {
      console.error('Error calculating LAI:', error);
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

  const resetForm = () => {
    setFormData({
      leavesPerShoot: "",
      shootsPerVine: "",
      avgLeafLength: "",
      avgLeafWidth: "",
      canopyHeight: "",
      canopyWidth: "",
      leafShape: "heart",
      trellisSystem: "vsp",
      season: "summer",
      productionGoal: "wine"
    });
    setResults(null);
  };

  const getQualityIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'adequate': return <Info className="h-4 w-4 text-orange-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'moderate': return <Info className="h-4 w-4 text-orange-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const optimalTargets = LAICalculator.getOptimalLAITargets(formData.productionGoal);
  const seasonalSchedule = LAICalculator.getSeasonalMonitoringSchedule();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Leaf className="h-4 w-4 text-green-600" />
          <h2 className="text-lg font-semibold text-green-800">Leaf Coverage Calculator</h2>
        </div>
        <p className="text-xs text-gray-600">
          Measure how well your vines cover the ground for optimal canopy management
        </p>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-600" />
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
                Please add a farm first to calculate LAI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedFarm ? (
        <Card className="text-center py-12">
          <CardContent>
            <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">Please add a farm first to calculate LAI</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile-Optimized Input Sections */}
          <div className="mx-4 sm:mx-0 space-y-4 sm:space-y-3">
            
            {/* Canopy Measurements Section */}
            <Card>
              <CardHeader 
                className="pb-4 sm:pb-3 cursor-pointer"
                onClick={() => setActiveSection(activeSection === 'measurement' ? 'measurement' : 'measurement')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <Leaf className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Canopy Measurements</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </div>
                <CardDescription className="text-sm sm:text-xs">
                  Enter your vineyard canopy measurements for LAI calculation
                </CardDescription>
              </CardHeader>
              {activeSection === 'measurement' && (
                <CardContent className="pt-0 space-y-6 sm:space-y-4">
                  
                  {/* Vine Structure */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Shoots per Vine</Label>
                      <Input
                        type="number"
                        placeholder="25"
                        value={formData.shootsPerVine}
                        onChange={(e) => handleInputChange('shootsPerVine', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Leaves per Shoot</Label>
                      <Input
                        type="number"
                        placeholder="18"
                        value={formData.leavesPerShoot}
                        onChange={(e) => handleInputChange('leavesPerShoot', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Leaf Characteristics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Avg Leaf Length (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="15.5"
                        value={formData.avgLeafLength}
                        onChange={(e) => handleInputChange('avgLeafLength', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Avg Leaf Width (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="14.0"
                        value={formData.avgLeafWidth}
                        onChange={(e) => handleInputChange('avgLeafWidth', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Canopy Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Canopy Height (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={formData.canopyHeight}
                        onChange={(e) => handleInputChange('canopyHeight', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Canopy Width (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="1.8"
                        value={formData.canopyWidth}
                        onChange={(e) => handleInputChange('canopyWidth', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Growth Parameters */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Growth Stage</Label>
                      <Select
                        value={formData.season}
                        onValueChange={(value: 'dormant' | 'bud_break' | 'flowering' | 'fruit_set' | 'veraison' | 'harvest' | 'post_harvest') => handleInputChange('season', value)}
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dormant">Dormant (Dec-Jan)</SelectItem>
                          <SelectItem value="bud_break">Bud Break (Feb-Mar)</SelectItem>
                          <SelectItem value="flowering">Flowering (Apr-May)</SelectItem>
                          <SelectItem value="fruit_set">Fruit Set (May-Jun)</SelectItem>
                          <SelectItem value="veraison">Veraison (Jul-Aug)</SelectItem>
                          <SelectItem value="harvest">Harvest (Aug-Oct)</SelectItem>
                          <SelectItem value="post_harvest">Post Harvest (Oct-Nov)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">Production Goal</Label>
                      <Select
                        value={formData.productionGoal}
                        onValueChange={(value: 'wine' | 'table' | 'raisin') => handleInputChange('productionGoal', value)}
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wine">Wine Grapes</SelectItem>
                          <SelectItem value="table">Table Grapes</SelectItem>
                          <SelectItem value="raisin">Raisin Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Calculate Button */}
          <div className="px-4 sm:px-0 mt-6">
            <div className="flex gap-3 sm:gap-2">
              <Button 
                onClick={handleCalculate}
                disabled={loading || !selectedFarm}
                className="flex-1 h-14 sm:h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-lg sm:text-base"
              >
                {loading ? (
                  <>
                    <Calculator className="mr-3 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4 animate-pulse" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-3 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                    Calculate LAI
                  </>
                )}
              </Button>
              {results && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="px-6 sm:px-4 h-14 sm:h-12 text-lg sm:text-base"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="mx-4 space-y-4">
              
              {/* LAI Results */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg text-green-800">LAI Results</CardTitle>
                    </div>
                    <Badge 
                      variant={results.canopyDensity === 'optimal' ? 'default' : results.canopyDensity === 'dense' ? 'secondary' : 'destructive'}
                      className="text-xs bg-green-600"
                    >
                      {results.canopyDensity.toUpperCase()} DENSITY
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{results.lai.toFixed(2)}</div>
                      <div className="text-xs font-medium text-green-600">LAI Value</div>
                      <div className="text-xs text-gray-600">Leaf Area Index</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{results.leafAreaPerVine.toFixed(1)}</div>
                      <div className="text-xs font-medium text-green-600">Total Leaf Area</div>
                      <div className="text-xs text-gray-600">m² per vine</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{results.lightInterception.toFixed(1)}%</div>
                      <div className="text-xs font-medium text-green-600">Light Interception</div>
                      <div className="text-xs text-gray-600">Canopy efficiency</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{results.canopyDensity}</div>
                      <div className="text-xs font-medium text-green-600">Canopy Density</div>
                      <div className="text-xs text-gray-600">Density rating</div>
                    </div>
                  </div>

                  {/* Quality Assessment */}
                  <Card className="border-green-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-green-800 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Quality Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                                                 <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                           <div className="flex items-center justify-between mb-2">
                             <Badge className="bg-green-600 text-white text-sm">
                               {results.canopyDensity.toUpperCase()}
                             </Badge>
                             {getQualityIcon(results.canopyDensity)}
                           </div>
                           <p className="text-sm text-green-700">Canopy density is {results.canopyDensity}</p>
                         </div>
                         
                         {results.recommendations.canopyManagement && results.recommendations.canopyManagement.length > 0 && (
                           <div>
                             <h4 className="font-medium text-green-800 text-sm mb-2">Canopy Management:</h4>
                             <ul className="text-xs text-green-700 space-y-1">
                               {results.recommendations.canopyManagement.map((rec, index) => (
                                 <li key={index} className="flex items-start gap-1">
                                   <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                   <span>{rec}</span>
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

              {/* Optimal Targets */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                    <Target className="h-5 w-5" />
                    Optimal LAI Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                                         <div className="bg-white rounded-lg p-3 border border-green-200">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-medium text-green-700">Target LAI Range:</span>
                         <Badge className="bg-green-600 text-white text-sm">
                           {optimalTargets.minLAI} - {optimalTargets.maxLAI}
                         </Badge>
                       </div>
                       <p className="text-xs text-green-600">{optimalTargets.reasoning}</p>
                     </div>
                     
                     <div className="bg-white rounded-lg p-3 border border-green-200">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-medium text-green-700">Current Status:</span>
                         <Badge 
                           variant={results.lai >= optimalTargets.minLAI && results.lai <= optimalTargets.maxLAI ? 'default' : 'destructive'}
                           className={results.lai >= optimalTargets.minLAI && results.lai <= optimalTargets.maxLAI ? 'bg-green-600' : 'bg-red-600'}
                         >
                           {results.lai >= optimalTargets.minLAI && results.lai <= optimalTargets.maxLAI ? 'OPTIMAL' : 'NEEDS ADJUSTMENT'}
                         </Badge>
                       </div>
                       {results.lai < optimalTargets.minLAI && (
                         <p className="text-xs text-red-600">Increase canopy density for better yield potential</p>
                       )}
                       {results.lai > optimalTargets.maxLAI && (
                         <p className="text-xs text-red-600">Reduce canopy density to prevent disease and improve quality</p>
                       )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}