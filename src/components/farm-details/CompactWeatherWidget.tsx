'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Cloud, Droplets, Wind, Loader2 } from 'lucide-react'
import { WeatherService } from '@/lib/weather-service'
import type { Farm } from '@/types/types'

interface CompactWeatherWidgetProps {
  farm: Farm
}

export function CompactWeatherWidget({ farm }: CompactWeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const latitude = farm.latitude
  const longitude = farm.longitude

  useEffect(() => {
    const fetchWeather = async () => {
      if (latitude === undefined || longitude === undefined) return

      try {
        setLoading(true)
        const data = await WeatherService.getCurrentWeather(latitude, longitude)
        setWeatherData(data)
      } catch (error) {
        console.error('Error fetching weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [latitude, longitude])

  if (latitude === undefined || longitude === undefined) return null

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) return null

  const current = weatherData?.current

  return (
    <Card className="border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/80 rounded-xl">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {current?.temperature?.toFixed(0) || '--'}°C
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {current?.condition || 'Loading...'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700">{current?.humidity || '--'}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-gray-600" />
              <span className="text-gray-700">{current?.windSpeed?.toFixed(0) || '--'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
