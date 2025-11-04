/**
 * Tomorrow.io Weather Provider
 * Hyper-accurate weather API with minute-by-minute forecasts and agricultural data
 */

import type { IWeatherProvider, WeatherData, HourlySolarData } from './types'

interface TomorrowTimeline {
  time: string
  values: {
    temperature: number
    temperatureApparent: number
    temperatureMax?: number
    temperatureMin?: number
    humidity: number
    windSpeed: number
    windDirection: number
    precipitationIntensity: number
    precipitationProbability: number
    precipitationType: number
    pressureSurfaceLevel: number
    cloudCover: number
    visibility: number
    uvIndex: number
    solarGHI?: number // Global Horizontal Irradiance (W/m²)
    solarDNI?: number // Direct Normal Irradiance (W/m²)
    evapotranspiration?: number // mm
    soilMoistureVolumetric0To10?: number // m³/m³
    soilMoistureVolumetric10To40?: number // m³/m³
    soilTemperature0To10?: number // °C
    soilTemperature10To40?: number // °C
  }
}

interface TomorrowResponse {
  data: {
    timelines: Array<{
      timestep: string
      startTime: string
      endTime: string
      intervals: TomorrowTimeline[]
    }>
  }
  location: {
    lat: number
    lon: number
    name?: string
    type?: string
  }
}

export class TomorrowIOProvider implements IWeatherProvider {
  private static readonly BASE_URL = 'https://api.tomorrow.io/v4'
  private static readonly API_KEY = process.env.NEXT_PUBLIC_TOMORROW_IO_API_KEY

  async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]> {
    const today = new Date().toISOString().split('T')[0]
    const start = startDate || today
    const end = endDate || today

    // Tomorrow.io uses ISO 8601 format with time
    const startTime = `${start}T00:00:00Z`
    const endTime = `${end}T23:59:59Z`

    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      apikey: this.API_KEY || '',
      timesteps: '1d', // Daily data
      startTime,
      endTime,
      fields: [
        'temperature',
        'temperatureMax',
        'temperatureMin',
        'humidity',
        'windSpeed',
        'precipitationIntensity',
        'precipitationProbability',
        'solarGHI',
        'solarDNI',
        'cloudCover',
        'uvIndex',
        'evapotranspiration',
        'soilMoistureVolumetric0To10',
        'soilTemperature0To10'
      ].join(','),
      units: 'metric',
      timezone: 'UTC'
    })

    const url = `${this.BASE_URL}/timelines?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Tomorrow.io API key is invalid or missing')
        }
        if (response.status === 429) {
          throw new Error('Tomorrow.io API rate limit exceeded')
        }
        throw new Error(`Tomorrow.io API error: ${response.status} ${response.statusText}`)
      }

      const data: TomorrowResponse = await response.json()
      return this.parseWeatherData(data)
    } catch (error) {
      console.error('Error fetching Tomorrow.io weather data:', error)
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
    // Tomorrow.io supports hourly data, but it requires a separate API call
    // For now, return null to keep implementation simple
    // Can be enhanced later with hourly timestep
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

  private parseWeatherData(response: TomorrowResponse): WeatherData[] {
    const timeline = response.data.timelines[0]
    if (!timeline || !timeline.intervals) {
      return []
    }

    const latitude = response.location.lat
    const longitude = response.location.lon

    return timeline.intervals.map((interval) => {
      const values = interval.values

      // Extract date from ISO timestamp
      const date = interval.time.split('T')[0]

      // Calculate temperature mean if not provided
      const tempMean =
        values.temperatureMax && values.temperatureMin
          ? (values.temperatureMax + values.temperatureMin) / 2
          : values.temperature

      // Convert solar GHI from W/m² to MJ/m²/day
      // Daily solar energy = W/m² * 86400 seconds / 1,000,000
      const solarGHI = values.solarGHI || 0
      const solarEnergyMJ = (solarGHI * 86400) / 1000000

      // Calculate sunshine duration from solar radiation
      // Approximate: full sun ≈ 1000 W/m² for 12 hours
      const sunshineDuration = (solarGHI / 1000) * 12

      // Calculate daily precipitation from intensity
      // precipitationIntensity is in mm/hr, convert to daily total
      const precipitationDaily = values.precipitationIntensity * 24

      // Use provided ETo or calculate it
      let et0 = values.evapotranspiration || 0
      if (et0 === 0) {
        et0 = this.calculateETo(values)
      }

      return {
        date,
        provider: 'tomorrow-io' as const,

        // Temperature (°C)
        temperatureMax: values.temperatureMax || values.temperature,
        temperatureMin: values.temperatureMin || values.temperature,
        temperatureMean: tempMean,

        // Humidity (%) - Tomorrow.io provides average, estimate min/max
        relativeHumidityMax: Math.min(100, values.humidity + 12),
        relativeHumidityMin: Math.max(0, values.humidity - 12),
        relativeHumidityMean: values.humidity,

        // Wind (m/s) - Tomorrow.io already provides in m/s
        windSpeed10m: values.windSpeed,
        windSpeedMax: values.windSpeed,

        // Precipitation (mm)
        precipitationSum: precipitationDaily,

        // Solar radiation
        shortwaveRadiationSum: solarEnergyMJ,
        sunshineDuration: sunshineDuration,

        // Evapotranspiration
        et0FaoEvapotranspiration: et0,

        // Location context
        latitude: latitude,
        longitude: longitude,
        elevation: 0, // Tomorrow.io doesn't provide elevation in this endpoint
        timezone: 'UTC'
      }
    })
  }

  /**
   * Calculate ETo using simplified FAO-56 Penman-Monteith
   */
  private calculateETo(values: TomorrowTimeline['values']): number {
    const tempMax = values.temperatureMax || values.temperature
    const tempMin = values.temperatureMin || values.temperature
    const temp = (tempMax + tempMin) / 2
    const humidity = values.humidity
    const windSpeed = values.windSpeed
    const solarGHI = values.solarGHI || 0
    const solarRadiation = (solarGHI * 86400) / 1000000 // Convert W/m² to MJ/m²/day

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
