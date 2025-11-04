/**
 * Common Weather Provider Interface
 * All weather providers must implement this interface
 */

export type WeatherProvider = 'open-meteo' | 'visual-crossing' | 'weatherbit'

export interface WeatherData {
  date: string
  provider: WeatherProvider

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
  shortwaveRadiationSum: number // MJ/m²/day
  sunshineDuration: number // hours

  // Reference Evapotranspiration (ETo)
  et0FaoEvapotranspiration: number // mm/day

  // Location context
  latitude: number
  longitude: number
  elevation: number
  timezone: string
}

export interface HourlySolarData {
  minLux: number
  maxLux: number
  avgLux: number
  hourlyLux: number[]
}

export interface IWeatherProvider {
  /**
   * Get weather data for a date range
   */
  getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]>

  /**
   * Get current weather data for today
   */
  getCurrentWeatherData(latitude: number, longitude: number): Promise<WeatherData>

  /**
   * Get hourly solar radiation data (if supported)
   */
  getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<HourlySolarData | null>

  /**
   * Get weather forecast for multiple days
   */
  getWeatherForecast(
    latitude: number,
    longitude: number,
    days?: number
  ): Promise<WeatherData[]>
}

export interface WeatherProviderInfo {
  id: WeatherProvider
  name: string
  description: string
  features: string[]
  isFree: boolean
  requiresApiKey: boolean
}

export const WEATHER_PROVIDERS: Record<WeatherProvider, WeatherProviderInfo> = {
  'open-meteo': {
    id: 'open-meteo',
    name: 'Open-Meteo',
    description: 'Free, open-source weather API with excellent agricultural data',
    features: [
      'FAO-56 Penman-Monteith ETo',
      'Solar radiation',
      'Free forever',
      'No API key needed',
      'Historical data from 1940'
    ],
    isFree: true,
    requiresApiKey: false
  },
  'visual-crossing': {
    id: 'visual-crossing',
    name: 'Visual Crossing',
    description: 'Premium weather API optimized for agriculture with 50 years of historical data',
    features: [
      'Pre-calculated ETo',
      'High accuracy',
      '50 years historical data',
      'Growing degree days',
      'Free tier: 1000 calls/day'
    ],
    isFree: false,
    requiresApiKey: true
  },
  'weatherbit': {
    id: 'weatherbit',
    name: 'Weatherbit Agriculture',
    description: 'Dedicated agriculture API with soil data and 8-day forecasts',
    features: [
      'Soil temperature & moisture',
      '8-day agriculture forecast',
      'ETo calculations',
      'Free tier: 500 calls/day',
      'Affordable paid plans'
    ],
    isFree: false,
    requiresApiKey: true
  }
}
