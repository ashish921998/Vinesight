/**
 * ETo Accuracy Service - Supabase Integration
 *
 * Handles all database operations for the ETo accuracy enhancement system:
 * - Local sensor data (CRUD)
 * - ETo validations (CRUD)
 * - Regional calibrations (load/save)
 * - Provider performance tracking
 */

import { supabase } from '@/lib/supabase'
import type { WeatherProvider } from '@/lib/weather-providers/types'
import type {
  LocalSensorData,
  RegionalCalibration,
  CropStressFeedback
} from '@/lib/weather-providers/eto-accuracy-enhancement-service'

// ============================================================================
// Type Definitions (Database Row Types)
// ============================================================================

export interface LocalSensorDataRow {
  id: number
  farm_id: number
  user_id: string
  date: string
  time?: string
  temperature_max?: number
  temperature_min?: number
  temperature_current?: number
  humidity?: number
  wind_speed?: number
  solar_radiation?: number
  rainfall?: number
  soil_moisture?: number
  source: 'manual' | 'iot' | 'station'
  device_id?: string
  quality_checked: boolean
  notes?: string
  created_at: string
}

export interface EToValidationRow {
  id: number
  farm_id: number
  user_id: string
  date: string
  latitude: number
  longitude: number
  provider: WeatherProvider
  api_eto: number
  measured_eto: number
  validation_source: 'weather_station' | 'sensor_calculation' | 'crop_stress' | 'expert_estimate'
  error?: number
  error_percent?: number
  weather_conditions?: any
  crop_type?: string
  irrigation_status?: string
  confidence: number
  notes?: string
  created_at: string
}

export interface RegionalCalibrationRow {
  id: number
  region_key: string
  provider: WeatherProvider
  season: 'winter' | 'spring' | 'summer' | 'monsoon' | 'post-monsoon'
  correction_factor: number
  bias: number
  sample_size: number
  confidence: number
  rmse?: number
  mae?: number
  last_updated: string
  created_at: string
}

export interface ProviderPerformanceRow {
  id: number
  region_key: string
  provider: WeatherProvider
  validation_count: number
  avg_error?: number
  avg_error_percent?: number
  rmse?: number
  mae?: number
  r_squared?: number
  accuracy_score?: number
  period_start?: string
  period_end?: string
  last_updated: string
}

// ============================================================================
// Local Sensor Data Operations
// ============================================================================

export class LocalSensorDataService {
  /**
   * Save or update sensor reading for a farm
   */
  static async saveSensorData(
    farmId: number,
    sensorData: LocalSensorData
  ): Promise<LocalSensorDataRow | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if entry exists for this farm and date
      const { data: existing } = await supabase
        .from('local_sensor_data')
        .select('id')
        .eq('farm_id', farmId)
        .eq('date', sensorData.date)
        .single()

      const payload = {
        farm_id: farmId,
        user_id: user.id,
        date: sensorData.date,
        temperature_max: sensorData.temperatureMax,
        temperature_min: sensorData.temperatureMin,
        humidity: sensorData.humidity,
        wind_speed: sensorData.windSpeed,
        solar_radiation: sensorData.solarRadiation,
        rainfall: sensorData.rainfall,
        source: sensorData.source,
        quality_checked: false
      }

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('local_sensor_data')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('local_sensor_data')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error saving sensor data:', error)
      throw error
    }
  }

  /**
   * Get sensor data for a specific date
   */
  static async getSensorData(
    farmId: number,
    date: string
  ): Promise<LocalSensorDataRow | null> {
    try {
      const { data, error } = await supabase
        .from('local_sensor_data')
        .select('*')
        .eq('farm_id', farmId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    } catch (error) {
      console.error('Error loading sensor data:', error)
      return null
    }
  }

  /**
   * Get recent sensor data for a farm (last N days)
   */
  static async getRecentSensorData(
    farmId: number,
    days: number = 30
  ): Promise<LocalSensorDataRow[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('local_sensor_data')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading recent sensor data:', error)
      return []
    }
  }

  /**
   * Check if farm has any sensor data
   */
  static async hasSensorData(farmId: number): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('local_sensor_data')
        .select('id', { count: 'exact', head: true })
        .eq('farm_id', farmId)

      if (error) throw error
      return (count || 0) > 0
    } catch (error) {
      console.error('Error checking sensor data:', error)
      return false
    }
  }

  /**
   * Delete sensor reading
   */
  static async deleteSensorData(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('local_sensor_data')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting sensor data:', error)
      return false
    }
  }
}

// ============================================================================
// ETo Validation Operations
// ============================================================================

export class EToValidationService {
  /**
   * Save ETo validation (API vs measured)
   */
  static async saveValidation(
    farmId: number,
    provider: WeatherProvider,
    apiETo: number,
    measuredETo: number,
    latitude: number,
    longitude: number,
    date: string,
    validationSource: EToValidationRow['validation_source'],
    options?: {
      weatherConditions?: any
      cropType?: string
      irrigationStatus?: string
      confidence?: number
      notes?: string
    }
  ): Promise<EToValidationRow | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('eto_validations')
        .insert({
          farm_id: farmId,
          user_id: user.id,
          date,
          latitude,
          longitude,
          provider,
          api_eto: apiETo,
          measured_eto: measuredETo,
          validation_source: validationSource,
          weather_conditions: options?.weatherConditions,
          crop_type: options?.cropType,
          irrigation_status: options?.irrigationStatus,
          confidence: options?.confidence || 0.7,
          notes: options?.notes
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving validation:', error)
      throw error
    }
  }

  /**
   * Get validation history for a farm
   */
  static async getValidationHistory(
    farmId: number,
    limit: number = 50
  ): Promise<EToValidationRow[]> {
    try {
      const { data, error } = await supabase
        .from('eto_validations')
        .select('*')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading validation history:', error)
      return []
    }
  }

  /**
   * Get validation count for a farm
   */
  static async getValidationCount(farmId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('eto_validations')
        .select('id', { count: 'exact', head: true })
        .eq('farm_id', farmId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error counting validations:', error)
      return 0
    }
  }

  /**
   * Get validations by provider for accuracy tracking
   */
  static async getValidationsByProvider(
    farmId: number,
    provider: WeatherProvider
  ): Promise<EToValidationRow[]> {
    try {
      const { data, error } = await supabase
        .from('eto_validations')
        .select('*')
        .eq('farm_id', farmId)
        .eq('provider', provider)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading provider validations:', error)
      return []
    }
  }

  /**
   * Calculate validation statistics for a provider
   */
  static calculateValidationStats(validations: EToValidationRow[]): {
    count: number
    avgError: number
    avgErrorPercent: number
    rmse: number
    mae: number
  } {
    if (validations.length === 0) {
      return { count: 0, avgError: 0, avgErrorPercent: 0, rmse: 0, mae: 0 }
    }

    const errors = validations.map(v => v.api_eto - v.measured_eto)
    const errorPercents = validations.map(v =>
      ((v.api_eto - v.measured_eto) / v.measured_eto) * 100
    )

    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length
    const avgErrorPercent = errorPercents.reduce((sum, e) => sum + e, 0) / errorPercents.length

    const squaredErrors = errors.map(e => e * e)
    const rmse = Math.sqrt(squaredErrors.reduce((sum, e) => sum + e, 0) / errors.length)

    const absoluteErrors = errors.map(e => Math.abs(e))
    const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / errors.length

    return {
      count: validations.length,
      avgError: Math.round(avgError * 100) / 100,
      avgErrorPercent: Math.round(avgErrorPercent * 10) / 10,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100
    }
  }
}

// ============================================================================
// Regional Calibration Operations
// ============================================================================

export class RegionalCalibrationService {
  /**
   * Get region key from coordinates (0.5-degree grid)
   */
  static getRegionKey(latitude: number, longitude: number): string {
    const latGrid = Math.floor(latitude * 2) / 2
    const lonGrid = Math.floor(longitude * 2) / 2
    return `${latGrid},${lonGrid}`
  }

  /**
   * Get current season based on date (India-specific)
   */
  static getSeason(date: Date): RegionalCalibrationRow['season'] {
    const month = date.getMonth() + 1
    if (month >= 12 || month <= 2) return 'winter'
    if (month >= 3 && month <= 5) return 'summer'
    if (month >= 6 && month <= 9) return 'monsoon'
    return 'post-monsoon'
  }

  /**
   * Load regional calibrations for a location
   */
  static async loadCalibrations(
    latitude: number,
    longitude: number
  ): Promise<RegionalCalibrationRow[]> {
    try {
      const regionKey = this.getRegionKey(latitude, longitude)

      const { data, error } = await supabase
        .from('regional_calibrations')
        .select('*')
        .eq('region_key', regionKey)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading calibrations:', error)
      return []
    }
  }

  /**
   * Get calibration for specific provider and season
   */
  static async getCalibration(
    latitude: number,
    longitude: number,
    provider: WeatherProvider,
    season?: RegionalCalibrationRow['season']
  ): Promise<RegionalCalibrationRow | null> {
    try {
      const regionKey = this.getRegionKey(latitude, longitude)
      const currentSeason = season || this.getSeason(new Date())

      const { data, error } = await supabase
        .from('regional_calibrations')
        .select('*')
        .eq('region_key', regionKey)
        .eq('provider', provider)
        .eq('season', currentSeason)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error loading calibration:', error)
      return null
    }
  }

  /**
   * Update or create calibration based on validation data
   */
  static async updateCalibration(
    latitude: number,
    longitude: number,
    provider: WeatherProvider,
    validations: EToValidationRow[]
  ): Promise<RegionalCalibrationRow | null> {
    try {
      if (validations.length < 3) {
        console.warn('Need at least 3 validations to create calibration')
        return null
      }

      const regionKey = this.getRegionKey(latitude, longitude)

      // Group by season
      const seasonalValidations: Record<string, EToValidationRow[]> = {}
      validations.forEach(v => {
        const season = this.getSeason(new Date(v.date))
        if (!seasonalValidations[season]) {
          seasonalValidations[season] = []
        }
        seasonalValidations[season].push(v)
      })

      // Update calibration for each season with enough data
      const results: RegionalCalibrationRow[] = []

      for (const [season, vals] of Object.entries(seasonalValidations)) {
        if (vals.length < 3) continue

        // Calculate correction factor and bias
        const ratios = vals.map(v => v.measured_eto / v.api_eto)
        const correctionFactor = ratios.reduce((sum, r) => sum + r, 0) / ratios.length

        const errors = vals.map(v => v.api_eto - v.measured_eto)
        const bias = errors.reduce((sum, e) => sum + e, 0) / errors.length

        // Calculate statistics
        const stats = EToValidationService.calculateValidationStats(vals)
        const confidence = Math.min(0.95, vals.length / 30) // Max 95% at 30+ samples

        // Upsert calibration
        const { data, error } = await supabase
          .from('regional_calibrations')
          .upsert({
            region_key: regionKey,
            provider,
            season: season as RegionalCalibrationRow['season'],
            correction_factor: Math.round(correctionFactor * 1000) / 1000,
            bias: Math.round(bias * 100) / 100,
            sample_size: vals.length,
            confidence: Math.round(confidence * 100) / 100,
            rmse: stats.rmse,
            mae: stats.mae,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'region_key,provider,season'
          })
          .select()
          .single()

        if (error) throw error
        if (data) results.push(data)
      }

      return results[0] || null
    } catch (error) {
      console.error('Error updating calibration:', error)
      return null
    }
  }
}

// ============================================================================
// Provider Performance Operations
// ============================================================================

export class ProviderPerformanceService {
  /**
   * Get provider performance for a region
   */
  static async getProviderPerformance(
    latitude: number,
    longitude: number
  ): Promise<ProviderPerformanceRow[]> {
    try {
      const regionKey = RegionalCalibrationService.getRegionKey(latitude, longitude)

      const { data, error } = await supabase
        .from('provider_performance')
        .select('*')
        .eq('region_key', regionKey)
        .order('accuracy_score', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading provider performance:', error)
      return []
    }
  }

  /**
   * Get best performing provider for a region
   */
  static async getBestProvider(
    latitude: number,
    longitude: number
  ): Promise<WeatherProvider | null> {
    try {
      const performance = await this.getProviderPerformance(latitude, longitude)

      if (performance.length === 0) return null

      // Return provider with highest accuracy score
      return performance[0].provider
    } catch (error) {
      console.error('Error getting best provider:', error)
      return null
    }
  }

  /**
   * Get provider weights for ensemble based on performance
   */
  static async getProviderWeights(
    latitude: number,
    longitude: number
  ): Promise<Record<WeatherProvider, number>> {
    try {
      const performance = await this.getProviderPerformance(latitude, longitude)

      // Default weights if no performance data
      if (performance.length === 0) {
        return {
          'open-meteo': 1.0,
          'tomorrow-io': 0.9,
          'weatherbit': 0.7,
          'visual-crossing': 0.5
        }
      }

      // Calculate weights based on accuracy scores
      const weights: Record<string, number> = {}
      performance.forEach(p => {
        weights[p.provider] = p.accuracy_score || 0.5
      })

      // Ensure all providers have weights
      const allProviders: WeatherProvider[] = ['open-meteo', 'visual-crossing', 'weatherbit', 'tomorrow-io']
      allProviders.forEach(provider => {
        if (!weights[provider]) {
          weights[provider] = 0.5 // Default weight
        }
      })

      return weights as Record<WeatherProvider, number>
    } catch (error) {
      console.error('Error calculating provider weights:', error)
      return {
        'open-meteo': 1.0,
        'tomorrow-io': 0.9,
        'weatherbit': 0.7,
        'visual-crossing': 0.5
      }
    }
  }
}

// ============================================================================
// Accuracy Insights Operations
// ============================================================================

export class AccuracyInsightsService {
  /**
   * Get current accuracy level for a farm
   */
  static async getAccuracyLevel(farmId: number): Promise<{
    level: 'basic' | 'good' | 'excellent' | 'professional'
    validationCount: number
    hasSensorData: boolean
    estimatedError: number
  }> {
    try {
      const [validationCount, hasSensorData] = await Promise.all([
        EToValidationService.getValidationCount(farmId),
        LocalSensorDataService.hasSensorData(farmId)
      ])

      // Determine accuracy level
      let level: 'basic' | 'good' | 'excellent' | 'professional' = 'basic'
      let estimatedError = 18 // ±18% baseline

      if (hasSensorData && validationCount >= 20) {
        level = 'professional'
        estimatedError = 4
      } else if (hasSensorData || validationCount >= 10) {
        level = 'excellent'
        estimatedError = 6
      } else if (validationCount >= 5) {
        level = 'good'
        estimatedError = 10
      }

      return {
        level,
        validationCount,
        hasSensorData,
        estimatedError
      }
    } catch (error) {
      console.error('Error getting accuracy level:', error)
      return {
        level: 'basic',
        validationCount: 0,
        hasSensorData: false,
        estimatedError: 18
      }
    }
  }

  /**
   * Get progress percentage to next level
   */
  static getProgressToNextLevel(
    currentLevel: string,
    validationCount: number,
    hasSensorData: boolean
  ): number {
    if (currentLevel === 'professional') return 100

    if (currentLevel === 'basic') {
      // Progress to 'good': need 5 validations
      return Math.min(100, (validationCount / 5) * 100)
    } else if (currentLevel === 'good') {
      // Progress to 'excellent': need sensors or 10 validations
      if (hasSensorData) return 100
      return Math.min(100, (validationCount / 10) * 100)
    } else if (currentLevel === 'excellent') {
      // Progress to 'professional': need sensors + 20 validations
      if (!hasSensorData) return 0
      return Math.min(100, (validationCount / 20) * 100)
    }

    return 0
  }
}

// ============================================================================
// Export All Services
// ============================================================================

export const EToAccuracyService = {
  LocalSensorData: LocalSensorDataService,
  Validation: EToValidationService,
  RegionalCalibration: RegionalCalibrationService,
  ProviderPerformance: ProviderPerformanceService,
  AccuracyInsights: AccuracyInsightsService
}
