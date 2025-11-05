import { describe, it, expect } from 'vitest'
import {
  ETcCalculator,
  type WeatherData,
  type ETcCalculationInputs,
  type GrapeGrowthStage,
} from '../etc-calculator'

describe('ETcCalculator', () => {
  const validWeatherData: WeatherData = {
    date: '2025-01-15',
    temperatureMax: 30,
    temperatureMin: 15,
    humidity: 60,
    windSpeed: 2.5,
    rainfall: 0,
    solarRadiation: 20,
  }

  const validLocation: ETcCalculationInputs['location'] = {
    latitude: 19.9975,
    longitude: 73.7898,
    elevation: 500,
  }

  const validInputs: ETcCalculationInputs = {
    farmId: 1,
    weatherData: validWeatherData,
    growthStage: 'flowering',
    plantingDate: '2023-01-15',
    location: validLocation,
    irrigationMethod: 'drip',
    soilType: 'loamy',
  }

  describe('calculateETo', () => {
    it('should calculate reference evapotranspiration correctly', () => {
      const eto = ETcCalculator.calculateETo(validWeatherData, validLocation)
      expect(eto).toBeGreaterThan(0)
      expect(eto).toBeLessThan(20) // Reasonable range for ETo
    })

    it('should handle different solar radiation inputs', () => {
      // Test with solarRadiation
      const eto1 = ETcCalculator.calculateETo(validWeatherData, validLocation)

      // Test with solarRadiationLux
      const weatherLux = { ...validWeatherData }
      delete weatherLux.solarRadiation
      weatherLux.solarRadiationLux = 50000
      const eto2 = ETcCalculator.calculateETo(weatherLux, validLocation)

      // Test with sunshineHours
      const weatherSunshine = { ...validWeatherData }
      delete weatherSunshine.solarRadiation
      weatherSunshine.sunshineHours = 8
      const eto3 = ETcCalculator.calculateETo(weatherSunshine, validLocation)

      expect(eto1).toBeGreaterThan(0)
      expect(eto2).toBeGreaterThan(0)
      expect(eto3).toBeGreaterThan(0)
    })

    it('should return non-negative ETo values', () => {
      const eto = ETcCalculator.calculateETo(validWeatherData, validLocation)
      expect(eto).toBeGreaterThanOrEqual(0)
    })

    it('should handle extreme temperatures', () => {
      const extremeWeather = {
        ...validWeatherData,
        temperatureMax: 45,
        temperatureMin: 25,
      }
      const eto = ETcCalculator.calculateETo(extremeWeather, validLocation)
      expect(eto).toBeGreaterThan(0)
    })

    it('should handle different elevations', () => {
      const lowElevation = { ...validLocation, elevation: 100 }
      const highElevation = { ...validLocation, elevation: 2000 }

      const eto1 = ETcCalculator.calculateETo(validWeatherData, lowElevation)
      const eto2 = ETcCalculator.calculateETo(validWeatherData, highElevation)

      expect(eto1).toBeGreaterThan(0)
      expect(eto2).toBeGreaterThan(0)
    })

    it('should throw error if temperature max < temperature min', () => {
      const invalidWeather = {
        ...validWeatherData,
        temperatureMax: 10,
        temperatureMin: 20,
      }
      expect(() => ETcCalculator.calculateETo(invalidWeather, validLocation)).toThrow()
    })

    it('should throw error if humidity out of range', () => {
      const invalidWeather = { ...validWeatherData, humidity: 150 }
      expect(() => ETcCalculator.calculateETo(invalidWeather, validLocation)).toThrow()
    })

    it('should throw error if no solar radiation data provided', () => {
      const weatherNoSolar = { ...validWeatherData }
      delete weatherNoSolar.solarRadiation
      expect(() => ETcCalculator.calculateETo(weatherNoSolar, validLocation)).toThrow(
        /solar radiation data is required/i
      )
    })
  })

  describe('getCropCoefficient', () => {
    it('should return correct Kc for each growth stage', () => {
      const stages: GrapeGrowthStage[] = [
        'dormant',
        'budbreak',
        'flowering',
        'fruit_set',
        'veraison',
        'harvest',
        'post_harvest',
      ]

      stages.forEach((stage) => {
        const { kc, description } = ETcCalculator.getCropCoefficient(stage)
        expect(kc).toBeGreaterThan(0)
        expect(kc).toBeLessThanOrEqual(1)
        expect(description).toBeDefined()
        expect(typeof description).toBe('string')
      })
    })

    it('should return highest Kc for fruit_set stage', () => {
      const { kc: fruitSetKc } = ETcCalculator.getCropCoefficient('fruit_set')
      const { kc: dormantKc } = ETcCalculator.getCropCoefficient('dormant')
      expect(fruitSetKc).toBeGreaterThan(dormantKc)
    })

    it('should return specific Kc values', () => {
      expect(ETcCalculator.getCropCoefficient('dormant').kc).toBe(0.15)
      expect(ETcCalculator.getCropCoefficient('fruit_set').kc).toBe(0.95)
      expect(ETcCalculator.getCropCoefficient('flowering').kc).toBe(0.7)
    })
  })

  describe('calculateETc', () => {
    it('should calculate crop evapotranspiration correctly', () => {
      const result = ETcCalculator.calculateETc(validInputs)

      expect(result.eto).toBeGreaterThan(0)
      expect(result.kc).toBe(0.7) // flowering stage
      expect(result.etc).toBeGreaterThan(0)
      expect(result.irrigationNeed).toBeGreaterThanOrEqual(0)
      expect(result.growthStage).toBe('flowering')
      expect(result.date).toBe('2025-01-15')
    })

    it('should account for rainfall in irrigation need', () => {
      const withRain = {
        ...validInputs,
        weatherData: { ...validWeatherData, rainfall: 10 },
      }
      const withoutRain = {
        ...validInputs,
        weatherData: { ...validWeatherData, rainfall: 0 },
      }

      const result1 = ETcCalculator.calculateETc(withRain)
      const result2 = ETcCalculator.calculateETc(withoutRain)

      expect(result1.irrigationNeed).toBeLessThan(result2.irrigationNeed)
    })

    it('should generate irrigation recommendations', () => {
      const result = ETcCalculator.calculateETc(validInputs)

      expect(result.irrigationRecommendation).toBeDefined()
      expect(result.irrigationRecommendation.shouldIrrigate).toBeDefined()
      expect(result.irrigationRecommendation.duration).toBeGreaterThanOrEqual(0)
      expect(result.irrigationRecommendation.frequency).toBeDefined()
      expect(Array.isArray(result.irrigationRecommendation.notes)).toBe(true)
    })

    it('should not recommend irrigation during dormant stage', () => {
      const dormantInputs = { ...validInputs, growthStage: 'dormant' as GrapeGrowthStage }
      const result = ETcCalculator.calculateETc(dormantInputs)

      expect(result.irrigationRecommendation.shouldIrrigate).toBe(false)
    })

    it('should recommend irrigation for high water needs', () => {
      const highNeedWeather = {
        ...validWeatherData,
        temperatureMax: 40,
        rainfall: 0,
      }
      const highNeedInputs = {
        ...validInputs,
        weatherData: highNeedWeather,
        growthStage: 'fruit_set' as GrapeGrowthStage,
      }
      const result = ETcCalculator.calculateETc(highNeedInputs)

      expect(result.irrigationRecommendation.shouldIrrigate).toBe(true)
    })

    it('should not recommend irrigation after heavy rainfall', () => {
      const rainyWeather = { ...validWeatherData, rainfall: 50 }
      const rainyInputs = { ...validInputs, weatherData: rainyWeather }
      const result = ETcCalculator.calculateETc(rainyInputs)

      expect(result.irrigationRecommendation.shouldIrrigate).toBe(false)
    })

    it('should adjust duration for drip irrigation', () => {
      const dripInputs = { ...validInputs, irrigationMethod: 'drip' as const }
      const sprinklerInputs = { ...validInputs, irrigationMethod: 'sprinkler' as const }

      const dripResult = ETcCalculator.calculateETc(dripInputs)
      const sprinklerResult = ETcCalculator.calculateETc(sprinklerInputs)

      // Drip should be more efficient (shorter duration for same need)
      if (
        dripResult.irrigationRecommendation.shouldIrrigate &&
        sprinklerResult.irrigationRecommendation.shouldIrrigate
      ) {
        expect(dripResult.irrigationRecommendation.duration).toBeLessThanOrEqual(
          sprinklerResult.irrigationRecommendation.duration
        )
      }
    })

    it('should adjust for sandy soil', () => {
      const sandyInputs = { ...validInputs, soilType: 'sandy' as const }
      const result = ETcCalculator.calculateETc(sandyInputs)

      if (result.irrigationRecommendation.shouldIrrigate) {
        const notes = result.irrigationRecommendation.notes
        expect(notes.some((note) => note.includes('Sandy soil'))).toBe(true)
      }
    })

    it('should adjust for clay soil', () => {
      const clayInputs = { ...validInputs, soilType: 'clay' as const }
      const result = ETcCalculator.calculateETc(clayInputs)

      if (result.irrigationRecommendation.shouldIrrigate) {
        const notes = result.irrigationRecommendation.notes
        expect(notes.some((note) => note.includes('Clay soil'))).toBe(true)
      }
    })

    it('should provide confidence level', () => {
      const result = ETcCalculator.calculateETc(validInputs)
      expect(['high', 'medium', 'low']).toContain(result.confidence)
    })

    it('should have high confidence with complete data', () => {
      const result = ETcCalculator.calculateETc(validInputs)
      expect(result.confidence).toBe('high')
    })
  })

  describe('determineGrowthStage', () => {
    it('should determine growth stage based on month', () => {
      const plantingDate = '2023-01-15'

      // Test different months
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-01-15')).toBe('dormant')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-03-15')).toBe('budbreak')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-04-15')).toBe('flowering')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-05-15')).toBe('fruit_set')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-07-15')).toBe('veraison')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-09-15')).toBe('harvest')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-11-15')).toBe(
        'post_harvest'
      )
    })

    it('should return dormant for winter months', () => {
      const plantingDate = '2023-01-15'
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-12-15')).toBe('dormant')
      expect(ETcCalculator.determineGrowthStage(plantingDate, '2025-02-15')).toBe('dormant')
    })
  })

  describe('calculateSeasonalRequirements', () => {
    it('should calculate requirements for all growth stages', () => {
      const results = ETcCalculator.calculateSeasonalRequirements(
        '2023-01-15',
        validLocation,
        {}
      )

      expect(results.length).toBe(7)
      results.forEach((result) => {
        expect(result.stage).toBeDefined()
        expect(result.days).toBeGreaterThan(0)
        expect(result.totalETc).toBeGreaterThan(0)
        expect(result.description).toBeDefined()
      })
    })

    it('should have different water requirements for different stages', () => {
      const results = ETcCalculator.calculateSeasonalRequirements(
        '2023-01-15',
        validLocation,
        {}
      )

      const dormant = results.find((r) => r.stage === 'dormant')
      const fruitSet = results.find((r) => r.stage === 'fruit_set')

      expect(fruitSet!.totalETc).toBeGreaterThan(dormant!.totalETc)
    })
  })

  describe('Weather Data Validation', () => {
    it('should reject extreme temperature values', () => {
      const extremeTemp = {
        ...validWeatherData,
        temperatureMax: 100,
      }
      expect(() => ETcCalculator.calculateETo(extremeTemp, validLocation)).toThrow()
    })

    it('should reject negative humidity', () => {
      const negativeHumidity = {
        ...validWeatherData,
        humidity: -10,
      }
      expect(() => ETcCalculator.calculateETo(negativeHumidity, validLocation)).toThrow()
    })

    it('should reject negative wind speed', () => {
      const negativeWind = {
        ...validWeatherData,
        windSpeed: -5,
      }
      expect(() => ETcCalculator.calculateETo(negativeWind, validLocation)).toThrow()
    })

    it('should reject extreme rainfall values', () => {
      const extremeRainfall = {
        ...validWeatherData,
        rainfall: 1000,
      }
      expect(() => ETcCalculator.calculateETo(extremeRainfall, validLocation)).toThrow()
    })

    it('should reject out of range solar radiation', () => {
      const extremeSolar = {
        ...validWeatherData,
        solarRadiation: 100,
      }
      expect(() => ETcCalculator.calculateETo(extremeSolar, validLocation)).toThrow()
    })
  })

  describe('Location Validation', () => {
    it('should reject invalid latitude', () => {
      const invalidLocation = { ...validLocation, latitude: 100 }
      expect(() => ETcCalculator.calculateETo(validWeatherData, invalidLocation)).toThrow()
    })

    it('should reject extreme elevation', () => {
      const invalidLocation = { ...validLocation, elevation: 10000 }
      expect(() => ETcCalculator.calculateETo(validWeatherData, invalidLocation)).toThrow()
    })

    it('should accept negative elevation (below sea level)', () => {
      const belowSeaLevel = { ...validLocation, elevation: -100 }
      expect(() =>
        ETcCalculator.calculateETo(validWeatherData, belowSeaLevel)
      ).not.toThrow()
    })
  })

  describe('Irrigation Recommendations', () => {
    it('should add disease risk note for high humidity', () => {
      const highHumidity = { ...validWeatherData, humidity: 85 }
      const inputs = { ...validInputs, weatherData: highHumidity }
      const result = ETcCalculator.calculateETc(inputs)

      const hasHumidityNote = result.irrigationRecommendation.notes.some((note) =>
        note.includes('High humidity')
      )
      expect(hasHumidityNote).toBe(true)
    })

    it('should add windy conditions note for high wind', () => {
      const windyWeather = { ...validWeatherData, windSpeed: 6 }
      const inputs = { ...validInputs, weatherData: windyWeather }
      const result = ETcCalculator.calculateETc(inputs)

      const hasWindNote = result.irrigationRecommendation.notes.some((note) =>
        note.includes('Windy conditions')
      )
      expect(hasWindNote).toBe(true)
    })

    it('should add critical stage note for flowering', () => {
      const floweringInputs = {
        ...validInputs,
        growthStage: 'flowering' as GrapeGrowthStage,
      }
      const result = ETcCalculator.calculateETc(floweringInputs)

      if (result.irrigationRecommendation.shouldIrrigate) {
        const hasCriticalNote = result.irrigationRecommendation.notes.some((note) =>
          note.includes('Critical growth stage')
        )
        expect(hasCriticalNote).toBe(true)
      }
    })

    it('should add veraison note for controlled stress', () => {
      const veraisonInputs = {
        ...validInputs,
        growthStage: 'veraison' as GrapeGrowthStage,
        weatherData: { ...validWeatherData, rainfall: 0 },
      }
      const result = ETcCalculator.calculateETc(veraisonInputs)

      const hasVeraisonNote = result.irrigationRecommendation.notes.some((note) =>
        note.includes('Veraison')
      )
      expect(hasVeraisonNote).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero rainfall', () => {
      const noRain = { ...validInputs, weatherData: { ...validWeatherData, rainfall: 0 } }
      expect(() => ETcCalculator.calculateETc(noRain)).not.toThrow()
    })

    it('should handle zero wind speed', () => {
      const noWind = { ...validWeatherData, windSpeed: 0 }
      expect(() => ETcCalculator.calculateETo(noWind, validLocation)).not.toThrow()
    })

    it('should handle minimum valid values', () => {
      const minWeather: WeatherData = {
        date: '2025-01-15',
        temperatureMax: 0,
        temperatureMin: -10,
        humidity: 0,
        windSpeed: 0,
        rainfall: 0,
        solarRadiation: 0.1,
      }
      expect(() => ETcCalculator.calculateETo(minWeather, validLocation)).not.toThrow()
    })
  })
})
