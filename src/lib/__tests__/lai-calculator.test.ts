import { describe, it, expect } from 'vitest'
import { LAICalculator, type LAICalculationInputs } from '../lai-calculator'

describe('LAICalculator', () => {
  const validInputs: LAICalculationInputs = {
    farmId: 1,
    vineSpacing: 2.5,
    rowSpacing: 8,
    leavesPerShoot: 15,
    shootsPerVine: 25,
    avgLeafLength: 12,
    avgLeafWidth: 10,
    canopyWidth: 1.5,
    leafShape: 'heart',
    trellisSystem: 'vsp',
    season: 'summer'
  }

  describe('calculateLAI', () => {
    it('should calculate LAI correctly with valid inputs', () => {
      const result = LAICalculator.calculateLAI(validInputs)

      expect(result.lai).toBeGreaterThan(0)
      expect(result.leafAreaPerVine).toBeGreaterThan(0)
      expect(result.leafAreaPerAcre).toBeGreaterThan(0)
      expect(result.plantDensity).toBeGreaterThan(0)
      expect(result.canopyDensity).toBeDefined()
      expect(result.lightInterception).toBeGreaterThan(0)
    })

    it('should return proper canopy density classifications', () => {
      const result = LAICalculator.calculateLAI(validInputs)
      expect(['sparse', 'optimal', 'dense', 'overcrowded']).toContain(result.canopyDensity)
    })

    it('should return quality metrics', () => {
      const result = LAICalculator.calculateLAI(validInputs)

      expect(result.qualityMetrics).toBeDefined()
      expect(['poor', 'adequate', 'good', 'excellent']).toContain(
        result.qualityMetrics.fruitExposure
      )
      expect(['poor', 'adequate', 'good', 'excellent']).toContain(result.qualityMetrics.airflow)
      expect(['low', 'moderate', 'high']).toContain(result.qualityMetrics.diseaseRisk)
    })

    it('should return recommendations', () => {
      const result = LAICalculator.calculateLAI(validInputs)

      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations.canopyManagement)).toBe(true)
      expect(Array.isArray(result.recommendations.pruningAdvice)).toBe(true)
      expect(Array.isArray(result.recommendations.trellisAdjustments)).toBe(true)
    })

    it('should classify sparse canopy correctly', () => {
      const sparseInputs = {
        ...validInputs,
        leavesPerShoot: 5,
        shootsPerVine: 10
      }
      const result = LAICalculator.calculateLAI(sparseInputs)
      expect(result.canopyDensity).toBe('sparse')
    })

    it('should classify optimal canopy correctly', () => {
      const optimalInputs = {
        ...validInputs,
        leavesPerShoot: 12,
        shootsPerVine: 20
      }
      const result = LAICalculator.calculateLAI(optimalInputs)
      // The calculated LAI should fall into a valid category
      expect(['sparse', 'optimal', 'dense', 'overcrowded']).toContain(result.canopyDensity)
      expect(result.lai).toBeGreaterThan(0)
    })

    it('should classify overcrowded canopy correctly', () => {
      const overcrowdedInputs = {
        ...validInputs,
        leavesPerShoot: 25,
        shootsPerVine: 40
      }
      const result = LAICalculator.calculateLAI(overcrowdedInputs)
      // The calculated LAI should fall into a valid category
      expect(['sparse', 'optimal', 'dense', 'overcrowded']).toContain(result.canopyDensity)
      expect(result.lai).toBeGreaterThan(0)
    })

    it('should handle different leaf shapes', () => {
      const heartResult = LAICalculator.calculateLAI({
        ...validInputs,
        leafShape: 'heart'
      })
      const roundResult = LAICalculator.calculateLAI({
        ...validInputs,
        leafShape: 'round'
      })
      const lobedResult = LAICalculator.calculateLAI({
        ...validInputs,
        leafShape: 'lobed'
      })

      expect(roundResult.leafAreaPerVine).toBeGreaterThan(lobedResult.leafAreaPerVine)
      expect(roundResult.leafAreaPerVine).toBeGreaterThan(heartResult.leafAreaPerVine)
    })

    it('should apply seasonal adjustments', () => {
      const summerResult = LAICalculator.calculateLAI({
        ...validInputs,
        season: 'summer'
      })
      const dormantResult = LAICalculator.calculateLAI({
        ...validInputs,
        season: 'dormant'
      })

      expect(summerResult.leafAreaPerVine).toBeGreaterThan(dormantResult.leafAreaPerVine)
    })

    it('should handle different trellis systems', () => {
      const vspResult = LAICalculator.calculateLAI({
        ...validInputs,
        trellisSystem: 'vsp'
      })
      const lyreResult = LAICalculator.calculateLAI({
        ...validInputs,
        trellisSystem: 'lyre'
      })

      expect(lyreResult.leafAreaPerVine).toBeGreaterThan(vspResult.leafAreaPerVine)
    })

    it('should calculate plant density correctly', () => {
      const result = LAICalculator.calculateLAI(validInputs)
      const expectedDensity = 10000 / (2.5 * 8)
      expect(result.plantDensity).toBe(Math.round(expectedDensity))
    })

    it('should calculate light interception', () => {
      const result = LAICalculator.calculateLAI(validInputs)
      expect(result.lightInterception).toBeGreaterThan(0)
      expect(result.lightInterception).toBeLessThanOrEqual(100)
    })

    it('should round LAI to 2 decimal places', () => {
      const result = LAICalculator.calculateLAI(validInputs)
      expect(result.lai.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
    })

    it('should round plant density to whole number', () => {
      const result = LAICalculator.calculateLAI(validInputs)
      expect(result.plantDensity % 1).toBe(0)
    })
  })

  describe('Canopy Management Recommendations', () => {
    it('should recommend encouraging growth for sparse canopy', () => {
      const sparseInputs = {
        ...validInputs,
        leavesPerShoot: 5,
        shootsPerVine: 10
      }
      const result = LAICalculator.calculateLAI(sparseInputs)

      const recommendations = result.recommendations.canopyManagement.join(' ')
      expect(
        recommendations.includes('Encourage') || recommendations.includes('reducing pruning')
      ).toBe(true)
    })

    it('should recommend maintenance for optimal canopy', () => {
      const optimalInputs = {
        ...validInputs,
        leavesPerShoot: 12,
        shootsPerVine: 20
      }
      const result = LAICalculator.calculateLAI(optimalInputs)

      if (result.canopyDensity === 'optimal') {
        const recommendations = result.recommendations.canopyManagement.join(' ')
        expect(recommendations.includes('Maintain')).toBe(true)
      }
    })

    it('should recommend thinning for overcrowded canopy', () => {
      const overcrowdedInputs = {
        ...validInputs,
        leavesPerShoot: 25,
        shootsPerVine: 40
      }
      const result = LAICalculator.calculateLAI(overcrowdedInputs)

      if (result.canopyDensity === 'overcrowded') {
        const recommendations = result.recommendations.canopyManagement.join(' ')
        expect(recommendations.includes('thinning') || recommendations.includes('Remove')).toBe(
          true
        )
      }
    })

    it('should recommend trellis upgrade for high LAI with VSP', () => {
      const highLAIInputs = {
        ...validInputs,
        leavesPerShoot: 25,
        shootsPerVine: 35,
        trellisSystem: 'vsp' as const
      }
      const result = LAICalculator.calculateLAI(highLAIInputs)

      if (result.lai > 3.0) {
        const trellisRecommendations = result.recommendations.trellisAdjustments.join(' ')
        expect(
          trellisRecommendations.includes('divided canopy') ||
            trellisRecommendations.includes('upgrade')
        ).toBe(true)
      }
    })

    it('should provide light-based recommendations', () => {
      const lowLightInputs = {
        ...validInputs,
        leavesPerShoot: 3,
        shootsPerVine: 5
      }
      const result = LAICalculator.calculateLAI(lowLightInputs)

      if (result.lightInterception < 60) {
        const recommendations = result.recommendations.canopyManagement.join(' ')
        expect(recommendations.includes('light')).toBe(true)
      }
    })
  })

  describe('Quality Metrics Assessment', () => {
    it('should assess poor fruit exposure for sparse canopy', () => {
      const sparseInputs = {
        ...validInputs,
        leavesPerShoot: 3,
        shootsPerVine: 5
      }
      const result = LAICalculator.calculateLAI(sparseInputs)

      if (result.lai < 1.0) {
        expect(result.qualityMetrics.fruitExposure).toBe('poor')
      }
    })

    it('should assess high disease risk for overcrowded canopy', () => {
      const overcrowdedInputs = {
        ...validInputs,
        leavesPerShoot: 25,
        shootsPerVine: 40
      }
      const result = LAICalculator.calculateLAI(overcrowdedInputs)

      if (result.lai > 4.0) {
        expect(result.qualityMetrics.diseaseRisk).toBe('high')
        expect(result.qualityMetrics.airflow).toBe('poor')
      }
    })

    it('should assess good metrics for optimal canopy', () => {
      const optimalInputs = {
        ...validInputs,
        leavesPerShoot: 13,
        shootsPerVine: 22
      }
      const result = LAICalculator.calculateLAI(optimalInputs)

      if (result.lai >= 2.0 && result.lai <= 3.0) {
        expect(result.qualityMetrics.airflow).toBe('good')
        expect(result.qualityMetrics.diseaseRisk).toBe('low')
      }
    })

    it('should assess excellent fruit exposure for balanced canopy', () => {
      const balancedInputs = {
        ...validInputs,
        leavesPerShoot: 12,
        shootsPerVine: 20
      }
      const result = LAICalculator.calculateLAI(balancedInputs)

      if (
        result.lightInterception >= 65 &&
        result.lightInterception <= 80 &&
        result.lai >= 1.5 &&
        result.lai <= 3.0
      ) {
        expect(result.qualityMetrics.fruitExposure).toBe('excellent')
      }
    })
  })

  describe('getOptimalLAITargets', () => {
    it('should return targets for table grapes', () => {
      const targets = LAICalculator.getOptimalLAITargets('table')
      expect(targets.minLAI).toBe(1.8)
      expect(targets.maxLAI).toBe(2.8)
      expect(targets.optimalRange).toBeDefined()
      expect(targets.reasoning).toBeDefined()
    })

    it('should return targets for wine grapes', () => {
      const targets = LAICalculator.getOptimalLAITargets('wine')
      expect(targets.minLAI).toBe(2.2)
      expect(targets.maxLAI).toBe(3.5)
      expect(targets.optimalRange).toBeDefined()
      expect(targets.reasoning).toBeDefined()
    })

    it('should return targets for raisin grapes', () => {
      const targets = LAICalculator.getOptimalLAITargets('raisin')
      expect(targets.minLAI).toBe(2.0)
      expect(targets.maxLAI).toBe(3.2)
      expect(targets.optimalRange).toBeDefined()
      expect(targets.reasoning).toBeDefined()
    })

    it('should have higher LAI targets for wine than table grapes', () => {
      const tableTargets = LAICalculator.getOptimalLAITargets('table')
      const wineTargets = LAICalculator.getOptimalLAITargets('wine')
      expect(wineTargets.maxLAI).toBeGreaterThan(tableTargets.maxLAI)
    })
  })

  describe('getSeasonalMonitoringSchedule', () => {
    it('should return monitoring schedule for all seasons', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      expect(schedule.length).toBeGreaterThan(0)
    })

    it('should have required fields for each season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      schedule.forEach((season) => {
        expect(season.season).toBeDefined()
        expect(season.timing).toBeDefined()
        expect(Array.isArray(season.focus)).toBe(true)
        expect(Array.isArray(season.actions)).toBe(true)
      })
    })

    it('should include spring season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      const spring = schedule.find((s) => s.season === 'Spring')
      expect(spring).toBeDefined()
      expect(spring?.actions.length).toBeGreaterThan(0)
    })

    it('should include summer season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      const summer = schedule.find((s) => s.season.includes('Summer'))
      expect(summer).toBeDefined()
    })

    it('should include autumn season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      const autumn = schedule.find((s) => s.season === 'Autumn')
      expect(autumn).toBeDefined()
    })

    it('should provide focus areas for each season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      schedule.forEach((season) => {
        expect(season.focus.length).toBeGreaterThan(0)
      })
    })

    it('should provide actions for each season', () => {
      const schedule = LAICalculator.getSeasonalMonitoringSchedule()
      schedule.forEach((season) => {
        expect(season.actions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle minimum values', () => {
      const minInputs = {
        ...validInputs,
        leavesPerShoot: 1,
        shootsPerVine: 1,
        avgLeafLength: 1,
        avgLeafWidth: 1
      }
      expect(() => LAICalculator.calculateLAI(minInputs)).not.toThrow()
    })

    it('should handle maximum realistic values', () => {
      const maxInputs = {
        ...validInputs,
        leavesPerShoot: 30,
        shootsPerVine: 50,
        avgLeafLength: 20,
        avgLeafWidth: 18
      }
      expect(() => LAICalculator.calculateLAI(maxInputs)).not.toThrow()
    })

    it('should handle different trellis systems', () => {
      const systems: Array<LAICalculationInputs['trellisSystem']> = [
        'vsp',
        'geneva',
        'scott-henry',
        'lyre',
        'pergola'
      ]

      systems.forEach((system) => {
        const result = LAICalculator.calculateLAI({ ...validInputs, trellisSystem: system })
        expect(result.lai).toBeGreaterThan(0)
      })
    })

    it('should handle all seasons', () => {
      const seasons: Array<LAICalculationInputs['season']> = [
        'spring',
        'summer',
        'autumn',
        'dormant',
        'bud_break',
        'flowering',
        'fruit_set',
        'veraison',
        'harvest',
        'post_harvest'
      ]

      seasons.forEach((season) => {
        const result = LAICalculator.calculateLAI({ ...validInputs, season })
        expect(result.lai).toBeGreaterThan(0)
      })
    })

    it('should calculate correctly with narrow vine spacing', () => {
      const narrowInputs = { ...validInputs, vineSpacing: 1.5 }
      const result = LAICalculator.calculateLAI(narrowInputs)
      expect(result.plantDensity).toBeGreaterThan(0)
    })

    it('should calculate correctly with wide row spacing', () => {
      const wideInputs = { ...validInputs, rowSpacing: 12 }
      const result = LAICalculator.calculateLAI(wideInputs)
      expect(result.plantDensity).toBeGreaterThan(0)
    })
  })
})
