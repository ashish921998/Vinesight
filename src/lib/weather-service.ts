import { OpenMeteoWeatherService, OpenMeteoWeatherData } from './open-meteo-weather'

export interface WeatherData {
  current: CurrentWeather
  forecast: ForecastDay[]
  location: LocationData
  lastUpdated: Date
}

export interface CurrentWeather {
  temperature: number // °C
  humidity: number // %
  windSpeed: number // km/h
  windDirection: string
  pressure: number // hPa
  visibility: number // km
  uvIndex: number
  cloudCover: number // %
  condition: string
  conditionCode: number
  isDay: boolean
  precipitation: number // mm
  feelsLike: number // °C
}

export interface ForecastDay {
  date: string
  maxTemp: number // °C
  minTemp: number // °C
  avgTemp: number // °C
  maxHumidity: number // %
  minHumidity: number // %
  avgHumidity: number // %
  precipitation: number // mm
  precipitationProbability: number // %
  windSpeed: number // km/h
  condition: string
  conditionCode: number
  uvIndex: number
  sunrise: string
  sunset: string
  dayLength: number // hours
  et0?: number // Reference evapotranspiration from Open-Meteo (mm/day)
}

export interface LocationData {
  name: string
  region: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}

export interface WeatherAlerts {
  irrigation: {
    shouldIrrigate: boolean
    reason: string
    urgency: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
  pest: {
    riskLevel: 'low' | 'medium' | 'high'
    conditions: string[]
    precautions: string[]
  }
  harvest: {
    isOptimal: boolean
    conditions: string
    recommendations: string[]
  }
}

export interface ETc {
  dailyETc: number // mm/day
  dailyETcOpenMeteo: number // mm/day (using Open-Meteo ET0)
  dailyETcCalculated: number // mm/day (using calculated ET0)
  weeklyETc: number // mm/week
  monthlyETc: number // mm/month
  cropCoefficient: number
  referenceET: number // mm/day
  referenceETOpenMeteo: number // mm/day (direct from Open-Meteo)
  referenceETCalculated: number // mm/day (calculated locally)
  growthStage: string
}

// Weather service for grape farming using Open-Meteo API
export class WeatherService {
  // Default coordinates for Maharashtra grape region if no location provided
  private static readonly DEFAULT_COORDS = {
    latitude: 19.0825,
    longitude: 73.1963,
    name: 'Nashik',
    region: 'Maharashtra',
    country: 'India'
  }

  static async getCurrentWeather(latitude?: number, longitude?: number): Promise<WeatherData> {
    const coords =
      latitude && longitude
        ? { latitude, longitude, name: 'Custom Location', region: 'Unknown', country: 'Unknown' }
        : this.DEFAULT_COORDS

    try {
      // Get current weather and 7-day forecast from Open-Meteo
      const forecastData = await OpenMeteoWeatherService.getWeatherForecast(
        coords.latitude,
        coords.longitude,
        7
      )

      if (!forecastData || forecastData.length === 0) {
        throw new Error('No weather data received from Open-Meteo API')
      }

      console.log('Using Open-Meteo API with ET0 data')
      return this.parseWeatherData(forecastData, coords)
    } catch (error) {
      console.error('Error fetching weather data from Open-Meteo:', error)
      throw new Error(
        `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private static parseWeatherData(
    forecastData: OpenMeteoWeatherData[],
    coords: { latitude: number; longitude: number; name: string; region: string; country: string }
  ): WeatherData {
    const current = forecastData[0] // Today's data
    const forecast = forecastData

    // Convert Open-Meteo data to our format
    const currentWeather: CurrentWeather = {
      temperature: Math.round(current.temperatureMean),
      humidity: Math.round(current.relativeHumidityMean),
      windSpeed: Math.round(current.windSpeed10m * 3.6), // Convert m/s to km/h
      windDirection: this.getWindDirection(current.windSpeed10m),
      pressure: 1013, // Open-Meteo doesn't provide pressure in free tier, use standard
      visibility: 10, // Open-Meteo doesn't provide visibility in free tier, use standard
      uvIndex: this.estimateUVIndex(current.shortwaveRadiationSum),
      cloudCover: this.estimateCloudCover(current.sunshineDuration),
      condition: this.getWeatherCondition(current.temperatureMean, current.precipitationSum),
      conditionCode: this.getConditionCode(current.temperatureMean, current.precipitationSum),
      isDay: true, // Open-Meteo daily data doesn't distinguish day/night
      precipitation: current.precipitationSum,
      feelsLike: Math.round(current.temperatureMean) // Simplified feels like
    }

    const forecastDays: ForecastDay[] = forecast.map((day) => ({
      date: day.date,
      maxTemp: Math.round(day.temperatureMax),
      minTemp: Math.round(day.temperatureMin),
      avgTemp: Math.round(day.temperatureMean),
      maxHumidity: Math.round(day.relativeHumidityMax),
      minHumidity: Math.round(day.relativeHumidityMin),
      avgHumidity: Math.round(day.relativeHumidityMean),
      precipitation: day.precipitationSum,
      precipitationProbability: this.estimatePrecipitationProbability(day.precipitationSum),
      windSpeed: Math.round(day.windSpeed10m * 3.6), // Convert m/s to km/h
      condition: this.getWeatherCondition(day.temperatureMean, day.precipitationSum),
      conditionCode: this.getConditionCode(day.temperatureMean, day.precipitationSum),
      uvIndex: this.estimateUVIndex(day.shortwaveRadiationSum),
      sunrise: '06:00 AM', // Open-Meteo doesn't provide sunrise/sunset in daily data
      sunset: '06:00 PM', // Open-Meteo doesn't provide sunrise/sunset in daily data
      dayLength: 12, // Default day length
      et0: day.et0FaoEvapotranspiration // ET0 from Open-Meteo
    }))

    return {
      current: currentWeather,
      forecast: forecastDays,
      location: {
        name: coords.name,
        region: coords.region,
        country: coords.country,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezone: forecast[0]?.timezone || 'UTC'
      },
      lastUpdated: new Date()
    }
  }

  // Helper methods for weather condition estimation
  private static getWeatherCondition(temp: number, precipitation: number): string {
    if (precipitation > 5) return 'Rain'
    if (precipitation > 0) return 'Light rain'
    if (temp > 30) return 'Hot'
    if (temp > 20) return 'Partly cloudy'
    if (temp > 10) return 'Cloudy'
    return 'Cool'
  }

  private static getConditionCode(temp: number, precipitation: number): number {
    if (precipitation > 5) return 1186 // Moderate rain
    if (precipitation > 0) return 1153 // Light rain
    if (temp > 30) return 1000 // Sunny
    if (temp > 20) return 1003 // Partly cloudy
    if (temp > 10) return 1006 // Cloudy
    return 1009 // Overcast
  }

  private static getWindDirection(windSpeed: number): string {
    // Simplified wind direction based on speed
    if (windSpeed < 2) return 'N'
    if (windSpeed < 4) return 'NE'
    if (windSpeed < 6) return 'E'
    if (windSpeed < 8) return 'SE'
    return 'S'
  }

  private static estimateUVIndex(solarRadiation: number): number {
    // Convert MJ/m²/day to UV index (simplified)
    // Max solar radiation ~25 MJ/m²/day corresponds to UV index 11
    return Math.min(11, Math.round((solarRadiation / 25) * 11))
  }

  private static estimateCloudCover(sunshineDuration: number): number {
    // Convert sunshine duration to cloud cover percentage
    // 12 hours of sunshine = 0% cloud cover, 0 hours = 100% cloud cover
    const maxSunshine = 12
    return Math.max(
      0,
      Math.min(100, Math.round(((maxSunshine - sunshineDuration) / maxSunshine) * 100))
    )
  }

  private static estimatePrecipitationProbability(precipitation: number): number {
    // Simple probability estimation based on precipitation amount
    if (precipitation === 0) return 0
    if (precipitation < 2) return 30
    if (precipitation < 5) return 60
    if (precipitation < 10) return 80
    return 90
  }

  // Calculate Evapotranspiration (ETc) for grapes using Open-Meteo ET0
  static calculateETc(weather: WeatherData, growthStage: string): ETc {
    const current = weather.current
    const forecast = weather.forecast

    // Crop coefficients for grape growth stages
    const cropCoefficients: { [key: string]: number } = {
      Budbreak: 0.3,
      'Leaf development': 0.5,
      Flowering: 0.7,
      'Fruit set': 0.8,
      Veraison: 0.8,
      Harvest: 0.6,
      'Post-harvest': 0.4,
      Dormant: 0.2
    }

    const kc = cropCoefficients[growthStage] || 0.7

    // Get ET0 from Open-Meteo
    let et0OpenMeteo: number = 0
    if (
      forecast[0] &&
      forecast[0].et0 !== undefined &&
      forecast[0].et0 !== null &&
      forecast[0].et0 > 0
    ) {
      et0OpenMeteo = forecast[0].et0
      console.log('ET0 from Open-Meteo:', et0OpenMeteo)
    } else {
      console.log('Open-Meteo ET0 not available')
    }

    // Always calculate ET0 locally using FAO Penman-Monteith equation
    console.log('Calculating ET0 locally with improved FAO Penman-Monteith')
    const temp = current.temperature // °C
    const humidity = current.humidity // %
    const windSpeed = current.windSpeed // km/h
    const pressure = current.pressure // hPa
    const altitude = 200 // Default altitude in meters (should be configurable)

    // Convert units properly
    const pressureKpa = pressure / 10 // Convert hPa to kPa
    const u2 = windSpeed * 0.277778 // Convert km/h to m/s

    // Validate input ranges
    if (temp < -50 || temp > 60) {
      console.warn('Temperature out of reasonable range:', temp)
    }
    if (humidity < 0 || humidity > 100) {
      console.warn('Humidity out of range:', humidity)
    }
    if (u2 < 0 || u2 > 20) {
      console.warn('Wind speed out of reasonable range:', u2)
    }

    // 1. Calculate saturation vapor pressure (es) in kPa
    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3))

    // 2. Calculate actual vapor pressure (ea) in kPa
    const ea = (humidity / 100) * es

    // 3. Calculate vapor pressure deficit (es - ea) in kPa
    const vpd = es - ea

    // 4. Calculate psychrometric constant (gamma) in kPa/°C
    const gamma = 0.000665 * pressureKpa

    // 5. Calculate slope of saturation vapor pressure curve (delta) in kPa/°C
    const delta = (4098 * es) / Math.pow(temp + 237.3, 2)

    // 6. Estimate net radiation (Rn) in MJ/m²/day
    // Using improved solar radiation estimation
    const solarRadiation = this.estimateSolarRadiationImproved(
      current.uvIndex,
      current.cloudCover,
      temp
    )

    // Estimate net shortwave radiation (assuming clear sky albedo = 0.23)
    const rns = (1 - 0.23) * solarRadiation

    // Estimate net longwave radiation (simplified)
    // Rnl = σ * [(Tmax+273.16)^4 + (Tmin+273.16)^4]/2 * (0.34 - 0.14*sqrt(ea)) * (1.35*Rs/Rso - 0.35)
    const stefanBoltzmann = 4.903e-9 // MJ K^-4 m^-2 day^-1
    const rnl = stefanBoltzmann * Math.pow(temp + 273.16, 4) * (0.34 - 0.14 * Math.sqrt(ea)) * 0.75

    // Net radiation
    const rn = rns - rnl

    // 7. Soil heat flux (G) - assumed negligible for daily calculations
    const G = 0

    // 8. FAO Penman-Monteith equation
    // ET0 = [0.408 * Δ * (Rn - G) + γ * (900/(T + 273)) * u2 * (es - ea)] / [Δ + γ * (1 + 0.34 * u2)]
    const denominator = delta + gamma * (1 + 0.34 * u2)

    // Prevent division by zero or very small numbers
    if (denominator <= 0.01) {
      console.warn('Denominator too small in ET0 calculation:', denominator)
    }

    const et0Calculated =
      (0.408 * delta * (rn - G) + gamma * (900 / (temp + 273)) * u2 * vpd) / denominator

    // Validate ET0 result - should be reasonable for most conditions
    const et0Final = Math.max(0, Math.min(15, et0Calculated)) // Limit to 0-15 mm/day

    if (et0Final !== et0Calculated) {
      console.warn('ET0 value clamped from', et0Calculated.toFixed(2), 'to', et0Final.toFixed(2))
    }

    console.log('ET0 calculation details:', {
      temp,
      humidity,
      windSpeed,
      pressure,
      es: es.toFixed(3),
      ea: ea.toFixed(3),
      vpd: vpd.toFixed(3),
      delta: delta.toFixed(4),
      gamma: gamma.toFixed(4),
      rn: rn.toFixed(2),
      denominator: denominator.toFixed(4),
      et0Calculated: et0Calculated.toFixed(2),
      et0Final: et0Final.toFixed(2)
    })

    // Calculate ETc using both ET0 values
    const dailyETcOpenMeteo = et0OpenMeteo > 0 ? Math.max(0, et0OpenMeteo * kc) : 0
    const dailyETcCalculated = Math.max(0, et0Final * kc)

    // Use Open-Meteo ET0 if available, otherwise use calculated value
    const et0 = et0OpenMeteo > 0 ? et0OpenMeteo : et0Final
    const dailyETc = Math.max(0, et0 * kc)

    // Calculate weekly and monthly averages (using primary ETc)
    const weeklyETc = dailyETc * 7
    const monthlyETc = dailyETc * 30

    return {
      dailyETc: Math.round(dailyETc * 100) / 100,
      dailyETcOpenMeteo: Math.round(dailyETcOpenMeteo * 100) / 100,
      dailyETcCalculated: Math.round(dailyETcCalculated * 100) / 100,
      weeklyETc: Math.round(weeklyETc * 100) / 100,
      monthlyETc: Math.round(monthlyETc * 100) / 100,
      cropCoefficient: kc,
      referenceET: Math.round(et0 * 100) / 100,
      referenceETOpenMeteo: Math.round(et0OpenMeteo * 100) / 100,
      referenceETCalculated: Math.round(et0Final * 100) / 100,
      growthStage
    }
  }

  private static estimateSolarRadiation(uvIndex: number, cloudCover: number): number {
    // Simplified solar radiation estimation based on UV index and cloud cover
    const maxRadiation = 25 // MJ/m²/day for clear sky
    const uvFactor = Math.min(uvIndex / 11, 1) // Normalize UV index
    const cloudFactor = (100 - cloudCover) / 100 // Reduce radiation based on cloud cover
    return maxRadiation * uvFactor * cloudFactor
  }

  private static estimateSolarRadiationImproved(
    uvIndex: number,
    cloudCover: number,
    temperature: number
  ): number {
    // Improved solar radiation estimation considering temperature and season
    const maxRadiation = 25 // MJ/m²/day for clear sky at sea level

    // Temperature-based adjustment (higher temp = more radiation)
    const tempFactor = Math.max(0.3, Math.min(1.0, (temperature + 10) / 40))

    // UV index normalization (more accurate than simple linear)
    const uvFactor = Math.pow(Math.min(uvIndex / 11, 1), 0.8)

    // Cloud cover impact (non-linear relationship)
    const cloudFactor = Math.pow((100 - cloudCover) / 100, 1.2)

    // Seasonal adjustment (simplified - would need day of year for accuracy)
    const seasonalFactor = 0.9 // Default for moderate season

    return maxRadiation * tempFactor * uvFactor * cloudFactor * seasonalFactor
  }

  // Generate weather-based alerts for farming
  static generateWeatherAlerts(weather: WeatherData, etc: ETc): WeatherAlerts {
    const current = weather.current
    const forecast = weather.forecast.slice(0, 3) // Next 3 days

    // Irrigation recommendations
    const irrigationAlert = this.generateIrrigationAlert(weather, etc)

    // Pest and disease risk assessment
    const pestAlert = this.generatePestAlert(weather)

    // Harvest timing recommendations
    const harvestAlert = this.generateHarvestAlert(weather)

    return {
      irrigation: irrigationAlert,
      pest: pestAlert,
      harvest: harvestAlert
    }
  }

  private static generateIrrigationAlert(
    weather: WeatherData,
    etc: ETc
  ): WeatherAlerts['irrigation'] {
    const current = weather.current
    const forecast = weather.forecast.slice(0, 3)

    // Check recent/upcoming precipitation
    const upcomingRain = forecast.reduce((sum, day) => sum + day.precipitation, 0)
    const rainProbability = Math.max(...forecast.map((day) => day.precipitationProbability))

    const shouldIrrigate = upcomingRain < etc.dailyETc * 2 && rainProbability < 60

    let urgency: 'low' | 'medium' | 'high' = 'medium'
    let reason = ''
    const recommendations: string[] = []

    if (current.temperature > 35) {
      urgency = 'high'
      reason = 'High temperature stress detected'
      recommendations.push('Increase irrigation frequency')
      recommendations.push('Consider early morning irrigation')
    } else if (current.humidity < 30) {
      urgency = 'high'
      reason = 'Low humidity increasing water demand'
      recommendations.push('Monitor soil moisture closely')
    } else if (upcomingRain < 5 && rainProbability < 30) {
      urgency = 'medium'
      reason = 'Low rainfall expected in next 3 days'
      recommendations.push('Plan irrigation for next 24-48 hours')
    } else {
      urgency = 'low'
      reason = 'Adequate moisture conditions expected'
      recommendations.push('Monitor soil moisture levels')
    }

    if (current.windSpeed > 20) {
      recommendations.push('High winds detected - avoid overhead irrigation')
    }

    return {
      shouldIrrigate,
      reason,
      urgency,
      recommendations
    }
  }

  private static generatePestAlert(weather: WeatherData): WeatherAlerts['pest'] {
    const current = weather.current
    const forecast = weather.forecast.slice(0, 3)

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const conditions: string[] = []
    const precautions: string[] = []

    // High humidity + moderate temperature = fungal risk
    if (current.humidity > 80 && current.temperature > 20 && current.temperature < 30) {
      riskLevel = 'high'
      conditions.push('High humidity and optimal temperature for fungal diseases')
      precautions.push('Monitor for powdery mildew and downy mildew')
      precautions.push('Improve air circulation around vines')
    }

    // Wet conditions
    const recentRain =
      current.precipitation + forecast.slice(0, 2).reduce((sum, day) => sum + day.precipitation, 0)
    if (recentRain > 10) {
      if (riskLevel === 'low') riskLevel = 'medium'
      conditions.push('Wet conditions increase disease pressure')
      precautions.push('Inspect for leaf spot diseases')
      precautions.push('Ensure proper drainage')
    }

    // Temperature extremes
    if (current.temperature > 38) {
      conditions.push('High temperature stress')
      precautions.push('Monitor for heat stress symptoms')
      precautions.push('Ensure adequate irrigation')
    } else if (current.temperature < 10) {
      conditions.push('Low temperature may affect growth')
      precautions.push('Monitor for cold damage')
    }

    // Wind conditions
    if (current.windSpeed > 30) {
      conditions.push('Strong winds may cause mechanical damage')
      precautions.push('Check trellis systems and supports')
      precautions.push('Protect young shoots')
    }

    if (conditions.length === 0) {
      conditions.push('Favorable weather conditions')
      precautions.push('Continue regular monitoring')
    }

    return {
      riskLevel,
      conditions,
      precautions
    }
  }

  private static generateHarvestAlert(weather: WeatherData): WeatherAlerts['harvest'] {
    const current = weather.current
    const forecast = weather.forecast.slice(0, 5) // Next 5 days

    // Optimal harvest conditions: dry, mild temperatures, low humidity
    const upcomingRain = forecast.reduce((sum, day) => sum + day.precipitation, 0)
    const avgTemp = forecast.reduce((sum, day) => sum + day.avgTemp, 0) / forecast.length
    const maxRainProb = Math.max(...forecast.map((day) => day.precipitationProbability))

    const isOptimal = upcomingRain < 2 && avgTemp > 15 && avgTemp < 30 && maxRainProb < 30

    let conditions = ''
    const recommendations: string[] = []

    if (isOptimal) {
      conditions = 'Excellent harvest conditions expected'
      recommendations.push('Ideal weather window for harvesting')
      recommendations.push('Plan harvest operations for the next few days')
    } else if (upcomingRain > 10 || maxRainProb > 70) {
      conditions = 'Wet weather expected - not ideal for harvest'
      recommendations.push('Delay harvest if possible')
      recommendations.push('Monitor fruit condition closely')
      recommendations.push('Ensure proper post-harvest handling')
    } else if (avgTemp > 35) {
      conditions = 'High temperatures may affect fruit quality'
      recommendations.push('Plan harvest for early morning hours')
      recommendations.push('Ensure rapid cooling of harvested grapes')
    } else {
      conditions = 'Moderate harvest conditions'
      recommendations.push('Monitor weather forecasts closely')
      recommendations.push('Be prepared to adjust harvest timing')
    }

    return {
      isOptimal,
      conditions,
      recommendations
    }
  }

  // Irrigation scheduling based on weather and ETc
  static generateIrrigationSchedule(
    weather: WeatherData,
    etc: ETc,
    soilType: string = 'medium'
  ): {
    schedule: {
      date: string
      duration: number // hours
      amount: number // mm
      reason: string
      priority: 'low' | 'medium' | 'high'
    }[]
    totalWaterNeed: number
  } {
    const schedule = []
    const forecast = weather.forecast.slice(0, 7) // Next 7 days

    // Soil water holding capacity (mm per 30cm depth)
    const soilCapacity = {
      sandy: 80,
      medium: 120,
      clay: 160
    }

    const capacity = soilCapacity[soilType as keyof typeof soilCapacity] || 120
    let soilMoisture = capacity * 0.6 // Assume 60% initial moisture
    let totalWaterNeed = 0

    for (const day of forecast) {
      // Daily water balance
      const dailyET = etc.dailyETc
      const rainfall = day.precipitation

      // Update soil moisture
      soilMoisture = soilMoisture - dailyET + rainfall

      // Check if irrigation needed
      const threshold = capacity * 0.4 // Irrigate when soil moisture drops to 40%

      if (soilMoisture < threshold && day.precipitationProbability < 70) {
        const deficit = threshold - soilMoisture
        const irrigationAmount = Math.min(deficit + dailyET, capacity - soilMoisture)
        const duration = irrigationAmount / 4 // Assume 4mm/hour irrigation rate

        let priority: 'low' | 'medium' | 'high' = 'medium'
        let reason = 'Scheduled irrigation based on soil moisture'

        if (day.maxTemp > 35) {
          priority = 'high'
          reason = 'High temperature stress - critical irrigation needed'
        } else if (soilMoisture < capacity * 0.25) {
          priority = 'high'
          reason = 'Critical soil moisture level'
        } else if (day.precipitationProbability < 30) {
          priority = 'medium'
          reason = 'Low rainfall probability - maintain soil moisture'
        }

        schedule.push({
          date: day.date,
          duration: Math.round(duration * 100) / 100,
          amount: Math.round(irrigationAmount * 100) / 100,
          reason,
          priority
        })

        soilMoisture += irrigationAmount
        totalWaterNeed += irrigationAmount
      }
    }

    return {
      schedule,
      totalWaterNeed: Math.round(totalWaterNeed * 100) / 100
    }
  }
}
