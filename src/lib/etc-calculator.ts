/**
 * ETc (Evapotranspiration) Calculator for Grape Farming
 * Based on FAO Penman-Monteith equation and grape-specific crop coefficients
 */

export interface WeatherData {
  date: string;
  temperatureMax: number; // °C
  temperatureMin: number; // °C
  humidity: number; // %
  windSpeed: number; // m/s
  solarRadiation?: number; // MJ/m²/day
  rainfall?: number; // mm
}

export interface ETcCalculationInputs {
  farmId: number;
  weatherData: WeatherData;
  growthStage: GrapeGrowthStage;
  plantingDate: string;
  location: {
    latitude: number;
    longitude: number;
    elevation: number; // meters above sea level
  };
  irrigationMethod: 'drip' | 'sprinkler' | 'surface';
  soilType: 'sandy' | 'loamy' | 'clay';
}

export interface ETcResults {
  date: string;
  eto: number; // Reference evapotranspiration (mm/day)
  kc: number; // Crop coefficient
  etc: number; // Crop evapotranspiration (mm/day)
  irrigationNeed: number; // mm/day (accounting for rainfall)
  irrigationRecommendation: IrrigationRecommendation;
  growthStage: GrapeGrowthStage;
  confidence: 'high' | 'medium' | 'low';
}

export type GrapeGrowthStage = 
  | 'dormant' 
  | 'budbreak' 
  | 'flowering' 
  | 'fruit_set' 
  | 'veraison' 
  | 'harvest' 
  | 'post_harvest';

export interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  duration: number; // hours
  frequency: string; // e.g., "every 2 days"
  notes: string[];
}

// Grape-specific crop coefficients (Kc) based on FAO standards and research
const GRAPE_KC_VALUES: Record<GrapeGrowthStage, { kc: number; description: string }> = {
  dormant: { kc: 0.15, description: "Dormant season - minimal water needs" },
  budbreak: { kc: 0.30, description: "Early season - buds swelling and breaking" },
  flowering: { kc: 0.70, description: "Flowering stage - moderate water needs" },
  fruit_set: { kc: 0.95, description: "Fruit development - peak water needs" },
  veraison: { kc: 0.85, description: "Ripening stage - reducing water stress" },
  harvest: { kc: 0.45, description: "Harvest time - controlled irrigation" },
  post_harvest: { kc: 0.60, description: "Post-harvest recovery and storage" }
};

export class ETcCalculator {
  /**
   * Calculate Reference Evapotranspiration (ETo) using Penman-Monteith equation
   */
  static calculateETo(weather: WeatherData, location: ETcCalculationInputs['location']): number {
    const { temperatureMax, temperatureMin, humidity, windSpeed } = weather;
    const { latitude, elevation } = location;

    // Mean temperature
    const tmean = (temperatureMax + temperatureMin) / 2;
    
    // Saturation vapor pressure
    const es = (this.saturatedVaporPressure(temperatureMax) + this.saturatedVaporPressure(temperatureMin)) / 2;
    
    // Actual vapor pressure
    const ea = es * (humidity / 100);
    
    // Slope of saturation vapor pressure curve
    const delta = 4098 * es / Math.pow(tmean + 237.3, 2);
    
    // Psychrometric constant
    const pressure = 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
    const gamma = 0.665 * pressure;
    
    // Net radiation (simplified - in practice would use solar radiation data)
    const rn = this.estimateNetRadiation(temperatureMax, temperatureMin, latitude, new Date(weather.date).getMonth());
    
    // Penman-Monteith equation
    const numerator = 0.408 * delta * rn + gamma * 900 / (tmean + 273) * windSpeed * (es - ea);
    const denominator = delta + gamma * (1 + 0.34 * windSpeed);
    
    const eto = numerator / denominator;
    return Math.max(0, eto); // Ensure non-negative
  }

  /**
   * Calculate saturated vapor pressure
   */
  private static saturatedVaporPressure(temp: number): number {
    return 0.6108 * Math.exp(17.27 * temp / (temp + 237.3));
  }

  /**
   * Estimate net radiation (simplified method)
   */
  private static estimateNetRadiation(tmax: number, tmin: number, latitude: number, month: number): number {
    // This is a simplified estimation. In practice, you'd use actual solar radiation data
    const tmean = (tmax + tmin) / 2;
    const dayOfYear = month * 30 + 15; // Rough approximation
    
    // Solar declination
    const delta = 0.409 * Math.sin(0.0172 * dayOfYear - 1.39);
    
    // Sunset hour angle
    const phi = latitude * Math.PI / 180;
    const omega = Math.acos(-Math.tan(phi) * Math.tan(delta));
    
    // Extraterrestrial radiation
    const dr = 1 + 0.033 * Math.cos(0.0172 * dayOfYear);
    const ra = 24 * 60 / Math.PI * 0.082 * dr * (omega * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(omega));
    
    // Net radiation (simplified)
    const rn = 0.77 * ra - 0.0864 * (tmean + 273.15);
    
    return Math.max(0, rn);
  }

  /**
   * Get crop coefficient based on growth stage
   */
  static getCropCoefficient(growthStage: GrapeGrowthStage): { kc: number; description: string } {
    return GRAPE_KC_VALUES[growthStage];
  }

  /**
   * Calculate ETc (Crop Evapotranspiration)
   */
  static calculateETc(inputs: ETcCalculationInputs): ETcResults {
    const { weatherData, growthStage, irrigationMethod, soilType } = inputs;
    
    // Calculate ETo
    const eto = this.calculateETo(weatherData, inputs.location);
    
    // Get crop coefficient
    const { kc, description } = this.getCropCoefficient(growthStage);
    
    // Calculate ETc
    const etc = eto * kc;
    
    // Account for rainfall
    const effectiveRainfall = (weatherData.rainfall || 0) * 0.8; // 80% efficiency
    const irrigationNeed = Math.max(0, etc - effectiveRainfall);
    
    // Generate irrigation recommendation
    const irrigationRecommendation = this.generateIrrigationRecommendation(
      irrigationNeed,
      growthStage,
      irrigationMethod,
      soilType,
      weatherData
    );

    // Determine confidence level
    const confidence = this.calculateConfidence(weatherData, inputs);

    return {
      date: weatherData.date,
      eto,
      kc,
      etc,
      irrigationNeed,
      irrigationRecommendation,
      growthStage,
      confidence
    };
  }

  /**
   * Generate irrigation recommendations
   */
  private static generateIrrigationRecommendation(
    irrigationNeed: number,
    growthStage: GrapeGrowthStage,
    irrigationMethod: string,
    soilType: string,
    weather: WeatherData
  ): IrrigationRecommendation {
    const notes: string[] = [];
    let shouldIrrigate = irrigationNeed > 2; // Basic threshold
    let duration = 0;
    let frequency = "as needed";

    // Adjust based on growth stage
    if (growthStage === 'flowering' || growthStage === 'fruit_set') {
      shouldIrrigate = irrigationNeed > 1.5; // More sensitive during critical periods
      notes.push("Critical growth stage - maintain consistent moisture");
    }

    if (growthStage === 'veraison') {
      shouldIrrigate = irrigationNeed > 3; // Controlled stress for sugar concentration
      notes.push("Veraison stage - controlled water stress improves fruit quality");
    }

    if (growthStage === 'dormant') {
      shouldIrrigate = false;
      notes.push("Dormant season - irrigation not recommended");
    }

    // Calculate duration based on irrigation method and need
    if (shouldIrrigate) {
      switch (irrigationMethod) {
        case 'drip':
          duration = irrigationNeed * 0.5; // More efficient
          frequency = irrigationNeed > 4 ? "daily" : "every 2 days";
          break;
        case 'sprinkler':
          duration = irrigationNeed * 0.7;
          frequency = "every 2-3 days";
          break;
        case 'surface':
          duration = irrigationNeed * 1.2; // Less efficient
          frequency = "weekly";
          break;
      }

      // Adjust for soil type
      if (soilType === 'sandy') {
        duration *= 1.2;
        frequency = "more frequent, shorter durations";
        notes.push("Sandy soil - increase frequency, reduce duration");
      } else if (soilType === 'clay') {
        duration *= 0.8;
        frequency = "less frequent, longer durations";
        notes.push("Clay soil - longer intervals, deeper watering");
      }
    }

    // Weather-based adjustments
    if (weather.humidity > 80) {
      notes.push("High humidity - monitor for disease risk");
    }

    if (weather.windSpeed > 5) {
      notes.push("Windy conditions - may increase water loss");
    }

    if ((weather.rainfall || 0) > 10) {
      shouldIrrigate = false;
      notes.push("Recent rainfall - irrigation not needed");
    }

    return {
      shouldIrrigate,
      duration: Math.round(duration * 100) / 100,
      frequency,
      notes
    };
  }

  /**
   * Calculate confidence level based on data quality
   */
  private static calculateConfidence(weather: WeatherData, inputs: ETcCalculationInputs): 'high' | 'medium' | 'low' {
    let score = 0;

    // Check weather data completeness
    if (weather.solarRadiation !== undefined) score += 2;
    if (weather.rainfall !== undefined) score += 1;
    if (weather.humidity > 0) score += 1;
    if (weather.windSpeed >= 0) score += 1;

    // Check location data
    if (inputs.location.elevation > 0) score += 1;
    if (Math.abs(inputs.location.latitude) > 0) score += 1;

    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Determine growth stage based on planting date and current date
   */
  static determineGrowthStage(plantingDate: string, currentDate: string = new Date().toISOString()): GrapeGrowthStage {
    const planting = new Date(plantingDate);
    const current = new Date(currentDate);
    const currentMonth = current.getMonth() + 1; // 1-12
    
    // Simplified growth stage determination for India (Northern Hemisphere)
    // This would be more complex in a real system, accounting for variety and region
    
    if (currentMonth >= 12 || currentMonth <= 2) return 'dormant';
    if (currentMonth === 3) return 'budbreak';
    if (currentMonth === 4) return 'flowering';
    if (currentMonth === 5 || currentMonth === 6) return 'fruit_set';
    if (currentMonth === 7 || currentMonth === 8) return 'veraison';
    if (currentMonth === 9 || currentMonth === 10) return 'harvest';
    if (currentMonth === 11) return 'post_harvest';
    
    return 'dormant'; // fallback
  }

  /**
   * Calculate seasonal water requirements
   */
  static calculateSeasonalRequirements(
    plantingDate: string,
    location: ETcCalculationInputs['location'],
    averageWeather: Partial<WeatherData>
  ): { stage: GrapeGrowthStage; days: number; totalETc: number; description: string }[] {
    const stages = [
      { stage: 'dormant' as GrapeGrowthStage, days: 90 },
      { stage: 'budbreak' as GrapeGrowthStage, days: 30 },
      { stage: 'flowering' as GrapeGrowthStage, days: 30 },
      { stage: 'fruit_set' as GrapeGrowthStage, days: 60 },
      { stage: 'veraison' as GrapeGrowthStage, days: 60 },
      { stage: 'harvest' as GrapeGrowthStage, days: 30 },
      { stage: 'post_harvest' as GrapeGrowthStage, days: 60 }
    ];

    return stages.map(({ stage, days }) => {
      const { kc, description } = this.getCropCoefficient(stage);
      // Use average ETo estimation (simplified)
      const avgETo = 4; // This would be calculated from historical data
      const totalETc = avgETo * kc * days;

      return { stage, days, totalETc, description };
    });
  }
}