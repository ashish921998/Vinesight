/**
 * Unit tests for lab test recommendations validation
 */

import {
  generateSoilTestRecommendations,
  generatePetioleTestRecommendations
} from '../lab-test-recommendations'

describe('generateSoilTestRecommendations', () => {
  describe('Input Validation', () => {
    it('should reject negative pH values', () => {
      const result = generateSoilTestRecommendations({ ph: -1 })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].parameter).toBe('Data Quality')
      expect(result[0].technical).toContain('Invalid test data')
    })

    it('should reject pH values above 14', () => {
      const result = generateSoilTestRecommendations({ ph: 20 })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].parameter).toBe('Data Quality')
    })

    it('should reject extreme EC values', () => {
      const result = generateSoilTestRecommendations({ ec: 1000 })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].parameter).toBe('Data Quality')
      expect(result[0].technical).toContain('ec')
    })

    it('should reject negative nutrient values', () => {
      const result = generateSoilTestRecommendations({
        nitrogen: -50,
        phosphorus: -10
      })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].technical).toContain('nitrogen')
      expect(result[0].technical).toContain('phosphorus')
    })

    it('should reject non-numeric values', () => {
      const result = generateSoilTestRecommendations({
        ph: NaN,
        ec: Infinity
      })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].parameter).toBe('Data Quality')
    })

    it('should accept valid values within range', () => {
      const result = generateSoilTestRecommendations({
        ph: 7.0,
        ec: 1.5,
        nitrogen: 250,
        phosphorus: 50,
        potassium: 300
      })
      // Should not return data quality error (validation passed)
      expect(result.every((r) => r.parameter !== 'Data Quality')).toBe(true)
    })

    it('should handle undefined/optional parameters', () => {
      const result = generateSoilTestRecommendations({
        ph: 7.0
        // Other parameters undefined
      })
      expect(result.every((r) => r.parameter !== 'Data Quality')).toBe(true)
    })

    it('should reject values at upper boundary edge', () => {
      const result = generateSoilTestRecommendations({
        boron: 15 // Max is 10 ppm
      })
      expect(result).toHaveLength(1)
      expect(result[0].parameter).toBe('Data Quality')
      expect(result[0].technical).toContain('boron')
    })

    it('should accept values at valid boundary', () => {
      const result = generateSoilTestRecommendations({
        ph: 14, // Max valid pH
        ec: 0 // Min valid EC
      })
      // Should generate recommendations, not validation errors
      expect(result.every((r) => r.parameter !== 'Data Quality')).toBe(true)
    })
  })

  describe('Recommendation Logic', () => {
    it('should generate critical recommendation for highly acidic soil', () => {
      const result = generateSoilTestRecommendations({ ph: 5.0 })
      const phRec = result.find((r) => r.parameter === 'pH')
      expect(phRec).toBeDefined()
      expect(phRec?.priority).toBe('critical')
    })

    it('should generate optimal recommendation for ideal pH', () => {
      const result = generateSoilTestRecommendations({ ph: 7.0 })
      const phRec = result.find((r) => r.parameter === 'pH')
      expect(phRec).toBeDefined()
      expect(phRec?.priority).toBe('optimal')
    })
  })
})

describe('generatePetioleTestRecommendations', () => {
  describe('Input Validation', () => {
    it('should reject negative percentage values', () => {
      const result = generatePetioleTestRecommendations({
        total_nitrogen: -1,
        phosphorus: -0.5
      })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].parameter).toBe('Data Quality')
    })

    it('should reject percentage values above realistic range', () => {
      const result = generatePetioleTestRecommendations({
        total_nitrogen: 15, // Max is 10%
        potassium: 10 // Max is 6%
      })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
      expect(result[0].technical).toContain('total_nitrogen')
      expect(result[0].technical).toContain('potassium')
    })

    it('should reject negative ppm values', () => {
      const result = generatePetioleTestRecommendations({
        zinc: -20,
        boron: -5
      })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('critical')
    })

    it('should reject extreme ppm values', () => {
      const result = generatePetioleTestRecommendations({
        ferrous: 1000, // Max is 500 ppm
        manganese: 600 // Max is 500 ppm
      })
      expect(result).toHaveLength(1)
      expect(result[0].parameter).toBe('Data Quality')
    })

    it('should accept valid percentage and ppm values', () => {
      const result = generatePetioleTestRecommendations({
        total_nitrogen: 3.0,
        phosphorus: 0.4,
        potassium: 2.5,
        zinc: 50,
        boron: 40
      })
      expect(result.every((r) => r.parameter !== 'Data Quality')).toBe(true)
    })

    it('should handle undefined/optional parameters', () => {
      const result = generatePetioleTestRecommendations({
        total_nitrogen: 3.0
        // Other parameters undefined
      })
      expect(result.every((r) => r.parameter !== 'Data Quality')).toBe(true)
    })
  })

  describe('Recommendation Logic', () => {
    it('should generate critical recommendation for very low potassium', () => {
      const result = generatePetioleTestRecommendations({ potassium: 1.0 })
      const kRec = result.find((r) => r.parameter === 'Potassium')
      expect(kRec).toBeDefined()
      expect(kRec?.priority).toBe('critical')
    })

    it('should generate optimal recommendation for adequate nitrogen', () => {
      const result = generatePetioleTestRecommendations({ total_nitrogen: 3.0 })
      const nRec = result.find((r) => r.parameter === 'Nitrogen')
      expect(nRec).toBeDefined()
      expect(nRec?.priority).toBe('optimal')
    })
  })
})
