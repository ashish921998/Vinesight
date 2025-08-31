/**
 * ETc (Evapotranspiration) Calculator for Grape Farming
 * Based on FAO Penman-Monteith equation and grape-specific crop coefficients
 */

export interface WeatherData {
  date: string;
  temperatureMax: number; // °C
  temperatureMin: number; // °C
  humidity: number; // % (relative humidity, preferably mean daily)
  windSpeed: number; // m/s (measured at 2m height)
  rainfall: number; // mm/day (required - use 0 if no rain)
  // At least one solar radiation input is required:
  solarRadiation?: number; // MJ/m²/day (most accurate)
  solarRadiationLux?: number; // lux (practical alternative)
  sunshineHours?: number; // hours/day (alternative method)
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
   * Calculate Reference Evapotranspiration (ETo) using FAO-56 Penman-Monteith equation
   */
  static calculateETo(weather: WeatherData, location: ETcCalculationInputs['location']): number {
    // Input validation
    this.validateWeatherData(weather);
    this.validateLocationData(location);

    const { temperatureMax, temperatureMin, humidity, windSpeed } = weather;
    const { latitude, elevation } = location;

    // Step 1: Basic calculations
    const tmean = (temperatureMax + temperatureMin) / 2;
    const dayOfYear = this.getDayOfYear(weather.date);

    // Step 2: Saturation vapor pressure calculations (kPa)
    const es_tmax = 0.6108 * Math.exp(17.27 * temperatureMax / (temperatureMax + 237.3));
    const es_tmin = 0.6108 * Math.exp(17.27 * temperatureMin / (temperatureMin + 237.3));
    const es = (es_tmax + es_tmin) / 2;
    
    // Step 3: Actual vapor pressure (kPa)
    const ea = (es_tmin * (humidity / 100) + es_tmax * (humidity / 100)) / 2;
    
    // Step 4: Slope of saturation vapor pressure curve (kPa/°C)
    const delta = 4098 * (0.6108 * Math.exp(17.27 * tmean / (tmean + 237.3))) / Math.pow(tmean + 237.3, 2);
    
    // Step 5: Atmospheric pressure and psychrometric constant
    const pressure = 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26); // kPa
    const gamma = 0.665 * pressure / 1000; // kPa/°C (convert to proper units)
    
    // Step 6: Net radiation calculation (FAO-56 method)
    const rn = this.calculateNetRadiation(weather, location, dayOfYear);
    
    // Step 7: Soil heat flux (G = 0 for daily calculations as per FAO-56)
    const G = 0;
    
    // Step 8: FAO-56 Penman-Monteith equation
    const numerator = 0.408 * delta * (rn - G) + gamma * 900 / (tmean + 273) * windSpeed * (es - ea);
    const denominator = delta + gamma * (1 + 0.34 * windSpeed);
    
    const eto = numerator / denominator;

    // Debug output for troubleshooting (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('ETo Calculation Debug:', {
        tmean,
        es_tmax: 0.6108 * Math.exp(17.27 * temperatureMax / (temperatureMax + 237.3)),
        es_tmin: 0.6108 * Math.exp(17.27 * temperatureMin / (temperatureMin + 237.3)),
        es,
        ea,
        delta,
        pressure: 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26),
        gamma,
        rn,
        numerator,
        denominator,
        eto: Math.max(0, eto)
      });
    }

    return Math.max(0, eto); // Ensure non-negative
  }

  /**
   * Convert lux to solar radiation (MJ/m²/day)
   * Improved conversion for agricultural applications
   */
  private static convertLuxToSolarRadiation(lux: number, sunshineHours: number = 8): number {
    // Improved conversion for solar radiation:
    // Based on typical solar radiation measurements:
    // - Clear sunny day: ~100,000 lux ≈ 25-30 MJ/m²/day
    // - Partly cloudy: ~25,000 lux ≈ 15-20 MJ/m²/day
    // - Overcast: ~10,000 lux ≈ 5-10 MJ/m²/day
    
    // Empirical conversion based on agricultural data
    // This accounts for the solar spectrum and daily curve
    const mjPerSqMPerDay = lux * 0.0008; // Adjusted conversion factor
    
    return Math.max(0, mjPerSqMPerDay);
  }

  /**
   * Calculate net radiation using FAO-56 method (MJ/m²/day)
   */
  private static calculateNetRadiation(weather: WeatherData, location: ETcCalculationInputs['location'], dayOfYear: number): number {
    const { temperatureMax, temperatureMin, solarRadiation, solarRadiationLux, sunshineHours } = weather;
    const { latitude, elevation } = location;

    // Step 1: Solar declination (radians)
    const solarDeclination = 0.409 * Math.sin(2 * Math.PI / 365 * dayOfYear - 1.39);

    // Step 2: Inverse relative distance Earth-Sun
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI / 365 * dayOfYear);

    // Step 3: Convert latitude to radians
    const latitudeRad = latitude * Math.PI / 180;

    // Step 4: Sunset hour angle (radians)
    const sunsetHourAngle = Math.acos(-Math.tan(latitudeRad) * Math.tan(solarDeclination));

    // Step 5: Extraterrestrial radiation (MJ/m²/day)
    const Ra = 24 * 60 / Math.PI * 0.082 * dr * 
               (sunsetHourAngle * Math.sin(latitudeRad) * Math.sin(solarDeclination) + 
                Math.cos(latitudeRad) * Math.cos(solarDeclination) * Math.sin(sunsetHourAngle));

    // Step 6: Solar radiation (MJ/m²/day)
    let Rs: number;
    if (solarRadiation !== undefined) {
      Rs = solarRadiation;
    } else if (solarRadiationLux !== undefined) {
      // Convert lux to solar radiation
      const estimatedSunshineHours = sunshineHours || 8; // Default to 8 hours if not provided
      Rs = this.convertLuxToSolarRadiation(solarRadiationLux, estimatedSunshineHours);
    } else if (sunshineHours !== undefined) {
      // Calculate from sunshine hours using Angstrom formula
      const maxSunshineHours = 24 * sunsetHourAngle / Math.PI;
      Rs = (0.25 + 0.50 * sunshineHours / maxSunshineHours) * Ra;
    } else {
      // Estimate from temperature difference (Hargreaves method)
      Rs = 0.16 * Math.sqrt(Math.max(0, temperatureMax - temperatureMin)) * Ra;
    }

    // Step 7: Clear sky solar radiation (MJ/m²/day)
    const Rso = (0.75 + 2 * elevation / 100000) * Ra;

    // Step 8: Net shortwave radiation (MJ/m²/day)
    const albedo = 0.23; // FAO-56 reference crop albedo
    const Rns = (1 - albedo) * Rs;

    // Step 9: Net longwave radiation (MJ/m²/day)
    const stefanBoltzmann = 4.903e-9; // MJ K⁻⁴ m⁻² day⁻¹
    const ea = this.calculateActualVaporPressure(temperatureMax, temperatureMin, weather.humidity);
    
    const Rnl = stefanBoltzmann * 
                (Math.pow(temperatureMax + 273.16, 4) + Math.pow(temperatureMin + 273.16, 4)) / 2 * 
                (0.34 - 0.14 * Math.sqrt(ea)) * 
                (1.35 * Math.min(Rs / Rso, 1.0) - 0.35);

    // Step 10: Net radiation (MJ/m²/day)
    const Rn = Rns - Rnl;

    return Rn;
  }

  /**
   * Calculate actual vapor pressure for net radiation calculation
   */
  private static calculateActualVaporPressure(tmax: number, tmin: number, humidity: number): number {
    const es_tmax = 0.6108 * Math.exp(17.27 * tmax / (tmax + 237.3));
    const es_tmin = 0.6108 * Math.exp(17.27 * tmin / (tmin + 237.3));
    return (es_tmin * (humidity / 100) + es_tmax * (humidity / 100)) / 2;
  }

  /**
   * Get day of year from date string
   */
  private static getDayOfYear(dateString: string): number {
    const date = new Date(dateString);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate weather data inputs
   */
  private static validateWeatherData(weather: WeatherData): void {
    const { temperatureMax, temperatureMin, humidity, windSpeed, rainfall } = weather;
    
    if (temperatureMax < temperatureMin) {
      throw new Error('Maximum temperature must be greater than minimum temperature');
    }
    
    if (temperatureMax < -50 || temperatureMax > 60) {
      throw new Error('Maximum temperature out of reasonable range (-50°C to 60°C)');
    }
    
    if (temperatureMin < -60 || temperatureMin > 50) {
      throw new Error('Minimum temperature out of reasonable range (-60°C to 50°C)');
    }
    
    if (humidity < 0 || humidity > 100) {
      throw new Error('Humidity must be between 0 and 100%');
    }
    
    if (windSpeed < 0 || windSpeed > 50) {
      throw new Error('Wind speed out of reasonable range (0 to 50 m/s)');
    }

    // Rainfall is required
    if (rainfall < 0 || rainfall > 500) {
      throw new Error('Rainfall out of reasonable range (0 to 500 mm/day)');
    }

    // At least one form of solar radiation data is required
    const hasSolarData = weather.solarRadiation !== undefined || 
                        weather.solarRadiationLux !== undefined || 
                        weather.sunshineHours !== undefined;
    
    if (!hasSolarData) {
      throw new Error('At least one form of solar radiation data is required (solar radiation in MJ/m²/day, lux, or sunshine hours)');
    }

    if (weather.solarRadiation !== undefined && (weather.solarRadiation < 0 || weather.solarRadiation > 45)) {
      throw new Error('Solar radiation out of reasonable range (0 to 45 MJ/m²/day)');
    }

    if (weather.solarRadiationLux !== undefined && (weather.solarRadiationLux < 0 || weather.solarRadiationLux > 150000)) {
      throw new Error('Solar radiation (lux) out of reasonable range (0 to 150,000 lux)');
    }

    if (weather.sunshineHours !== undefined && (weather.sunshineHours < 0 || weather.sunshineHours > 16)) {
      throw new Error('Sunshine hours out of reasonable range (0 to 16 hours/day)');
    }
  }

  /**
   * Validate location data inputs
   */
  private static validateLocationData(location: ETcCalculationInputs['location']): void {
    const { latitude, elevation } = location;
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    
    if (elevation < -500 || elevation > 9000) {
      throw new Error('Elevation out of reasonable range (-500 to 9000 meters)');
    }
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