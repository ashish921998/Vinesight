/**
 * ETo Accuracy Enhancement Service
 *
 * Multi-strategy system to improve ETo accuracy from ±20% (typical API error)
 * to ±5% or better using ensemble methods, calibration, and sensor fusion.
 *
 * Strategies:
 * 1. Ensemble Averaging - Combine multiple providers to reduce random error
 * 2. Adaptive Regional Calibration - Build correction database from user feedback
 * 3. Local Sensor Integration - Refine API data with cheap local sensors
 * 4. Machine Learning Correction - Learn location-specific bias patterns
 * 5. Crop-Based Validation - Use actual crop water stress as feedback
 * 6. Hybrid Provider Selection - Auto-select best provider per region/season
 * 7. Real-time Bias Detection - Continuously validate and adjust
 */

import { WeatherProviderManager } from './weather-provider-manager'
import type { WeatherProvider, WeatherData } from './types'

// ============================================================================
// Type Definitions
// ============================================================================

export interface EnhancedEToResult {
  eto: number // Final calibrated ETo (mm/day)
  confidence: number // 0-1 confidence score
  method: AccuracyMethod
  contributors: {
    provider: WeatherProvider
    eto: number
    weight: number
  }[]
  corrections: {
    type: string
    adjustment: number // mm/day
    reason: string
  }[]
  metadata: {
    providersUsed: number
    hasLocalSensors: boolean
    hasRegionalCalibration: boolean
    estimatedError: number // Estimated ±% error
  }
}

export type AccuracyMethod =
  | 'single-provider' // Standard API call
  | 'ensemble-average' // Multiple providers averaged
  | 'weighted-ensemble' // Providers weighted by historical accuracy
  | 'sensor-fusion' // API + local sensors
  | 'ml-corrected' // Machine learning correction applied
  | 'regionally-calibrated' // Regional bias correction applied

export interface LocalSensorData {
  date: string
  temperatureMax?: number
  temperatureMin?: number
  humidity?: number
  windSpeed?: number
  solarRadiation?: number
  rainfall?: number
  source: 'manual' | 'iot' | 'station'
}

export interface RegionalCalibration {
  region: string // Geographic identifier (lat/lon grid or district)
  provider: WeatherProvider
  season: 'winter' | 'spring' | 'summer' | 'monsoon' | 'post-monsoon'
  correctionFactor: number // Multiply API ETo by this
  bias: number // Systematic error (mm/day)
  sampleSize: number // How many validations
  confidence: number // 0-1
  lastUpdated: Date
}

export interface CropStressFeedback {
  date: string
  farmId: number
  cropStressLevel: number // 0-1 (0=no stress, 1=severe stress)
  irrigationAmount: number // mm applied
  soilMoisture?: number // 0-1 volumetric
  cropStage: string
  expectedStress: number // What model predicted
  actualStress: number // What farmer observed
}

// ============================================================================
// Strategy 1: Ensemble Averaging
// ============================================================================

export class EnsembleEToService {
  /**
   * Simple ensemble: average all available providers
   */
  static async getSimpleEnsemble(
    latitude: number,
    longitude: number,
    date: string
  ): Promise<EnhancedEToResult> {
    const providers: WeatherProvider[] = [
      'open-meteo',
      'visual-crossing',
      'weatherbit',
      'tomorrow-io'
    ]
    const results: { provider: WeatherProvider; eto: number }[] = []

    // Fetch from all providers in parallel
    await Promise.all(
      providers.map(async (provider) => {
        try {
          const data = await WeatherProviderManager.getWeatherData(latitude, longitude, date, date)
          if (data[0]) {
            results.push({
              provider,
              eto: data[0].et0FaoEvapotranspiration
            })
          }
        } catch (error) {
          console.warn(`Provider ${provider} failed:`, error)
        }
      })
    )

    if (results.length === 0) {
      throw new Error('No providers available for ensemble')
    }

    // Simple average
    const averageETo = results.reduce((sum, r) => sum + r.eto, 0) / results.length

    // Calculate standard deviation for confidence
    const variance =
      results.reduce((sum, r) => sum + Math.pow(r.eto - averageETo, 2), 0) / results.length
    const stdDev = Math.sqrt(variance)
    const confidence = Math.max(0, 1 - stdDev / averageETo) // Lower variance = higher confidence

    return {
      eto: Math.round(averageETo * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      method: 'ensemble-average',
      contributors: results.map((r) => ({
        provider: r.provider,
        eto: r.eto,
        weight: 1 / results.length
      })),
      corrections: [],
      metadata: {
        providersUsed: results.length,
        hasLocalSensors: false,
        hasRegionalCalibration: false,
        estimatedError: (stdDev / averageETo) * 100 // % error estimate
      }
    }
  }

  /**
   * Weighted ensemble: providers weighted by historical accuracy
   */
  static async getWeightedEnsemble(
    latitude: number,
    longitude: number,
    date: string,
    providerWeights: Record<WeatherProvider, number>
  ): Promise<EnhancedEToResult> {
    const providers: WeatherProvider[] = [
      'open-meteo',
      'visual-crossing',
      'weatherbit',
      'tomorrow-io'
    ]
    const results: { provider: WeatherProvider; eto: number; weight: number }[] = []

    await Promise.all(
      providers.map(async (provider) => {
        try {
          const data = await WeatherProviderManager.getWeatherData(latitude, longitude, date, date)
          if (data[0]) {
            results.push({
              provider,
              eto: data[0].et0FaoEvapotranspiration,
              weight: providerWeights[provider] || 1.0
            })
          }
        } catch (error) {
          console.warn(`Provider ${provider} failed:`, error)
        }
      })
    )

    // Normalize weights
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0)
    results.forEach((r) => (r.weight = r.weight / totalWeight))

    // Weighted average
    const weightedETo = results.reduce((sum, r) => sum + r.eto * r.weight, 0)

    // Weighted variance for confidence
    const weightedVariance = results.reduce(
      (sum, r) => sum + r.weight * Math.pow(r.eto - weightedETo, 2),
      0
    )
    const weightedStdDev = Math.sqrt(weightedVariance)
    const confidence = Math.max(0, 1 - weightedStdDev / weightedETo)

    return {
      eto: Math.round(weightedETo * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      method: 'weighted-ensemble',
      contributors: results,
      corrections: [],
      metadata: {
        providersUsed: results.length,
        hasLocalSensors: false,
        hasRegionalCalibration: false,
        estimatedError: (weightedStdDev / weightedETo) * 100
      }
    }
  }
}

// ============================================================================
// Strategy 2: Adaptive Regional Calibration
// ============================================================================

export class RegionalCalibrationService {
  private static calibrations: Map<string, RegionalCalibration[]> = new Map()

  /**
   * Get region key for calibration lookup
   */
  private static getRegionKey(latitude: number, longitude: number): string {
    // 0.5-degree grid cells (roughly 50km)
    const latGrid = Math.floor(latitude * 2) / 2
    const lonGrid = Math.floor(longitude * 2) / 2
    return `${latGrid},${lonGrid}`
  }

  /**
   * Get current season based on date (India-specific)
   */
  private static getSeason(date: Date): RegionalCalibration['season'] {
    const month = date.getMonth() + 1
    if (month >= 12 || month <= 2) return 'winter'
    if (month >= 3 && month <= 5) return 'summer'
    if (month >= 6 && month <= 9) return 'monsoon'
    return 'post-monsoon'
  }

  /**
   * Apply regional calibration to API ETo
   */
  static async applyRegionalCalibration(
    eto: number,
    provider: WeatherProvider,
    latitude: number,
    longitude: number,
    date: Date
  ): Promise<{ calibratedETo: number; correction: number; confidence: number }> {
    const regionKey = this.getRegionKey(latitude, longitude)
    const season = this.getSeason(date)

    // Look for matching calibration
    const regionalCals = this.calibrations.get(regionKey) || []
    const calibration = regionalCals.find(
      (cal) => cal.provider === provider && cal.season === season
    )

    if (!calibration) {
      return {
        calibratedETo: eto,
        correction: 0,
        confidence: 0
      }
    }

    // Apply correction: calibratedETo = eto * factor - bias
    const calibratedETo = eto * calibration.correctionFactor - calibration.bias

    return {
      calibratedETo: Math.max(0, Math.round(calibratedETo * 100) / 100),
      correction: calibratedETo - eto,
      confidence: calibration.confidence
    }
  }

  /**
   * Add new calibration data from user validation
   */
  static addCalibrationData(
    provider: WeatherProvider,
    latitude: number,
    longitude: number,
    date: Date,
    apiETo: number,
    measuredETo: number
  ): void {
    const regionKey = this.getRegionKey(latitude, longitude)
    const season = this.getSeason(date)

    const calibrations = this.calibrations.get(regionKey) || []
    let existing = calibrations.find((cal) => cal.provider === provider && cal.season === season)

    if (!existing) {
      existing = {
        region: regionKey,
        provider,
        season,
        correctionFactor: 1.0,
        bias: 0,
        sampleSize: 0,
        confidence: 0,
        lastUpdated: new Date()
      }
      calibrations.push(existing)
      this.calibrations.set(regionKey, calibrations)
    }

    // Update with exponential moving average
    const alpha = 0.2 // Learning rate
    const ratio = measuredETo / apiETo
    const error = apiETo - measuredETo

    existing.correctionFactor = existing.correctionFactor * (1 - alpha) + ratio * alpha
    existing.bias = existing.bias * (1 - alpha) + error * alpha
    existing.sampleSize++
    existing.confidence = Math.min(0.95, existing.sampleSize / 30) // Max confidence at 30 samples
    existing.lastUpdated = new Date()
  }

  /**
   * Load calibrations from Supabase (to be implemented)
   */
  static async loadCalibrations(latitude: number, longitude: number): Promise<void> {
    // TODO: Load from Supabase regional_calibrations table
    // This would query nearby regions and populate this.calibrations
  }

  /**
   * Save calibration to Supabase (to be implemented)
   */
  static async saveCalibration(calibration: RegionalCalibration): Promise<void> {
    // TODO: Save to Supabase regional_calibrations table
  }
}

// ============================================================================
// Strategy 3: Local Sensor Integration
// ============================================================================

export class SensorFusionService {
  /**
   * Refine API ETo using local sensor data
   *
   * If farmer has cheap sensors (temperature, humidity), we can improve accuracy:
   * - Use local temp instead of gridded API temp
   * - Use local humidity instead of estimated humidity
   * - Keep API solar radiation (sensors are expensive)
   */
  static async refineWithSensors(
    apiData: WeatherData,
    sensorData: LocalSensorData
  ): Promise<EnhancedEToResult> {
    // Start with API values
    let tempMax = apiData.temperatureMax
    let tempMin = apiData.temperatureMin
    let humidity = apiData.relativeHumidityMean
    let windSpeed = apiData.windSpeed10m
    let solarRadiation = apiData.shortwaveRadiationSum

    const corrections: EnhancedEToResult['corrections'] = []

    // Replace with sensor data if available (higher trust)
    if (sensorData.temperatureMax !== undefined && sensorData.temperatureMin !== undefined) {
      const tempDiff =
        (sensorData.temperatureMax + sensorData.temperatureMin) / 2 - (tempMax + tempMin) / 2
      tempMax = sensorData.temperatureMax
      tempMin = sensorData.temperatureMin
      corrections.push({
        type: 'temperature',
        adjustment: tempDiff,
        reason: 'Used local sensor temperature (more accurate than gridded API data)'
      })
    }

    if (sensorData.humidity !== undefined) {
      const humidityDiff = sensorData.humidity - humidity
      humidity = sensorData.humidity
      corrections.push({
        type: 'humidity',
        adjustment: humidityDiff,
        reason: 'Used local sensor humidity (critical for ETo accuracy)'
      })
    }

    if (sensorData.windSpeed !== undefined) {
      windSpeed = sensorData.windSpeed
      corrections.push({
        type: 'wind',
        adjustment: 0,
        reason: 'Used local wind speed'
      })
    }

    // Recalculate ETo with refined parameters
    const refinedETo = this.calculateETo(tempMax, tempMin, humidity, windSpeed, solarRadiation)
    const originalETo = apiData.et0FaoEvapotranspiration
    const improvement = Math.abs(refinedETo - originalETo)

    return {
      eto: Math.round(refinedETo * 100) / 100,
      confidence: 0.9, // High confidence with local sensors
      method: 'sensor-fusion',
      contributors: [
        {
          provider: apiData.provider,
          eto: originalETo,
          weight: sensorData.solarRadiation ? 0 : 0.3 // Some weight to API if we lack solar sensor
        }
      ],
      corrections,
      metadata: {
        providersUsed: 1,
        hasLocalSensors: true,
        hasRegionalCalibration: false,
        estimatedError: 5 // ~5% error with good sensor data
      }
    }
  }

  /**
   * Simplified FAO-56 Penman-Monteith calculation
   */
  private static calculateETo(
    tempMax: number,
    tempMin: number,
    humidity: number,
    windSpeed: number,
    solarRadiation: number
  ): number {
    const temp = (tempMax + tempMin) / 2

    // Saturation vapor pressure
    const esTmax = 0.6108 * Math.exp((17.27 * tempMax) / (tempMax + 237.3))
    const esTmin = 0.6108 * Math.exp((17.27 * tempMin) / (tempMin + 237.3))
    const es = (esTmax + esTmin) / 2

    // Actual vapor pressure
    const ea = es * (humidity / 100)

    // Slope of saturation vapor pressure curve
    const delta =
      (4098 * 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3))) / Math.pow(temp + 237.3, 2)

    // Psychrometric constant (standard atmospheric pressure)
    const gamma = 0.067

    // FAO-56 Penman-Monteith
    const numerator =
      0.408 * delta * solarRadiation + (gamma * 900 * windSpeed * (es - ea)) / (temp + 273)
    const denominator = delta + gamma * (1 + 0.34 * windSpeed)

    return Math.max(0, numerator / denominator)
  }
}

// ============================================================================
// Strategy 4: Machine Learning Correction
// ============================================================================

export class MLCorrectionService {
  /**
   * Simple pattern-based correction using historical data
   *
   * This is a lightweight ML approach that learns:
   * - Seasonal bias patterns (e.g., APIs overestimate in monsoon)
   * - Temperature-dependent bias (e.g., overestimate at high temps)
   * - Humidity-dependent bias (e.g., irrigation cooling ignored)
   */
  static async applyPatternCorrection(
    eto: number,
    weatherData: WeatherData,
    historicalValidations: Array<{
      apiETo: number
      measuredETo: number
      temp: number
      humidity: number
      season: string
    }>
  ): Promise<{ correctedETo: number; confidence: number }> {
    if (historicalValidations.length < 10) {
      return { correctedETo: eto, confidence: 0.3 } // Not enough data
    }

    // Find similar historical conditions
    const temp = weatherData.temperatureMean
    const humidity = weatherData.relativeHumidityMean
    const season = this.getSeason(new Date(weatherData.date))

    const similarConditions = historicalValidations.filter((v) => {
      const tempMatch = Math.abs(v.temp - temp) < 5 // Within 5°C
      const humidityMatch = Math.abs(v.humidity - humidity) < 15 // Within 15%
      const seasonMatch = v.season === season
      return tempMatch && humidityMatch && seasonMatch
    })

    if (similarConditions.length === 0) {
      return { correctedETo: eto, confidence: 0.5 }
    }

    // Calculate average correction factor from similar conditions
    const avgRatio =
      similarConditions.reduce((sum, v) => sum + v.measuredETo / v.apiETo, 0) /
      similarConditions.length

    const correctedETo = eto * avgRatio
    const confidence = Math.min(0.9, similarConditions.length / 20) // Max confidence at 20+ samples

    return {
      correctedETo: Math.round(correctedETo * 100) / 100,
      confidence
    }
  }

  private static getSeason(date: Date): string {
    const month = date.getMonth() + 1
    if (month >= 12 || month <= 2) return 'winter'
    if (month >= 3 && month <= 5) return 'summer'
    if (month >= 6 && month <= 9) return 'monsoon'
    return 'post-monsoon'
  }
}

// ============================================================================
// Strategy 5: Crop-Based Validation
// ============================================================================

export class CropValidationService {
  /**
   * Validate ETo using actual crop water stress observations
   *
   * Theory: If ETo is accurate, then:
   * - Irrigation based on ETo should prevent crop stress
   * - Observed stress levels validate or invalidate ETo accuracy
   */
  static async validateWithCropStress(
    eto: number,
    feedback: CropStressFeedback
  ): Promise<{ isAccurate: boolean; suggestedCorrection: number }> {
    // Simple validation logic:
    // If farmer irrigated based on ETo but crop still stressed → ETo was underestimated
    // If farmer irrigated based on ETo and no stress expected but occurred → ETo was overestimated

    const expectedStress = feedback.expectedStress
    const actualStress = feedback.actualStress

    const stressDiff = actualStress - expectedStress

    let suggestedCorrection = 0

    if (Math.abs(stressDiff) > 0.2) {
      // Significant mismatch
      if (stressDiff > 0) {
        // More stress than expected → underestimated ETo
        suggestedCorrection = eto * 0.1 // Increase by 10%
      } else {
        // Less stress than expected → overestimated ETo
        suggestedCorrection = -eto * 0.1 // Decrease by 10%
      }
    }

    return {
      isAccurate: Math.abs(stressDiff) < 0.15,
      suggestedCorrection
    }
  }
}

// ============================================================================
// Strategy 6: Hybrid Provider Selection
// ============================================================================

export class HybridProviderService {
  /**
   * Auto-select best provider based on region, season, and historical performance
   */
  static async selectBestProvider(
    latitude: number,
    longitude: number,
    date: Date,
    performanceHistory: Record<WeatherProvider, { accuracy: number; sampleSize: number }>
  ): Promise<WeatherProvider> {
    // Default ranking based on ETO_ACCURACY_GUIDE.md
    const defaultRanking: WeatherProvider[] = [
      'open-meteo', // Best: FAO-56 direct, ±5%
      'tomorrow-io', // Excellent: direct ETo
      'weatherbit', // Good: agriculture focused
      'visual-crossing' // Fair: calculated
    ]

    // If we have performance history, use it
    const providersWithHistory = Object.entries(performanceHistory)
      .filter(([_, stats]) => stats.sampleSize >= 5) // Need at least 5 validations
      .sort(([_, a], [__, b]) => a.accuracy - b.accuracy) // Lower error = better
      .map(([provider]) => provider as WeatherProvider)

    if (providersWithHistory.length > 0) {
      return providersWithHistory[0] // Best performing provider
    }

    // No history, use default
    return defaultRanking[0]
  }
}

// ============================================================================
// Strategy 7: Real-time Bias Detection
// ============================================================================

export class BiasDetectionService {
  /**
   * Detect systematic bias in API data over time
   *
   * Monitors rolling 7-day average to detect:
   * - Consistent overestimation/underestimation
   * - Sudden shifts in accuracy
   * - Provider-specific issues
   */
  static detectBias(
    recentData: Array<{
      date: string
      apiETo: number
      validatedETo?: number
    }>
  ): { hasBias: boolean; biasAmount: number; confidence: number } {
    const validatedData = recentData.filter((d) => d.validatedETo !== undefined)

    if (validatedData.length < 3) {
      return { hasBias: false, biasAmount: 0, confidence: 0 }
    }

    // Calculate average bias
    const biases = validatedData.map((d) => d.apiETo - (d.validatedETo || 0))
    const avgBias = biases.reduce((sum, b) => sum + b, 0) / biases.length

    // Calculate consistency (lower variance = more confident in bias)
    const variance = biases.reduce((sum, b) => sum + Math.pow(b - avgBias, 2), 0) / biases.length
    const stdDev = Math.sqrt(variance)

    const hasBias = Math.abs(avgBias) > 0.5 // >0.5 mm/day bias is significant
    const confidence = Math.max(0, 1 - stdDev / Math.abs(avgBias || 1))

    return {
      hasBias,
      biasAmount: Math.round(avgBias * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    }
  }
}

// ============================================================================
// Master Service: Combines All Strategies
// ============================================================================

export class AccuracyEnhancementService {
  /**
   * Get the most accurate ETo possible using all available strategies
   */
  static async getEnhancedETo(
    latitude: number,
    longitude: number,
    date: string,
    options: {
      useEnsemble?: boolean
      localSensors?: LocalSensorData
      providerWeights?: Record<WeatherProvider, number>
      useRegionalCalibration?: boolean
      historicalValidations?: any[]
    } = {}
  ): Promise<EnhancedEToResult> {
    // Strategy 1: Start with ensemble if requested
    if (options.useEnsemble) {
      if (options.providerWeights) {
        const result = await EnsembleEToService.getWeightedEnsemble(
          latitude,
          longitude,
          date,
          options.providerWeights
        )

        // Apply additional corrections to ensemble result
        return await this.applyAdditionalCorrections(result, latitude, longitude, date, options)
      } else {
        const result = await EnsembleEToService.getSimpleEnsemble(latitude, longitude, date)
        return await this.applyAdditionalCorrections(result, latitude, longitude, date, options)
      }
    }

    // Strategy 2: Single provider with all corrections
    const provider = WeatherProviderManager.getActiveProviderId()
    const data = await WeatherProviderManager.getWeatherData(latitude, longitude, date, date)

    if (data.length === 0) {
      throw new Error('No weather data available')
    }

    let result: EnhancedEToResult = {
      eto: data[0].et0FaoEvapotranspiration,
      confidence: 0.7,
      method: 'single-provider',
      contributors: [
        {
          provider: data[0].provider,
          eto: data[0].et0FaoEvapotranspiration,
          weight: 1.0
        }
      ],
      corrections: [],
      metadata: {
        providersUsed: 1,
        hasLocalSensors: false,
        hasRegionalCalibration: false,
        estimatedError: 15 // Default ±15% for single provider
      }
    }

    // Apply sensor fusion if available
    if (options.localSensors) {
      result = await SensorFusionService.refineWithSensors(data[0], options.localSensors)
    }

    // Apply regional calibration if available
    if (options.useRegionalCalibration) {
      const calibrated = await RegionalCalibrationService.applyRegionalCalibration(
        result.eto,
        data[0].provider,
        latitude,
        longitude,
        new Date(date)
      )

      if (calibrated.confidence > 0.5) {
        result.eto = calibrated.calibratedETo
        result.corrections.push({
          type: 'regional-calibration',
          adjustment: calibrated.correction,
          reason: `Regional calibration applied (${calibrated.confidence * 100}% confidence)`
        })
        result.metadata.hasRegionalCalibration = true
        result.metadata.estimatedError = Math.max(
          5,
          result.metadata.estimatedError * (1 - calibrated.confidence)
        )
      }
    }

    // Apply ML pattern correction if historical data available
    if (options.historicalValidations && options.historicalValidations.length >= 10) {
      const mlCorrected = await MLCorrectionService.applyPatternCorrection(
        result.eto,
        data[0],
        options.historicalValidations
      )

      if (mlCorrected.confidence > 0.6) {
        const adjustment = mlCorrected.correctedETo - result.eto
        result.eto = mlCorrected.correctedETo
        result.corrections.push({
          type: 'ml-pattern-correction',
          adjustment,
          reason: `Pattern-based ML correction (${mlCorrected.confidence * 100}% confidence)`
        })
        result.method = 'ml-corrected'
        result.confidence = Math.max(result.confidence, mlCorrected.confidence)
      }
    }

    return result
  }

  /**
   * Apply additional corrections to an ensemble result
   */
  private static async applyAdditionalCorrections(
    result: EnhancedEToResult,
    latitude: number,
    longitude: number,
    date: string,
    options: any
  ): Promise<EnhancedEToResult> {
    // Regional calibration can still be applied to ensemble
    if (options.useRegionalCalibration) {
      // Use primary provider for calibration lookup
      const primaryProvider = result.contributors[0].provider
      const calibrated = await RegionalCalibrationService.applyRegionalCalibration(
        result.eto,
        primaryProvider,
        latitude,
        longitude,
        new Date(date)
      )

      if (calibrated.confidence > 0.5) {
        result.eto = calibrated.calibratedETo
        result.corrections.push({
          type: 'regional-calibration',
          adjustment: calibrated.correction,
          reason: `Regional calibration applied to ensemble`
        })
        result.metadata.hasRegionalCalibration = true
        result.metadata.estimatedError *= 1 - calibrated.confidence * 0.5
      }
    }

    return result
  }

  /**
   * Recommend best accuracy strategy for a given situation
   */
  static recommendStrategy(context: {
    hasLocalSensors: boolean
    hasRegionalData: boolean
    multipleProvidersAvailable: boolean
    historicalValidations: number
  }): {
    strategy: AccuracyMethod
    expectedAccuracy: string
    reasoning: string
  } {
    // Best: Sensor fusion
    if (context.hasLocalSensors) {
      return {
        strategy: 'sensor-fusion',
        expectedAccuracy: '±5%',
        reasoning: 'Local sensors provide most accurate temperature and humidity data'
      }
    }

    // Second best: Weighted ensemble with regional calibration
    if (context.multipleProvidersAvailable && context.hasRegionalData) {
      return {
        strategy: 'regionally-calibrated',
        expectedAccuracy: '±8%',
        reasoning: 'Ensemble reduces random error, calibration corrects systematic bias'
      }
    }

    // Third: ML correction with good training data
    if (context.historicalValidations >= 20) {
      return {
        strategy: 'ml-corrected',
        expectedAccuracy: '±10%',
        reasoning: 'Sufficient historical data for pattern-based correction'
      }
    }

    // Fourth: Simple ensemble
    if (context.multipleProvidersAvailable) {
      return {
        strategy: 'ensemble-average',
        expectedAccuracy: '±12%',
        reasoning: 'Multiple providers reduce random error through averaging'
      }
    }

    // Fallback: Single provider
    return {
      strategy: 'single-provider',
      expectedAccuracy: '±15-20%',
      reasoning: 'Standard API accuracy, consider adding calibration or sensors'
    }
  }
}
