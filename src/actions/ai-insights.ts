'use server'

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export interface WeatherInsightData {
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  confidence: number
  timeRelevant: boolean
  actionLabel: string
}

export interface FinancialAnalysisData {
  trend: 'increasing' | 'decreasing' | 'stable'
  varianceFromAverage: number
  recommendation: string
  confidence: number
  nextReviewDate: string
  riskFactors: string[]
}

export interface GrowthAnalysisData {
  currentStage: string
  daysSincePlanting: number
  projectedHarvestDate: string
  healthScore: number
  recommendations: string[]
  risks: string[]
}

/**
 * Generate weather-based insights for a farm
 */
export async function generateWeatherInsights(data: {
  weatherData: any
  farmData: any
  history?: any[]
}) {
  try {
    if (!data.weatherData) {
      return {
        success: false,
        error: 'Weather data is required',
        data: []
      }
    }

    const context = {
      currentWeather: {
        temperature: data.weatherData?.temperature,
        humidity: data.weatherData?.humidity,
        wind_speed: data.weatherData?.wind_speed,
        precipitation: data.weatherData?.precipitation
      },
      farmLocation: data.farmData?.region,
      recentActivities: data.history?.slice(0, 5) || []
    }

    const prompt = `
You are an agricultural AI expert specializing in grape farming in India.

Analyze weather data and generate 2-3 actionable insights for immediate farmer action:
${JSON.stringify(context)}

Focus on:
1. Immediate risks or opportunities from current weather
2. Optimal timing for activities based on conditions
3. Prevention measures needed for upcoming weather

Return ONLY valid JSON array:
[{
  "type": "weather_advisory",
  "priority": "critical|high|medium|low",
  "title": "concise title",
  "subtitle": "specific conditions and metrics",
  "confidence": number (0.0-1.0),
  "timeRelevant": boolean,
  "actionLabel": "specific action button text"
}]`

    try {
      const result = await generateText({
        model: google('gemini-2.0-flash-lite'),
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural AI expert specializing in grape farming in India.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      })

      const parsed = JSON.parse(result.text)

      if (!Array.isArray(parsed)) {
        throw new Error('Expected array response')
      }

      const insights: WeatherInsightData[] = parsed.slice(0, 3).map((insight) => ({
        type: insight.type || 'weather_advisory',
        priority: ['critical', 'high', 'medium', 'low'].includes(insight.priority)
          ? insight.priority
          : 'medium',
        title: insight.title || 'Weather Advisory',
        subtitle: insight.subtitle || 'Check current conditions',
        confidence: Math.min(Math.max(insight.confidence || 0.5, 0), 1),
        timeRelevant: Boolean(insight.timeRelevant),
        actionLabel: insight.actionLabel || 'View Details'
      }))

      return { success: true, data: insights }
    } catch (aiError) {
      // AI service failed, return empty array as fallback
      return {
        success: true,
        data: [],
        fallback: true
      }
    }
  } catch (error) {
    console.error('Weather insights error:', error)
    return {
      success: false,
      error: 'Failed to generate weather insights',
      data: []
    }
  }
}

/**
 * Generate financial analysis based on expense data
 */
export async function generateFinancialAnalysis(data: { expenses: any[]; historicalData?: any[] }) {
  try {
    if (!data.expenses && !data.historicalData) {
      return {
        success: false,
        error: 'Expense data is required'
      }
    }

    const context = {
      recentExpenses: data.expenses?.slice(0, 10) || [],
      totalCurrentSpend: data.expenses?.reduce((sum, exp) => sum + (exp.cost || 0), 0) || 0,
      historicalData: data.historicalData?.slice(0, 20) || []
    }

    const prompt = `
You are a financial analyst specializing in agricultural expenses for grape farming.

Analyze the spending pattern and provide insights:
${JSON.stringify(context)}

Compare current spending with historical patterns and identify:
1. Spending trends and variations
2. Unusual expenses or cost spikes
3. Optimization opportunities
4. Risk factors for budget overruns

Return ONLY valid JSON:
{
  "trend": "increasing|decreasing|stable",
  "varianceFromAverage": number (percentage, can be negative),
  "recommendation": "specific actionable advice",
  "confidence": number (0.0-1.0),
  "nextReviewDate": "YYYY-MM-DD",
  "riskFactors": ["list of identified risks"]
}`

    try {
      const result = await generateText({
        model: google('gemini-2.0-flash-lite'),
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst specializing in agricultural expenses for grape farming.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })

      const parsed = JSON.parse(result.text)

      const analysis: FinancialAnalysisData = {
        trend: ['increasing', 'decreasing', 'stable'].includes(parsed.trend) ? parsed.trend : 'stable',
        varianceFromAverage: parsed.varianceFromAverage || 0,
        recommendation: parsed.recommendation || 'Monitor expenses regularly',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
        nextReviewDate:
          parsed.nextReviewDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []
      }

      return { success: true, data: analysis }
    } catch (aiError) {
      // AI service failed, use fallback analysis
      const fallbackAnalysis: FinancialAnalysisData = {
        trend: 'stable',
        varianceFromAverage: 0,
        recommendation: 'Monitor expenses regularly for better insights',
        confidence: 0.5,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: []
      }

      return {
        success: true,
        data: fallbackAnalysis,
        fallback: true
      }
    }
  } catch (error) {
    console.error('Financial analysis error:', error)
    return {
      success: false,
      error: 'Failed to analyze financial data'
    }
  }
}

/**
 * Generate growth analysis for a farm
 */
export async function generateGrowthAnalysis(data: { farmData: any; activities?: any[] }) {
  try {
    if (!data.farmData) {
      return {
        success: false,
        error: 'Farm data is required'
      }
    }

    const plantingDate = data.farmData.plantingDate
      ? new Date(data.farmData.plantingDate)
      : new Date()
    const daysSincePlanting = Math.floor(
      (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const context = {
      crop: data.farmData.crop,
      cropVariety: data.farmData.cropVariety,
      plantingDate: data.farmData.plantingDate,
      daysSincePlanting,
      region: data.farmData.region,
      recentActivities: data.activities?.slice(0, 10) || []
    }

    const prompt = `
You are an agricultural expert specializing in grape cultivation.

Analyze the growth stage and provide insights:
${JSON.stringify(context)}

Determine:
1. Current growth stage based on days since planting
2. Projected harvest date
3. Overall health assessment (0-100 score)
4. Stage-specific recommendations
5. Potential risks to monitor

Return ONLY valid JSON:
{
  "currentStage": "stage name",
  "daysSincePlanting": number,
  "projectedHarvestDate": "YYYY-MM-DD",
  "healthScore": number (0-100),
  "recommendations": ["list of actionable recommendations"],
  "risks": ["list of potential risks"]
}`

    try {
      const result = await generateText({
        model: google('gemini-2.0-flash-lite'),
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural expert specializing in grape cultivation.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })

      const parsed = JSON.parse(result.text)

      const analysis: GrowthAnalysisData = {
        currentStage: parsed.currentStage || 'Unknown',
        daysSincePlanting: parsed.daysSincePlanting || daysSincePlanting,
        projectedHarvestDate:
          parsed.projectedHarvestDate ||
          new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        healthScore: Math.min(Math.max(parsed.healthScore || 75, 0), 100),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : []
      }

      return { success: true, data: analysis }
    } catch (aiError) {
      // AI service failed, use fallback analysis
      const fallbackAnalysis: GrowthAnalysisData = {
        currentStage: 'Growing',
        daysSincePlanting,
        projectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        healthScore: 75,
        recommendations: ['Monitor crop regularly', 'Maintain irrigation schedule'],
        risks: []
      }

      return {
        success: true,
        data: fallbackAnalysis,
        fallback: true
      }
    }
  } catch (error) {
    console.error('Growth analysis error:', error)
    return {
      success: false,
      error: 'Failed to analyze growth data'
    }
  }
}
