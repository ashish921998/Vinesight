import { AIService } from './ai-service'

export interface MarketData {
  date: Date
  location: string
  market: string
  grapeVariety: string
  quality: 'premium' | 'standard' | 'low'
  pricePerKg: number // INR
  volume: number // kg traded
  trend: 'up' | 'down' | 'stable'
  demandLevel: 'high' | 'medium' | 'low'
  source: 'agmarknet' | 'mandi' | 'auction' | 'direct'
}

export interface PricePrediction {
  predictedPrice: number
  priceRange: { min: number; max: number }
  confidence: number // 0-100
  factors: PriceInfluenceFactor[]
  recommendations: MarketRecommendation[]
  optimalSellingWindow: {
    start: Date
    end: Date
    expectedPrice: number
  }
}

export interface PriceInfluenceFactor {
  factor: string
  impact: number // -100 to +100
  description: string
  weight: number // 0-1
}

export interface MarketRecommendation {
  type: 'timing' | 'quality' | 'marketing' | 'storage' | 'processing'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  expectedBenefit: string
  timeframe: string
}

export interface MarketForecast {
  shortTerm: {
    // 1-3 months
    avgPrice: number
    trend: 'bullish' | 'bearish' | 'neutral'
    volatility: 'high' | 'medium' | 'low'
    keyDrivers: string[]
  }
  mediumTerm: {
    // 3-6 months
    avgPrice: number
    trend: 'bullish' | 'bearish' | 'neutral'
    seasonalFactors: string[]
  }
  longTerm: {
    // 6-12 months
    avgPrice: number
    marketOutlook: string
    structuralChanges: string[]
  }
}

export interface SupplyChainInsight {
  stage: 'farm' | 'transport' | 'wholesale' | 'retail' | 'processing'
  margin: number // %
  costs: { [key: string]: number }
  opportunities: string[]
  risks: string[]
}

export class MarketIntelligenceService {
  private static marketData: MarketData[] = []
  private static priceHistory: Map<string, number[]> = new Map()

  // Initialize with sample data (in production, this would fetch from APIs)
  static async initialize() {
    // Sample market data for demonstration
    const sampleData = this.generateSampleMarketData()
    this.marketData = sampleData
    this.buildPriceHistory()
  }

  // Get current market prices for different grape varieties and qualities
  static getCurrentMarketPrices(
    location?: string,
    variety?: string
  ): { [key: string]: { price: number; trend: string; date: Date } } {
    const recent = this.marketData
      .filter((data) => {
        const daysDiff = (Date.now() - data.date.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7 // Last 7 days
      })
      .filter((data) => !location || data.location.includes(location))
      .filter((data) => !variety || data.grapeVariety === variety)

    const prices: { [key: string]: { price: number; trend: string; date: Date } } = {}

    recent.forEach((data) => {
      const key = `${data.grapeVariety}_${data.quality}`
      if (!prices[key] || data.date > prices[key].date) {
        prices[key] = {
          price: data.pricePerKg,
          trend: data.trend,
          date: data.date
        }
      }
    })

    return prices
  }

  // Predict grape prices based on multiple factors
  static async predictGrapePrices(
    variety: string,
    quality: 'premium' | 'standard' | 'low',
    location: string,
    harvestDate: Date,
    estimatedQuantity: number
  ): Promise<PricePrediction> {
    // Analyze historical price patterns
    const historicalAnalysis = this.analyzeHistoricalPrices(variety, quality)

    // Consider seasonal factors
    const seasonalFactors = this.getSeasonalFactors(harvestDate)

    // Market demand analysis
    const demandAnalysis = this.analyzeDemand(variety, location, harvestDate)

    // Supply analysis
    const supplyAnalysis = this.analyzeSupply(variety, harvestDate)

    // Weather impact on quality and supply
    const weatherImpact = await this.assessWeatherImpact(harvestDate)

    // Calculate base price prediction
    const basePrediction = this.calculateBasePrediction(
      historicalAnalysis,
      seasonalFactors,
      demandAnalysis,
      supplyAnalysis
    )

    // Apply AI-based adjustments
    const aiAdjustment = await this.getAIPriceAdjustment({
      variety,
      quality,
      location,
      harvestDate,
      quantity: estimatedQuantity,
      weatherImpact
    })

    const predictedPrice = basePrediction * (1 + aiAdjustment.adjustment)
    const confidence = aiAdjustment.confidence

    // Determine optimal selling window
    const optimalWindow = this.calculateOptimalSellingWindow(
      harvestDate,
      predictedPrice,
      seasonalFactors
    )

    return {
      predictedPrice,
      priceRange: {
        min: predictedPrice * 0.85,
        max: predictedPrice * 1.15
      },
      confidence,
      factors: this.compilePriceFactors(
        seasonalFactors,
        demandAnalysis,
        supplyAnalysis,
        weatherImpact
      ),
      recommendations: this.generateMarketRecommendations(
        predictedPrice,
        quality,
        optimalWindow,
        demandAnalysis
      ),
      optimalSellingWindow: optimalWindow
    }
  }

  // Get comprehensive market forecast
  static async getMarketForecast(variety: string, location: string): Promise<MarketForecast> {
    const currentPrice = this.getCurrentAveragePrice(variety)

    return {
      shortTerm: {
        avgPrice: currentPrice * (0.95 + Math.random() * 0.1),
        trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
        volatility: 'medium',
        keyDrivers: [
          'Seasonal demand patterns',
          'Local harvest timing',
          'Weather conditions',
          'Export demand'
        ]
      },
      mediumTerm: {
        avgPrice: currentPrice * (0.9 + Math.random() * 0.2),
        trend: 'neutral',
        seasonalFactors: [
          'Festival season increased demand',
          'Processing industry requirements',
          'International market trends'
        ]
      },
      longTerm: {
        avgPrice: currentPrice * (1.05 + Math.random() * 0.1),
        marketOutlook: 'Growing export opportunities and premium segment expansion',
        structuralChanges: [
          'Increased focus on quality over quantity',
          'Direct farmer-to-consumer channels',
          'Organic and sustainable grape demand growth'
        ]
      }
    }
  }

  // Analyze supply chain margins and opportunities
  static analyzeSupplyChain(variety: string, quality: string): SupplyChainInsight[] {
    return [
      {
        stage: 'farm',
        margin: 35,
        costs: {
          Production: 60,
          Labor: 25,
          Materials: 15
        },
        opportunities: [
          'Direct-to-consumer sales',
          'Value-added processing',
          'Organic certification premium'
        ],
        risks: ['Weather dependency', 'Price volatility', 'Input cost inflation']
      },
      {
        stage: 'wholesale',
        margin: 20,
        costs: {
          Transportation: 8,
          Storage: 5,
          Packaging: 4,
          Operations: 3
        },
        opportunities: [
          'Cold storage facilities',
          'Quality grading systems',
          'Regional distribution networks'
        ],
        risks: ['Inventory management', 'Quality deterioration', 'Payment delays']
      },
      {
        stage: 'retail',
        margin: 30,
        costs: {
          'Store operations': 15,
          Marketing: 8,
          Wastage: 5,
          Staff: 2
        },
        opportunities: ['Premium positioning', 'Brand partnerships', 'Online sales channels'],
        risks: ['Consumer preference shifts', 'Competition', 'Seasonal demand variations']
      }
    ]
  }

  // Get market intelligence alerts
  static getMarketAlerts(userPreferences: {
    varieties: string[]
    locations: string[]
    priceThresholds: { [variety: string]: number }
  }): {
    type: 'price' | 'demand' | 'supply' | 'opportunity'
    message: string
    priority: 'high' | 'medium' | 'low'
  }[] {
    const alerts = []

    // Price alerts
    const currentPrices = this.getCurrentMarketPrices()
    Object.entries(currentPrices).forEach(([key, data]) => {
      const [variety, quality] = key.split('_')
      const threshold = userPreferences.priceThresholds[variety]

      if (threshold && data.price >= threshold) {
        alerts.push({
          type: 'price' as const,
          message: `${variety} (${quality}) price reached ₹${data.price}/kg - Above your target of ₹${threshold}/kg`,
          priority: 'high' as const
        })
      }
    })

    // Market opportunity alerts
    alerts.push({
      type: 'opportunity' as const,
      message: 'Premium grape demand increasing by 15% in metropolitan markets',
      priority: 'medium' as const
    })

    return alerts
  }

  private static generateSampleMarketData(): MarketData[] {
    const data: MarketData[] = []
    const varieties = ['cabernet_sauvignon', 'chardonnay', 'sauvignon_blanc']
    const qualities: ('premium' | 'standard' | 'low')[] = ['premium', 'standard', 'low']
    const locations = ['Pune', 'Nashik', 'Sangli', 'Solapur']
    const markets = ['APMC', 'Direct Sale', 'Cooperative', 'Export']

    for (let i = 0; i < 90; i++) {
      // 3 months of daily data
      const date = new Date()
      date.setDate(date.getDate() - i)

      varieties.forEach((variety) => {
        qualities.forEach((quality) => {
          locations.forEach((location, locIndex) => {
            const basePrice = this.getBasePrice(variety, quality)
            const priceVariation = (Math.random() - 0.5) * 0.2 // ±20% variation
            const seasonalMultiplier = this.getSeasonalMultiplier(date)

            data.push({
              date,
              location,
              market: markets[Math.floor(Math.random() * markets.length)],
              grapeVariety: variety,
              quality,
              pricePerKg: Math.round(basePrice * (1 + priceVariation) * seasonalMultiplier),
              volume: Math.round(100 + Math.random() * 500), // 100-600 kg
              trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'stable' : 'down',
              demandLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
              source: 'agmarknet'
            })
          })
        })
      })
    }

    return data
  }

  private static getBasePrice(variety: string, quality: 'premium' | 'standard' | 'low'): number {
    const basePrices = {
      cabernet_sauvignon: { premium: 80, standard: 50, low: 30 },
      chardonnay: { premium: 85, standard: 55, low: 35 },
      sauvignon_blanc: { premium: 75, standard: 45, low: 28 },
      pinot_noir: { premium: 90, standard: 60, low: 40 },
      merlot: { premium: 78, standard: 48, low: 32 },
      riesling: { premium: 72, standard: 42, low: 25 }
    }

    return basePrices[variety as keyof typeof basePrices]?.[quality] || 50
  }

  private static getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth()
    // Higher prices during festival seasons (Oct-Dec) and summer (Mar-May)
    if (month >= 9 || month <= 1) return 1.1 // Oct-Jan
    if (month >= 2 && month <= 4) return 1.05 // Mar-May
    return 0.95 // Other months
  }

  private static buildPriceHistory() {
    this.marketData.forEach((data) => {
      const key = `${data.grapeVariety}_${data.quality}_${data.location}`
      if (!this.priceHistory.has(key)) {
        this.priceHistory.set(key, [])
      }
      this.priceHistory.get(key)!.push(data.pricePerKg)
    })
  }

  private static analyzeHistoricalPrices(variety: string, quality: string) {
    const relevantData = this.marketData.filter(
      (d) => d.grapeVariety === variety && d.quality === quality
    )

    const prices = relevantData.map((d) => d.pricePerKg)
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const volatility = this.calculateVolatility(prices)

    return { avgPrice, volatility, dataPoints: prices.length }
  }

  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (prices.length - 1)

    return Math.sqrt(variance) / mean // Coefficient of variation
  }

  private static getSeasonalFactors(harvestDate: Date) {
    const month = harvestDate.getMonth()
    const seasonalImpact = this.getSeasonalMultiplier(harvestDate) - 1

    return {
      impact: seasonalImpact,
      factors: this.getSeasonalFactorsList(month)
    }
  }

  private static getSeasonalFactorsList(month: number): string[] {
    const factors = {
      0: ['New Year celebrations', 'Wedding season demand'],
      1: ['Winter storage depletion', "Valentine's Day"],
      2: ['Holi festival', 'Spring season start'],
      3: ['Chaitra Navratri', 'Summer demand increase'],
      4: ['Peak summer demand', 'Ramadan'],
      5: ['Pre-monsoon storage'],
      6: ['Monsoon season', 'Guru Purnima'],
      7: ['Monsoon continues', 'Raksha Bandhan'],
      8: ['Post-monsoon', 'Ganesh Chaturthi'],
      9: ['Navratri season', 'Dussehra'],
      10: ['Diwali season', 'Wedding season'],
      11: ['Post-harvest', 'Christmas season']
    }

    return factors[month as keyof typeof factors] || ['Regular demand']
  }

  private static analyzeDemand(variety: string, location: string, harvestDate: Date) {
    const baselinedemand = Math.random() * 0.5 + 0.5 // 0.5 to 1.0
    const locationFactor = location.includes('Pune') || location.includes('Mumbai') ? 1.2 : 1.0
    const varietyFactor = variety.includes('cabernet') ? 1.1 : 1.0

    return {
      level: baselinedemand * locationFactor * varietyFactor,
      drivers: [
        'Urban consumer preference',
        'Wine industry demand',
        'Export opportunities',
        'Processing industry needs'
      ]
    }
  }

  private static analyzeSupply(variety: string, harvestDate: Date) {
    const baselineSupply = Math.random() * 0.3 + 0.7 // 0.7 to 1.0
    const seasonalFactor = this.getSeasonalMultiplier(harvestDate)

    return {
      level: baselineSupply * seasonalFactor,
      factors: [
        'Regional harvest timing',
        'Weather impact on yield',
        'Planted area changes',
        'Farmer decisions'
      ]
    }
  }

  private static async assessWeatherImpact(harvestDate: Date) {
    // Simulate weather impact assessment
    const impactScore = Math.random() * 0.4 - 0.2 // -0.2 to +0.2

    return {
      impact: impactScore,
      description:
        impactScore > 0.1
          ? 'Favorable weather conditions'
          : impactScore < -0.1
            ? 'Challenging weather conditions'
            : 'Normal weather conditions'
    }
  }

  private static calculateBasePrediction(
    historical: any,
    seasonal: any,
    demand: any,
    supply: any
  ): number {
    let prediction = historical.avgPrice

    // Apply seasonal adjustment
    prediction *= 1 + seasonal.impact

    // Apply supply-demand dynamics
    const supplyDemandRatio = supply.level / demand.level
    prediction *= 2 - supplyDemandRatio // Inverse relationship

    return prediction
  }

  private static async getAIPriceAdjustment(inputs: any) {
    // Simulate AI-based price adjustment
    const adjustment = (Math.random() - 0.5) * 0.3 // ±15%
    const confidence = 70 + Math.random() * 25 // 70-95%

    return { adjustment, confidence }
  }

  private static calculateOptimalSellingWindow(
    harvestDate: Date,
    predictedPrice: number,
    seasonalFactors: any
  ) {
    const start = new Date(harvestDate)
    start.setDate(start.getDate() + 7) // Week after harvest

    const end = new Date(start)
    end.setMonth(end.getMonth() + 2) // 2 months window

    return {
      start,
      end,
      expectedPrice: predictedPrice * 1.02 // Slight premium for timing
    }
  }

  private static compilePriceFactors(
    seasonal: any,
    demand: any,
    supply: any,
    weather: any
  ): PriceInfluenceFactor[] {
    return [
      {
        factor: 'Seasonal Demand',
        impact: seasonal.impact * 100,
        description: 'Festival seasons and market cycles affect prices',
        weight: 0.3
      },
      {
        factor: 'Supply Levels',
        impact: (1 - supply.level) * 50,
        description: 'Regional harvest volumes and competing regions',
        weight: 0.25
      },
      {
        factor: 'Market Demand',
        impact: (demand.level - 0.75) * 80,
        description: 'Consumer preference and industrial demand',
        weight: 0.25
      },
      {
        factor: 'Weather Impact',
        impact: weather.impact * 100,
        description: weather.description,
        weight: 0.2
      }
    ]
  }

  private static generateMarketRecommendations(
    predictedPrice: number,
    quality: string,
    optimalWindow: any,
    demandAnalysis: any
  ): MarketRecommendation[] {
    return [
      {
        type: 'timing',
        title: 'Optimal Selling Window',
        description: `Best selling period is ${optimalWindow.start.toLocaleDateString()} to ${optimalWindow.end.toLocaleDateString()}`,
        priority: 'high',
        expectedBenefit: 'Up to 5% price premium',
        timeframe: 'Next 2 months'
      },
      {
        type: 'quality',
        title: 'Quality Enhancement',
        description:
          quality === 'premium'
            ? 'Maintain premium quality standards for best prices'
            : 'Consider quality improvements for better market positioning',
        priority: 'medium',
        expectedBenefit: quality === 'premium' ? 'Maintain premium' : '15-25% price increase',
        timeframe: 'Current season'
      },
      {
        type: 'marketing',
        title: 'Market Channel Optimization',
        description: 'Consider direct sales to premium buyers for better margins',
        priority: 'medium',
        expectedBenefit: '10-20% better margins',
        timeframe: 'Immediate'
      }
    ]
  }

  private static getCurrentAveragePrice(variety: string): number {
    const recentPrices = this.marketData
      .filter((d) => d.grapeVariety === variety)
      .filter((d) => Date.now() - d.date.getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .map((d) => d.pricePerKg)

    return recentPrices.length > 0
      ? recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length
      : this.getBasePrice(variety, 'standard')
  }
}

// Initialize market intelligence service
MarketIntelligenceService.initialize()
