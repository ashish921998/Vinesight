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
  Beaker, 
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  IndianRupee,
  Leaf,
  FlaskConical,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  NutrientCalculator,
  type NutrientCalculationInputs,
  type NutrientResults,
  type SoilTestResults
} from '@/lib/nutrient-calculator';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

export function NutrientCalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NutrientResults | null>(null);
  
  const [formData, setFormData] = useState({
    targetYield: "",
    currentGrowthStage: "budbreak" as const,
    grapeVariety: "wine" as const,
    irrigationMethod: "drip" as const,
    // Soil test data
    ph: "",
    organicMatter: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    calcium: "",
    magnesium: "",
    sulfur: "",
    boron: "",
    zinc: "",
    manganese: "",
    iron: "",
    copper: "",
    cec: ""
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
      const soilTest: SoilTestResults = {
        ph: parseFloat(formData.ph) || 7.0,
        organicMatter: parseFloat(formData.organicMatter) || 2.5,
        nitrogen: parseFloat(formData.nitrogen) || 20,
        phosphorus: parseFloat(formData.phosphorus) || 25,
        potassium: parseFloat(formData.potassium) || 150,
        calcium: parseFloat(formData.calcium) || 1200,
        magnesium: parseFloat(formData.magnesium) || 180,
        sulfur: parseFloat(formData.sulfur) || 12,
        boron: parseFloat(formData.boron) || 0.8,
        zinc: parseFloat(formData.zinc) || 2.5,
        manganese: parseFloat(formData.manganese) || 15,
        iron: parseFloat(formData.iron) || 25,
        copper: parseFloat(formData.copper) || 1.5,
        cec: parseFloat(formData.cec) || 15
      };

      const inputs: NutrientCalculationInputs = {
        farmId: selectedFarm.id!,
        targetYield: parseFloat(formData.targetYield) || 10,
        currentGrowthStage: formData.currentGrowthStage,
        soilTest,
        grapeVariety: formData.grapeVariety,
        irrigationMethod: formData.irrigationMethod,
        previousApplications: [], // Could be loaded from database
        farmArea: selectedFarm.area
      };

      const calculationResults = NutrientCalculator.calculateNutrients(inputs);
      setResults(calculationResults);

      // Save calculation to history
      await SupabaseService.addCalculationHistory({
        farm_id: selectedFarm.id!,
        calculation_type: 'nutrients',
        date: new Date().toISOString().split('T')[0],
        inputs: inputs,
        outputs: calculationResults
      });
    } catch (error) {
      console.error('Error calculating nutrients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': case 'good': case 'adequate': case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'fair': case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': case 'low': case 'acidic': case 'alkaline':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const deficiencySymptoms = NutrientCalculator.getDeficiencySymptoms();

  return (
    <div className="space-y-6">
      {/* Farm Selection */}
      {farms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Select Farm
            </CardTitle>
            <CardDescription>Choose a farm for nutrient analysis and fertilizer recommendations</CardDescription>
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
                    {farm.area}ha • {farm.grape_variety}
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
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">Please add a farm first to calculate nutrient requirements</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Nutrient Calculator</TabsTrigger>
            <TabsTrigger value="symptoms">Deficiency Guide</TabsTrigger>
            <TabsTrigger value="schedule">Application Schedule</TabsTrigger>
          </TabsList>

          {/* Main Calculator */}
          <TabsContent value="calculator" className="space-y-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Production Goals & Soil Analysis
                </CardTitle>
                <CardDescription>
                  Enter your yield targets and soil test results for precise nutrient recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Production Goals */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Production Goals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="targetYield">Target Yield (tons/ha)</Label>
                      <Input
                        id="targetYield"
                        type="number"
                        step="0.5"
                        placeholder="e.g., 12.5"
                        value={formData.targetYield}
                        onChange={(e) => handleInputChange('targetYield', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentGrowthStage">Current Growth Stage</Label>
                      <select
                        id="currentGrowthStage"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.currentGrowthStage}
                        onChange={(e) => handleInputChange('currentGrowthStage', e.target.value)}
                      >
                        <option value="dormant">Dormant</option>
                        <option value="budbreak">Bud Break</option>
                        <option value="flowering">Flowering</option>
                        <option value="fruit_set">Fruit Set</option>
                        <option value="veraison">Veraison</option>
                        <option value="harvest">Harvest</option>
                        <option value="post_harvest">Post Harvest</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="grapeVariety">Production Type</Label>
                      <select
                        id="grapeVariety"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.grapeVariety}
                        onChange={(e) => handleInputChange('grapeVariety', e.target.value)}
                      >
                        <option value="table">Table Grapes</option>
                        <option value="wine">Wine Grapes</option>
                        <option value="raisin">Raisin Production</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Basic Soil Properties */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Basic Soil Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="ph">pH</Label>
                      <Input
                        id="ph"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 6.8"
                        value={formData.ph}
                        onChange={(e) => handleInputChange('ph', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="organicMatter">Organic Matter (%)</Label>
                      <Input
                        id="organicMatter"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 3.2"
                        value={formData.organicMatter}
                        onChange={(e) => handleInputChange('organicMatter', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cec">CEC (meq/100g)</Label>
                      <Input
                        id="cec"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 15.0"
                        value={formData.cec}
                        onChange={(e) => handleInputChange('cec', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Nutrients */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Primary Nutrients (NPK)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nitrogen">Nitrogen (ppm)</Label>
                      <Input
                        id="nitrogen"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.nitrogen}
                        onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phosphorus">Phosphorus (ppm)</Label>
                      <Input
                        id="phosphorus"
                        type="number"
                        placeholder="e.g., 30"
                        value={formData.phosphorus}
                        onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="potassium">Potassium (ppm)</Label>
                      <Input
                        id="potassium"
                        type="number"
                        placeholder="e.g., 180"
                        value={formData.potassium}
                        onChange={(e) => handleInputChange('potassium', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Nutrients */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Secondary Nutrients
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="calcium">Calcium (ppm)</Label>
                      <Input
                        id="calcium"
                        type="number"
                        placeholder="e.g., 1200"
                        value={formData.calcium}
                        onChange={(e) => handleInputChange('calcium', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="magnesium">Magnesium (ppm)</Label>
                      <Input
                        id="magnesium"
                        type="number"
                        placeholder="e.g., 180"
                        value={formData.magnesium}
                        onChange={(e) => handleInputChange('magnesium', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sulfur">Sulfur (ppm)</Label>
                      <Input
                        id="sulfur"
                        type="number"
                        placeholder="e.g., 12"
                        value={formData.sulfur}
                        onChange={(e) => handleInputChange('sulfur', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Micronutrients */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Micronutrients
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="boron">Boron (ppm)</Label>
                      <Input
                        id="boron"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 0.8"
                        value={formData.boron}
                        onChange={(e) => handleInputChange('boron', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zinc">Zinc (ppm)</Label>
                      <Input
                        id="zinc"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        value={formData.zinc}
                        onChange={(e) => handleInputChange('zinc', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="iron">Iron (ppm)</Label>
                      <Input
                        id="iron"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.iron}
                        onChange={(e) => handleInputChange('iron', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manganese">Manganese (ppm)</Label>
                      <Input
                        id="manganese"
                        type="number"
                        placeholder="e.g., 15"
                        value={formData.manganese}
                        onChange={(e) => handleInputChange('manganese', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCalculate}
                  disabled={loading || !selectedFarm}
                  className="w-full"
                >
                  {loading ? 'Calculating Nutrient Requirements...' : 'Calculate Fertilizer Program'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <div className="space-y-6">
                {/* Soil Health Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      Soil Health Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className={`p-4 rounded-lg border ${getStatusColor(results.soilHealthAssessment.phStatus)}`}>
                        <div className="font-semibold mb-1">pH Status</div>
                        <div className="text-sm capitalize">{results.soilHealthAssessment.phStatus}</div>
                      </div>
                      <div className={`p-4 rounded-lg border ${getStatusColor(results.soilHealthAssessment.organicMatterStatus)}`}>
                        <div className="font-semibold mb-1">Organic Matter</div>
                        <div className="text-sm capitalize">{results.soilHealthAssessment.organicMatterStatus}</div>
                      </div>
                      <div className={`p-4 rounded-lg border ${getStatusColor(results.soilHealthAssessment.cationBalance)}`}>
                        <div className="font-semibold mb-1">Cation Balance</div>
                        <div className="text-sm capitalize">{results.soilHealthAssessment.cationBalance}</div>
                      </div>
                    </div>

                    {results.soilHealthAssessment.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Soil Improvement Recommendations:</h4>
                        <ul className="space-y-1">
                          {results.soilHealthAssessment.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Nutrient Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Nutrient Requirements (kg/ha)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {results.recommendations.nitrogen.deficit.toFixed(1)}
                        </div>
                        <div className="text-sm text-green-700">Nitrogen (N) Needed</div>
                        <div className="text-xs text-green-600 mt-1">
                          {results.recommendations.nitrogen.available.toFixed(1)} available
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {results.recommendations.phosphorus.deficit.toFixed(1)}
                        </div>
                        <div className="text-sm text-blue-700">Phosphorus (P) Needed</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {results.recommendations.phosphorus.available.toFixed(1)} available
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {results.recommendations.potassium.deficit.toFixed(1)}
                        </div>
                        <div className="text-sm text-purple-700">Potassium (K) Needed</div>
                        <div className="text-xs text-purple-600 mt-1">
                          {results.recommendations.potassium.available.toFixed(1)} available
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fertilizer Program */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Beaker className="h-5 w-5" />
                      Recommended Fertilizer Program
                      <Badge variant="secondary">
                        ₹{results.totalCost.toLocaleString('en-IN')} Total Cost
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.fertilizerProgram.map((program, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{program.fertilizer}</h4>
                              <Badge variant="outline" className="mt-1">
                                {program.stage.charAt(0).toUpperCase() + program.stage.slice(1).replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                ₹{(program.totalCost * selectedFarm.area).toLocaleString('en-IN')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {program.rate.toFixed(1)} kg/ha
                              </div>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div><strong>Timing:</strong> {program.timing}</div>
                            <div><strong>Method:</strong> {program.method}</div>
                            <div><strong>Notes:</strong> {program.notes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Deficiency Symptoms Guide */}
          <TabsContent value="symptoms">
            <div className="space-y-4">
              {deficiencySymptoms.map((symptom, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      {symptom.nutrient} Deficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-red-700">Symptoms:</h4>
                        <ul className="space-y-1">
                          {symptom.symptoms.map((s, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-red-600">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-green-700">Management:</h4>
                        <ul className="space-y-1">
                          {symptom.management.map((m, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              {m}
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

          {/* Application Schedule */}
          <TabsContent value="schedule">
            {results && results.applicationSchedule.length > 0 ? (
              <div className="space-y-4">
                {results.applicationSchedule.map((schedule, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {schedule.month}
                        <Badge variant="outline">
                          {schedule.stage.charAt(0).toUpperCase() + schedule.stage.slice(1).replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {schedule.applications.map((app, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{app.fertilizer}</div>
                              <div className="text-sm text-muted-foreground">{app.method}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{app.rate.toFixed(1)} kg/ha</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Schedule Available</h3>
                  <p className="text-muted-foreground">Calculate nutrient requirements first to see the application schedule</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}