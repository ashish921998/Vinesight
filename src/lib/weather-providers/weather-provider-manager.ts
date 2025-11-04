/**
 * Weather Provider Manager
 * Manages switching between different weather providers and stores user preferences
 */

import type { IWeatherProvider, WeatherProvider, WeatherData, HourlySolarData } from './types'
import { OpenMeteoProvider } from './open-meteo-provider'
import { VisualCrossingProvider } from './visual-crossing-provider'

export class WeatherProviderManager {
  private static providers: Map<WeatherProvider, IWeatherProvider> = new Map([
    ['open-meteo', new OpenMeteoProvider()],
    ['visual-crossing', new VisualCrossingProvider()]
  ])

  private static defaultProvider: WeatherProvider = 'open-meteo'

  /**
   * Get the active weather provider for a farm
   */
  static getProvider(farmId?: number): IWeatherProvider {
    const providerId = this.getActiveProviderId(farmId)
    const provider = this.providers.get(providerId)

    if (!provider) {
      throw new Error(`Weather provider '${providerId}' not found`)
    }

    return provider
  }

  /**
   * Get the active provider ID for a farm
   */
  static getActiveProviderId(farmId?: number): WeatherProvider {
    if (farmId) {
      // Try to get farm-specific preference from localStorage
      const stored = localStorage.getItem(`weather-provider-${farmId}`)
      if (stored && this.isValidProvider(stored)) {
        return stored as WeatherProvider
      }
    }

    // Fall back to global preference
    const globalPref = localStorage.getItem('weather-provider-global')
    if (globalPref && this.isValidProvider(globalPref)) {
      return globalPref as WeatherProvider
    }

    return this.defaultProvider
  }

  /**
   * Set the weather provider preference for a farm
   */
  static setProviderPreference(providerId: WeatherProvider, farmId?: number): void {
    if (!this.isValidProvider(providerId)) {
      throw new Error(`Invalid weather provider: ${providerId}`)
    }

    if (farmId) {
      localStorage.setItem(`weather-provider-${farmId}`, providerId)
    } else {
      localStorage.setItem('weather-provider-global', providerId)
    }
  }

  /**
   * Check if a provider ID is valid
   */
  private static isValidProvider(providerId: string): boolean {
    return this.providers.has(providerId as WeatherProvider)
  }

  /**
   * Get weather data using the active provider
   */
  static async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
    farmId?: number
  ): Promise<WeatherData[]> {
    const provider = this.getProvider(farmId)
    return await provider.getWeatherData(latitude, longitude, startDate, endDate)
  }

  /**
   * Get current weather data using the active provider
   */
  static async getCurrentWeatherData(
    latitude: number,
    longitude: number,
    farmId?: number
  ): Promise<WeatherData> {
    const provider = this.getProvider(farmId)
    return await provider.getCurrentWeatherData(latitude, longitude)
  }

  /**
   * Get hourly solar radiation data using the active provider
   */
  static async getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string,
    farmId?: number
  ): Promise<HourlySolarData | null> {
    const provider = this.getProvider(farmId)
    return await provider.getHourlySolarRadiation(latitude, longitude, date)
  }

  /**
   * Get weather forecast using the active provider
   */
  static async getWeatherForecast(
    latitude: number,
    longitude: number,
    days?: number,
    farmId?: number
  ): Promise<WeatherData[]> {
    const provider = this.getProvider(farmId)
    return await provider.getWeatherForecast(latitude, longitude, days)
  }

  /**
   * Compare data from both providers (useful for testing accuracy)
   */
  static async compareProviders(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<{
    openMeteo: WeatherData
    visualCrossing: WeatherData
    differences: {
      temperatureDiff: number
      humidityDiff: number
      precipitationDiff: number
      etoDiff: number
    }
  }> {
    const [openMeteoData, visualCrossingData] = await Promise.all([
      this.providers.get('open-meteo')!.getWeatherData(latitude, longitude, date, date),
      this.providers.get('visual-crossing')!.getWeatherData(latitude, longitude, date, date)
    ])

    const om = openMeteoData[0]
    const vc = visualCrossingData[0]

    return {
      openMeteo: om,
      visualCrossing: vc,
      differences: {
        temperatureDiff: Math.abs(om.temperatureMean - vc.temperatureMean),
        humidityDiff: Math.abs(om.relativeHumidityMean - vc.relativeHumidityMean),
        precipitationDiff: Math.abs(om.precipitationSum - vc.precipitationSum),
        etoDiff: Math.abs(om.et0FaoEvapotranspiration - vc.et0FaoEvapotranspiration)
      }
    }
  }
}
