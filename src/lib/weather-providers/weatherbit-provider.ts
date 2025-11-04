/**
 * Weatherbit Agriculture Weather Provider
 * Dedicated agriculture API with soil data and 8-day forecasts
 */

import type { IWeatherProvider, WeatherData, HourlySolarData } from './types'

interface WeatherbitDay {
  datetime: string
  temp: number
  max_temp: number
  min_temp: number
  rh: number // relative humidity average
  precip: number
  wind_spd: number
  solar_rad: number // W/m²
  dni: number // Direct Normal Irradiance
  ghi: number // Global Horizontal Irradiance
  clouds: number
  pop: number // probability of precipitation
  pres: number // pressure

  // Agriculture-specific parameters
  soil_temp?: number // soil temperature at 0-10cm depth
  soil_moisture?: number // soil moisture (m³/m³)
  evapotranspiration?: number // mm/day
}

interface WeatherbitResponse {
  data: WeatherbitDay[]
  city_name: string
  lon: string
  timezone: string
  lat: string
  country_code: string
  state_code: string
}

export class WeatherbitProvider implements IWeatherProvider {
  private static readonly BASE_URL = 'https://api.weatherbit.io/v2.0'
  private static readonly API_KEY = process.env.NEXT_PUBLIC_WEATHERBIT_API_KEY

  async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]> {
    // Weatherbit agriculture API doesn't support historical data retrieval easily
    // For historical data, we'd need to use their historical API (different endpoint)
    // For now, we'll focus on current and forecast data

    const today = new Date().toISOString().split('T')[0]
    const start = startDate || today

    // Calculate if we need historical or forecast data
    const isHistorical = new Date(start) < new Date(today)

    if (isHistorical) {
      // For historical data, return empty array or throw error
      // Weatherbit historical API requires paid plan and different endpoint
      throw new Error('Weatherbit historical data requires premium plan')
    }

    // Use agriculture forecast API
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      key: this.API_KEY || '',
      days: '8' // Weatherbit ag API provides up to 8 days
    })

    const url = `${this.BASE_URL}/forecast/agweather?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Weatherbit API key is invalid or missing')
        }
        throw new Error(`Weatherbit API error: ${response.status} ${response.statusText}`)
      }

      const data: WeatherbitResponse = await response.json()

      // Filter data based on date range
      let filteredData = data.data
      if (startDate || endDate) {
        filteredData = data.data.filter((day) => {
          const dayDate = day.datetime
          if (startDate && dayDate < startDate) return false
          if (endDate && dayDate > endDate) return false
          return true
        })
      }

      return this.parseWeatherData(data, filteredData)
    } catch (error) {
      console.error('Error fetching Weatherbit weather data:', error)
      throw error
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
    // Weatherbit hourly API is available but requires separate endpoint
    // For now, return null to indicate it's not supported in this implementation
    return null
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<WeatherData[]> {
    // Weatherbit ag API provides up to 8 days
    const maxDays = Math.min(days, 8)

    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      key: this.API_KEY || '',
      days: maxDays.toString()
    })

    const url = `${this.BASE_URL}/forecast/agweather?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Weatherbit API key is invalid or missing')
        }
        throw new Error(`Weatherbit API error: ${response.status} ${response.statusText}`)
      }

      const data: WeatherbitResponse = await response.json()
      return this.parseWeatherData(data, data.data.slice(0, maxDays))
    } catch (error) {
      console.error('Error fetching Weatherbit forecast:', error)
      throw error
    }
  }

  private parseWeatherData(
    response: WeatherbitResponse,
    days: WeatherbitDay[]
  ): WeatherData[] {
    const latitude = parseFloat(response.lat)
    const longitude = parseFloat(response.lon)

    return days.map((day) => {
      // Calculate sunshine duration from solar radiation
      // Approximate: full sun ≈ 1000 W/m² for 12 hours
      const avgSolarRad = day.solar_rad || 0
      const sunshineDuration = (avgSolarRad / 1000) * 12 // Rough estimate

      // Convert solar radiation from W/m² to MJ/m²/day
      // Daily solar energy = average W/m² * hours * 3600 seconds / 1,000,000
      // Simplified: W/m² * 0.0864 = MJ/m²/day
      const solarEnergyMJ = avgSolarRad * 0.0864

      // Calculate ETo if not provided, use simplified Penman-Monteith
      let et0 = day.evapotranspiration || 0

      if (et0 === 0) {
        // Fallback calculation if ETo not provided
        et0 = this.calculateETo(day)
      }

      return {
        date: day.datetime,
        provider: 'weatherbit' as const,

        // Temperature (°C)
        temperatureMax: day.max_temp,
        temperatureMin: day.min_temp,
        temperatureMean: day.temp,

        // Humidity (%) - Weatherbit provides average, estimate min/max
        relativeHumidityMax: Math.min(100, day.rh + 10),
        relativeHumidityMin: Math.max(0, day.rh - 10),
        relativeHumidityMean: day.rh,

        // Wind (m/s) - Weatherbit already provides in m/s
        windSpeed10m: day.wind_spd,
        windSpeedMax: day.wind_spd,

        // Precipitation (mm)
        precipitationSum: day.precip,

        // Solar radiation
        shortwaveRadiationSum: solarEnergyMJ,
        sunshineDuration: sunshineDuration,

        // Evapotranspiration
        et0FaoEvapotranspiration: et0,

        // Location context
        latitude: latitude,
        longitude: longitude,
        elevation: 0, // Weatherbit ag API doesn't provide elevation
        timezone: response.timezone
      }
    })
  }

  /**
   * Simplified ETo calculation using FAO-56 Penman-Monteith
   */
  private calculateETo(day: WeatherbitDay): number {
    const temp = day.temp
    const tempMax = day.max_temp
    const tempMin = day.min_temp
    const humidity = day.rh
    const windSpeed = day.wind_spd
    const solarRadiation = day.solar_rad * 0.0864 // Convert W/m² to MJ/m²/day

    // Saturation vapor pressure
    const es = (this.satVaporPressure(tempMax) + this.satVaporPressure(tempMin)) / 2

    // Actual vapor pressure
    const ea = es * (humidity / 100)

    // Slope of saturation vapor pressure curve
    const delta = (4098 * this.satVaporPressure(temp)) / Math.pow(temp + 237.3, 2)

    // Psychrometric constant (assuming standard atmospheric pressure)
    const gamma = 0.067

    // FAO-56 Penman-Monteith ETo calculation
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
