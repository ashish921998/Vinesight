/**
 * Open-Meteo Weather Provider Adapter
 * Wraps the existing OpenMeteoWeatherService to conform to the common interface
 */

import { OpenMeteoWeatherService } from '../open-meteo-weather'
import type { IWeatherProvider, WeatherData, HourlySolarData } from './types'

export class OpenMeteoProvider implements IWeatherProvider {
  async getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]> {
    const data = await OpenMeteoWeatherService.getWeatherData(
      latitude,
      longitude,
      startDate,
      endDate
    )

    return data.map((d) => ({
      ...d,
      provider: 'open-meteo' as const
    }))
  }

  async getCurrentWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    const data = await OpenMeteoWeatherService.getCurrentWeatherData(latitude, longitude)
    return {
      ...data,
      provider: 'open-meteo' as const
    }
  }

  async getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<HourlySolarData | null> {
    return await OpenMeteoWeatherService.getHourlySolarRadiation(latitude, longitude, date)
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<WeatherData[]> {
    const data = await OpenMeteoWeatherService.getWeatherForecast(latitude, longitude, days)
    return data.map((d) => ({
      ...d,
      provider: 'open-meteo' as const
    }))
  }
}
