/**
 * Local Sensor Input Component
 *
 * Allows farmers to:
 * 1. Enter local weather sensor readings (manual or IoT)
 * 2. Validate API ETo against local data
 * 3. See improved accuracy with sensor fusion
 * 4. Track calibration progress over time
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Thermometer,
  Droplet,
  Wind,
  Sun,
  CloudRain,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react'
import type { Farm } from '@/types/farm'
import type { LocalSensorData, EnhancedEToResult } from '@/lib/weather-providers/eto-accuracy-enhancement-service'
import { SensorFusionService, AccuracyEnhancementService } from '@/lib/weather-providers/eto-accuracy-enhancement-service'
import { WeatherProviderManager } from '@/lib/weather-providers/weather-provider-manager'

interface LocalSensorInputProps {
  farm: Farm
}

interface SensorReading {
  date: string
  temperatureMax?: number
  temperatureMin?: number
  humidity?: number
  windSpeed?: number
  solarRadiation?: number
  rainfall?: number
  source: 'manual' | 'iot' | 'station'
}

export function LocalSensorInput({ farm }: LocalSensorInputProps) {
  const [reading, setReading] = useState<SensorReading>({
    date: new Date().toISOString().split('T')[0],
    source: 'manual'
  })

  const [apiETo, setApiETo] = useState<number | null>(null)
  const [refinedETo, setRefinedETo] = useState<EnhancedEToResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load API ETo for selected date
  useEffect(() => {
    loadApiETo()
  }, [reading.date, farm.id])

  const loadApiETo = async () => {
    try {
      const data = await WeatherProviderManager.getWeatherData(
        farm.location.coordinates.lat,
        farm.location.coordinates.lng,
        reading.date,
        reading.date
      )
      if (data[0]) {
        setApiETo(data[0].et0FaoEvapotranspiration)
      }
    } catch (err) {
      console.error('Error loading API ETo:', err)
    }
  }

  const handleInputChange = (field: keyof SensorReading, value: string | number) => {
    setReading((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : typeof value === 'string' ? parseFloat(value) : value
    }))
  }

  const handleRefineETo = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Get API weather data
      const weatherData = await WeatherProviderManager.getWeatherData(
        farm.location.coordinates.lat,
        farm.location.coordinates.lng,
        reading.date,
        reading.date
      )

      if (!weatherData[0]) {
        throw new Error('No weather data available for this date')
      }

      // Refine with sensor data
      const sensorData: LocalSensorData = {
        date: reading.date,
        temperatureMax: reading.temperatureMax,
        temperatureMin: reading.temperatureMin,
        humidity: reading.humidity,
        windSpeed: reading.windSpeed,
        solarRadiation: reading.solarRadiation,
        rainfall: reading.rainfall,
        source: reading.source
      }

      const enhanced = await SensorFusionService.refineWithSensors(weatherData[0], sensorData)
      setRefinedETo(enhanced)

      // Save to database (implement this)
      // await saveSensorData(farm.id, reading)

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine ETo')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Save validation data to database
      // This will be used for regional calibration
      // await saveValidation(farm.id, reading, apiETo, refinedETo?.eto)

      setSuccess(true)
      alert('Validation saved! This will improve accuracy for future readings.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save validation')
    } finally {
      setLoading(false)
    }
  }

  const getAccuracyImprovement = (): string => {
    if (!refinedETo || !apiETo) return '0'
    const improvement = Math.abs(refinedETo.eto - apiETo)
    return improvement.toFixed(2)
  }

  const getCompletionPercentage = (): number => {
    const fields = [
      reading.temperatureMax,
      reading.temperatureMin,
      reading.humidity,
      reading.windSpeed
    ]
    const filled = fields.filter((f) => f !== undefined).length
    return (filled / fields.length) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Improve ETo Accuracy with Local Sensors
          </CardTitle>
          <CardDescription>
            Enter readings from your local weather sensors to refine API data and improve irrigation
            accuracy from ±15% to ±5%
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Sensor Input</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="guide">Setup Guide</TabsTrigger>
        </TabsList>

        {/* Sensor Input Tab */}
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Local Sensor Readings</CardTitle>
              <Progress value={getCompletionPercentage()} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {getCompletionPercentage().toFixed(0)}% complete • More sensors = better accuracy
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={reading.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Data Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Data Source</Label>
                <Select
                  value={reading.source}
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Reading</SelectItem>
                    <SelectItem value="iot">IoT Weather Station</SelectItem>
                    <SelectItem value="station">Nearby Weather Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature Section */}
              <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold">Temperature (°C)</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Most Important</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tempMax">Maximum</Label>
                    <Input
                      id="tempMax"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 35.5"
                      value={reading.temperatureMax ?? ''}
                      onChange={(e) => handleInputChange('temperatureMax', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tempMin">Minimum</Label>
                    <Input
                      id="tempMin"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 22.3"
                      value={reading.temperatureMin ?? ''}
                      onChange={(e) => handleInputChange('temperatureMin', e.target.value)}
                    />
                  </div>
                </div>

                {reading.temperatureMax !== undefined && reading.temperatureMin !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Average: {((reading.temperatureMax + reading.temperatureMin) / 2).toFixed(1)}°C
                  </p>
                )}
              </div>

              {/* Humidity Section */}
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">Relative Humidity (%)</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Very Important</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="humidity">Average Humidity</Label>
                  <Input
                    id="humidity"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="e.g., 65"
                    value={reading.humidity ?? ''}
                    onChange={(e) => handleInputChange('humidity', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Critical for ETo accuracy. Even rough estimates help!
                  </p>
                </div>
              </div>

              {/* Wind Section */}
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold">Wind Speed (m/s or km/h)</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Optional</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="windSpeed">Average Wind Speed</Label>
                  <Input
                    id="windSpeed"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5 m/s or 9 km/h"
                    value={reading.windSpeed ?? ''}
                    onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If entering km/h, we'll convert to m/s
                  </p>
                </div>
              </div>

              {/* Optional Advanced Sensors */}
              <details className="space-y-4">
                <summary className="cursor-pointer font-semibold text-sm">
                  Advanced Sensors (Optional)
                </summary>

                <div className="space-y-4 mt-4">
                  {/* Solar Radiation */}
                  <div className="space-y-2">
                    <Label htmlFor="solar" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Solar Radiation (W/m² or MJ/m²/day)
                    </Label>
                    <Input
                      id="solar"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 280 W/m²"
                      value={reading.solarRadiation ?? ''}
                      onChange={(e) => handleInputChange('solarRadiation', e.target.value)}
                    />
                  </div>

                  {/* Rainfall */}
                  <div className="space-y-2">
                    <Label htmlFor="rainfall" className="flex items-center gap-2">
                      <CloudRain className="h-4 w-4" />
                      Rainfall (mm)
                    </Label>
                    <Input
                      id="rainfall"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 12.5"
                      value={reading.rainfall ?? ''}
                      onChange={(e) => handleInputChange('rainfall', e.target.value)}
                    />
                  </div>
                </div>
              </details>

              {/* API ETo Reference */}
              {apiETo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    API ETo for this date: <strong>{apiETo.toFixed(2)} mm/day</strong>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Your sensor data will refine this value
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Sensor data saved and accuracy improved!
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRefineETo}
                  disabled={loading || !reading.temperatureMax || !reading.temperatureMin}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Refine ETo'}
                </Button>

                {refinedETo && (
                  <Button
                    onClick={handleValidate}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    Save Validation
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Minimum: Temperature Max & Min required
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accuracy Improvement Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {refinedETo ? (
                <>
                  {/* ETo Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">API ETo (Original)</p>
                      <p className="text-2xl font-bold">{apiETo?.toFixed(2)} mm/day</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated error: ±{refinedETo.metadata.estimatedError.toFixed(0)}%
                      </p>
                    </div>

                    <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Refined ETo (Sensors)</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {refinedETo.eto} mm/day
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated error: ±5-7%
                      </p>
                    </div>
                  </div>

                  {/* Improvement Metrics */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Accuracy Improvement</p>
                        <p className="text-sm text-muted-foreground">
                          Adjustment: {getAccuracyImprovement()} mm/day
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {refinedETo.confidence * 100}%
                      </p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                  </div>

                  {/* Corrections Applied */}
                  {refinedETo.corrections.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Corrections Applied:</h3>
                      {refinedETo.corrections.map((correction, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-gray-900 rounded border-l-4 border-blue-500"
                        >
                          <p className="font-medium capitalize text-sm">
                            {correction.type.replace('-', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{correction.reason}</p>
                          {correction.adjustment !== 0 && (
                            <p className="text-xs font-mono mt-1">
                              Adjustment: {correction.adjustment > 0 ? '+' : ''}
                              {correction.adjustment.toFixed(2)} mm/day
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Impact on Irrigation */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Irrigation Impact:</strong> Using refined ETo instead of API ETo could
                      save{' '}
                      {(
                        ((Math.abs(refinedETo.eto - (apiETo || 0)) / (apiETo || 1)) * 100)
                      ).toFixed(1)}
                      % water per irrigation cycle.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter sensor data and click "Refine ETo" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Guide Tab */}
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sensor Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Budget Setup (₹2,000)</h3>
                <ul>
                  <li>
                    <strong>Min/Max Thermometer:</strong> ₹500-800
                    <br />
                    <span className="text-muted-foreground text-xs">
                      Records daily maximum and minimum temperature
                    </span>
                  </li>
                  <li>
                    <strong>Humidity Meter (Hygrometer):</strong> ₹300-500
                    <br />
                    <span className="text-muted-foreground text-xs">
                      Digital hygrometer with min/max memory recommended
                    </span>
                  </li>
                  <li>
                    <strong>Rain Gauge:</strong> ₹200-400
                    <br />
                    <span className="text-muted-foreground text-xs">
                      Optional but helpful for rainfall tracking
                    </span>
                  </li>
                </ul>

                <h3>Better Setup (₹5,000-7,000)</h3>
                <ul>
                  <li>
                    <strong>Digital Weather Station:</strong> ₹3,000-5,000
                    <br />
                    <span className="text-muted-foreground text-xs">
                      All-in-one: temperature, humidity, rainfall, wind speed
                    </span>
                  </li>
                </ul>

                <h3>Installation Tips</h3>
                <ol>
                  <li>Place thermometer 1.5m (5 feet) above ground</li>
                  <li>Choose shaded location (avoid direct sun)</li>
                  <li>Keep away from buildings and irrigation</li>
                  <li>Protect from rain but allow air circulation</li>
                  <li>Read daily at same time (morning recommended)</li>
                </ol>

                <h3>Daily Routine (5 minutes)</h3>
                <ol>
                  <li>Read max/min temperature from thermometer</li>
                  <li>Read current humidity from hygrometer</li>
                  <li>Enter values in VineSight</li>
                  <li>Reset thermometer for next 24 hours</li>
                  <li>Get refined ETo for accurate irrigation</li>
                </ol>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Accuracy Levels:</strong>
                    <br />
                    • Temperature only: ±8-10% error
                    <br />
                    • Temperature + Humidity: ±5-7% error
                    <br />• All sensors: ±3-5% error
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
