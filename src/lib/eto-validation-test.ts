/**
 * ETo Validation Tests - Compare against known reference values
 * Using FAO-56 worked examples and other reference sources
 */

import { ETcCalculator, type WeatherData, type ETcCalculationInputs } from './etc-calculator'

// FAO-56 Example data (Chapter 4, Example 18)
export const FAO56_EXAMPLE_DATA = {
  location: {
    latitude: 16.22, // degrees (Thailand example)
    longitude: 0,
    elevation: 2, // meters
  },
  weather: {
    date: '2024-06-01',
    temperatureMax: 34.5, // °C
    temperatureMin: 25.6, // °C
    humidity: 65, // %
    windSpeed: 2.3, // m/s
    rainfall: 0, // mm
    solarRadiation: 22.7, // MJ/m²/day
  },
  expectedETo: 6.14, // mm/day (FAO-56 reference result)
}

// Test function to validate our implementation
export function validateEToCalculation(testData = FAO56_EXAMPLE_DATA) {
  const inputs: ETcCalculationInputs = {
    farmId: 1,
    weatherData: testData.weather as WeatherData,
    growthStage: 'fruit_set',
    plantingDate: '2024-01-01',
    location: testData.location,
    irrigationMethod: 'drip',
    soilType: 'loamy',
  }

  const result = ETcCalculator.calculateETc(inputs)

  console.log('=== ETo Validation Test ===')
  console.log('Expected ETo:', testData.expectedETo, 'mm/day')
  console.log('Calculated ETo:', result.eto.toFixed(2), 'mm/day')
  console.log('Difference:', (result.eto - testData.expectedETo).toFixed(2), 'mm/day')
  console.log(
    'Percentage Error:',
    (((result.eto - testData.expectedETo) / testData.expectedETo) * 100).toFixed(1) + '%',
  )
  console.log('============================')

  return {
    expected: testData.expectedETo,
    calculated: result.eto,
    difference: result.eto - testData.expectedETo,
    percentageError: ((result.eto - testData.expectedETo) / testData.expectedETo) * 100,
  }
}

// Indian climate test case (approximate)
export const INDIA_TEST_DATA = {
  location: {
    latitude: 19.076, // Mumbai area
    longitude: 72.8777,
    elevation: 14,
  },
  weather: {
    date: '2024-06-01',
    temperatureMax: 35.0,
    temperatureMin: 27.0,
    humidity: 75,
    windSpeed: 3.2,
    rainfall: 0,
    solarRadiation: 26.5,
  },
  expectedETo: 7.2, // Estimated for validation
}

// Fyllo test data from August 31, 2025
export const FYLLO_TEST_DATA = {
  location: {
    latitude: 19.5, // Estimated for Mantra region (need exact coordinates)
    longitude: 73.0,
    elevation: 500, // Estimated
  },
  weather: {
    date: '2025-08-31',
    temperatureMax: 30.0,
    temperatureMin: 21.0,
    humidity: 88,
    windSpeed: 5.0,
    rainfall: 0.26,
    // Testing both assumptions for solar radiation:
    solarRadiation: undefined, // Will test lux conversion
    solarRadiationLux: 26530, // Assuming this is in lux
  },
  expectedETo: 3.99,
}

// Create test with your friend's Fyllo data
export function testWithFylloData(
  temperatureMax: number,
  temperatureMin: number,
  humidity: number,
  windSpeed: number,
  rainfall: number,
  solarRadiation: number,
  latitude: number,
  longitude: number,
  elevation: number,
  fylloETo: number,
) {
  const testData = {
    location: { latitude, longitude, elevation },
    weather: {
      date: new Date().toISOString().split('T')[0],
      temperatureMax,
      temperatureMin,
      humidity,
      windSpeed,
      rainfall,
      solarRadiation,
    },
    expectedETo: fylloETo,
  }

  return validateEToCalculation(testData)
}

// Test function for Fyllo data
export function testFylloData() {
  console.log('=== TESTING FYLLO DATA ===')

  // Test with lux assumption
  const inputs: ETcCalculationInputs = {
    farmId: 1,
    weatherData: FYLLO_TEST_DATA.weather as WeatherData,
    growthStage: 'fruit_set',
    plantingDate: '2024-01-01',
    location: FYLLO_TEST_DATA.location,
    irrigationMethod: 'drip',
    soilType: 'loamy',
  }

  const result = ETcCalculator.calculateETc(inputs)

  console.log('Fyllo Data Input:', FYLLO_TEST_DATA.weather)
  console.log('Location:', FYLLO_TEST_DATA.location)
  console.log('Expected ETo (Fyllo):', FYLLO_TEST_DATA.expectedETo, 'mm/day')
  console.log('Calculated ETo (Our):', result.eto.toFixed(2), 'mm/day')
  console.log('Difference:', (result.eto - FYLLO_TEST_DATA.expectedETo).toFixed(2), 'mm/day')
  console.log(
    'Percentage Error:',
    (((result.eto - FYLLO_TEST_DATA.expectedETo) / FYLLO_TEST_DATA.expectedETo) * 100).toFixed(1) +
      '%',
  )

  return {
    expected: FYLLO_TEST_DATA.expectedETo,
    calculated: result.eto,
    difference: result.eto - FYLLO_TEST_DATA.expectedETo,
    percentageError:
      ((result.eto - FYLLO_TEST_DATA.expectedETo) / FYLLO_TEST_DATA.expectedETo) * 100,
  }
}
