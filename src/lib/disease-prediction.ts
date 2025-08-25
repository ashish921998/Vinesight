export interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  rainfall: number; // mm
  windSpeed: number; // m/s
  leafWetnessDuration: number; // hours
  date: Date;
}

export interface DiseaseRiskInputs {
  weatherData: WeatherData[];
  grapeVariety: 'cabernet_sauvignon' | 'chardonnay' | 'pinot_noir' | 'merlot' | 'sauvignon_blanc' | 'riesling';
  growthStage: 'budbreak' | 'flowering' | 'fruit_set' | 'veraison' | 'harvest' | 'dormant';
  previousTreatments: {
    fungicide: Date | null;
    bactericide: Date | null;
    insecticide: Date | null;
  };
  vineyardConditions: {
    canopyDensity: 'light' | 'moderate' | 'dense';
    airCirculation: 'poor' | 'moderate' | 'good';
    drainageQuality: 'poor' | 'moderate' | 'good';
  };
  location: {
    latitude: number;
    longitude: number;
    elevation: number; // meters
  };
}

export interface DiseaseRisk {
  disease: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  probability: number; // 0-100%
  peakRiskDate: Date;
  factors: string[];
  recommendations: string[];
  treatmentWindow: {
    optimal: Date;
    latest: Date;
  };
}

export interface DiseaseAlert {
  severity: 'info' | 'warning' | 'critical';
  disease: string;
  message: string;
  actionRequired: boolean;
  daysUntilAction: number;
}

export interface DiseasePredictionResults {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  diseases: DiseaseRisk[];
  alerts: DiseaseAlert[];
  weatherScore: number; // 0-100, higher = more favorable for diseases
  treatmentCalendar: {
    date: Date;
    treatments: string[];
    priority: 'low' | 'medium' | 'high';
  }[];
  confidence: number; // 0-100%
}

// Disease-specific risk models
const DISEASE_MODELS = {
  powdery_mildew: {
    name: 'Powdery Mildew (Uncinula necator)',
    optimalTemp: { min: 20, max: 27 },
    optimalHumidity: { min: 40, max: 70 },
    rainRequirement: false, // Can spread without rain
    leafWetnessThreshold: 0, // hours
    susceptibleStages: ['flowering', 'fruit_set', 'veraison'],
    varietyResistance: {
      cabernet_sauvignon: 0.7,
      chardonnay: 0.3,
      pinot_noir: 0.4,
      merlot: 0.6,
      sauvignon_blanc: 0.5,
      riesling: 0.8
    }
  },
  downy_mildew: {
    name: 'Downy Mildew (Plasmopara viticola)',
    optimalTemp: { min: 13, max: 23 },
    optimalHumidity: { min: 85, max: 100 },
    rainRequirement: true,
    leafWetnessThreshold: 6, // hours
    susceptibleStages: ['budbreak', 'flowering', 'fruit_set'],
    varietyResistance: {
      cabernet_sauvignon: 0.6,
      chardonnay: 0.4,
      pinot_noir: 0.2,
      merlot: 0.5,
      sauvignon_blanc: 0.3,
      riesling: 0.7
    }
  },
  botrytis: {
    name: 'Botrytis Bunch Rot (Botrytis cinerea)',
    optimalTemp: { min: 15, max: 25 },
    optimalHumidity: { min: 80, max: 100 },
    rainRequirement: true,
    leafWetnessThreshold: 12, // hours
    susceptibleStages: ['flowering', 'fruit_set', 'veraison', 'harvest'],
    varietyResistance: {
      cabernet_sauvignon: 0.8,
      chardonnay: 0.4,
      pinot_noir: 0.2,
      merlot: 0.6,
      sauvignon_blanc: 0.5,
      riesling: 0.3
    }
  },
  black_rot: {
    name: 'Black Rot (Guignardia bidwellii)',
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 80, max: 100 },
    rainRequirement: true,
    leafWetnessThreshold: 8, // hours
    susceptibleStages: ['flowering', 'fruit_set', 'veraison'],
    varietyResistance: {
      cabernet_sauvignon: 0.7,
      chardonnay: 0.6,
      pinot_noir: 0.4,
      merlot: 0.7,
      sauvignon_blanc: 0.6,
      riesling: 0.8
    }
  },
  anthracnose: {
    name: 'Anthracnose (Elsinoe ampelina)',
    optimalTemp: { min: 2, max: 30 },
    optimalHumidity: { min: 85, max: 100 },
    rainRequirement: true,
    leafWetnessThreshold: 10, // hours
    susceptibleStages: ['budbreak', 'flowering', 'fruit_set'],
    varietyResistance: {
      cabernet_sauvignon: 0.8,
      chardonnay: 0.7,
      pinot_noir: 0.5,
      merlot: 0.8,
      sauvignon_blanc: 0.7,
      riesling: 0.6
    }
  }
};

export class DiseasePredictionModel {
  static predictDiseaseRisk(inputs: DiseaseRiskInputs): DiseasePredictionResults {
    const diseases: DiseaseRisk[] = [];
    const alerts: DiseaseAlert[] = [];
    
    // Analyze each disease
    Object.entries(DISEASE_MODELS).forEach(([diseaseKey, model]) => {
      const risk = this.calculateDiseaseRisk(diseaseKey, model, inputs);
      if (risk.riskLevel !== 'low') {
        diseases.push(risk);
      }
      
      // Generate alerts for high-risk diseases
      if (risk.riskLevel === 'high' || risk.riskLevel === 'critical') {
        alerts.push(this.generateAlert(risk));
      }
    });
    
    // Calculate overall risk and weather score
    const overallRisk = this.calculateOverallRisk(diseases);
    const weatherScore = this.calculateWeatherScore(inputs.weatherData);
    const treatmentCalendar = this.generateTreatmentCalendar(diseases, inputs);
    const confidence = this.calculateConfidence(inputs.weatherData);
    
    return {
      overallRisk,
      diseases: diseases.sort((a, b) => b.probability - a.probability),
      alerts: alerts.sort((a, b) => a.daysUntilAction - b.daysUntilAction),
      weatherScore,
      treatmentCalendar,
      confidence
    };
  }
  
  private static calculateDiseaseRisk(diseaseKey: string, model: any, inputs: DiseaseRiskInputs): DiseaseRisk {
    const recentWeather = inputs.weatherData.slice(-7); // Last 7 days
    const factors: string[] = [];
    let riskScore = 0;
    
    // Temperature factor
    const avgTemp = recentWeather.reduce((sum, w) => sum + w.temperature, 0) / recentWeather.length;
    const tempFactor = this.calculateTemperatureFactor(avgTemp, model.optimalTemp);
    riskScore += tempFactor * 25;
    if (tempFactor > 0.7) factors.push(`Optimal temperature range (${avgTemp.toFixed(1)}°C)`);
    
    // Humidity factor
    const avgHumidity = recentWeather.reduce((sum, w) => sum + w.humidity, 0) / recentWeather.length;
    const humidityFactor = this.calculateHumidityFactor(avgHumidity, model.optimalHumidity);
    riskScore += humidityFactor * 25;
    if (humidityFactor > 0.7) factors.push(`High humidity conditions (${avgHumidity.toFixed(1)}%)`);
    
    // Rainfall/leaf wetness factor
    const totalRainfall = recentWeather.reduce((sum, w) => sum + w.rainfall, 0);
    const maxLeafWetness = Math.max(...recentWeather.map(w => w.leafWetnessDuration));
    const moistureFactor = this.calculateMoistureFactor(totalRainfall, maxLeafWetness, model);
    riskScore += moistureFactor * 20;
    if (model.rainRequirement && totalRainfall > 5) factors.push(`Recent rainfall (${totalRainfall}mm)`);
    if (maxLeafWetness > model.leafWetnessThreshold) factors.push(`Extended leaf wetness (${maxLeafWetness}h)`);
    
    // Growth stage susceptibility
    const stageFactor = model.susceptibleStages.includes(inputs.growthStage) ? 1 : 0.3;
    riskScore += stageFactor * 15;
    if (stageFactor === 1) factors.push(`Susceptible growth stage (${inputs.growthStage})`);
    
    // Variety resistance
    const resistanceFactor = 1 - (model.varietyResistance[inputs.grapeVariety] || 0.5);
    riskScore += resistanceFactor * 10;
    if (resistanceFactor > 0.5) factors.push(`Low variety resistance`);
    
    // Vineyard conditions
    const conditionsFactor = this.calculateVineyardConditionsFactor(inputs.vineyardConditions);
    riskScore += conditionsFactor * 5;
    if (conditionsFactor > 0.7) factors.push('Poor vineyard conditions');
    
    // Previous treatments
    const treatmentFactor = this.calculateTreatmentFactor(inputs.previousTreatments, diseaseKey);
    riskScore *= treatmentFactor;
    if (treatmentFactor > 0.8) factors.push('No recent protective treatments');
    
    const probability = Math.min(100, Math.max(0, riskScore));
    const riskLevel = this.getRiskLevel(probability);
    const peakRiskDate = this.calculatePeakRiskDate(inputs.weatherData);
    const recommendations = this.generateRecommendations(diseaseKey, riskLevel, inputs.growthStage);
    const treatmentWindow = this.calculateTreatmentWindow(peakRiskDate, inputs.growthStage);
    
    return {
      disease: model.name,
      riskLevel,
      probability,
      peakRiskDate,
      factors,
      recommendations,
      treatmentWindow
    };
  }
  
  private static calculateTemperatureFactor(temp: number, optimal: { min: number; max: number }): number {
    if (temp >= optimal.min && temp <= optimal.max) return 1;
    const distanceFromOptimal = Math.min(
      Math.abs(temp - optimal.min),
      Math.abs(temp - optimal.max)
    );
    return Math.max(0, 1 - (distanceFromOptimal / 10));
  }
  
  private static calculateHumidityFactor(humidity: number, optimal: { min: number; max: number }): number {
    if (humidity >= optimal.min && humidity <= optimal.max) return 1;
    if (humidity < optimal.min) return Math.max(0, humidity / optimal.min);
    return Math.max(0, 1 - ((humidity - optimal.max) / (100 - optimal.max)));
  }
  
  private static calculateMoistureFactor(rainfall: number, leafWetness: number, model: any): number {
    let factor = 0;
    
    if (model.rainRequirement) {
      factor = Math.min(1, rainfall / 10); // 10mm = optimal
    } else {
      factor = 0.5; // Base factor for diseases that don't need rain
    }
    
    if (leafWetness > model.leafWetnessThreshold) {
      factor += Math.min(0.5, (leafWetness - model.leafWetnessThreshold) / 12);
    }
    
    return Math.min(1, factor);
  }
  
  private static calculateVineyardConditionsFactor(conditions: DiseaseRiskInputs['vineyardConditions']): number {
    const factors = {
      canopyDensity: { light: 0.2, moderate: 0.5, dense: 1 },
      airCirculation: { good: 0.2, moderate: 0.5, poor: 1 },
      drainageQuality: { good: 0.2, moderate: 0.5, poor: 1 }
    };
    
    return (
      factors.canopyDensity[conditions.canopyDensity] +
      factors.airCirculation[conditions.airCirculation] +
      factors.drainageQuality[conditions.drainageQuality]
    ) / 3;
  }
  
  private static calculateTreatmentFactor(treatments: DiseaseRiskInputs['previousTreatments'], diseaseKey: string): number {
    const now = new Date();
    const fungicideDate = treatments.fungicide;
    
    if (!fungicideDate) return 1;
    
    const daysSinceTreatment = (now.getTime() - fungicideDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Effectiveness decreases over time
    if (daysSinceTreatment <= 7) return 0.2;
    if (daysSinceTreatment <= 14) return 0.4;
    if (daysSinceTreatment <= 21) return 0.6;
    if (daysSinceTreatment <= 28) return 0.8;
    
    return 1;
  }
  
  private static getRiskLevel(probability: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (probability >= 80) return 'critical';
    if (probability >= 60) return 'high';
    if (probability >= 30) return 'moderate';
    return 'low';
  }
  
  private static calculatePeakRiskDate(weatherData: WeatherData[]): Date {
    // Find the date with highest risk conditions in the forecast
    let maxScore = 0;
    let peakDate = new Date();
    
    weatherData.forEach(day => {
      const score = day.humidity + (day.rainfall * 10) + (day.leafWetnessDuration * 2);
      if (score > maxScore) {
        maxScore = score;
        peakDate = day.date;
      }
    });
    
    return peakDate;
  }
  
  private static generateRecommendations(diseaseKey: string, riskLevel: string, growthStage: string): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Apply preventive fungicide treatment immediately');
      recommendations.push('Monitor weather conditions closely');
      recommendations.push('Increase vineyard scouting frequency');
    }
    
    if (riskLevel === 'moderate') {
      recommendations.push('Prepare for potential treatment application');
      recommendations.push('Monitor disease pressure indicators');
    }
    
    // Disease-specific recommendations
    switch (diseaseKey) {
      case 'powdery_mildew':
        recommendations.push('Improve air circulation through canopy management');
        recommendations.push('Consider sulfur-based treatments');
        break;
      case 'downy_mildew':
        recommendations.push('Ensure good drainage in vineyard rows');
        recommendations.push('Apply copper-based treatments in wet conditions');
        break;
      case 'botrytis':
        recommendations.push('Remove damaged or infected berries');
        recommendations.push('Improve air circulation around grape clusters');
        break;
    }
    
    return recommendations;
  }
  
  private static calculateTreatmentWindow(peakRiskDate: Date, growthStage: string): { optimal: Date; latest: Date } {
    const optimal = new Date(peakRiskDate);
    optimal.setDate(optimal.getDate() - 3); // 3 days before peak risk
    
    const latest = new Date(peakRiskDate);
    latest.setDate(latest.getDate() + 1); // 1 day after peak risk
    
    return { optimal, latest };
  }
  
  private static generateAlert(risk: DiseaseRisk): DiseaseAlert {
    const now = new Date();
    const daysUntilAction = Math.ceil((risk.treatmentWindow.optimal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      severity: risk.riskLevel === 'critical' ? 'critical' : 'warning',
      disease: risk.disease,
      message: `${risk.riskLevel.toUpperCase()} risk (${risk.probability.toFixed(0)}%) - Treatment recommended`,
      actionRequired: risk.riskLevel === 'critical' || risk.riskLevel === 'high',
      daysUntilAction: Math.max(0, daysUntilAction)
    };
  }
  
  private static calculateOverallRisk(diseases: DiseaseRisk[]): 'low' | 'moderate' | 'high' | 'critical' {
    if (diseases.some(d => d.riskLevel === 'critical')) return 'critical';
    if (diseases.some(d => d.riskLevel === 'high')) return 'high';
    if (diseases.some(d => d.riskLevel === 'moderate')) return 'moderate';
    return 'low';
  }
  
  private static calculateWeatherScore(weatherData: WeatherData[]): number {
    const recentWeather = weatherData.slice(-7);
    let score = 0;
    
    recentWeather.forEach(day => {
      // Higher score = more favorable for diseases
      if (day.humidity > 80) score += 15;
      if (day.rainfall > 0) score += 10;
      if (day.leafWetnessDuration > 6) score += 10;
      if (day.temperature >= 20 && day.temperature <= 25) score += 5;
    });
    
    return Math.min(100, score);
  }
  
  private static generateTreatmentCalendar(diseases: DiseaseRisk[], inputs: DiseaseRiskInputs): any[] {
    const calendar: any[] = [];
    
    diseases.forEach(disease => {
      if (disease.riskLevel === 'high' || disease.riskLevel === 'critical') {
        calendar.push({
          date: disease.treatmentWindow.optimal,
          treatments: [`Preventive treatment for ${disease.disease}`],
          priority: disease.riskLevel === 'critical' ? 'high' : 'medium'
        });
      }
    });
    
    return calendar.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  private static calculateConfidence(weatherData: WeatherData[]): number {
    // Confidence based on data quality and recency
    const dataAge = weatherData.length > 0 ? 
      (Date.now() - weatherData[weatherData.length - 1].date.getTime()) / (1000 * 60 * 60 * 24) : 7;
    
    let confidence = 100;
    
    // Reduce confidence based on data age
    if (dataAge > 1) confidence -= (dataAge - 1) * 10;
    
    // Reduce confidence if insufficient data points
    if (weatherData.length < 7) confidence -= (7 - weatherData.length) * 5;
    
    return Math.max(30, Math.min(100, confidence));
  }
}