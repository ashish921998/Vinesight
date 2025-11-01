'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Sun, Cloud, CloudRain, Wind, Droplets, Gauge } from 'lucide-react'
import { OpenMeteoWeatherService, type OpenMeteoWeatherData } from '@/lib/open-meteo-weather'
import { logger } from '@/lib/logger'
import type { Farm } from '@/types/types'

interface SimpleWeatherCardProps {
  farm: Farm
}

export function SimpleWeatherCard({ farm }: SimpleWeatherCardProps) {
  const [weatherData, setWeatherData] = useState<OpenMeteoWeatherData | null>(null)
  const [forecast, setForecast] = useState<OpenMeteoWeatherData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const hasLocationData = farm.latitude && farm.longitude

  useEffect(() => {
    if (!hasLocationData) return

    const loadWeather = async () => {
      setIsLoading(true)
      try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        const threeDaysLater = new Date(today)
        threeDaysLater.setDate(today.getDate() + 2)
        const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]

        const weatherDataArray = await OpenMeteoWeatherService.getWeatherData(
          farm.latitude!,
          farm.longitude!,
          todayStr,
          threeDaysLaterStr
        )

        if (weatherDataArray.length > 0) {
          setWeatherData(weatherDataArray[0])
          setForecast(weatherDataArray.slice(1, 4))
        }
      } catch (error) {
        logger.error('Error fetching weather data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWeather()
  }, [farm.latitude, farm.longitude, hasLocationData])

  const getWeatherIcon = (temp: number, humidity: number, precipitation: number) => {
    if (precipitation > 1) return <CloudRain className="h-5 w-5 text-primary" />
    if (humidity > 80) return <Cloud className="h-5 w-5 text-muted-foreground" />
    return <Sun className="h-5 w-5 text-primary" />
  }

  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return 'Tue'
    if (index === 1) return 'Wed'
    if (index === 2) return 'Thu'
    return new Date(dateStr).toLocaleDateString('en', { weekday: 'short' })
  }

  const handleCardClick = () => {
    router.push('/weather')
  }

  if (!hasLocationData || isLoading || !weatherData) {
    return (
      <Card
        className="cursor-pointer border border-border bg-card hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium text-foreground">Weather</span>
            </div>
          </div>
          <div className="py-3 text-center text-muted-foreground">
            {isLoading ? 'Loading...' : 'Weather data unavailable'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="cursor-pointer border border-border bg-card hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            <span className="text-lg font-medium text-foreground">Weather</span>
          </div>
        </div>

        {/* Current Temperature */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl font-light">{Math.round(weatherData.temperatureMean)}°C</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              <span className="text-sm">{Math.round(weatherData.relativeHumidityMean)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudRain className="h-4 w-4" />
              <span className="text-sm">{Math.round(weatherData.precipitationSum)}mm</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4" />
              <span className="text-sm">{Math.round(weatherData.windSpeed10m * 3.6)} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              <span className="text-sm">
                ETo {weatherData.et0FaoEvapotranspiration.toFixed(1)}mm
              </span>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        <div className="flex justify-between">
          {forecast.map((day, index) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {getDayName(day.date, index)}
              </span>
              {getWeatherIcon(day.temperatureMean, day.relativeHumidityMean, day.precipitationSum)}
              <div className="text-xs">
                <span className="font-medium">{Math.round(day.temperatureMax)}°</span>
                <span className="ml-1 text-muted-foreground">
                  {Math.round(day.precipitationSum)}mm
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
