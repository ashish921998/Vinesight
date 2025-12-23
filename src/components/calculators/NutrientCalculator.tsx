'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Beaker,
  Target,
  TrendingUp,
  CheckCircle,
  Info,
  Calendar,
  Leaf,
  FlaskConical,
  Calculator,
  DollarSign
} from 'lucide-react'
import {
  NutrientCalculator,
  type NutrientCalculationInputs,
  type NutrientResults,
  type SoilTestResults
} from '@/lib/nutrient-calculator'
import { SupabaseService } from '@/lib/supabase-service'
import type { Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'
import { SoilTestLoadBanner } from '@/components/lab-tests/SoilTestLoadBanner'
import { toast } from 'sonner'

export function NutrientCalculatorComponent() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<NutrientResults | null>(null)
  const [activeSection, setActiveSection] = useState<'calculator' | 'symptoms' | 'schedule'>(
    'calculator'
  )

  const [formData, setFormData] = useState({
    targetYield: '',
    currentGrowthStage: 'budbreak' as const,
    grapeVariety: 'wine' as const,
    irrigationMethod: 'drip' as const,
    // Soil test data
    ph: '',
    organicMatter: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    calcium: '',
    magnesium: '',
    sulfur: '',
    boron: '',
    zinc: '',
    manganese: '',
    iron: '',
    copper: '',
    cec: ''
  })

  useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      const farmList = await SupabaseService.getAllFarms()
      setFarms(farmList)
      if (farmList.length > 0) {
        setSelectedFarm(farmList[0])
      }
    } catch (error) {
      console.error('Error loading farms:', error)
    }
  }

  const handleCalculate = async () => {
    if (!selectedFarm) return

    setLoading(true)
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
      }

      const inputs: NutrientCalculationInputs = {
        farmId: selectedFarm.id!,
        targetYield: parseFloat(formData.targetYield) || 12,
        currentGrowthStage: formData.currentGrowthStage,
        grapeVariety: formData.grapeVariety,
        irrigationMethod: formData.irrigationMethod,
        soilTest: soilTest,
        previousApplications: [],
        farmArea: selectedFarm.area
      }

      const calculationResults = NutrientCalculator.calculateNutrients(inputs)
      setResults(calculationResults)

      // Save calculation to history
      await SupabaseService.addCalculationHistory({
        farm_id: selectedFarm.id!,
        calculation_type: 'nutrients',
        date: new Date().toISOString().split('T')[0],
        inputs: inputs,
        outputs: calculationResults
      })
    } catch (error) {
      console.error('Error calculating nutrient requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      targetYield: '',
      currentGrowthStage: 'budbreak',
      grapeVariety: 'wine',
      irrigationMethod: 'drip',
      ph: '',
      organicMatter: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      calcium: '',
      magnesium: '',
      sulfur: '',
      boron: '',
      zinc: '',
      manganese: '',
      iron: '',
      copper: '',
      cec: ''
    })
    setResults(null)
  }

  const loadSoilTestData = (testParameters: Record<string, any>) => {
    setFormData((prev) => ({
      ...prev,
      ph: (testParameters.pH ?? testParameters.ph)?.toString() || '',
      organicMatter: testParameters.organicMatter?.toString() || '',
      nitrogen: testParameters.nitrogen?.toString() || '',
      phosphorus: testParameters.phosphorus?.toString() || '',
      potassium: testParameters.potassium?.toString() || '',
      calcium: testParameters.calcium?.toString() || '',
      magnesium: testParameters.magnesium?.toString() || '',
      sulfur: testParameters.sulfur?.toString() || '',
      boron: testParameters.boron?.toString() || '',
      zinc: testParameters.zinc?.toString() || '',
      manganese: testParameters.manganese?.toString() || '',
      iron: testParameters.iron?.toString() || '',
      copper: testParameters.copper?.toString() || '',
      cec: testParameters.cec?.toString() || ''
    }))
    toast.success('Soil test data loaded! Review and adjust values as needed.')
  }

  const getNutrientStatus = (deficit: number) => {
    if (deficit > 50) return { variant: 'destructive' as const, status: 'High Need' }
    if (deficit > 20) return { variant: 'secondary' as const, status: 'Moderate Need' }
    return { variant: 'default' as const, status: 'Low Need' }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Beaker className="h-4 w-4 text-green-600" />
          <h2 className="text-lg font-semibold text-green-800">Fertilizer Calculator</h2>
        </div>
        <p className="text-xs text-gray-600">
          Find out exactly how much fertilizer to apply for optimal grape production
        </p>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
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
                      <h4 className="font-medium text-gray-900 text-sm">{capitalize(farm.name)}</h4>
                      <p className="text-xs text-gray-500">
                        {farm.area}acre • {farm.cropVariety}
                      </p>
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
                Please add a farm first to calculate nutrient requirements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedFarm ? (
        <Card className="text-center py-12">
          <CardContent>
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms available</h3>
            <p className="text-muted-foreground">
              Please add a farm first to calculate nutrient requirements
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Soil Test Load Banner */}
          {selectedFarm && (
            <SoilTestLoadBanner farmId={selectedFarm.id!} onLoadTest={loadSoilTestData} />
          )}

          {/* Mobile-Optimized Input Sections */}
          <div className="mx-4 sm:mx-0 space-y-4 sm:space-y-3">
            {/* Production Goals Section */}
            <Card>
              <CardHeader
                className="pb-4 sm:pb-3 cursor-pointer"
                onClick={() =>
                  setActiveSection(activeSection === 'calculator' ? 'calculator' : 'calculator')
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Production Goals</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </div>
                <CardDescription className="text-sm sm:text-xs">
                  Enter your yield targets and production details
                </CardDescription>
              </CardHeader>
              {activeSection === 'calculator' && (
                <CardContent className="pt-0 space-y-6 sm:space-y-4">
                  {/* Basic Production Info */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Target Yield (tons/ha)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="12.5"
                        value={formData.targetYield}
                        onChange={(e) => handleInputChange('targetYield', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Current Growth Stage
                      </Label>
                      <Select
                        value={formData.currentGrowthStage}
                        onValueChange={(
                          value:
                            | 'dormant'
                            | 'budbreak'
                            | 'flowering'
                            | 'fruit_set'
                            | 'veraison'
                            | 'harvest'
                            | 'post_harvest'
                        ) => handleInputChange('currentGrowthStage', value)}
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dormant">Dormant</SelectItem>
                          <SelectItem value="budbreak">Bud Break</SelectItem>
                          <SelectItem value="flowering">Flowering</SelectItem>
                          <SelectItem value="fruit_set">Fruit Set</SelectItem>
                          <SelectItem value="veraison">Veraison</SelectItem>
                          <SelectItem value="harvest">Harvest</SelectItem>
                          <SelectItem value="post_harvest">Post Harvest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Production Type
                      </Label>
                      <Select
                        value={formData.grapeVariety}
                        onValueChange={(value: 'table' | 'wine' | 'raisin') =>
                          handleInputChange('grapeVariety', value)
                        }
                      >
                        <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Table Grapes</SelectItem>
                          <SelectItem value="wine">Wine Grapes</SelectItem>
                          <SelectItem value="raisin">Raisin Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Soil Test Data Section */}
            <Card>
              <CardHeader
                className="pb-4 sm:pb-3 cursor-pointer"
                onClick={() =>
                  setActiveSection(activeSection === 'calculator' ? 'calculator' : 'calculator')
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <FlaskConical className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Soil Test Results</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </div>
                <CardDescription className="text-sm sm:text-xs">
                  Enter your soil test results for precise recommendations
                </CardDescription>
              </CardHeader>
              {activeSection === 'calculator' && (
                <CardContent className="pt-0 space-y-6 sm:space-y-4">
                  {/* Basic Soil Properties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        pH
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="6.8"
                        value={formData.ph}
                        onChange={(e) => handleInputChange('ph', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Organic Matter (%)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={formData.organicMatter}
                        onChange={(e) => handleInputChange('organicMatter', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Macronutrients */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Nitrogen (N) ppm
                      </Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={formData.nitrogen}
                        onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Phosphorus (P) ppm
                      </Label>
                      <Input
                        type="number"
                        placeholder="25"
                        value={formData.phosphorus}
                        onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Potassium (K) ppm
                      </Label>
                      <Input
                        type="number"
                        placeholder="150"
                        value={formData.potassium}
                        onChange={(e) => handleInputChange('potassium', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Calcium (Ca) ppm
                      </Label>
                      <Input
                        type="number"
                        placeholder="1200"
                        value={formData.calcium}
                        onChange={(e) => handleInputChange('calcium', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Micronutrients */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Zinc (Zn) ppm
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={formData.zinc}
                        onChange={(e) => handleInputChange('zinc', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-base sm:text-sm font-medium text-gray-700 mb-2 block">
                        Iron (Fe) ppm
                      </Label>
                      <Input
                        type="number"
                        placeholder="25"
                        value={formData.iron}
                        onChange={(e) => handleInputChange('iron', e.target.value)}
                        className="h-12 sm:h-11 text-base sm:text-sm"
                      />
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
                    Calculate Nutrients
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

          {/* Results Display */}
          {results && (
            <div className="mx-4 sm:mx-0 space-y-4 sm:space-y-3">
              {/* Nutrient Recommendations */}
              <Card>
                <CardHeader className="pb-4 sm:pb-3">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <Leaf className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Nutrient Recommendations</CardTitle>
                  </div>
                  <CardDescription className="text-sm sm:text-xs">
                    Based on your soil test results and production goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6 sm:space-y-4">
                  {/* Macronutrients */}
                  <div className="space-y-4 sm:space-y-3">
                    <h4 className="font-semibold text-base sm:text-sm text-gray-800">
                      Macronutrients
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Nitrogen (N)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.nitrogen.deficit).variant
                            }
                            className="text-xs"
                          >
                            {getNutrientStatus(results.recommendations.nitrogen.deficit).status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required: {results.recommendations.nitrogen.required.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Available: {results.recommendations.nitrogen.available.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Deficit: {results.recommendations.nitrogen.deficit.toFixed(1)} kg/ha
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Phosphorus (P)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.phosphorus.deficit).variant
                            }
                            className="text-xs"
                          >
                            {getNutrientStatus(results.recommendations.phosphorus.deficit).status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required: {results.recommendations.phosphorus.required.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Available: {results.recommendations.phosphorus.available.toFixed(1)}{' '}
                            kg/ha
                          </div>
                          <div>
                            Deficit: {results.recommendations.phosphorus.deficit.toFixed(1)} kg/ha
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Potassium (K)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.potassium.deficit).variant
                            }
                            className="text-xs"
                          >
                            {getNutrientStatus(results.recommendations.potassium.deficit).status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required: {results.recommendations.potassium.required.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Available: {results.recommendations.potassium.available.toFixed(1)}{' '}
                            kg/ha
                          </div>
                          <div>
                            Deficit: {results.recommendations.potassium.deficit.toFixed(1)} kg/ha
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Nutrients */}
                  <div className="space-y-4 sm:space-y-3">
                    <h4 className="font-semibold text-base sm:text-sm text-gray-800">
                      Secondary Nutrients
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Calcium (Ca)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.secondary.calcium.deficit)
                                .variant
                            }
                            className="text-xs"
                          >
                            {
                              getNutrientStatus(results.recommendations.secondary.calcium.deficit)
                                .status
                            }
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required:{' '}
                            {results.recommendations.secondary.calcium.required.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Available:{' '}
                            {results.recommendations.secondary.calcium.available.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Deficit: {results.recommendations.secondary.calcium.deficit.toFixed(1)}{' '}
                            kg/ha
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Magnesium (Mg)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.secondary.magnesium.deficit)
                                .variant
                            }
                            className="text-xs"
                          >
                            {
                              getNutrientStatus(results.recommendations.secondary.magnesium.deficit)
                                .status
                            }
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required:{' '}
                            {results.recommendations.secondary.magnesium.required.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Available:{' '}
                            {results.recommendations.secondary.magnesium.available.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Deficit:{' '}
                            {results.recommendations.secondary.magnesium.deficit.toFixed(1)} kg/ha
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Sulfur (S)</span>
                          <Badge
                            variant={
                              getNutrientStatus(results.recommendations.secondary.sulfur.deficit)
                                .variant
                            }
                            className="text-xs"
                          >
                            {
                              getNutrientStatus(results.recommendations.secondary.sulfur.deficit)
                                .status
                            }
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            Required: {results.recommendations.secondary.sulfur.required.toFixed(1)}{' '}
                            kg/ha
                          </div>
                          <div>
                            Available:{' '}
                            {results.recommendations.secondary.sulfur.available.toFixed(1)} kg/ha
                          </div>
                          <div>
                            Deficit: {results.recommendations.secondary.sulfur.deficit.toFixed(1)}{' '}
                            kg/ha
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Schedule */}
              <Card>
                <CardHeader className="pb-4 sm:pb-3">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Application Schedule</CardTitle>
                  </div>
                  <CardDescription className="text-sm sm:text-xs">
                    Recommended timing and methods for nutrient applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4 sm:space-y-3">
                  {results.applicationSchedule.map((schedule, index) => (
                    <div key={index} className="bg-gray-50 p-4 sm:p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-3 sm:mb-2">
                        <h5 className="font-medium text-base sm:text-sm text-gray-800">
                          {schedule.month}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {schedule.stage}
                        </Badge>
                      </div>
                      <div className="space-y-2 sm:space-y-1">
                        {schedule.applications.map((app, appIndex) => (
                          <div key={appIndex} className="text-sm sm:text-xs text-gray-600">
                            <span className="font-medium">{app.fertilizer}:</span>{' '}
                            {app.rate.toFixed(1)} kg/ha - {app.method}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Cost Summary */}
              <Card>
                <CardHeader className="pb-4 sm:pb-3">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg sm:text-base">Cost Summary</CardTitle>
                  </div>
                  <CardDescription className="text-sm sm:text-xs">
                    Estimated costs for the nutrient program
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-green-50 p-4 sm:p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl sm:text-xl font-bold text-green-600">
                        ${results.totalCost.toFixed(2)}
                      </div>
                      <div className="text-sm sm:text-xs text-green-700 mt-1">
                        Total cost per acre
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
