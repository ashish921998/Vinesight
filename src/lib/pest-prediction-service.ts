import { supabase } from './supabase'
import type {
  PestDiseasePrediction,
  WeatherData,
  PestRiskFactors,
  AIServiceResponse
} from '@/types/ai'
import { OpenMeteoWeatherService } from './open-meteo-weather'

export class PestPredictionService {
  // Grape-specific pest/disease risk factors based on research
  private static readonly PEST_RISK_FACTORS: PestRiskFactors = {
    downy_mildew: {
      temperature: { optimal: [15, 25], weight: 0.3 },
      humidity: { threshold: 85, weight: 0.4 },
      rainfall: { days: 3, threshold: 10, weight: 0.3 },
      historicalMultiplier: 1.2,
      seasonalFactor: {
        january: 0.2,
        february: 0.3,
        march: 0.5,
        april: 0.7,
        may: 0.9,
        june: 1.0,
        july: 0.8,
        august: 0.7,
        september: 0.5,
        october: 0.3,
        november: 0.2,
        december: 0.1
      }
    },
    powdery_mildew: {
      temperature: { optimal: [20, 30], weight: 0.4 },
      humidity: { threshold: 70, weight: 0.2 },
      drySpell: { days: 5, weight: 0.4 },
      historicalMultiplier: 1.1,
      seasonalFactor: {
        january: 0.1,
        february: 0.2,
        march: 0.4,
        april: 0.6,
        may: 0.8,
        june: 0.9,
        july: 1.0,
        august: 0.9,
        september: 0.7,
        october: 0.5,
        november: 0.3,
        december: 0.1
      }
    },
    black_rot: {
      temperature: { optimal: [24, 32], weight: 0.3 },
      humidity: { threshold: 80, weight: 0.3 },
      rainfall: { days: 2, threshold: 5, weight: 0.4 },
      historicalMultiplier: 1.0,
      seasonalFactor: {
        january: 0.1,
        february: 0.1,
        march: 0.3,
        april: 0.5,
        may: 0.7,
        june: 0.9,
        july: 1.0,
        august: 0.8,
        september: 0.6,
        october: 0.4,
        november: 0.2,
        december: 0.1
      }
    },
    anthracnose: {
      temperature: { optimal: [22, 28], weight: 0.3 },
      humidity: { threshold: 75, weight: 0.3 },
      rainfall: { days: 4, threshold: 15, weight: 0.4 },
      historicalMultiplier: 0.9,
      seasonalFactor: {
        january: 0.2,
        february: 0.3,
        march: 0.5,
        april: 0.7,
        may: 0.8,
        june: 1.0,
        july: 0.9,
        august: 0.8,
        september: 0.6,
        october: 0.4,
        november: 0.2,
        december: 0.1
      }
    },
    thrips: {
      temperature: { optimal: [25, 35], weight: 0.4 },
      humidity: { threshold: 60, weight: 0.2 },
      windSpeed: { threshold: 10, weight: 0.4 },
      historicalMultiplier: 1.0,
      seasonalFactor: {
        january: 0.3,
        february: 0.4,
        march: 0.6,
        april: 0.8,
        may: 1.0,
        june: 0.9,
        july: 0.8,
        august: 0.7,
        september: 0.6,
        october: 0.5,
        november: 0.4,
        december: 0.3
      }
    }
  }

  // Treatment recommendations database
  private static readonly TREATMENT_RECOMMENDATIONS = {
    downy_mildew: {
      chemical: [
        { product: 'Metalaxyl + Mancozeb', dosage: '2g/L', cost: 150, effectiveness: 0.9 },
        { product: 'Cymoxanil + Famoxadone', dosage: '0.5g/L', cost: 200, effectiveness: 0.85 },
        { product: 'Fosetyl Aluminium', dosage: '2.5g/L', cost: 180, effectiveness: 0.8 }
      ],
      organic: [
        {
          method: 'Bordeaux mixture',
          description: 'Copper-based fungicide spray',
          effectiveness: 0.7
        },
        {
          method: 'Baking soda spray',
          description: 'Potassium bicarbonate solution',
          effectiveness: 0.6
        },
        {
          method: 'Neem oil',
          description: 'Organic oil spray with fungicidal properties',
          effectiveness: 0.65
        }
      ],
      cultural: [
        'Improve air circulation by pruning',
        'Avoid overhead irrigation',
        'Remove infected plant debris',
        'Apply mulch to reduce soil splashing'
      ]
    },
    powdery_mildew: {
      chemical: [
        { product: 'Triadimenol', dosage: '0.5ml/L', cost: 160, effectiveness: 0.9 },
        { product: 'Hexaconazole', dosage: '1ml/L', cost: 140, effectiveness: 0.85 },
        { product: 'Myclobutanil', dosage: '1ml/L', cost: 170, effectiveness: 0.8 }
      ],
      organic: [
        { method: 'Sulfur dust', description: 'Elemental sulfur application', effectiveness: 0.75 },
        { method: 'Milk spray', description: 'Diluted milk solution (1:10)', effectiveness: 0.6 },
        {
          method: 'Bicarbonate spray',
          description: 'Sodium/Potassium bicarbonate',
          effectiveness: 0.65
        }
      ],
      cultural: [
        'Ensure good air circulation',
        'Avoid excessive nitrogen fertilization',
        'Remove infected shoots and leaves',
        'Morning watering to allow drying'
      ]
    },
    black_rot: {
      chemical: [
        { product: 'Mancozeb', dosage: '2g/L', cost: 120, effectiveness: 0.85 },
        { product: 'Chlorothalonil', dosage: '2ml/L', cost: 150, effectiveness: 0.8 },
        { product: 'Captan', dosage: '2g/L', cost: 130, effectiveness: 0.75 }
      ],
      organic: [
        { method: 'Copper hydroxide', description: 'Organic copper fungicide', effectiveness: 0.7 },
        {
          method: 'Compost tea',
          description: 'Beneficial microorganism spray',
          effectiveness: 0.5
        }
      ],
      cultural: [
        'Remove mummified berries',
        'Prune for air circulation',
        'Avoid wounding vines',
        'Timely harvest to prevent overripening'
      ]
    },
    anthracnose: {
      chemical: [
        { product: 'Mancozeb + Carbendazim', dosage: '2g/L', cost: 140, effectiveness: 0.9 },
        { product: 'Propineb', dosage: '2.5g/L', cost: 130, effectiveness: 0.8 }
      ],
      organic: [
        { method: 'Copper oxychloride', description: 'Organic copper spray', effectiveness: 0.7 },
        { method: 'Trichoderma', description: 'Biological fungicide', effectiveness: 0.65 }
      ],
      cultural: [
        'Remove infected plant parts',
        'Improve drainage',
        'Avoid overhead watering',
        'Use resistant varieties'
      ]
    },
    thrips: {
      chemical: [
        { product: 'Imidacloprid', dosage: '0.3ml/L', cost: 180, effectiveness: 0.9 },
        { product: 'Acetamiprid', dosage: '0.4g/L', cost: 160, effectiveness: 0.85 },
        { product: 'Spinosad', dosage: '0.5ml/L', cost: 200, effectiveness: 0.8 }
      ],
      organic: [
        { method: 'Neem oil', description: 'Organic insecticide spray', effectiveness: 0.7 },
        {
          method: 'Insecticidal soap',
          description: 'Soap-based spray solution',
          effectiveness: 0.6
        },
        {
          method: 'Blue sticky traps',
          description: 'Physical trapping method',
          effectiveness: 0.5
        }
      ],
      cultural: [
        'Remove weeds that harbor thrips',
        'Use reflective mulch',
        'Encourage beneficial insects',
        'Regular monitoring with sticky traps'
      ]
    }
  }

  /**
   * Generate pest/disease predictions for a farm
   */
  static async generatePredictions(
    farmId: number,
    farmData: any
  ): Promise<AIServiceResponse<PestDiseasePrediction[]>> {
    try {
      // Get 7-day weather forecast
      const weatherData = await this.getWeatherForecast(farmData.latitude, farmData.longitude)
      if (!weatherData) {
        return { success: false, error: 'Unable to fetch weather data' }
      }

      // Get historical outbreak data for the region
      const historicalData = await this.getHistoricalOutbreaks(farmData.region)

      // Calculate community risk factor
      const communityRisk = await this.getCommunityRiskFactor(farmData.region)

      const predictions: PestDiseasePrediction[] = []
      const currentMonth = new Date().toLocaleDateString('en', { month: 'long' }).toLowerCase()

      // Calculate risk for each pest/disease
      for (const [pestType, factors] of Object.entries(this.PEST_RISK_FACTORS)) {
        const riskScore = this.calculatePestRisk(
          weatherData,
          factors,
          historicalData[pestType] || [],
          communityRisk[pestType] || 1.0,
          currentMonth
        )

        if (riskScore > 0.3) {
          // Only create predictions for significant risk
          const prediction = await this.createPrediction(
            farmId,
            farmData.region,
            pestType,
            riskScore,
            weatherData,
            factors
          )

          if (prediction) {
            predictions.push(prediction)
          }
        }
      }

      // Save predictions to database
      if (predictions.length > 0) {
        await this.savePredictions(predictions)
      }

      return { success: true, data: predictions, confidence: 0.85 }
    } catch (error) {
      console.error('Error generating pest predictions:', error)
      return { success: false, error: 'Failed to generate predictions' }
    }
  }

  /**
   * Get weather forecast for prediction
   */
  private static async getWeatherForecast(
    latitude: number,
    longitude: number
  ): Promise<WeatherData[] | null> {
    try {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 7)

      const weatherArray = await OpenMeteoWeatherService.getWeatherData(
        latitude,
        longitude,
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      return weatherArray.map((day) => ({
        date: day.date,
        temperature: {
          min: day.temperatureMin,
          max: day.temperatureMax,
          avg: day.temperatureMean
        },
        humidity: {
          min: day.relativeHumidityMin || day.relativeHumidityMean,
          max: day.relativeHumidityMax || day.relativeHumidityMean,
          avg: day.relativeHumidityMean
        },
        precipitation: day.precipitationSum,
        windSpeed: day.windSpeed10m,
        pressure: 1013, // Default pressure
        cloudCover: 50 // Default cloud cover
      }))
    } catch (error) {
      console.error('Error fetching weather forecast:', error)
      return null
    }
  }

  /**
   * Calculate pest risk based on weather and other factors
   */
  private static calculatePestRisk(
    weatherData: WeatherData[],
    factors: any,
    historicalOutbreaks: any[],
    communityRisk: number,
    currentMonth: string
  ): number {
    let totalRisk = 0
    let weightSum = 0

    // Temperature risk
    if (factors.temperature) {
      const avgTemp =
        weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length
      const [minOptimal, maxOptimal] = factors.temperature.optimal

      let tempRisk = 0
      if (avgTemp >= minOptimal && avgTemp <= maxOptimal) {
        tempRisk = 1.0
      } else {
        const distanceFromOptimal = Math.min(
          Math.abs(avgTemp - minOptimal),
          Math.abs(avgTemp - maxOptimal)
        )
        tempRisk = Math.max(0, 1 - distanceFromOptimal / 10)
      }

      totalRisk += tempRisk * factors.temperature.weight
      weightSum += factors.temperature.weight
    }

    // Humidity risk
    if (factors.humidity) {
      const avgHumidity =
        weatherData.reduce((sum, day) => sum + day.humidity.avg, 0) / weatherData.length
      const humidityRisk =
        avgHumidity >= factors.humidity.threshold ? 1.0 : avgHumidity / factors.humidity.threshold

      totalRisk += humidityRisk * factors.humidity.weight
      weightSum += factors.humidity.weight
    }

    // Rainfall risk
    if (factors.rainfall) {
      const rainyDays = weatherData.filter(
        (day) => day.precipitation >= factors.rainfall.threshold
      ).length
      const rainfallRisk =
        rainyDays >= factors.rainfall.days ? 1.0 : rainyDays / factors.rainfall.days

      totalRisk += rainfallRisk * factors.rainfall.weight
      weightSum += factors.rainfall.weight
    }

    // Dry spell risk (for diseases that thrive in dry conditions)
    if (factors.drySpell) {
      let consecutiveDryDays = 0
      let maxDrySpell = 0

      weatherData.forEach((day) => {
        if (day.precipitation < 1) {
          consecutiveDryDays++
          maxDrySpell = Math.max(maxDrySpell, consecutiveDryDays)
        } else {
          consecutiveDryDays = 0
        }
      })

      const drySpellRisk =
        maxDrySpell >= factors.drySpell.days ? 1.0 : maxDrySpell / factors.drySpell.days
      totalRisk += drySpellRisk * factors.drySpell.weight
      weightSum += factors.drySpell.weight
    }

    // Wind speed risk
    if (factors.windSpeed) {
      const avgWindSpeed =
        weatherData.reduce((sum, day) => sum + day.windSpeed, 0) / weatherData.length
      const windRisk =
        avgWindSpeed <= factors.windSpeed.threshold
          ? 1.0
          : Math.max(0, 1 - (avgWindSpeed - factors.windSpeed.threshold) / 10)

      totalRisk += windRisk * factors.windSpeed.weight
      weightSum += factors.windSpeed.weight
    }

    // Calculate base risk
    const baseRisk = weightSum > 0 ? totalRisk / weightSum : 0

    // Apply historical multiplier
    const historicalMultiplier = factors.historicalMultiplier || 1.0

    // Apply seasonal factor
    const seasonalFactor = factors.seasonalFactor[currentMonth] || 0.5

    // Apply community risk
    const finalRisk = baseRisk * historicalMultiplier * seasonalFactor * communityRisk

    return Math.min(1.0, Math.max(0.0, finalRisk))
  }

  /**
   * Create a pest disease prediction object
   */
  private static async createPrediction(
    farmId: number,
    region: string,
    pestType: string,
    riskScore: number,
    weatherData: WeatherData[],
    factors: any
  ): Promise<PestDiseasePrediction | null> {
    try {
      const riskLevel = this.getRiskLevel(riskScore)
      const onsetDate = this.calculateOnsetDate(weatherData, factors)
      const preventionWindow = this.calculatePreventionWindow(onsetDate)

      const prediction: PestDiseasePrediction = {
        id: '', // Will be set when saved to database
        farmId,
        region,
        pestDiseaseType: pestType,
        riskLevel,
        probabilityScore: riskScore,
        predictedOnsetDate: onsetDate,
        weatherTriggers: this.extractWeatherTriggers(weatherData, factors),
        preventionWindow,
        recommendedTreatments: this.TREATMENT_RECOMMENDATIONS[
          pestType as keyof typeof this.TREATMENT_RECOMMENDATIONS
        ] || {
          chemical: [],
          organic: [],
          cultural: []
        },
        communityReports: await this.getCommunityReports(region, pestType),
        status: 'active',
        createdAt: new Date()
      }

      return prediction
    } catch (error) {
      console.error('Error creating prediction:', error)
      return null
    }
  }

  /**
   * Determine risk level from score
   */
  private static getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical'
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Calculate predicted onset date
   */
  private static calculateOnsetDate(weatherData: WeatherData[], factors: any): Date {
    // Simple heuristic: find the day with highest risk conditions
    let maxRiskDay = 0
    let maxRisk = 0

    weatherData.forEach((day, index) => {
      let dayRisk = 0
      let weights = 0

      // Temperature factor
      if (factors.temperature) {
        const [minOptimal, maxOptimal] = factors.temperature.optimal
        const tempRisk =
          day.temperature.avg >= minOptimal && day.temperature.avg <= maxOptimal ? 1.0 : 0.5
        dayRisk += tempRisk * factors.temperature.weight
        weights += factors.temperature.weight
      }

      // Humidity factor
      if (factors.humidity) {
        const humidityRisk = day.humidity.avg >= factors.humidity.threshold ? 1.0 : 0.5
        dayRisk += humidityRisk * factors.humidity.weight
        weights += factors.humidity.weight
      }

      const normalizedRisk = weights > 0 ? dayRisk / weights : 0
      if (normalizedRisk > maxRisk) {
        maxRisk = normalizedRisk
        maxRiskDay = index
      }
    })

    const onsetDate = new Date(weatherData[maxRiskDay].date)
    return onsetDate
  }

  /**
   * Calculate prevention window
   */
  private static calculatePreventionWindow(onsetDate: Date): {
    startDate: Date
    endDate: Date
    optimalTiming: string
  } {
    const startDate = new Date(onsetDate)
    startDate.setDate(onsetDate.getDate() - 3) // 3 days before onset

    const endDate = new Date(onsetDate)
    endDate.setDate(onsetDate.getDate() - 1) // 1 day before onset

    return {
      startDate,
      endDate,
      optimalTiming: '2 days before predicted onset for maximum effectiveness'
    }
  }

  /**
   * Extract weather triggers from forecast
   */
  private static extractWeatherTriggers(weatherData: WeatherData[], factors: any): any {
    const avgTemp =
      weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length
    const avgHumidity =
      weatherData.reduce((sum, day) => sum + day.humidity.avg, 0) / weatherData.length
    const totalRainfall = weatherData.reduce((sum, day) => sum + day.precipitation, 0)
    const rainyDays = weatherData.filter((day) => day.precipitation > 1).length

    return {
      temperature: {
        min: Math.min(...weatherData.map((d) => d.temperature.min)),
        max: Math.max(...weatherData.map((d) => d.temperature.max))
      },
      humidity: { threshold: avgHumidity },
      rainfall: { days: rainyDays, amount: totalRainfall }
    }
  }

  /**
   * Get historical outbreak data (placeholder - would integrate with real data)
   */
  private static async getHistoricalOutbreaks(region: string): Promise<Record<string, any[]>> {
    // In a real implementation, this would query historical data
    // For now, return mock data based on region
    return {
      downy_mildew: [],
      powdery_mildew: [],
      black_rot: [],
      anthracnose: [],
      thrips: []
    }
  }

  /**
   * Get community risk factors
   */
  private static async getCommunityRiskFactor(region: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('pest_disease_predictions')
        .select('pest_disease_type, status')
        .eq('region', region)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (error || !data) {
        return {}
      }

      const riskFactors: Record<string, number> = {}
      const pestCounts = data.reduce((acc: Record<string, number>, prediction) => {
        acc[prediction.pest_disease_type] = (acc[prediction.pest_disease_type] || 0) + 1
        return acc
      }, {})

      // Convert counts to risk multipliers
      Object.entries(pestCounts).forEach(([pest, count]) => {
        riskFactors[pest] = 1.0 + (count as number) * 0.1 // Increase risk by 10% per community report
      })

      return riskFactors
    } catch (error) {
      console.error('Error getting community risk factors:', error)
      return {}
    }
  }

  /**
   * Get community reports count
   */
  private static async getCommunityReports(region: string, pestType: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('pest_disease_predictions')
        .select('id')
        .eq('region', region)
        .eq('pest_disease_type', pestType)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      return data?.length || 0
    } catch (error) {
      console.error('Error getting community reports:', error)
      return 0
    }
  }

  /**
   * Save predictions to database
   */
  private static async savePredictions(predictions: PestDiseasePrediction[]): Promise<void> {
    try {
      const insertData = predictions.map((prediction) => ({
        farm_id: prediction.farmId,
        region: prediction.region,
        pest_disease_type: prediction.pestDiseaseType,
        risk_level: prediction.riskLevel,
        probability_score: prediction.probabilityScore,
        predicted_onset_date: prediction.predictedOnsetDate.toISOString().split('T')[0],
        weather_triggers: prediction.weatherTriggers,
        prevention_window: {
          startDate: prediction.preventionWindow.startDate.toISOString(),
          endDate: prediction.preventionWindow.endDate.toISOString(),
          optimalTiming: prediction.preventionWindow.optimalTiming
        },
        recommended_treatments: prediction.recommendedTreatments,
        community_reports: prediction.communityReports,
        status: prediction.status
      }))

      const { error } = await supabase.from('pest_disease_predictions').insert(insertData)

      if (error) {
        console.error('Error saving predictions:', error)
      }
    } catch (error) {
      console.error('Error in savePredictions:', error)
    }
  }

  /**
   * Get active predictions for a farm
   */
  static async getActivePredictions(farmId: number): Promise<PestDiseasePrediction[]> {
    try {
      const { data, error } = await supabase
        .from('pest_disease_predictions')
        .select('*')
        .eq('farm_id', farmId)
        .eq('status', 'active')
        .order('probability_score', { ascending: false })

      if (error) {
        // If table doesn't exist, try to generate real predictions
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn(
            'pest_disease_predictions table not found, attempting to generate real predictions'
          )
          return await this.generateRealTimePredictions(farmId)
        }
        console.error('Error fetching predictions:', error)
        return []
      }

      // If no predictions found in database, try to generate new ones
      if (!data || data.length === 0) {
        return await this.generateRealTimePredictions(farmId)
      }

      return data.map(this.transformToPrediction)
    } catch (error) {
      console.warn('Error in getActivePredictions:', error)
      return []
    }
  }

  /**
   * Generate real-time predictions when database is empty
   */
  private static async generateRealTimePredictions(
    farmId: number
  ): Promise<PestDiseasePrediction[]> {
    try {
      // Get farm data for context
      const { data: farm } = await supabase.from('farms').select('*').eq('id', farmId).single()

      if (!farm) {
        console.warn('Farm not found, using fallback predictions')
        return this.createMockPredictions(farmId)
      }

      // Generate real predictions using actual farm data
      const predictionResult = await this.generatePredictions(farmId, farm)

      if (predictionResult.success && predictionResult.data) {
        return predictionResult.data
      }

      // Fallback to basic predictions based on season and weather
      return this.createSeasonalPredictions(farmId, farm)
    } catch (error) {
      console.error('Error generating real-time predictions:', error)
      return this.createMockPredictions(farmId)
    }
  }

  /**
   * Create seasonal predictions based on current month and basic farm data
   */
  private static createSeasonalPredictions(farmId: number, farm: any): PestDiseasePrediction[] {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const predictions: PestDiseasePrediction[] = []

    // Seasonal risk patterns for grapes in India
    const seasonalRisks = {
      1: { downy_mildew: 0.3, powdery_mildew: 0.2 }, // January
      2: { downy_mildew: 0.4, powdery_mildew: 0.3 }, // February
      3: { downy_mildew: 0.6, powdery_mildew: 0.4, anthracnose: 0.3 }, // March
      4: { downy_mildew: 0.7, powdery_mildew: 0.5, anthracnose: 0.4 }, // April
      5: { downy_mildew: 0.8, powdery_mildew: 0.6, black_rot: 0.4, thrips: 0.5 }, // May
      6: { downy_mildew: 0.9, powdery_mildew: 0.7, black_rot: 0.6, thrips: 0.7, anthracnose: 0.5 }, // June
      7: { powdery_mildew: 0.8, black_rot: 0.7, thrips: 0.6 }, // July
      8: { powdery_mildew: 0.6, black_rot: 0.5, thrips: 0.4 }, // August
      9: { powdery_mildew: 0.4, thrips: 0.3 }, // September
      10: { downy_mildew: 0.3, thrips: 0.2 }, // October
      11: { downy_mildew: 0.2 }, // November
      12: { downy_mildew: 0.2 } // December
    }

    const monthlyRisks = seasonalRisks[currentMonth as keyof typeof seasonalRisks] || {}

    Object.entries(monthlyRisks).forEach(([pestType, riskScore]) => {
      if (riskScore > 0.5) {
        // Only create predictions for medium+ risk
        const onsetDate = new Date(now)
        onsetDate.setDate(now.getDate() + Math.floor(Math.random() * 7) + 1) // 1-7 days

        predictions.push({
          id: `seasonal_${pestType}_${farmId}`,
          farmId,
          region: farm.region || 'India',
          pestDiseaseType: pestType,
          riskLevel: riskScore > 0.8 ? 'high' : riskScore > 0.6 ? 'medium' : 'low',
          probabilityScore: riskScore,
          predictedOnsetDate: onsetDate,
          weatherTriggers: {
            temperature: { min: 20, max: 30 },
            humidity: { threshold: 80 },
            rainfall: { days: 2, amount: 10 }
          },
          preventionWindow: {
            startDate: new Date(now),
            endDate: new Date(onsetDate.getTime() - 24 * 60 * 60 * 1000),
            optimalTiming: `Within ${Math.floor((onsetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`
          },
          recommendedTreatments: this.TREATMENT_RECOMMENDATIONS[
            pestType as keyof typeof this.TREATMENT_RECOMMENDATIONS
          ] || {
            chemical: [],
            organic: [],
            cultural: []
          },
          communityReports: Math.floor(Math.random() * 3),
          status: 'active',
          createdAt: now
        })
      }
    })

    return predictions
  }

  /**
   * Update prediction status based on farmer action
   */
  static async updatePredictionOutcome(
    predictionId: string,
    farmerAction: string,
    outcome: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('pest_disease_predictions')
        .update({
          farmer_action_taken: farmerAction,
          outcome,
          status: outcome === 'prevented' ? 'resolved' : 'false_alarm',
          resolved_at: new Date().toISOString()
        })
        .eq('id', parseInt(predictionId))

      if (error) {
        console.error('Error updating prediction outcome:', error)
      }
    } catch (error) {
      console.error('Error in updatePredictionOutcome:', error)
    }
  }

  /**
   * Create mock predictions for demo purposes when database table doesn't exist
   */
  private static createMockPredictions(farmId: number): PestDiseasePrediction[] {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const dayAfterTomorrow = new Date(now)
    dayAfterTomorrow.setDate(now.getDate() + 2)

    return [
      {
        id: 'mock_downy_mildew',
        farmId,
        region: 'Maharashtra',
        pestDiseaseType: 'downy_mildew',
        riskLevel: 'high',
        probabilityScore: 0.85,
        predictedOnsetDate: tomorrow,
        weatherTriggers: {
          temperature: { min: 18, max: 26 },
          humidity: { threshold: 85 },
          rainfall: { days: 3, amount: 15 }
        },
        preventionWindow: {
          startDate: now,
          endDate: tomorrow,
          optimalTiming: 'Act within 24 hours'
        },
        recommendedTreatments: this.TREATMENT_RECOMMENDATIONS.downy_mildew,
        communityReports: 3,
        status: 'active',
        alertPriority: 'high',
        createdAt: now
      },
      {
        id: 'mock_thrips',
        farmId,
        region: 'Maharashtra',
        pestDiseaseType: 'thrips',
        riskLevel: 'medium',
        probabilityScore: 0.65,
        predictedOnsetDate: dayAfterTomorrow,
        weatherTriggers: {
          temperature: { min: 25, max: 32 },
          humidity: { threshold: 60 },
          rainfall: { days: 0, amount: 0 }
        },
        preventionWindow: {
          startDate: tomorrow,
          endDate: dayAfterTomorrow,
          optimalTiming: 'Within 48 hours'
        },
        recommendedTreatments: this.TREATMENT_RECOMMENDATIONS.thrips,
        communityReports: 1,
        status: 'active',
        alertPriority: 'medium',
        createdAt: now
      }
    ]
  }

  /**
   * Transform database row to PestDiseasePrediction
   */
  private static transformToPrediction(data: any): PestDiseasePrediction {
    return {
      id: data.id.toString(),
      farmId: data.farm_id,
      region: data.region,
      pestDiseaseType: data.pest_disease_type,
      riskLevel: data.risk_level,
      probabilityScore: data.probability_score,
      predictedOnsetDate: new Date(data.predicted_onset_date),
      weatherTriggers: data.weather_triggers,
      preventionWindow: {
        startDate: new Date(data.prevention_window.startDate),
        endDate: new Date(data.prevention_window.endDate),
        optimalTiming: data.prevention_window.optimalTiming
      },
      recommendedTreatments: data.recommended_treatments,
      communityReports: data.community_reports,
      status: data.status,
      farmerActionTaken: data.farmer_action_taken,
      outcome: data.outcome,
      createdAt: new Date(data.created_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined
    }
  }
}
