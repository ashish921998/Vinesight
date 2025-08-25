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
  BarChart3
} from 'lucide-react';
import { 
  LAICalculator,
  type LAICalculationInputs,
  type LAIResults
} from '@/lib/lai-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export function LAICalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LAIResults | null>(null);
  
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
        vineSpacing: selectedFarm.vine_spacing,
        rowSpacing: selectedFarm.row_spacing,
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCanopyDensityColor = (density: LAIResults['canopyDensity']) => {
    switch (density) {
      case 'sparse': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'dense': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overcrowded': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'adequate': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'moderate': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const optimalTargets = LAICalculator.getOptimalLAITargets(formData.productionGoal);
  const seasonalSchedule = LAICalculator.getSeasonalMonitoringSchedule();

  return (
    <div className="space-y-6">
      {/* Farm Selection */}
      {farms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5" />
              Select Farm
            </CardTitle>
            <CardDescription>Choose a farm to calculate LAI for canopy management</CardDescription>
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
                    {farm.vine_spacing}×{farm.row_spacing}m
                  </Badge>
                </Button>
              ))}
            </div>

            {selectedFarm && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Variety:</span>
                    <div className="font-medium">{selectedFarm.grape_variety}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>
                    <div className="font-medium">{selectedFarm.area} ha</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vine Spacing:</span>
                    <div className="font-medium">{selectedFarm.vine_spacing} m</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Row Spacing:</span>
                    <div className="font-medium">{selectedFarm.row_spacing} m</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedFarm ? (
        <Card className="text-center py-12">
          <CardContent>
            <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">Please add a farm first to calculate LAI</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">LAI Calculator</TabsTrigger>
            <TabsTrigger value="targets">Optimal Targets</TabsTrigger>
            <TabsTrigger value="monitoring">Seasonal Schedule</TabsTrigger>
          </TabsList>

          {/* Main Calculator */}
          <TabsContent value="calculator" className="space-y-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-6 w-6" />
                  Canopy Measurements
                </CardTitle>
                <CardDescription>
                  Enter your vineyard canopy measurements for LAI calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vine Structure */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TreePine className="h-4 w-4" />
                    Vine Structure
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shootsPerVine">Shoots per Vine</Label>
                      <Input
                        id="shootsPerVine"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.shootsPerVine}
                        onChange={(e) => handleInputChange('shootsPerVine', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leavesPerShoot">Leaves per Shoot</Label>
                      <Input
                        id="leavesPerShoot"
                        type="number"
                        placeholder="e.g., 18"
                        value={formData.leavesPerShoot}
                        onChange={(e) => handleInputChange('leavesPerShoot', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Leaf Characteristics */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Leaf Characteristics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="avgLeafLength">Average Leaf Length (cm)</Label>
                      <Input
                        id="avgLeafLength"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 15.5"
                        value={formData.avgLeafLength}
                        onChange={(e) => handleInputChange('avgLeafLength', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgLeafWidth">Average Leaf Width (cm)</Label>
                      <Input
                        id="avgLeafWidth"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 14.0"
                        value={formData.avgLeafWidth}
                        onChange={(e) => handleInputChange('avgLeafWidth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leafShape">Leaf Shape</Label>
                      <select
                        id="leafShape"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.leafShape}
                        onChange={(e) => handleInputChange('leafShape', e.target.value)}
                      >
                        <option value="heart">Heart-shaped</option>
                        <option value="round">Round</option>
                        <option value="lobed">Deeply lobed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Canopy Architecture */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Canopy Architecture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="canopyHeight">Canopy Height (m)</Label>
                      <Input
                        id="canopyHeight"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        value={formData.canopyHeight}
                        onChange={(e) => handleInputChange('canopyHeight', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="canopyWidth">Canopy Width (m)</Label>
                      <Input
                        id="canopyWidth"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 1.2"
                        value={formData.canopyWidth}
                        onChange={(e) => handleInputChange('canopyWidth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="trellisSystem">Trellis System</Label>
                      <select
                        id="trellisSystem"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.trellisSystem}
                        onChange={(e) => handleInputChange('trellisSystem', e.target.value)}
                      >
                        <option value="vsp">VSP (Vertical Shoot Positioning)</option>
                        <option value="geneva">Geneva Double Curtain</option>
                        <option value="scott-henry">Scott Henry</option>
                        <option value="lyre">Lyre System</option>
                        <option value="pergola">Pergola</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Context Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Context
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="season">Current Season</Label>
                      <select
                        id="season"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.season}
                        onChange={(e) => handleInputChange('season', e.target.value)}
                      >
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="autumn">Autumn</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="productionGoal">Production Goal</Label>
                      <select
                        id="productionGoal"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.productionGoal}
                        onChange={(e) => handleInputChange('productionGoal', e.target.value)}
                      >
                        <option value="table">Table Grapes</option>
                        <option value="wine">Wine Grapes</option>
                        <option value="raisin">Raisin Production</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCalculate}
                  disabled={loading || !selectedFarm}
                  className="w-full"
                >
                  {loading ? 'Calculating...' : 'Calculate LAI'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      LAI Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">{results.lai}</div>
                        <div className="text-sm text-blue-700">Leaf Area Index</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">{results.lightInterception}%</div>
                        <div className="text-sm text-green-700">Light Interception</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{results.leafAreaPerVine}</div>
                        <div className="text-sm text-purple-700">m² per Vine</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{results.plantDensity}</div>
                        <div className="text-sm text-orange-700">Vines per Ha</div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Canopy Density Assessment */}
                    <div className={`p-4 rounded-lg border ${getCanopyDensityColor(results.canopyDensity)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TreePine className="h-5 w-5" />
                        <span className="font-semibold">
                          Canopy Density: {results.canopyDensity.charAt(0).toUpperCase() + results.canopyDensity.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm">
                        Current LAI of {results.lai} indicates {results.canopyDensity} canopy conditions
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Quality Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">Fruit Exposure</div>
                          <div className="text-sm text-muted-foreground">Light penetration to fruit</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getQualityIcon(results.qualityMetrics.fruitExposure)}
                          <span className="font-medium capitalize">{results.qualityMetrics.fruitExposure}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">Air Flow</div>
                          <div className="text-sm text-muted-foreground">Ventilation through canopy</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getQualityIcon(results.qualityMetrics.airflow)}
                          <span className="font-medium capitalize">{results.qualityMetrics.airflow}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">Disease Risk</div>
                          <div className="text-sm text-muted-foreground">Humidity and air circulation</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getQualityIcon(results.qualityMetrics.diseaseRisk)}
                          <span className="font-medium capitalize">{results.qualityMetrics.diseaseRisk}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Management Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.recommendations.canopyManagement.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          Canopy Management
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.canopyManagement.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.recommendations.pruningAdvice.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TreePine className="h-4 w-4 text-blue-600" />
                          Pruning Advice
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.pruningAdvice.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.recommendations.trellisAdjustments.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          Trellis System
                        </h4>
                        <ul className="space-y-1">
                          {results.recommendations.trellisAdjustments.map((rec, index) => (
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

          {/* Optimal Targets Tab */}
          <TabsContent value="targets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimal LAI Targets
                </CardTitle>
                <CardDescription>
                  LAI targets for {formData.productionGoal} grape production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{optimalTargets.minLAI}</div>
                      <div className="text-sm text-red-700">Minimum LAI</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{optimalTargets.optimalRange}</div>
                      <div className="text-sm text-green-700">Optimal Range</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{optimalTargets.maxLAI}</div>
                      <div className="text-sm text-red-700">Maximum LAI</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900">Reasoning:</h4>
                    <p className="text-blue-800 text-sm">{optimalTargets.reasoning}</p>
                  </div>

                  {results && (
                    <div className={`p-4 rounded-lg border ${
                      results.lai >= optimalTargets.minLAI && results.lai <= optimalTargets.maxLAI
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}>
                      <div className="font-semibold mb-1">Current Status:</div>
                      <div className="text-sm">
                        Your LAI of {results.lai} is {
                          results.lai >= optimalTargets.minLAI && results.lai <= optimalTargets.maxLAI
                            ? 'within the optimal range'
                            : results.lai < optimalTargets.minLAI
                            ? 'below the optimal range - consider increasing canopy density'
                            : 'above the optimal range - consider canopy management'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Schedule Tab */}
          <TabsContent value="monitoring">
            <div className="space-y-4">
              {seasonalSchedule.map((period, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {period.season}
                    </CardTitle>
                    <CardDescription>{period.timing}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Focus Areas
                        </h4>
                        <ul className="space-y-1">
                          {period.focus.map((item, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Recommended Actions
                        </h4>
                        <ul className="space-y-1">
                          {period.actions.map((action, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}