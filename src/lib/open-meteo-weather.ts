/**
 * Open-Meteo Weather Service using Official SDK
 * Provides accurate ET0 and weather data for agricultural calculations
 */

import { fetchWeatherApi } from 'openmeteo'

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

  // Direct ET0 from Open-Meteo (FAO Penman-Monteith)
  et0FaoEvapotranspiration: number // mm/day

  // Hourly ET0 data for more precise calculations
  hourlyEt0?: number[] // mm/hour

  // Location context
  latitude: number
  longitude: number
  elevation: number
  timezone: string
}

export class OpenMeteoWeatherService {
  private static readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast'

  /**
   * Fetch weather data from Open-Meteo API using official SDK
   */
  static async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<OpenMeteoWeatherData[]> {
    // Default to today if no dates provided
    const today = new Date()
    const start = startDate || today.toISOString().split('T')[0]
    const end = endDate || today.toISOString().split('T')[0]

    try {
      // Calculate forecast days
      const startDateObj = new Date(start)
      const endDateObj = new Date(end)
      const forecastDays =
        Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Parameters for comprehensive weather data including ET0
      const params = {
        latitude: latitude,
        longitude: longitude,
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
        ],
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'wind_speed_10m',
          'direct_radiation',
          'diffuse_radiation',
          'global_tilted_irradiance',
          'evapotranspiration',
          'et0_fao_evapotranspiration'
        ],
        timezone: 'auto',
        forecast_days: forecastDays
      }

      const url = 'https://api.open-meteo.com/v1/forecast'
      const responses = await fetchWeatherApi(url, params)

      // Process first location
      const response = responses[0]

      // Get location and timezone information
      const responseLatitude = response.latitude()
      const responseLongitude = response.longitude()
      const elevation = response.elevation()
      const timezone = response.timezone()
      const timezoneAbbreviation = response.timezoneAbbreviation()
      const utcOffsetSeconds = response.utcOffsetSeconds()

      console.log(
        `\nCoordinates: ${responseLatitude}°N ${responseLongitude}°E`,
        `\nElevation: ${elevation}m asl`,
        `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
        `\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`
      )

      const hourly = response.hourly()!
      const daily = response.daily()!

      // Process daily data
      const dailyData = {
        time: Array.from(
          { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
          (_, i) =>
            new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
        ),
        temperature_2m_max: daily.variables(0)!.valuesArray(),
        temperature_2m_min: daily.variables(1)!.valuesArray(),
        temperature_2m_mean: daily.variables(2)!.valuesArray(),
        relative_humidity_2m_max: daily.variables(3)!.valuesArray(),
        relative_humidity_2m_min: daily.variables(4)!.valuesArray(),
        relative_humidity_2m_mean: daily.variables(5)!.valuesArray(),
        wind_speed_10m_max: daily.variables(6)!.valuesArray(),
        precipitation_sum: daily.variables(7)!.valuesArray(),
        shortwave_radiation_sum: daily.variables(8)!.valuesArray(),
        sunshine_duration: daily.variables(9)!.valuesArray(),
        et0_fao_evapotranspiration: daily.variables(10)!.valuesArray()
      }

      // Process hourly data for more precise ET0
      const hourlyData = {
        time: Array.from(
          { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
          (_, i) =>
            new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
        ),
        temperature_2m: hourly.variables(0)!.valuesArray(),
        relative_humidity_2m: hourly.variables(1)!.valuesArray(),
        wind_speed_10m: hourly.variables(2)!.valuesArray(),
        direct_radiation: hourly.variables(3)!.valuesArray(),
        diffuse_radiation: hourly.variables(4)!.valuesArray(),
        global_tilted_irradiance: hourly.variables(5)!.valuesArray(),
        evapotranspiration: hourly.variables(6)!.valuesArray(),
        et0_fao_evapotranspiration: hourly.variables(7)!.valuesArray()
      }

      console.log('\nDaily data:\n', dailyData)
      console.log('\nHourly data:\n', hourlyData)

      // Convert to our format
      const result: OpenMeteoWeatherData[] = []

      for (let i = 0; i < dailyData.time.length; i++) {
        // Convert shortwave radiation from Wh/m² to MJ/m²/day
        const shortwaveWh = dailyData.shortwave_radiation_sum?.[i] || 0
        const shortwave_MJ = this.convertWhToMJ(shortwaveWh)

        // Convert sunshine duration from seconds to hours
        const sunshineDurationHours = (dailyData.sunshine_duration?.[i] || 0) / 3600

        // Get hourly ET0 data for this day (24 hours)
        const hourlyEt0Array = Array.from(hourlyData.et0_fao_evapotranspiration || [])
        const hourlyEt0ForDay = hourlyEt0Array.slice(
          i * 24,
          Math.min((i + 1) * 24, hourlyEt0Array.length)
        )

        result.push({
          date: dailyData.time[i].toISOString().split('T')[0],

          // Temperature (°C)
          temperatureMax: dailyData.temperature_2m_max?.[i] || 0,
          temperatureMin: dailyData.temperature_2m_min?.[i] || 0,
          temperatureMean: dailyData.temperature_2m_mean?.[i] || 0,

          // Humidity (%)
          relativeHumidityMax: dailyData.relative_humidity_2m_max?.[i] || 0,
          relativeHumidityMin: dailyData.relative_humidity_2m_min?.[i] || 0,
          relativeHumidityMean: dailyData.relative_humidity_2m_mean?.[i] || 0,

          // Wind (m/s)
          windSpeed10m: dailyData.wind_speed_10m_max?.[i] || 0,
          windSpeedMax: dailyData.wind_speed_10m_max?.[i] || 0,

          // Precipitation (mm)
          precipitationSum: dailyData.precipitation_sum?.[i] || 0,

          // Solar data
          shortwaveRadiationSum: shortwave_MJ,
          sunshineDuration: sunshineDurationHours,

          // Direct ET0 from Open-Meteo (FAO Penman-Monteith)
          et0FaoEvapotranspiration: dailyData.et0_fao_evapotranspiration?.[i] || 0,

          // Hourly ET0 data for more precise analysis
          hourlyEt0: hourlyEt0ForDay,

          // Location context
          latitude: responseLatitude,
          longitude: responseLongitude,
          elevation: elevation || 0,
          timezone: timezone || 'UTC'
        })
      }

      return result
    } catch (error) {
      console.error('Error fetching Open-Meteo weather data:', error)
      throw new Error(
        `Failed to fetch weather data from Open-Meteo API: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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

    try {
      const params = {
        latitude,
        longitude,
        hourly: ['shortwave_radiation', 'direct_radiation', 'diffuse_radiation'],
        timezone: 'auto',
        start_date: targetDate,
        end_date: targetDate
      }

      const url = 'https://api.open-meteo.com/v1/forecast'
      const responses = await fetchWeatherApi(url, params)
      const response = responses[0]
      const hourly = response.hourly()!

      // Get radiation data
      const shortwaveRadiationArray = Array.from(hourly.variables(0)!.valuesArray() || [])
      const directRadiation = hourly.variables(1)!.valuesArray()
      const diffuseRadiation = hourly.variables(2)!.valuesArray()

      // Convert W/m² to lux (approximate conversion: 1 W/m² ≈ 110 lux for solar radiation)
      const hourlyLux = shortwaveRadiationArray.map(
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
    const percentageError = openMeteoETo !== 0 ? (difference / openMeteoETo) * 100 : 0
    const isAccurate = Math.abs(percentageError) <= 5 // 5% tolerance

    return {
      difference: Number(difference.toFixed(2)),
      percentageError: Number(percentageError.toFixed(1)),
      isAccurate
    }
  }

  /**
   * Get detailed ET0 analysis comparing our calculation with Open-Meteo
   */
  static getET0Analysis(
    ourETo: number,
    openMeteoData: OpenMeteoWeatherData
  ): {
    ourETo: number
    openMeteoETo: number
    difference: number
    percentageError: number
    isAccurate: boolean
    hourlyEt0Data?: number[]
    recommendation: string
  } {
    const openMeteoETo = openMeteoData.et0FaoEvapotranspiration
    const validation = this.validateEToDifference(ourETo, openMeteoETo)

    let recommendation = ''
    if (validation.isAccurate) {
      recommendation = 'Our calculation is accurate within 5% of Open-Meteo FAO Penman-Monteith'
    } else if (validation.percentageError > 0) {
      recommendation =
        'Our calculation is higher than Open-Meteo - consider checking radiation inputs'
    } else {
      recommendation =
        'Our calculation is lower than Open-Meteo - consider checking wind/humidity inputs'
    }

    return {
      ourETo: Number(ourETo.toFixed(2)),
      openMeteoETo: Number(openMeteoETo.toFixed(2)),
      difference: validation.difference,
      percentageError: validation.percentageError,
      isAccurate: validation.isAccurate,
      hourlyEt0Data: openMeteoData.hourlyEt0,
      recommendation
    }
  }
}
