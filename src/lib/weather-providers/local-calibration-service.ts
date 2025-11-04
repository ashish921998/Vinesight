/**
 * Local Calibration Service
 * Validates weather API data against local weather stations
 * and applies correction factors for improved accuracy
 */

import type { WeatherProvider, WeatherData } from './types'
import { WeatherProviderManager } from './weather-provider-manager'

export interface StationData {
  date: string
  referenceET: number // mm/day from local station
  temperature: number // °C
  humidity: number // %
  windSpeed: number // m/s
  solarRadiation: number // MJ/m²/day
  source: string // Station name/ID
}

export interface ValidationResult {
  date: string
  apiETo: number
  stationETo: number
  error: number // apiETo - stationETo
  errorPercent: number
  provider: WeatherProvider
}

export interface ValidationStats {
  provider: WeatherProvider
  meanBias: number // Average error (mm/day)
  meanBiasPercent: number // Average error (%)
  rmse: number // Root Mean Square Error
  mae: number // Mean Absolute Error
  r2: number // Coefficient of determination
  sampleSize: number
  recommendation: string
}

export interface CorrectionFactor {
  region: string
  irrigationType: 'drip' | 'sprinkler' | 'flood' | 'rainfed'
  cropType: 'grapes' | 'other'
  season: 'summer' | 'monsoon' | 'winter'
  correctionFactor: number // Multiply API ETo by this
  confidence: 'high' | 'medium' | 'low'
  sampleSize: number
  validationPeriod: string
  notes?: string
}

export class LocalCalibrationService {
  /**
   * Validate weather API against local station data
   */
  static async validateProvider(
    provider: WeatherProvider,
    stationData: StationData[],
    latitude: number,
    longitude: number
  ): Promise<ValidationStats> {
    const results: ValidationResult[] = []

    // Fetch API data for each station observation
    for (const stationDay of stationData) {
      try {
        const apiData = await WeatherProviderManager.getWeatherData(
          latitude,
          longitude,
          stationDay.date,
          stationDay.date,
          undefined // Use specified provider
        )

        if (apiData.length === 0) continue

        const apiETo = apiData[0].et0FaoEvapotranspiration
        const stationETo = stationDay.referenceET

        results.push({
          date: stationDay.date,
          apiETo,
          stationETo,
          error: apiETo - stationETo,
          errorPercent: ((apiETo - stationETo) / stationETo) * 100,
          provider
        })
      } catch (error) {
        console.error(`Error fetching API data for ${stationDay.date}:`, error)
      }
    }

    return this.calculateStatistics(results, provider)
  }

  /**
   * Calculate validation statistics
   */
  private static calculateStatistics(
    results: ValidationResult[],
    provider: WeatherProvider
  ): ValidationStats {
    const n = results.length
    if (n === 0) {
      throw new Error('No valid comparison data available')
    }

    const errors = results.map((r) => r.error)
    const errorPercents = results.map((r) => r.errorPercent)

    // Mean bias
    const meanBias = errors.reduce((sum, e) => sum + e, 0) / n

    // Mean bias percentage
    const meanBiasPercent = errorPercents.reduce((sum, e) => sum + e, 0) / n

    // Root Mean Square Error
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n)

    // Mean Absolute Error
    const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / n

    // Coefficient of Determination (R²)
    const stationMean = results.reduce((sum, r) => sum + r.stationETo, 0) / n
    const ssTotal = results.reduce((sum, r) => sum + Math.pow(r.stationETo - stationMean, 2), 0)
    const ssResidual = results.reduce((sum, r) => sum + Math.pow(r.error, 2), 0)
    const r2 = 1 - ssResidual / ssTotal

    // Generate recommendation
    const recommendation = this.generateRecommendation(meanBiasPercent, rmse, r2, provider)

    return {
      provider,
      meanBias: Math.round(meanBias * 100) / 100,
      meanBiasPercent: Math.round(meanBiasPercent * 10) / 10,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      r2: Math.round(r2 * 1000) / 1000,
      sampleSize: n,
      recommendation
    }
  }

  /**
   * Generate recommendation based on validation results
   */
  private static generateRecommendation(
    meanBiasPercent: number,
    rmse: number,
    r2: number,
    provider: WeatherProvider
  ): string {
    const absPercent = Math.abs(meanBiasPercent)

    if (absPercent < 5 && rmse < 0.5 && r2 > 0.95) {
      return `Excellent accuracy! ${provider} matches local station very well. Use without correction.`
    }

    if (absPercent < 10 && rmse < 1.0 && r2 > 0.90) {
      return `Good accuracy. ${provider} shows ${meanBiasPercent > 0 ? 'slight overestimation' : 'slight underestimation'} of ${absPercent.toFixed(1)}%. Consider applying correction factor.`
    }

    if (absPercent < 20 && rmse < 1.5 && r2 > 0.80) {
      return `Moderate accuracy. ${provider} ${meanBiasPercent > 0 ? 'overestimates' : 'underestimates'} by ${absPercent.toFixed(1)}%. Correction factor recommended for precision irrigation.`
    }

    return `Lower accuracy detected. ${provider} ${meanBiasPercent > 0 ? 'overestimates' : 'underestimates'} by ${absPercent.toFixed(1)}%. Strong recommendation to use local station or apply correction factor.`
  }

  /**
   * Calculate correction factor from validation results
   */
  static calculateCorrectionFactor(validationStats: ValidationStats): number {
    // Correction factor to multiply API ETo by
    // If API overestimates by 15%, factor = 1 / 1.15 = 0.87
    const avgRatio = 1 + validationStats.meanBiasPercent / 100
    const correctionFactor = 1 / avgRatio
    return Math.round(correctionFactor * 1000) / 1000
  }

  /**
   * Apply correction to API ETo value
   */
  static applyCorrectedETo(apiETo: number, correctionFactor: number): number {
    return Math.round(apiETo * correctionFactor * 100) / 100
  }

  /**
   * Get correction factor for a specific region and conditions
   */
  static getCorrectionFactor(
    region: string,
    irrigationType: string,
    cropType: string,
    season: string,
    correctionDatabase: CorrectionFactor[]
  ): CorrectionFactor | null {
    // Find exact match
    const exactMatch = correctionDatabase.find(
      (cf) =>
        cf.region === region &&
        cf.irrigationType === irrigationType &&
        cf.cropType === cropType &&
        cf.season === season
    )

    if (exactMatch) return exactMatch

    // Find partial matches (same region and crop)
    const partialMatch = correctionDatabase.find(
      (cf) => cf.region === region && cf.cropType === cropType
    )

    return partialMatch || null
  }

  /**
   * Generate validation report
   */
  static generateValidationReport(stats: ValidationStats): string {
    let report = `Validation Report: ${stats.provider}\n`
    report += `${'='.repeat(50)}\n\n`

    report += `Sample Size: ${stats.sampleSize} days\n`
    report += `\n`

    report += `Accuracy Metrics:\n`
    report += `  Mean Bias:     ${stats.meanBias >= 0 ? '+' : ''}${stats.meanBias.toFixed(2)} mm/day (${stats.meanBias >= 0 ? '+' : ''}${stats.meanBiasPercent.toFixed(1)}%)\n`
    report += `  RMSE:          ${stats.rmse.toFixed(2)} mm/day\n`
    report += `  MAE:           ${stats.mae.toFixed(2)} mm/day\n`
    report += `  R²:            ${stats.r2.toFixed(3)}\n`
    report += `\n`

    // Interpretation
    report += `Interpretation:\n`
    if (stats.meanBias > 0) {
      report += `  ⚠️  API OVERESTIMATES ETo by average ${stats.meanBias.toFixed(2)} mm/day\n`
      report += `  💧 Risk of over-irrigation if used without correction\n`
    } else {
      report += `  ⚠️  API UNDERESTIMATES ETo by average ${Math.abs(stats.meanBias).toFixed(2)} mm/day\n`
      report += `  🌱 Risk of crop water stress if used without correction\n`
    }
    report += `\n`

    // Correction factor
    const correctionFactor = this.calculateCorrectionFactor(stats)
    report += `Recommended Correction Factor: ${correctionFactor.toFixed(3)}\n`
    report += `  Usage: correctedETo = apiETo × ${correctionFactor.toFixed(3)}\n`
    report += `\n`

    // Example
    const exampleAPI = 5.5
    const exampleCorrected = this.applyCorrectedETo(exampleAPI, correctionFactor)
    report += `Example:\n`
    report += `  API ETo:       ${exampleAPI.toFixed(1)} mm/day\n`
    report += `  Corrected ETo: ${exampleCorrected.toFixed(1)} mm/day\n`
    report += `\n`

    report += `Recommendation:\n`
    report += `  ${stats.recommendation}\n`

    return report
  }

  /**
   * Compare multiple providers against station data
   */
  static async compareProviders(
    providers: WeatherProvider[],
    stationData: StationData[],
    latitude: number,
    longitude: number
  ): Promise<{
    validations: ValidationStats[]
    bestProvider: WeatherProvider
    report: string
  }> {
    const validations = await Promise.all(
      providers.map((provider) => this.validateProvider(provider, stationData, latitude, longitude))
    )

    // Find best provider (lowest RMSE)
    const bestProvider = validations.reduce((best, current) =>
      current.rmse < best.rmse ? current : best
    ).provider

    // Generate comparison report
    let report = `Weather Provider Comparison\n`
    report += `${'='.repeat(70)}\n\n`

    report += `Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E\n`
    report += `Station Data: ${stationData.length} days\n`
    report += `\n`

    report += `Results:\n`
    report += `┌──────────────────┬──────────┬──────────┬─────────┬─────────┐\n`
    report += `│ Provider         │ Bias (%) │ RMSE     │ R²      │ Rating  │\n`
    report += `├──────────────────┼──────────┼──────────┼─────────┼─────────┤\n`

    for (const v of validations) {
      const bias = v.meanBiasPercent >= 0 ? `+${v.meanBiasPercent.toFixed(1)}` : v.meanBiasPercent.toFixed(1)
      const rating = this.getRating(v.rmse, v.r2)
      const isBest = v.provider === bestProvider ? ' ⭐' : '   '

      report += `│ ${v.provider.padEnd(16)} │ ${bias.padStart(8)} │ ${v.rmse.toFixed(2).padStart(8)} │ ${v.r2.toFixed(3).padStart(7)} │ ${rating}${isBest} │\n`
    }

    report += `└──────────────────┴──────────┴──────────┴─────────┴─────────┘\n`
    report += `\n`

    report += `Best Provider: ${bestProvider} ⭐\n`
    report += `\n`

    report += `Recommendations by Use Case:\n`
    report += this.getUseCaseRecommendations(validations)

    return {
      validations,
      bestProvider,
      report
    }
  }

  /**
   * Get star rating based on RMSE and R²
   */
  private static getRating(rmse: number, r2: number): string {
    if (rmse < 0.5 && r2 > 0.95) return '⭐⭐⭐⭐⭐'
    if (rmse < 1.0 && r2 > 0.90) return '⭐⭐⭐⭐ '
    if (rmse < 1.5 && r2 > 0.80) return '⭐⭐⭐  '
    if (rmse < 2.0 && r2 > 0.70) return '⭐⭐   '
    return '⭐    '
  }

  /**
   * Generate use case recommendations
   */
  private static getUseCaseRecommendations(validations: ValidationStats[]): string {
    let rec = ''

    // Find best free provider
    const freeProviders = validations.filter((v) => v.provider === 'open-meteo')
    if (freeProviders.length > 0) {
      rec += `  • Free Option: Use ${freeProviders[0].provider} (RMSE: ${freeProviders[0].rmse.toFixed(2)} mm/day)\n`
    }

    // Find best overall
    const best = validations.reduce((b, c) => (c.rmse < b.rmse ? c : b))
    rec += `  • Best Accuracy: Use ${best.provider} (RMSE: ${best.rmse.toFixed(2)} mm/day)\n`

    // Precision irrigation
    const precisionSuitable = validations.filter((v) => v.rmse < 1.0)
    if (precisionSuitable.length > 0) {
      rec += `  • Precision Irrigation: ${precisionSuitable.map((v) => v.provider).join(' or ')}\n`
    } else {
      rec += `  • Precision Irrigation: Use local weather station (all APIs show RMSE > 1.0)\n`
    }

    return rec
  }

  /**
   * Simple validation with just a few data points
   */
  static quickValidation(
    apiETo: number[],
    stationETo: number[]
  ): {
    bias: number
    biasPercent: number
    correctionFactor: number
  } {
    if (apiETo.length !== stationETo.length || apiETo.length === 0) {
      throw new Error('Invalid input: arrays must have same length and not be empty')
    }

    const errors = apiETo.map((api, i) => api - stationETo[i])
    const bias = errors.reduce((sum, e) => sum + e, 0) / errors.length

    const avgStationETo = stationETo.reduce((sum, e) => sum + e, 0) / stationETo.length
    const biasPercent = (bias / avgStationETo) * 100

    const correctionFactor = 1 / (1 + biasPercent / 100)

    return {
      bias: Math.round(bias * 100) / 100,
      biasPercent: Math.round(biasPercent * 10) / 10,
      correctionFactor: Math.round(correctionFactor * 1000) / 1000
    }
  }
}
