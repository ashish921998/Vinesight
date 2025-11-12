'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Timer,
  TrendingUp
} from 'lucide-react'
import { WeatherService, WeatherData, ETc, WeatherAlerts } from '@/lib/weather-service'
import { OpenMeteoWeatherService, OpenMeteoWeatherData } from '@/lib/open-meteo-weather'

interface WeatherDashboardProps {
  farmLocation?: { latitude: number; longitude: number; name?: string }
  growthStage?: string
  soilType?: string
}

export function WeatherDashboard({
  farmLocation,
  growthStage = 'Flowering',
  soilType = 'medium'
}: WeatherDashboardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [etc, setEtc] = useState<ETc | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlerts | null>(null)
  const [irrigationSchedule, setIrrigationSchedule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openMeteoData, setOpenMeteoData] = useState<OpenMeteoWeatherData[]>([])

  useEffect(() => {
    loadWeatherData()
    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [farmLocation])

  const loadWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get raw Open-Meteo data first
      const rawOpenMeteoData = await OpenMeteoWeatherService.getWeatherForecast(
        farmLocation?.latitude || 19.0825,
        farmLocation?.longitude || 73.1963,
        7
      )
      setOpenMeteoData(rawOpenMeteoData)

      // Get processed weather data
      const weatherData = await WeatherService.getCurrentWeather(
        farmLocation?.latitude,
        farmLocation?.longitude
      )

      // Calculate ETc using both processed weather data and raw Open-Meteo data
      const etcData = WeatherService.calculateETc(weatherData, growthStage, rawOpenMeteoData)
      const alertsData = WeatherService.generateWeatherAlerts(weatherData, etcData)
      const scheduleData = WeatherService.generateIrrigationSchedule(weatherData, etcData, soilType)

      setWeather(weatherData)
      setEtc(etcData)
      setAlerts(alertsData)
      setIrrigationSchedule(scheduleData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading weather data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load weather data')
      setWeather(null)
      setEtc(null)
      setAlerts(null)
      setIrrigationSchedule(null)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string, isDay: boolean = true) => {
    const lower = condition.toLowerCase()
    if (lower.includes('rain') || lower.includes('drizzle')) {
      return <CloudRain className="h-6 w-6 text-green-500" />
    } else if (lower.includes('cloud')) {
      return <Cloud className="h-6 w-6 text-gray-500" />
    } else if (lower.includes('sun') || lower.includes('clear')) {
      return <Sun className="h-6 w-6 text-green-400" />
    }
    return isDay ? (
      <Sun className="h-6 w-6 text-green-400" />
    ) : (
      <Cloud className="h-6 w-6 text-gray-500" />
    )
  }

  const getAlertIcon = (type: 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-green-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4 text-green-700" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-green-200 text-green-800 border-green-300'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Weather Data Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadWeatherData}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (!weather || !etc || !alerts) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Weather Data Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            Unable to fetch weather data. Please check your internet connection and API
            configuration.
          </p>
          <Button onClick={loadWeatherData}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {getWeatherIcon(weather.current.condition, weather.current.isDay)}
            Weather & Irrigation Intelligence
          </h2>
          <p className="text-muted-foreground">
            {weather.location.name}, {weather.location.region}
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={loadWeatherData} size="sm" variant="outline">
          Refresh
        </Button>
      </div>

      {/* Current Weather Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="text-2xl font-bold">{weather.current.temperature}°C</p>
                <p className="text-xs text-muted-foreground">
                  Feels like {weather.current.feelsLike}°C
                </p>
              </div>
              <Thermometer className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="text-2xl font-bold">{weather.current.humidity}%</p>
                <p className="text-xs text-muted-foreground">
                  {weather.current.humidity > 70
                    ? 'High'
                    : weather.current.humidity > 40
                      ? 'Moderate'
                      : 'Low'}
                </p>
              </div>
              <Droplets className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wind Speed</p>
                <p className="text-2xl font-bold">{weather.current.windSpeed}</p>
                <p className="text-xs text-muted-foreground">
                  km/h {weather.current.windDirection}
                </p>
              </div>
              <Wind className="h-6 w-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precipitation</p>
                <p className="text-2xl font-bold">{weather.current.precipitation}</p>
                <p className="text-xs text-muted-foreground">mm today</p>
              </div>
              <CloudRain className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETc and Irrigation Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Evapotranspiration (ETc)
            </CardTitle>
            <CardDescription>Water demand for {growthStage} stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    ETc (Open-Meteo)
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      API
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {etc.dailyETcOpenMeteo > 0 ? `${etc.dailyETcOpenMeteo} mm/day` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    ETc (Calculated)
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200"
                    >
                      Formula
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {etc.dailyETcCalculated} mm/day
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Growth Stage:</span>
                    <span className="ml-2 font-medium">{etc.growthStage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Crop Coefficient:</span>
                    <span className="ml-2 font-medium">{etc.cropCoefficient}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Need:</span>
                    <span className="ml-2 font-medium">{etc.monthlyETc} mm</span>
                  </div>
                </div>

                {/* ETc Calculation Details */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-sm mb-3 text-gray-700">
                    ETc Calculation Details
                  </h5>
                  <div className="space-y-3 text-xs">
                    {/* Formula Display */}
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="font-mono text-center text-gray-700 mb-2">ETc = ET₀ × Kc</div>
                      <div className="text-center text-muted-foreground">
                        <span className="font-medium">ETc</span>: Crop Evapotranspiration |
                        <span className="font-medium"> ET₀</span>: Reference Evapotranspiration |
                        <span className="font-medium"> Kc</span>: Crop Coefficient
                      </div>
                    </div>

                    {/* Current Values */}
                    <div className="grid grid-cols-1 gap-2">
                      {etc.referenceETOpenMeteo !== null &&
                      etc.referenceETOpenMeteo !== undefined ? (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-medium text-blue-700 mb-1">
                            Open-Meteo API Calculation
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>ET₀ (API):</span>
                              <span className="font-medium">{etc.referenceETOpenMeteo} mm/day</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Kc ({etc.growthStage}):</span>
                              <span className="font-medium">{etc.cropCoefficient}</span>
                            </div>
                            {etc.referenceETOpenMeteo !== null &&
                            etc.referenceETOpenMeteo !== undefined ? (
                              <div className="flex justify-between border-t pt-1">
                                <span>
                                  ETc = {etc.referenceETOpenMeteo} × {etc.cropCoefficient}:
                                </span>
                                <span className="font-bold text-blue-600">
                                  {(etc.referenceETOpenMeteo * etc.cropCoefficient).toFixed(2)}{' '}
                                  mm/day
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-between border-t pt-1">
                                <span className="text-gray-500">ETc calculation unavailable</span>
                                <span className="font-medium text-gray-500">N/A</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="font-medium text-gray-700 mb-1">API Unavailable</div>
                          <div className="text-xs text-gray-600">
                            Open-Meteo API data not available. Using local calculation only.
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <div className="font-medium text-green-700 mb-1">
                          Penman-Monteith Calculation
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>ET₀ (Calculated):</span>
                            <span className="font-medium">{etc.referenceETCalculated} mm/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kc ({etc.growthStage}):</span>
                            <span className="font-medium">{etc.cropCoefficient}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>
                              ETc = {etc.referenceETCalculated} × {etc.cropCoefficient}:
                            </span>
                            <span className="font-bold text-green-600">
                              {etc.dailyETcCalculated} mm/day
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison */}
                    {etc.dailyETcOpenMeteo > 0 && (
                      <div className="bg-purple-50 p-2 rounded border border-purple-200">
                        <div className="font-medium text-purple-700 mb-1">Comparison Analysis</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Primary ETc (Active):</span>
                            <span className="font-bold text-purple-600">{etc.dailyETc} mm/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Difference:</span>
                            <span className="font-medium">
                              {Math.abs(etc.dailyETcOpenMeteo - etc.dailyETcCalculated).toFixed(2)}{' '}
                              mm/day
                              {etc.dailyETcOpenMeteo !== etc.dailyETcCalculated && (
                                <span className="text-muted-foreground ml-1">
                                  (
                                  {(
                                    (Math.abs(etc.dailyETcOpenMeteo - etc.dailyETcCalculated) /
                                      etc.dailyETcOpenMeteo) *
                                    100
                                  ).toFixed(1)}
                                  % variance)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Irrigation Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-green-600" />
              Irrigation Recommendations
            </CardTitle>
            <CardDescription>Smart irrigation guidance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  alerts.irrigation.shouldIrrigate
                    ? 'bg-green-100 border-green-300'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {alerts.irrigation.shouldIrrigate ? (
                    <Droplets className="h-4 w-4 text-green-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">
                    {alerts.irrigation.shouldIrrigate
                      ? 'Irrigation Recommended'
                      : 'No Irrigation Needed'}
                  </span>
                  <Badge variant="outline" className={getPriorityColor(alerts.irrigation.urgency)}>
                    {alerts.irrigation.urgency} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alerts.irrigation.reason}</p>
                <div className="space-y-1">
                  {alerts.irrigation.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground flex items-center gap-1"
                    >
                      <span>•</span> {rec}
                    </div>
                  ))}
                </div>
              </div>

              {irrigationSchedule && irrigationSchedule.schedule.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    Upcoming Schedule
                  </h4>
                  <div className="space-y-2">
                    {irrigationSchedule.schedule.slice(0, 3).map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground ml-2">{item.duration}h</span>
                        </div>
                        <Badge variant="outline" className={getPriorityColor(item.priority)}>
                          {item.amount} mm
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total water need (7 days): {irrigationSchedule.totalWaterNeed} mm
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pest Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-green-700" />
              Pest & Disease Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge
                variant="outline"
                className={`${
                  alerts.pest.riskLevel === 'high'
                    ? 'bg-red-100 text-red-800'
                    : alerts.pest.riskLevel === 'medium'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {alerts.pest.riskLevel} risk
              </Badge>
              <div>
                <h5 className="font-medium mb-1">Current Conditions:</h5>
                {alerts.pest.conditions.map((condition, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {condition}
                  </p>
                ))}
              </div>
              <div>
                <h5 className="font-medium mb-1">Precautions:</h5>
                {alerts.pest.precautions.map((precaution, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {precaution}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Harvest Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 ${alerts.harvest.isOptimal ? 'text-green-600' : 'text-green-700'}`}
              >
                {alerts.harvest.isOptimal ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {alerts.harvest.isOptimal ? 'Optimal' : 'Suboptimal'} Conditions
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{alerts.harvest.conditions}</p>
              <div>
                <h5 className="font-medium mb-1">Recommendations:</h5>
                {alerts.harvest.recommendations.map((rec, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Weather Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-600" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">UV Index</span>
                <span className="text-sm font-medium">{weather.current.uvIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <span className="text-sm font-medium">{weather.current.visibility} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pressure</span>
                <span className="text-sm font-medium">{weather.current.pressure} hPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cloud Cover</span>
                <span className="text-sm font-medium">{weather.current.cloudCover}%</span>
              </div>
              {weather.forecast[0] && (
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sunrise</span>
                    <span className="text-sm font-medium">
                      {weather.forecast[0]?.sunrise || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sunset</span>
                    <span className="text-sm font-medium">
                      {weather.forecast[0]?.sunset || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Day Length</span>
                    <span className="text-sm font-medium">
                      {weather.forecast[0]?.dayLength?.toFixed(1) || 'N/A'} hrs
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            7-Day Forecast
          </CardTitle>
          <CardDescription>Weather outlook for the next week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {weather.forecast.map((day, index) => (
              <div key={index} className="text-center p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  {index === 0
                    ? 'Today'
                    : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className="flex justify-center mb-2">{getWeatherIcon(day.condition)}</div>
                <div className="text-xs mb-1">
                  <div className="font-medium">{day.maxTemp}°</div>
                  <div className="text-muted-foreground">{day.minTemp}°</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.precipitation > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <CloudRain className="h-3 w-3" />
                      {day.precipitation}mm
                    </div>
                  )}
                  {day.precipitationProbability > 0 && <div>{day.precipitationProbability}%</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
