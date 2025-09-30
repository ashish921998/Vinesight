'use client'

import { useState, useEffect } from 'react'
import { WeatherDashboard } from '@/components/weather/WeatherDashboard'
import { SupabaseService } from '@/lib/supabase-service'
import type { Farm } from '@/types/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CloudSun, MapPin, Sprout, Mountain } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function WeatherPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [selectedGrowthStage, setSelectedGrowthStage] = useState('Flowering')
  const [selectedSoilType, setSelectedSoilType] = useState('medium')
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  const growthStages = [
    { value: 'Budbreak', label: 'Budbreak', description: 'Early spring growth' },
    { value: 'Leaf development', label: 'Leaf Development', description: 'New leaves forming' },
    { value: 'Flowering', label: 'Flowering', description: 'Bloom period' },
    { value: 'Fruit set', label: 'Fruit Set', description: 'Berries forming' },
    { value: 'Veraison', label: 'Veraison', description: 'Berry color change' },
    { value: 'Harvest', label: 'Harvest', description: 'Ready for picking' },
    { value: 'Post-harvest', label: 'Post-harvest', description: 'After harvest' },
    { value: 'Dormant', label: 'Dormant', description: 'Winter dormancy' },
  ]

  const soilTypes = [
    { value: 'sandy', label: 'Sandy Soil', description: 'Well-draining, low water holding' },
    { value: 'medium', label: 'Loamy Soil', description: 'Balanced drainage and retention' },
    { value: 'clay', label: 'Clay Soil', description: 'High water holding capacity' },
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CloudSun className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading weather data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <CloudSun className="h-8 w-8" />
              Weather Intelligence
            </h1>
            <p className="text-muted-foreground mt-2">
              Smart weather monitoring and irrigation guidance for your vineyards
            </p>
          </div>
        </div>

        {/* Farm and Settings Selection */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Farm Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Select Farm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedFarm?.id?.toString()}
                  onValueChange={(value) => {
                    const farm = farms.find((f) => f.id?.toString() === value)
                    setSelectedFarm(farm || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id!.toString()}>
                        <div>
                          <div className="font-medium">{farm.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {farm.area} acres • {farm.region}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Growth Stage Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sprout className="h-4 w-4" />
                  Growth Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedGrowthStage} onValueChange={setSelectedGrowthStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {growthStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div>
                          <div className="font-medium">{stage.label}</div>
                          <div className="text-sm text-muted-foreground">{stage.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Soil Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mountain className="h-4 w-4" />
                  Soil Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSoilType} onValueChange={setSelectedSoilType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((soil) => (
                      <SelectItem key={soil.value} value={soil.value}>
                        <div>
                          <div className="font-medium">{soil.label}</div>
                          <div className="text-sm text-muted-foreground">{soil.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Farms Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your first farm to get personalized weather intelligence and irrigation
                recommendations.
              </p>
              <Button onClick={() => (window.location.href = '/farms')}>Add Your First Farm</Button>
            </CardContent>
          </Card>
        )}

        {/* Weather Dashboard */}
        {selectedFarm && (
          <WeatherDashboard
            farmLocation={{
              latitude: selectedFarm.latitude || 19.0825, // Use farm coordinates or default to Nashik
              longitude: selectedFarm.longitude || 73.1963,
              name: selectedFarm.locationName || selectedFarm.region,
            }}
            growthStage={selectedGrowthStage}
            soilType={selectedSoilType}
          />
        )}

        {/* Information Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About ETc Calculations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Evapotranspiration (ETc)</strong> represents the total water lost from your
                vineyard through evaporation from soil and transpiration from grape vines.
              </p>
              <p>
                Our calculations use the Penman-Monteith equation combined with crop-specific
                coefficients for different growth stages to provide accurate irrigation
                requirements.
              </p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Growth Stage Coefficients:</h4>
                <div className="space-y-1 text-xs">
                  <div>• Budbreak: 0.3 • Leaf development: 0.5</div>
                  <div>• Flowering: 0.7 • Fruit set: 0.8</div>
                  <div>• Veraison: 0.8 • Harvest: 0.6</div>
                  <div>• Post-harvest: 0.4 • Dormant: 0.2</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Smart Irrigation Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Our intelligent irrigation system considers multiple factors to optimize water
                usage:
              </p>
              <div className="space-y-1">
                <div>
                  • <strong>Weather forecasts</strong> - Adjusts for upcoming rainfall
                </div>
                <div>
                  • <strong>Soil moisture</strong> - Considers soil type and water holding capacity
                </div>
                <div>
                  • <strong>Growth stage</strong> - Matches water needs to vine development
                </div>
                <div>
                  • <strong>Environmental conditions</strong> - Factors in temperature, humidity,
                  and wind
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Pro Tip:</strong> Schedule irrigations during early morning hours (4-8 AM)
                  for maximum efficiency and reduced evaporation losses.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
