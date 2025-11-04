/**
 * Visual Crossing Weather Provider
 * Premium weather API with pre-calculated agricultural parameters
 */

import type { IWeatherProvider, WeatherData, HourlySolarData } from './types'

interface VisualCrossingDay {
  datetime: string
  tempmax: number
  tempmin: number
  temp: number
  humidity: number
  precip: number
  windspeed: number
  solarradiation: number // W/m²
  solarenergy: number // MJ/m²
  uvindex: number
  sunrise: string
  sunset: string
  conditions: string
  description: string
}

interface VisualCrossingResponse {
  queryCost: number
  latitude: number
  longitude: number
  resolvedAddress: string
  address: string
  timezone: string
  tzoffset: number
  description: string
  days: VisualCrossingDay[]
}

export class VisualCrossingProvider implements IWeatherProvider {
  private static readonly BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'
  private static readonly API_KEY = process.env.NEXT_PUBLIC_VISUAL_CROSSING_API_KEY

  async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]> {
    const today = new Date().toISOString().split('T')[0]
    const start = startDate || today
    const end = endDate || today

    const location = `${latitude},${longitude}`
    const dateRange = start === end ? start : `${start}/${end}`

    const params = new URLSearchParams({
      unitGroup: 'metric',
      key: this.API_KEY || '',
      include: 'days',
      elements: [
        'datetime',
        'tempmax',
        'tempmin',
        'temp',
        'humidity',
        'precip',
        'windspeed',
        'solarradiation',
        'solarenergy',
        'uvindex',
        'sunrise',
        'sunset',
        'conditions',
        'description'
      ].join(',')
    })

    const url = `${this.BASE_URL}/${location}/${dateRange}?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Visual Crossing API key is invalid or missing')
        }
        throw new Error(`Visual Crossing API error: ${response.status} ${response.statusText}`)
      }

      const data: VisualCrossingResponse = await response.json()
      return this.parseWeatherData(data)
    } catch (error) {
      console.error('Error fetching Visual Crossing weather data:', error)
      throw new Error('Failed to fetch weather data from Visual Crossing API')
    }
  }

  async getCurrentWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    const weatherData = await this.getWeatherData(latitude, longitude)
    return weatherData[0]
  }

  async getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<HourlySolarData | null> {
    // Visual Crossing doesn't provide hourly solar data in the same way
    // This would require a separate hourly API call which costs more
    // For now, return null to indicate it's not supported
    return null
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<WeatherData[]> {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)

    const startDateStr = today.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    return this.getWeatherData(latitude, longitude, startDateStr, endDateStr)
  }

  private parseWeatherData(data: VisualCrossingResponse): WeatherData[] {
    return data.days.map((day) => {
      // Calculate sunshine duration from sunrise/sunset
      const sunshineDuration = this.calculateDayLength(day.sunrise, day.sunset)

      // Visual Crossing provides solar energy in MJ/m²/day directly
      const solarEnergyMJ = day.solarenergy || 0

      // Calculate ETo using FAO-56 Penman-Monteith
      // Visual Crossing doesn't provide ETo directly, so we calculate it
      const et0 = this.calculateETo(day, data.latitude)

      return {
        date: day.datetime,
        provider: 'visual-crossing' as const,

        // Temperature (°C)
        temperatureMax: day.tempmax,
        temperatureMin: day.tempmin,
        temperatureMean: day.temp,

        // Humidity (%) - Visual Crossing provides average, we estimate min/max
        relativeHumidityMax: Math.min(100, day.humidity + 15),
        relativeHumidityMin: Math.max(0, day.humidity - 15),
        relativeHumidityMean: day.humidity,

        // Wind (m/s) - Convert from km/h to m/s
        windSpeed10m: day.windspeed / 3.6,
        windSpeedMax: day.windspeed / 3.6,

        // Precipitation (mm)
        precipitationSum: day.precip || 0,

        // Solar radiation
        shortwaveRadiationSum: solarEnergyMJ,
        sunshineDuration: sunshineDuration,

        // Calculated ETo
        et0FaoEvapotranspiration: et0,

        // Location context
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: 0, // Visual Crossing doesn't provide elevation
        timezone: data.timezone
      }
    })
  }

  /**
   * Calculate day length from sunrise/sunset strings
   */
  private calculateDayLength(sunrise: string, sunset: string): number {
    try {
      const sunriseTime = new Date(`1970-01-01T${sunrise}`)
      const sunsetTime = new Date(`1970-01-01T${sunset}`)
      const diffMs = sunsetTime.getTime() - sunriseTime.getTime()
      return diffMs / (1000 * 60 * 60) // Convert to hours
    } catch {
      return 12 // Default to 12 hours if parsing fails
    }
  }

  /**
   * Calculate ETo using simplified FAO-56 Penman-Monteith equation
   * This is a simplified version - for production, use the full equation
   */
  private calculateETo(day: VisualCrossingDay, latitude: number): number {
    const temp = day.temp
    const tempMax = day.tempmax
    const tempMin = day.tempmin
    const humidity = day.humidity
    const windSpeed = day.windspeed / 3.6 // Convert km/h to m/s
    const solarRadiation = day.solarenergy // MJ/m²/day

    // Saturation vapor pressure
    const es = (this.satVaporPressure(tempMax) + this.satVaporPressure(tempMin)) / 2

    // Actual vapor pressure
    const ea = es * (humidity / 100)

    // Slope of saturation vapor pressure curve
    const delta = (4098 * this.satVaporPressure(temp)) / Math.pow(temp + 237.3, 2)

    // Psychrometric constant (assuming standard atmospheric pressure)
    const gamma = 0.067

    // Simplified ETo calculation (FAO-56)
    const numerator =
      0.408 * delta * solarRadiation + (gamma * 900 * windSpeed * (es - ea)) / (temp + 273)
    const denominator = delta + gamma * (1 + 0.34 * windSpeed)

    const et0 = numerator / denominator

    return Math.max(0, et0)
  }

  /**
   * Calculate saturation vapor pressure
   */
  private satVaporPressure(temp: number): number {
    return 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3))
  }
}
