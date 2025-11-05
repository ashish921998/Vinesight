'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  Settings2,
  Target,
  Zap
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { WeatherProviderManager } from '@/lib/weather-providers/weather-provider-manager'
import {
  WEATHER_PROVIDERS,
  type WeatherProvider,
  type WeatherData
} from '@/lib/weather-providers/types'
import type { Farm } from '@/types/types'
import { LocalSensorInput } from './LocalSensorInput'
import { AccuracyInsights } from './AccuracyInsights'

interface WeatherCardProps {
  farm: Farm
}

export function WeatherCard({ farm }: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weeklyWeatherData, setWeeklyWeatherData] = useState<WeatherData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeProvider, setActiveProvider] = useState<WeatherProvider>('open-meteo')

  const hasLocationData = farm.latitude && farm.longitude

  // Initialize active provider from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const providerId = WeatherProviderManager.getActiveProviderId(farm.id)
      setActiveProvider(providerId)
    }
  }, [farm.id])

  const fetchWeatherData = async () => {
    if (!hasLocationData) {
      setError('Farm location data is required for weather information')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Get last 7 days for trend analysis
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 6)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      // Fetch both today's data and weekly data using the selected provider
      const [todayData, weeklyData] = await Promise.all([
        WeatherProviderManager.getWeatherData(
          farm.latitude!,
          farm.longitude!,
          todayStr,
          todayStr,
          farm.id
        ),
        WeatherProviderManager.getWeatherData(
          farm.latitude!,
          farm.longitude!,
          weekAgoStr,
          todayStr,
          farm.id
        )
      ])

      if (todayData.length > 0) {
        setWeatherData(todayData[0])
        setWeeklyWeatherData(weeklyData)
        setLastUpdated(new Date())

        // Fetch hourly solar radiation data for today (if provider supports it)
        try {
          const luxData = await WeatherProviderManager.getHourlySolarRadiation(
            farm.latitude!,
            farm.longitude!,
            todayData[0].date,
            farm.id
          )
          setSolarLuxData(luxData)
        } catch (luxError) {
          // Log error for debugging in development only
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Error fetching solar radiation data:', luxError)
          }
        }
      } else {
        setError('No weather data available for this location')
      }
    } catch (err) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error fetching weather data:', err)
      }
      setError('Failed to fetch weather data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderChange = (providerId: WeatherProvider) => {
    setActiveProvider(providerId)
    WeatherProviderManager.setProviderPreference(providerId, farm.id)
    // Immediately fetch data from the new provider
    fetchWeatherData()
  }

  useEffect(() => {
    if (hasLocationData) {
      fetchWeatherData()
    }
  }, [farm.latitude, farm.longitude])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  // Solar radiation lux data state
  const [solarLuxData, setSolarLuxData] = useState<{
    minLux: number
    maxLux: number
    avgLux: number
    hourlyLux: number[]
  } | null>(null)

  if (!hasLocationData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-base">Weather Data</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Location Required
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Add farm location to view weather information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Please add latitude and longitude coordinates to your farm to enable weather data
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Weather Data</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeatherData}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-3" />
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchWeatherData}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Weather Data</CardTitle>
            </div>
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) return null

  return (
    <Card>
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">Weather & Accuracy</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">{formatTime(lastUpdated)}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeatherData}
              disabled={isLoading}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <CardDescription className="text-xs flex items-center gap-1 mt-1">
          <Calendar className="h-3 w-3" />
          {weatherData.date} •{' '}
          {farm.locationName || `${farm.latitude?.toFixed(3)}, ${farm.longitude?.toFixed(3)}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0">
        <Tabs defaultValue="weather" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weather" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Accuracy
            </TabsTrigger>
            <TabsTrigger value="sensors" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Sensors
            </TabsTrigger>
          </TabsList>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-3 mt-0">
            {/* Weather Provider Selector */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
              <Settings2 className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">Data Source:</span>
              <Select value={activeProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="h-7 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WEATHER_PROVIDERS).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        {provider.isFree && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            Free
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider Info Badge */}
            <div className="mt-2">
              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-xs font-medium text-blue-800">
                    {WEATHER_PROVIDERS[activeProvider].name}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">
                    {WEATHER_PROVIDERS[activeProvider].description}
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Section */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-red-700">Temperature</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Max</span>
                    <span className="font-semibold text-red-800">
                      {weatherData.temperatureMax.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Min</span>
                    <span className="font-semibold text-red-800">
                      {weatherData.temperatureMin.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Avg</span>
                    <span className="font-semibold text-red-800">
                      {weatherData.temperatureMean.toFixed(1)}°C
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-700">Humidity</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">Max</span>
                    <span className="font-semibold text-blue-800">
                      {weatherData.relativeHumidityMax.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">Min</span>
                    <span className="font-semibold text-blue-800">
                      {weatherData.relativeHumidityMin.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">Avg</span>
                    <span className="font-semibold text-blue-800">
                      {weatherData.relativeHumidityMean.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">Wind Speed</span>
                </div>
                <span className="font-semibold text-gray-800 text-sm">
                  {weatherData.windSpeed10m.toFixed(1)} m/s
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Rainfall</span>
                </div>
                <span className="font-semibold text-blue-800 text-sm">
                  {weatherData.precipitationSum.toFixed(1)} mm
                </span>
              </div>
            </div>

            {/* Solar Radiation & Sunshine */}
            <div className="space-y-2">
              {/* Today&apos;s Solar Radiation */}
              <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700">
                    Today&apos;s Solar Radiation
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-yellow-600">Energy</span>
                      <span className="font-semibold text-yellow-800">
                        {weatherData.shortwaveRadiationSum.toFixed(1)} MJ/m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-yellow-600">Intensity</span>
                      <span className="font-semibold text-yellow-800">
                        {(weatherData.shortwaveRadiationSum / 0.0036).toFixed(0)} Wh/m²
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-yellow-200">
                    <span className="text-xs text-yellow-600">Daylight Average</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-800">
                        {solarLuxData ? solarLuxData.avgLux.toFixed(0) : '---'}
                      </div>
                      <div className="text-xs text-yellow-600">lux</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Solar Radiation (in Lux) */}
              {/* {solarLuxData && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Today&apos;s Solar Radiation Range (Lux)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">Peak (Max)</span>
                  <span className="font-semibold text-amber-800">{solarLuxData.maxLux.toFixed(0)} lux</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">Night (Min)</span>
                  <span className="font-semibold text-amber-800">{solarLuxData.minLux.toFixed(0)} lux</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">Daylight Average</span>
                  <span className="font-semibold text-amber-800">{solarLuxData.avgLux.toFixed(0)} lux</span>
                </div>
              </div>
            </div>
          )} */}

              {/* Sunshine Duration */}
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Sunshine Duration</span>
                </div>
                <span className="font-semibold text-orange-800 text-sm">
                  {weatherData.sunshineDuration.toFixed(1)} hrs
                </span>
              </div>
            </div>

            {/* ETo Information */}
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    Reference Evapotranspiration (ETo)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-green-600">FAO-56 Penman-Monteith</div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-green-800">
                      {weatherData.et0FaoEvapotranspiration.toFixed(2)} mm/day
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Elevation: {weatherData.elevation}m</span>
                </div>
                <div>Timezone: {weatherData.timezone}</div>
              </div>
            </div>
          </TabsContent>

          {/* Accuracy Insights Tab */}
          <TabsContent value="accuracy" className="mt-0">
            <AccuracyInsights farm={farm} currentProvider={activeProvider} />
          </TabsContent>

          {/* Local Sensors Tab */}
          <TabsContent value="sensors" className="mt-0">
            <LocalSensorInput farm={farm} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
