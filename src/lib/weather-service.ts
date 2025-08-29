export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  location: LocationData;
  lastUpdated: Date;
}

export interface CurrentWeather {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: string;
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number;
  cloudCover: number; // %
  condition: string;
  conditionCode: number;
  isDay: boolean;
  precipitation: number; // mm
  feelsLike: number; // °C
}

export interface ForecastDay {
  date: string;
  maxTemp: number; // °C
  minTemp: number; // °C
  avgTemp: number; // °C
  maxHumidity: number; // %
  minHumidity: number; // %
  avgHumidity: number; // %
  precipitation: number; // mm
  precipitationProbability: number; // %
  windSpeed: number; // km/h
  condition: string;
  conditionCode: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  dayLength: number; // hours
}

export interface LocationData {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WeatherAlerts {
  irrigation: {
    shouldIrrigate: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  pest: {
    riskLevel: 'low' | 'medium' | 'high';
    conditions: string[];
    precautions: string[];
  };
  harvest: {
    isOptimal: boolean;
    conditions: string;
    recommendations: string[];
  };
}

export interface ETc {
  dailyETc: number; // mm/day
  weeklyETc: number; // mm/week
  monthlyETc: number; // mm/month
  cropCoefficient: number;
  referenceET: number; // mm/day
  growthStage: string;
}

// Weather service for grape farming
export class WeatherService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  private static readonly BASE_URL = 'http://api.weatherapi.com/v1';
  
  // Default coordinates for Maharashtra grape region if no location provided
  private static readonly DEFAULT_COORDS = {
    latitude: 19.0825,
    longitude: 73.1963,
    name: 'Nashik'
  };

  static async getCurrentWeather(latitude?: number, longitude?: number): Promise<WeatherData> {
    // Check if API key is available
    if (!this.API_KEY || this.API_KEY === 'your_weatherapi_key_here') {
      return this.getMockWeatherData();
    }

    const coords = latitude && longitude 
      ? { latitude, longitude }
      : this.DEFAULT_COORDS;

    const query = `${coords.latitude},${coords.longitude}`;
    const url = `${this.BASE_URL}/forecast.json?key=${this.API_KEY}&q=${query}&days=7&aqi=no&alerts=no`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
        } else {
        }
        return this.getMockWeatherData();
      }

      const data = await response.json();
      return this.parseWeatherData(data);
    } catch (error) {
      return this.getMockWeatherData();
    }
  }

  private static parseWeatherData(data: any): WeatherData {
    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday;

    return {
      current: {
        temperature: current.temp_c,
        humidity: current.humidity,
        windSpeed: current.wind_kph,
        windDirection: current.wind_dir,
        pressure: current.pressure_mb,
        visibility: current.vis_km,
        uvIndex: current.uv,
        cloudCover: current.cloud,
        condition: current.condition.text,
        conditionCode: current.condition.code,
        isDay: current.is_day === 1,
        precipitation: current.precip_mm,
        feelsLike: current.feelslike_c
      },
      forecast: forecast.map((day: any) => ({
        date: day.date,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        avgTemp: day.day.avgtemp_c,
        maxHumidity: day.day.maxhumidity || 85,
        minHumidity: day.day.minhumidity || 45,
        avgHumidity: day.day.avghumidity,
        precipitation: day.day.totalprecip_mm,
        precipitationProbability: day.day.daily_chance_of_rain,
        windSpeed: day.day.maxwind_kph,
        condition: day.day.condition.text,
        conditionCode: day.day.condition.code,
        uvIndex: day.day.uv,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset,
        dayLength: this.calculateDayLength(day.astro.sunrise, day.astro.sunset)
      })),
      location: {
        name: location.name,
        region: location.region,
        country: location.country,
        latitude: location.lat,
        longitude: location.lon,
        timezone: location.tz_id
      },
      lastUpdated: new Date()
    };
  }

  private static calculateDayLength(sunrise: string, sunset: string): number {
    const sunriseTime = new Date(`1970-01-01T${this.convertTo24Hour(sunrise)}:00`);
    const sunsetTime = new Date(`1970-01-01T${this.convertTo24Hour(sunset)}:00`);
    return (sunsetTime.getTime() - sunriseTime.getTime()) / (1000 * 60 * 60);
  }

  private static convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    const [hoursPart, minutes] = time.split(':');
    let hours = hoursPart;
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours}:${minutes}`;
  }

  // Calculate Evapotranspiration (ETc) for grapes
  static calculateETc(weather: WeatherData, growthStage: string): ETc {
    const current = weather.current;
    const forecast = weather.forecast;

    // Crop coefficients for grape growth stages
    const cropCoefficients: { [key: string]: number } = {
      'Budbreak': 0.3,
      'Leaf development': 0.5,
      'Flowering': 0.7,
      'Fruit set': 0.8,
      'Veraison': 0.8,
      'Harvest': 0.6,
      'Post-harvest': 0.4,
      'Dormant': 0.2
    };

    const kc = cropCoefficients[growthStage] || 0.7;

    // Simplified Penman-Monteith equation for reference ET (ET0)
    const temp = current.temperature;
    const humidity = current.humidity;
    const windSpeed = current.windSpeed;
    const radiation = this.estimateSolarRadiation(current.uvIndex, current.cloudCover);

    // Reference evapotranspiration (ET0) calculation
    const delta = 4098 * (0.6108 * Math.exp(17.27 * temp / (temp + 237.3))) / Math.pow(temp + 237.3, 2);
    const gamma = 0.665 * current.pressure / 1000;
    const u2 = windSpeed * 0.277778; // Convert km/h to m/s
    const rh = humidity;
    
    const et0 = (0.408 * delta * radiation + gamma * 900 / (temp + 273) * u2 * (0.01 * (100 - rh))) / 
                (delta + gamma * (1 + 0.34 * u2));

    const dailyETc = Math.max(0, et0 * kc);
    
    // Calculate weekly and monthly averages
    const weeklyETc = dailyETc * 7;
    const monthlyETc = dailyETc * 30;

    return {
      dailyETc: Math.round(dailyETc * 100) / 100,
      weeklyETc: Math.round(weeklyETc * 100) / 100,
      monthlyETc: Math.round(monthlyETc * 100) / 100,
      cropCoefficient: kc,
      referenceET: Math.round(et0 * 100) / 100,
      growthStage
    };
  }

  private static estimateSolarRadiation(uvIndex: number, cloudCover: number): number {
    // Simplified solar radiation estimation based on UV index and cloud cover
    const maxRadiation = 25; // MJ/m²/day for clear sky
    const uvFactor = Math.min(uvIndex / 11, 1); // Normalize UV index
    const cloudFactor = (100 - cloudCover) / 100; // Reduce radiation based on cloud cover
    return maxRadiation * uvFactor * cloudFactor;
  }

  // Generate weather-based alerts for farming
  static generateWeatherAlerts(weather: WeatherData, etc: ETc): WeatherAlerts {
    const current = weather.current;
    const forecast = weather.forecast.slice(0, 3); // Next 3 days
    
    // Irrigation recommendations
    const irrigationAlert = this.generateIrrigationAlert(weather, etc);
    
    // Pest and disease risk assessment
    const pestAlert = this.generatePestAlert(weather);
    
    // Harvest timing recommendations
    const harvestAlert = this.generateHarvestAlert(weather);

    return {
      irrigation: irrigationAlert,
      pest: pestAlert,
      harvest: harvestAlert
    };
  }

  private static generateIrrigationAlert(weather: WeatherData, etc: ETc): WeatherAlerts['irrigation'] {
    const current = weather.current;
    const forecast = weather.forecast.slice(0, 3);
    
    // Check recent/upcoming precipitation
    const upcomingRain = forecast.reduce((sum, day) => sum + day.precipitation, 0);
    const rainProbability = Math.max(...forecast.map(day => day.precipitationProbability));
    
    const shouldIrrigate = upcomingRain < etc.dailyETc * 2 && rainProbability < 60;
    
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    let reason = '';
    const recommendations: string[] = [];

    if (current.temperature > 35) {
      urgency = 'high';
      reason = 'High temperature stress detected';
      recommendations.push('Increase irrigation frequency');
      recommendations.push('Consider early morning irrigation');
    } else if (current.humidity < 30) {
      urgency = 'high';
      reason = 'Low humidity increasing water demand';
      recommendations.push('Monitor soil moisture closely');
    } else if (upcomingRain < 5 && rainProbability < 30) {
      urgency = 'medium';
      reason = 'Low rainfall expected in next 3 days';
      recommendations.push('Plan irrigation for next 24-48 hours');
    } else {
      urgency = 'low';
      reason = 'Adequate moisture conditions expected';
      recommendations.push('Monitor soil moisture levels');
    }

    if (current.windSpeed > 20) {
      recommendations.push('High winds detected - avoid overhead irrigation');
    }

    return {
      shouldIrrigate,
      reason,
      urgency,
      recommendations
    };
  }

  private static generatePestAlert(weather: WeatherData): WeatherAlerts['pest'] {
    const current = weather.current;
    const forecast = weather.forecast.slice(0, 3);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const conditions: string[] = [];
    const precautions: string[] = [];

    // High humidity + moderate temperature = fungal risk
    if (current.humidity > 80 && current.temperature > 20 && current.temperature < 30) {
      riskLevel = 'high';
      conditions.push('High humidity and optimal temperature for fungal diseases');
      precautions.push('Monitor for powdery mildew and downy mildew');
      precautions.push('Improve air circulation around vines');
    }

    // Wet conditions
    const recentRain = current.precipitation + forecast.slice(0, 2).reduce((sum, day) => sum + day.precipitation, 0);
    if (recentRain > 10) {
      if (riskLevel === 'low') riskLevel = 'medium';
      conditions.push('Wet conditions increase disease pressure');
      precautions.push('Inspect for leaf spot diseases');
      precautions.push('Ensure proper drainage');
    }

    // Temperature extremes
    if (current.temperature > 38) {
      conditions.push('High temperature stress');
      precautions.push('Monitor for heat stress symptoms');
      precautions.push('Ensure adequate irrigation');
    } else if (current.temperature < 10) {
      conditions.push('Low temperature may affect growth');
      precautions.push('Monitor for cold damage');
    }

    // Wind conditions
    if (current.windSpeed > 30) {
      conditions.push('Strong winds may cause mechanical damage');
      precautions.push('Check trellis systems and supports');
      precautions.push('Protect young shoots');
    }

    if (conditions.length === 0) {
      conditions.push('Favorable weather conditions');
      precautions.push('Continue regular monitoring');
    }

    return {
      riskLevel,
      conditions,
      precautions
    };
  }

  private static generateHarvestAlert(weather: WeatherData): WeatherAlerts['harvest'] {
    const current = weather.current;
    const forecast = weather.forecast.slice(0, 5); // Next 5 days
    
    // Optimal harvest conditions: dry, mild temperatures, low humidity
    const upcomingRain = forecast.reduce((sum, day) => sum + day.precipitation, 0);
    const avgTemp = forecast.reduce((sum, day) => sum + day.avgTemp, 0) / forecast.length;
    const maxRainProb = Math.max(...forecast.map(day => day.precipitationProbability));
    
    const isOptimal = upcomingRain < 2 && avgTemp > 15 && avgTemp < 30 && maxRainProb < 30;
    
    let conditions = '';
    const recommendations: string[] = [];

    if (isOptimal) {
      conditions = 'Excellent harvest conditions expected';
      recommendations.push('Ideal weather window for harvesting');
      recommendations.push('Plan harvest operations for the next few days');
    } else if (upcomingRain > 10 || maxRainProb > 70) {
      conditions = 'Wet weather expected - not ideal for harvest';
      recommendations.push('Delay harvest if possible');
      recommendations.push('Monitor fruit condition closely');
      recommendations.push('Ensure proper post-harvest handling');
    } else if (avgTemp > 35) {
      conditions = 'High temperatures may affect fruit quality';
      recommendations.push('Plan harvest for early morning hours');
      recommendations.push('Ensure rapid cooling of harvested grapes');
    } else {
      conditions = 'Moderate harvest conditions';
      recommendations.push('Monitor weather forecasts closely');
      recommendations.push('Be prepared to adjust harvest timing');
    }

    return {
      isOptimal,
      conditions,
      recommendations
    };
  }

  // Provide mock data for development when API is unavailable
  private static getMockWeatherData(): WeatherData {
    const now = new Date();
    
    return {
      current: {
        temperature: 28,
        humidity: 65,
        windSpeed: 12,
        windDirection: 'WSW',
        pressure: 1013,
        visibility: 10,
        uvIndex: 7,
        cloudCover: 25,
        condition: 'Partly Cloudy',
        conditionCode: 1003,
        isDay: true,
        precipitation: 0,
        feelsLike: 31
      },
      forecast: [
        {
          date: now.toISOString().split('T')[0],
          maxTemp: 32,
          minTemp: 22,
          avgTemp: 27,
          maxHumidity: 75,
          minHumidity: 45,
          avgHumidity: 60,
          precipitation: 0,
          precipitationProbability: 10,
          windSpeed: 15,
          condition: 'Sunny',
          conditionCode: 1000,
          uvIndex: 8,
          sunrise: '06:15 AM',
          sunset: '06:45 PM',
          dayLength: 12.5
        },
        {
          date: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
          maxTemp: 30,
          minTemp: 20,
          avgTemp: 25,
          maxHumidity: 80,
          minHumidity: 50,
          avgHumidity: 65,
          precipitation: 2,
          precipitationProbability: 40,
          windSpeed: 10,
          condition: 'Light Rain',
          conditionCode: 1063,
          uvIndex: 6,
          sunrise: '06:16 AM',
          sunset: '06:44 PM',
          dayLength: 12.4
        }
      ],
      location: {
        name: 'Nashik',
        region: 'Maharashtra',
        country: 'India',
        latitude: 19.0825,
        longitude: 73.1963,
        timezone: 'Asia/Kolkata'
      },
      lastUpdated: now
    };
  }

  // Irrigation scheduling based on weather and ETc
  static generateIrrigationSchedule(weather: WeatherData, etc: ETc, soilType: string = 'medium'): {
    schedule: {
      date: string;
      duration: number; // hours
      amount: number; // mm
      reason: string;
      priority: 'low' | 'medium' | 'high';
    }[];
    totalWaterNeed: number;
  } {
    const schedule = [];
    const forecast = weather.forecast.slice(0, 7); // Next 7 days
    
    // Soil water holding capacity (mm per 30cm depth)
    const soilCapacity = {
      sandy: 80,
      medium: 120,
      clay: 160
    };
    
    const capacity = soilCapacity[soilType as keyof typeof soilCapacity] || 120;
    let soilMoisture = capacity * 0.6; // Assume 60% initial moisture
    let totalWaterNeed = 0;

    for (const day of forecast) {
      // Daily water balance
      const dailyET = etc.dailyETc;
      const rainfall = day.precipitation;
      
      // Update soil moisture
      soilMoisture = soilMoisture - dailyET + rainfall;
      
      // Check if irrigation needed
      const threshold = capacity * 0.4; // Irrigate when soil moisture drops to 40%
      
      if (soilMoisture < threshold && day.precipitationProbability < 70) {
        const deficit = threshold - soilMoisture;
        const irrigationAmount = Math.min(deficit + dailyET, capacity - soilMoisture);
        const duration = irrigationAmount / 4; // Assume 4mm/hour irrigation rate
        
        let priority: 'low' | 'medium' | 'high' = 'medium';
        let reason = 'Scheduled irrigation based on soil moisture';
        
        if (day.maxTemp > 35) {
          priority = 'high';
          reason = 'High temperature stress - critical irrigation needed';
        } else if (soilMoisture < capacity * 0.25) {
          priority = 'high';
          reason = 'Critical soil moisture level';
        } else if (day.precipitationProbability < 30) {
          priority = 'medium';
          reason = 'Low rainfall probability - maintain soil moisture';
        }

        schedule.push({
          date: day.date,
          duration: Math.round(duration * 100) / 100,
          amount: Math.round(irrigationAmount * 100) / 100,
          reason,
          priority
        });
        
        soilMoisture += irrigationAmount;
        totalWaterNeed += irrigationAmount;
      }
    }

    return {
      schedule,
      totalWaterNeed: Math.round(totalWaterNeed * 100) / 100
    };
  }
}