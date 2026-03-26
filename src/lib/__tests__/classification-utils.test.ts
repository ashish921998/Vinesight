import { describe, it, expect } from 'vitest'
import {
  calculatePercentDrop,
  classifyNutrient,
  classifyPetioleTest,
  compareWithBaseline,
  matchTemplate,
  findBestTemplate,
  calculateSeasonStage,
  type NutrientValues,
  type ClassificationThresholds
} from '../classification-utils'

describe('calculatePercentDrop', () => {
  it('returns 0 for values within optimal range', () => {
    // N optimal: 1.0-1.5, midpoint 1.25
    expect(calculatePercentDrop('n', 1.2)).toBe(0)
    expect(calculatePercentDrop('n', 1.0)).toBe(0)
    expect(calculatePercentDrop('n', 1.5)).toBe(0)
  })

  it('calculates correct percent drop below minimum', () => {
    // N min: 1.0, value: 0.8 -> (1.0-0.8)/1.0 = 20%
    expect(calculatePercentDrop('n', 0.8)).toBeCloseTo(20, 1)
    // N min: 1.0, value: 0.7 -> (1.0-0.7)/1.0 = 30%
    expect(calculatePercentDrop('n', 0.7)).toBeCloseTo(30, 1)
  })

  it('handles edge case of zero value', () => {
    // N min: 1.0, value: 0 -> 100% drop
    expect(calculatePercentDrop('n', 0)).toBe(100)
  })

  it('returns null for unknown nutrients', () => {
    expect(calculatePercentDrop('unknown', 1.0)).toBeNull()
  })
})

describe('classifyNutrient', () => {
  const thresholds: ClassificationThresholds = {
    yellow: 15,
    red: 30
  }

  it('classifies as green when within range', () => {
    const result = classifyNutrient('n', 1.2, thresholds)
    expect(result.classification).toBe('green')
    expect(result.percentDrop).toBe(0)
  })

  it('classifies as yellow for 15-30% drop', () => {
    // 20% drop -> yellow
    const result = classifyNutrient('n', 0.8, thresholds)
    expect(result.classification).toBe('yellow')
    expect(result.percentDrop).toBeCloseTo(20, 1)
  })

  it('classifies as red for >30% drop', () => {
    // 35% drop -> red
    const result = classifyNutrient('n', 0.65, thresholds)
    expect(result.classification).toBe('red')
    expect(result.percentDrop).toBeCloseTo(35, 0)
  })

  it('handles boundary at exactly yellow threshold', () => {
    // Due to floating point, 0.85 -> ~15.000000000000002% which is > 15 -> yellow
    const result = classifyNutrient('n', 0.85, thresholds)
    expect(result.classification).toBe('yellow')
  })

  it('handles boundary at exactly red threshold', () => {
    // Due to floating point, 0.7 -> ~30.000000000000004% which is > 30 -> red
    const result = classifyNutrient('n', 0.7, thresholds)
    expect(result.classification).toBe('red')
  })
})

describe('classifyPetioleTest', () => {
  const thresholds: ClassificationThresholds = {
    yellow: 15,
    red: 30
  }

  it('classifies as green when all nutrients optimal', () => {
    const nutrients: NutrientValues = {
      n: 1.2,
      p: 0.4,
      k: 2.0
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('green')
    expect(result.confidence).toBe(0.95)
    expect(result.deficientNutrients).toHaveLength(0)
    expect(result.reason).toContain('optimal')
  })

  it('classifies as yellow with single moderate deficiency', () => {
    const nutrients: NutrientValues = {
      n: 1.2,
      p: 0.24, // ~20% drop from min 0.3
      k: 2.0
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('yellow')
    expect(result.deficientNutrients).toContain('Phosphorus')
    expect(result.percentDrops.p).toBeCloseTo(20, 0)
  })

  it('classifies as red with single critical deficiency', () => {
    const nutrients: NutrientValues = {
      n: 0.6, // >30% drop from min 1.0
      p: 0.4,
      k: 2.0
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('red')
    expect(result.deficientNutrients).toContain('Nitrogen')
    expect(result.reason).toContain('Critical')
  })

  it('classifies as red when any nutrient is red (even with multiple yellows)', () => {
    const nutrients: NutrientValues = {
      n: 0.6, // red
      p: 0.24, // yellow
      k: 1.2 // yellow (from min 1.5)
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('red')
    expect(result.deficientNutrients.length).toBeGreaterThanOrEqual(1)
  })

  it('ignores null/undefined values', () => {
    const nutrients: NutrientValues = {
      n: 1.2,
      p: null,
      k: undefined
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('green')
  })

  it('handles empty nutrient object', () => {
    const result = classifyPetioleTest({}, thresholds)
    expect(result.classification).toBe('green')
    expect(result.reason).toContain('optimal')
  })

  it('includes all deficient nutrients in reason for yellow', () => {
    const nutrients: NutrientValues = {
      n: 1.2,
      p: 0.24, // yellow
      k: 1.2 // yellow
    }

    const result = classifyPetioleTest(nutrients, thresholds)
    expect(result.classification).toBe('yellow')
    expect(result.deficientNutrients).toContain('Phosphorus')
    expect(result.deficientNutrients).toContain('Potassium')
  })
})

describe('compareWithBaseline', () => {
  const thresholds: ClassificationThresholds = {
    yellow: 15,
    red: 30
  }

  it('classifies as green when no significant change from baseline', () => {
    const current: NutrientValues = { n: 1.2, p: 0.4 }
    const baseline: NutrientValues = { n: 1.2, p: 0.4 }

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('green')
    expect(result.reason).toContain('stable')
  })

  it('detects yellow decline from baseline (15-30% drop)', () => {
    const baseline: NutrientValues = { n: 1.2 }
    const current: NutrientValues = { n: 0.96 } // 20% drop

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('yellow')
    expect(result.percentDrops.n).toBeCloseTo(20, 0)
    expect(result.reason).toContain('decline')
  })

  it('detects red decline from baseline (>30% drop)', () => {
    const baseline: NutrientValues = { n: 1.2 }
    const current: NutrientValues = { n: 0.78 } // 35% drop

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('red')
    expect(result.percentDrops.n).toBeCloseTo(35, 0)
  })

  it('handles increase from baseline as green', () => {
    const baseline: NutrientValues = { n: 1.0 }
    const current: NutrientValues = { n: 1.5 } // 50% increase

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('green')
  })

  it('ignores nutrients missing in baseline or current', () => {
    const current: NutrientValues = { n: 1.2, p: 0.4 }
    const baseline: NutrientValues = { n: 1.2 } // p is missing

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('green')
    expect(result.percentDrops.p).toBeUndefined()
  })

  it('handles multiple declining nutrients', () => {
    const baseline: NutrientValues = { n: 1.2, p: 0.4, k: 2.0 }
    const current: NutrientValues = {
      n: 0.78, // 35% drop - red
      p: 0.32, // 20% drop - yellow
      k: 2.0 // stable
    }

    const result = compareWithBaseline(current, baseline, thresholds)
    expect(result.classification).toBe('red')
    expect(result.deficientNutrients).toContain('Nitrogen')
    expect(result.deficientNutrients).toContain('Phosphorus')
  })
})

describe('matchTemplate', () => {
  it('returns match=false when season stage does not match', () => {
    const template = {
      season_stage: ['flowering', 'fruit_set'],
      applicable_soil_types: ['loamy', 'clay']
    }

    const result = matchTemplate(template, {
      seasonStage: 'bud_break',
      soilType: 'loamy'
    })

    expect(result.matches).toBe(false)
    expect(result.specificity).toBe(0)
  })

  it('returns match=true with season-only specificity', () => {
    const template = {
      season_stage: ['flowering'],
      applicable_soil_types: null
    }

    const result = matchTemplate(template, {
      seasonStage: 'flowering',
      soilType: 'loamy'
    })

    expect(result.matches).toBe(true)
    expect(result.specificity).toBe(1.5) // 1 for season + 0.5 for universal soil
  })

  it('returns higher specificity when soil also matches', () => {
    const template = {
      season_stage: ['flowering'],
      applicable_soil_types: ['loamy', 'sandy']
    }

    const result = matchTemplate(template, {
      seasonStage: 'flowering',
      soilType: 'loamy'
    })

    expect(result.matches).toBe(true)
    expect(result.specificity).toBe(3) // 1 for season + 2 for soil match
  })

  it('handles empty soil types array as universal', () => {
    const template = {
      season_stage: ['flowering'],
      applicable_soil_types: []
    }

    const result = matchTemplate(template, {
      seasonStage: 'flowering',
      soilType: 'any_soil'
    })

    expect(result.matches).toBe(true)
    expect(result.specificity).toBe(2) // 1 for season + 1 for empty soil types (applies to all)
  })

  it('handles null soil type context', () => {
    const template = {
      season_stage: ['flowering'],
      applicable_soil_types: ['loamy']
    }

    const result = matchTemplate(template, {
      seasonStage: 'flowering',
      soilType: null
    })

    expect(result.matches).toBe(true)
    expect(result.specificity).toBe(1) // Just season match
  })
})

describe('findBestTemplate', () => {
  const templates = [
    { id: '1', season_stage: ['flowering'], applicable_soil_types: null },
    { id: '2', season_stage: ['flowering'], applicable_soil_types: ['loamy'] },
    { id: '3', season_stage: ['fruit_set'], applicable_soil_types: ['loamy', 'clay'] }
  ]

  it('returns null when no templates match', () => {
    const result = findBestTemplate(templates, {
      seasonStage: 'harvest',
      soilType: 'loamy'
    })

    expect(result.template).toBeNull()
    expect(result.specificity).toBe(0)
  })

  it('selects template with highest specificity', () => {
    // Should prefer template 2 with soil match (specificity 3) over template 1 (specificity 1.5)
    const result = findBestTemplate(templates, {
      seasonStage: 'flowering',
      soilType: 'loamy'
    })

    expect(result.template).toBeDefined()
    expect(result.template?.id).toBe('2')
    expect(result.specificity).toBe(3)
  })

  it('selects only matching template', () => {
    const result = findBestTemplate(templates, {
      seasonStage: 'fruit_set',
      soilType: 'clay'
    })

    expect(result.template?.id).toBe('3')
    expect(result.specificity).toBe(3)
  })
})

describe('calculateSeasonStage', () => {
  it('returns pre_pruning for future pruning date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)

    const result = calculateSeasonStage(future.toISOString())
    expect(result).toBe('pre_pruning')
  })

  it('returns bud_break within 14 days of pruning', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 7)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('bud_break')
  })

  it('returns flowering at 30 days post-pruning', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 30)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('flowering')
  })

  it('returns fruit_set at 60 days post-pruning', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 60)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('fruit_set')
  })

  it('returns veraison at 100 days post-pruning', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 100)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('veraison')
  })

  it('returns harvest at 140 days post-pruning', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 140)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('harvest')
  })

  it('returns post_harvest after 160 days', () => {
    const pruning = new Date()
    pruning.setDate(pruning.getDate() - 200)

    const result = calculateSeasonStage(pruning.toISOString())
    expect(result).toBe('post_harvest')
  })
})
