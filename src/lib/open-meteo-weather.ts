/**
 * Open-Meteo Weather Service for Agricultural ETo Calculations
 * Provides all necessary weather parameters for accurate evapotranspiration calculations
 */

export interface OpenMeteoWeatherData {
  date: string

  // Temperature data (°C)
  temperatureMax: number
  temperatureMin: number
  temperatureMean: number

  // Humidity data (%)
  relativeHumidityMax: number
  relativeHumidityMin: number
  relativeHumidityMean: number

  // Wind data (m/s)
  windSpeed10m: number
  windSpeedMax: number

  // Precipitation (mm)
  precipitationSum: number

  // Solar radiation data
  shortwaveRadiationSum: number // MJ/m²/day (converted from Wh/m²)
  sunshineDuration: number // seconds (converted to hours)

  // Direct ETo from Open-Meteo (for validation)
  et0FaoEvapotranspiration: number // mm

  // Location context
  latitude: number
  longitude: number
  elevation: number
  timezone: string
}

export interface OpenMeteoForecastResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    temperature_2m_mean: number[]
    relative_humidity_2m_max: number[]
    relative_humidity_2m_min: number[]
    relative_humidity_2m_mean: number[]
    wind_speed_10m_max: number[]
    precipitation_sum: number[]
    shortwave_radiation_sum: number[] // Wh/m²
    sunshine_duration: number[] // seconds
    et0_fao_evapotranspiration: number[] // mm
  }
  daily_units: {
    [key: string]: string
  }
}

export interface OpenMeteoApiResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  daily_units: {
    [key: string]: string
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    temperature_2m_mean: number[]
    relative_humidity_2m_max: number[]
    relative_humidity_2m_min: number[]
    relative_humidity_2m_mean: number[]
    wind_speed_10m_max: number[]
    precipitation_sum: number[]
    shortwave_radiation_sum: number[]
    sunshine_duration: number[]
    et0_fao_evapotranspiration: number[]
  }
}

export class OpenMeteoWeatherService {
  private static readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast'

  /**
   * Fetch weather data from Open-Meteo API for ETo calculations
   */
  static async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<OpenMeteoWeatherData[]> {
    // Default to today if no dates provided
    const today = new Date().toISOString().split('T')[0]
    const start = startDate || today
    const end = endDate || today

    // Parameters needed for ETo calculation
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'relative_humidity_2m_max',
        'relative_humidity_2m_min',
        'relative_humidity_2m_mean',
        'wind_speed_10m_max',
        'precipitation_sum',
        'shortwave_radiation_sum',
        'sunshine_duration',
        'et0_fao_evapotranspiration'
      ].join(','),
      timezone: 'auto',
      start_date: start,
      end_date: end
    })

    const url = `${this.BASE_URL}?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
      }

      const data: OpenMeteoApiResponse = await response.json()
      return this.parseWeatherData(data)
    } catch (error) {
      console.error('Error fetching Open-Meteo weather data:', error)
      throw new Error('Failed to fetch weather data from Open-Meteo API')
    }
  }

  /**
   * Get current weather data for today
   */
  static async getCurrentWeatherData(
    latitude: number,
    longitude: number
  ): Promise<OpenMeteoWeatherData> {
    const weatherData = await this.getWeatherData(latitude, longitude)
    return weatherData[0] // Return today's data
  }

  /**
   * Parse Open-Meteo API response into our format
   */
  private static parseWeatherData(data: OpenMeteoApiResponse): OpenMeteoWeatherData[] {
    const daily = data.daily
    const result: OpenMeteoWeatherData[] = []

    for (let i = 0; i < daily.time.length; i++) {
      // Convert shortwave radiation from Wh/m² to MJ/m²/day
      const shortwaveWh = daily.shortwave_radiation_sum[i] || 0
      const shortwave_MJ = this.convertWhToMJ(shortwaveWh)

      // Convert sunshine duration from seconds to hours
      const sunshineDurationHours = (daily.sunshine_duration[i] || 0) / 3600

      result.push({
        date: daily.time[i],

        // Temperature (°C)
        temperatureMax: daily.temperature_2m_max[i] || 0,
        temperatureMin: daily.temperature_2m_min[i] || 0,
        temperatureMean: daily.temperature_2m_mean[i] || 0,

        // Humidity (%)
        relativeHumidityMax: daily.relative_humidity_2m_max[i] || 0,
        relativeHumidityMin: daily.relative_humidity_2m_min[i] || 0,
        relativeHumidityMean: daily.relative_humidity_2m_mean[i] || 0,

        // Wind (m/s) - Open-Meteo provides in km/h by default, convert to m/s
        windSpeed10m: this.convertKmhToMs(daily.wind_speed_10m_max[i] || 0),
        windSpeedMax: this.convertKmhToMs(daily.wind_speed_10m_max[i] || 0),

        // Precipitation (mm)
        precipitationSum: daily.precipitation_sum[i] || 0,

        // Solar data
        shortwaveRadiationSum: shortwave_MJ,
        sunshineDuration: sunshineDurationHours,

        // Direct ETo from Open-Meteo
        et0FaoEvapotranspiration: daily.et0_fao_evapotranspiration[i] || 0,

        // Location context
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        timezone: data.timezone
      })
    }

    return result
  }

  /**
   * Convert shortwave radiation from Wh/m² to MJ/m²/day
   */
  private static convertWhToMJ(whPerSqM: number): number {
    // 1 Wh/m² = 0.0036 MJ/m²
    return whPerSqM * 0.0036
  }

  /**
   * Convert wind speed from km/h to m/s
   */
  private static convertKmhToMs(kmh: number): number {
    return kmh / 3.6
  }

  /**
   * Convert Open-Meteo weather data to our ETo calculator format
   */
  static convertToETcWeatherData(openMeteoData: OpenMeteoWeatherData): {
    date: string
    temperatureMax: number
    temperatureMin: number
    humidity: number
    windSpeed: number
    rainfall: number
    solarRadiation: number
    sunshineHours: number
  } {
    return {
      date: openMeteoData.date,
      temperatureMax: openMeteoData.temperatureMax,
      temperatureMin: openMeteoData.temperatureMin,
      // Use mean humidity for ETo calculation
      humidity: openMeteoData.relativeHumidityMean,
      windSpeed: openMeteoData.windSpeed10m,
      rainfall: openMeteoData.precipitationSum,
      solarRadiation: openMeteoData.shortwaveRadiationSum,
      sunshineHours: openMeteoData.sunshineDuration
    }
  }

  /**
   * Get weather forecast for multiple days
   */
  static async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<OpenMeteoWeatherData[]> {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)

    const startDateStr = today.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    return this.getWeatherData(latitude, longitude, startDateStr, endDateStr)
  }

  /**
   * Get hourly solar radiation data for accurate lux calculations
   */
  static async getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<{
    minLux: number
    maxLux: number
    avgLux: number
    hourlyLux: number[]
  } | null> {
    const targetDate = date || new Date().toISOString().split('T')[0]

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'shortwave_radiation',
      timezone: 'auto',
      start_date: targetDate,
      end_date: targetDate
    })

    const url = `${this.BASE_URL}?${params}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.hourly?.shortwave_radiation) {
        return null
      }

      // Convert W/m² to lux (approximate conversion: 1 W/m² ≈ 110 lux for solar radiation)
      const hourlyLux = data.hourly.shortwave_radiation.map(
        (wPerSqM: number) => wPerSqM * 110 // Standard conversion factor for solar radiation
      )

      // Filter out nighttime values (0 lux) for average calculation
      const daylightLux = hourlyLux.filter((lux: number) => lux > 0)

      return {
        minLux: Math.min(...hourlyLux), // Will be 0 (nighttime)
        maxLux: Math.max(...hourlyLux), // Peak daylight
        avgLux:
          daylightLux.length > 0
            ? daylightLux.reduce((sum: number, lux: number) => sum + lux, 0) / daylightLux.length
            : 0,
        hourlyLux
      }
    } catch (error) {
      console.error('Error fetching hourly solar radiation:', error)
      return null
    }
  }

  /**
   * Validate our ETo calculation against Open-Meteo's result
   */
  static validateEToDifference(
    ourETo: number,
    openMeteoETo: number
  ): {
    difference: number
    percentageError: number
    isAccurate: boolean
  } {
    const difference = ourETo - openMeteoETo
    const percentageError = (difference / openMeteoETo) * 100
    const isAccurate = Math.abs(percentageError) <= 5 // 5% tolerance

    return {
      difference: Number(difference.toFixed(2)),
      percentageError: Number(percentageError.toFixed(1)),
      isAccurate
    }
  }
}
