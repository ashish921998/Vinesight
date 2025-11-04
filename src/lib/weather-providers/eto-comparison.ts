/**
 * ETo Comparison Tool
 * Compare evapotranspiration accuracy across different weather providers
 */

import { WeatherProviderManager } from './weather-provider-manager'
import type { WeatherProvider, WeatherData } from './types'

export interface EToComparison {
  date: string
  providers: {
    [key in WeatherProvider]?: {
      eto: number
      provider: WeatherProvider
      isDirect: boolean // True if ETo comes from API, false if calculated
      dataQuality: 'excellent' | 'good' | 'fair'
    }
  }
  average: number
  standardDeviation: number
  recommendation: string
}

export class EToComparisonService {
  /**
   * Compare ETo values across all available providers
   */
  static async compareProviders(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<EToComparison> {
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Fetch data from all providers
    const providerPromises = Object.entries({
      'open-meteo': true,
      'visual-crossing': true,
      'weatherbit': true,
      'tomorrow-io': true
    } as Record<WeatherProvider, boolean>).map(async ([providerId]) => {
      try {
        const data = await WeatherProviderManager.getWeatherData(
          latitude,
          longitude,
          targetDate,
          targetDate
        )

        // Find data for target date
        const dayData = data.find(d => d.date === targetDate)
        if (!dayData) return null

        return {
          provider: providerId as WeatherProvider,
          data: dayData
        }
      } catch (error) {
        console.error(`Error fetching ${providerId}:`, error)
        return null
      }
    })

    const results = (await Promise.all(providerPromises)).filter(r => r !== null)

    // Build comparison object
    const providers: EToComparison['providers'] = {}
    const etoValues: number[] = []

    for (const result of results) {
      if (!result) continue

      const { provider, data } = result
      const eto = data.et0FaoEvapotranspiration

      // Determine if ETo is direct from API or calculated
      const isDirect = this.isDirectETo(provider)
      const dataQuality = this.getDataQuality(provider)

      providers[provider] = {
        eto,
        provider,
        isDirect,
        dataQuality
      }

      etoValues.push(eto)
    }

    // Calculate statistics
    const average = etoValues.reduce((sum, val) => sum + val, 0) / etoValues.length
    const variance =
      etoValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / etoValues.length
    const standardDeviation = Math.sqrt(variance)

    // Generate recommendation
    const recommendation = this.generateRecommendation(providers, standardDeviation)

    return {
      date: targetDate,
      providers,
      average: Math.round(average * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      recommendation
    }
  }

  /**
   * Check if provider gives direct ETo from API
   */
  private static isDirectETo(provider: WeatherProvider): boolean {
    switch (provider) {
      case 'open-meteo':
        return true // FAO-56 Penman-Monteith from API
      case 'tomorrow-io':
        return true // Direct evapotranspiration from API
      case 'weatherbit':
        return true // May provide direct ETo (agriculture API)
      case 'visual-crossing':
        return false // We calculate it client-side
      default:
        return false
    }
  }

  /**
   * Get data quality rating for each provider
   */
  private static getDataQuality(provider: WeatherProvider): 'excellent' | 'good' | 'fair' {
    switch (provider) {
      case 'open-meteo':
        return 'excellent' // FAO-56 standard, validated, complete weather model
      case 'tomorrow-io':
        return 'excellent' // Hyper-accurate, direct ETo, comprehensive data
      case 'weatherbit':
        return 'good' // Agriculture-focused, good accuracy
      case 'visual-crossing':
        return 'fair' // Calculated, estimated humidity min/max
      default:
        return 'fair'
    }
  }

  /**
   * Generate recommendation based on comparison
   */
  private static generateRecommendation(
    providers: EToComparison['providers'],
    stdDev: number
  ): string {
    const openMeteo = providers['open-meteo']
    const tomorrowIo = providers['tomorrow-io']

    // High variance between providers
    if (stdDev > 0.5) {
      return 'High variance detected between providers. Recommend using Open-Meteo (FAO-56 standard) or validating against local weather station.'
    }

    // Low variance - all providers agree
    if (stdDev < 0.2) {
      return 'All providers show good agreement. Any provider is reliable for this location.'
    }

    // Recommend best providers
    if (openMeteo && tomorrowIo) {
      const diff = Math.abs(openMeteo.eto - tomorrowIo.eto)
      if (diff < 0.3) {
        return 'Open-Meteo and Tomorrow.io show strong agreement. Recommend Open-Meteo for free unlimited use.'
      }
    }

    return 'Moderate variance between providers. Recommend Open-Meteo (FAO-56 standard) for agriculture.'
  }

  /**
   * Get the most reliable ETo value from comparison
   */
  static getBestEToValue(comparison: EToComparison): number {
    // Prioritize Open-Meteo if available (FAO-56 standard)
    if (comparison.providers['open-meteo']) {
      return comparison.providers['open-meteo'].eto
    }

    // Fall back to Tomorrow.io
    if (comparison.providers['tomorrow-io']) {
      return comparison.providers['tomorrow-io'].eto
    }

    // Otherwise use average
    return comparison.average
  }

  /**
   * Generate detailed comparison report
   */
  static generateReport(comparison: EToComparison): string {
    let report = `ETo Comparison Report - ${comparison.date}\n`
    report += `${'='.repeat(50)}\n\n`

    // Individual provider values
    report += 'Provider ETo Values:\n'
    Object.entries(comparison.providers).forEach(([provider, data]) => {
      if (!data) return
      const directIndicator = data.isDirect ? '✓ Direct' : '⚠ Calculated'
      const qualityEmoji =
        data.dataQuality === 'excellent' ? '⭐⭐⭐' : data.dataQuality === 'good' ? '⭐⭐' : '⭐'

      report += `  ${provider.padEnd(20)} ${data.eto.toFixed(2)} mm/day  ${directIndicator}  ${qualityEmoji}\n`
    })

    report += `\n`
    report += `Statistics:\n`
    report += `  Average: ${comparison.average.toFixed(2)} mm/day\n`
    report += `  Std Dev: ${comparison.standardDeviation.toFixed(2)} mm/day\n`
    report += `\n`
    report += `Recommendation:\n`
    report += `  ${comparison.recommendation}\n`

    return report
  }
}
