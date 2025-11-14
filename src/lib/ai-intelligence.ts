/**
 * Phase 3A: AI Intelligence Services
 * Outcome tracking, ROI calculation, and disease risk correlation
 */

import { SupabaseService } from './supabase-service'
import type { Recommendation } from './lab-test-recommendations'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface RecommendationOutcome {
  id?: number
  test_id: number
  test_type: 'soil' | 'petiole'
  farm_id: number
  recommendation_parameter: string
  recommendation_priority: 'critical' | 'high' | 'moderate' | 'low' | 'optimal'
  recommendation_text: string

  // Farmer action
  followed?: boolean | null
  action_taken?: string | null
  action_date?: string | null

  // Outcome metrics
  cost_spent?: number | null
  yield_impact?: number | null
  soil_parameter_change?: Record<string, number> | null
  disease_incidents?: number

  // Feedback
  satisfaction_rating?: 1 | 2 | 3 | 4 | 5 | null
  notes?: string | null

  created_at?: string
  updated_at?: string
}

export interface TestROI {
  id?: number
  test_id: number
  test_type: 'soil' | 'petiole'
  farm_id: number
  test_date: string

  // Costs
  test_cost: number

  // Benefits
  fertilizer_savings: number
  yield_increase_kg: number
  yield_increase_value: number
  disease_prevention_savings: number
  water_savings: number

  // Totals
  total_benefit: number
  roi_percentage: number

  // Period
  outcome_measured_date?: string | null
  season?: string | null

  created_at?: string
  updated_at?: string
}

export interface DiseaseRiskAlert {
  id?: number
  test_id: number
  test_type: 'soil' | 'petiole'
  farm_id: number

  nutrient_deficiency: string
  disease_risks: string[]
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_explanation: string

  preventive_actions?: string[]

  // Outcome
  disease_occurred?: boolean | null
  preventive_action_taken?: boolean | null

  created_at?: string
  resolved_at?: string | null
}

// ============================================================================
// Disease-Nutrient Risk Mapping
// ============================================================================

export const NUTRIENT_DISEASE_RISKS = {
  calcium: {
    low: {
      diseases: ['Powdery Mildew', 'Bunch Rot', 'Berry Cracking'],
      explanation:
        'Low calcium weakens cell walls, making vines more susceptible to powdery mildew and bunch rot. Berry cracking is also more common.',
      prevention: [
        'Apply calcium nitrate through fertigation at 10-15 kg/acre',
        'Foliar spray of calcium chloride during berry development',
        'Monitor for early signs of powdery mildew (white powdery spots on leaves)'
      ]
    }
  },
  potassium: {
    low: {
      diseases: ['Downy Mildew', 'General Weakness', 'Pest Susceptibility'],
      explanation:
        'Low potassium weakens overall vine health and disease resistance. Vines become more vulnerable to pests and fungal diseases.',
      prevention: [
        'Apply potassium sulfate through fertigation at 15-20 kg/acre',
        'Foliar spray of potassium nitrate',
        'Increase pest monitoring during low-K periods'
      ]
    }
  },
  nitrogen: {
    high: {
      diseases: ['Fungal Diseases', 'Soft Growth', 'Botrytis'],
      explanation:
        'Excess nitrogen causes soft, succulent growth that is highly prone to fungal infections and botrytis bunch rot.',
      prevention: [
        'Reduce nitrogen fertilization immediately',
        'Improve air circulation through pruning',
        'Increase fungicide application frequency'
      ]
    },
    low: {
      diseases: ['Chlorosis', 'Stunted Growth', 'Low Vigor'],
      explanation:
        'Nitrogen deficiency causes yellowing leaves (chlorosis) and stunted growth, reducing overall vine vigor.',
      prevention: [
        'Apply urea at 25-30 kg/acre',
        'Foliar spray of urea (1-2%) for quick response',
        'Monitor leaf color recovery after 7-10 days'
      ]
    }
  },
  magnesium: {
    low: {
      diseases: ['Chlorosis', 'Poor Photosynthesis'],
      explanation:
        'Magnesium deficiency causes interveinal chlorosis (yellowing between leaf veins) and reduces photosynthesis efficiency.',
      prevention: [
        'Apply Epsom salt (magnesium sulfate) at 10-15 kg/acre',
        'Foliar spray of magnesium sulfate (1%)',
        'Monitor for improved leaf greenness'
      ]
    }
  },
  boron: {
    low: {
      diseases: ['Poor Fruit Set', 'Bunch Necrosis'],
      explanation:
        'Boron deficiency causes poor fruit set, reduced berry size, and bunch necrosis (browning).',
      prevention: [
        'Apply borax at 5-10 kg/acre before flowering',
        'Foliar spray of boric acid (0.1-0.2%) during bloom',
        'Critical timing: just before and after flowering'
      ]
    }
  }
}

// ============================================================================
// AI Intelligence Service
// ============================================================================

export class AIIntelligenceService {
  /**
   * Generate disease risk alerts from test parameters
   */
  static async generateDiseaseRiskAlerts(
    testId: number,
    testType: 'soil' | 'petiole',
    farmId: number,
    parameters: Record<string, any>
  ): Promise<DiseaseRiskAlert[]> {
    const alerts: DiseaseRiskAlert[] = []

    // Check calcium
    const calcium = testType === 'soil' ? parameters.calcium : parameters.calcium
    if (calcium !== undefined && calcium < (testType === 'soil' ? 1000 : 1.5)) {
      const riskData = NUTRIENT_DISEASE_RISKS.calcium.low
      alerts.push({
        test_id: testId,
        test_type: testType,
        farm_id: farmId,
        nutrient_deficiency: 'calcium',
        disease_risks: riskData.diseases,
        risk_level: calcium < (testType === 'soil' ? 800 : 1.2) ? 'high' : 'medium',
        risk_explanation: riskData.explanation,
        preventive_actions: riskData.prevention
      })
    }

    // Check potassium
    const potassium = testType === 'soil' ? parameters.potassium : parameters.potassium
    if (potassium !== undefined && potassium < (testType === 'soil' ? 200 : 1.5)) {
      const riskData = NUTRIENT_DISEASE_RISKS.potassium.low
      alerts.push({
        test_id: testId,
        test_type: testType,
        farm_id: farmId,
        nutrient_deficiency: 'potassium',
        disease_risks: riskData.diseases,
        risk_level: potassium < (testType === 'soil' ? 150 : 1.2) ? 'high' : 'medium',
        risk_explanation: riskData.explanation,
        preventive_actions: riskData.prevention
      })
    }

    // Check nitrogen (high)
    const nitrogen = testType === 'soil' ? parameters.nitrogen : parameters.total_nitrogen
    if (nitrogen !== undefined && nitrogen > (testType === 'soil' ? 400 : 4.0)) {
      const riskData = NUTRIENT_DISEASE_RISKS.nitrogen.high
      alerts.push({
        test_id: testId,
        test_type: testType,
        farm_id: farmId,
        nutrient_deficiency: 'nitrogen_excess',
        disease_risks: riskData.diseases,
        risk_level: nitrogen > (testType === 'soil' ? 500 : 5.0) ? 'high' : 'medium',
        risk_explanation: riskData.explanation,
        preventive_actions: riskData.prevention
      })
    }

    // Check magnesium
    const magnesium = testType === 'soil' ? parameters.magnesium : parameters.magnesium
    if (magnesium !== undefined && magnesium < (testType === 'soil' ? 120 : 0.3)) {
      const riskData = NUTRIENT_DISEASE_RISKS.magnesium.low
      alerts.push({
        test_id: testId,
        test_type: testType,
        farm_id: farmId,
        nutrient_deficiency: 'magnesium',
        disease_risks: riskData.diseases,
        risk_level: 'low',
        risk_explanation: riskData.explanation,
        preventive_actions: riskData.prevention
      })
    }

    // Check boron
    const boron = testType === 'soil' ? parameters.boron : parameters.boron
    if (boron !== undefined && boron < (testType === 'soil' ? 0.5 : 30)) {
      const riskData = NUTRIENT_DISEASE_RISKS.boron.low
      alerts.push({
        test_id: testId,
        test_type: testType,
        farm_id: farmId,
        nutrient_deficiency: 'boron',
        disease_risks: riskData.diseases,
        risk_level: boron < (testType === 'soil' ? 0.3 : 20) ? 'high' : 'medium',
        risk_explanation: riskData.explanation,
        preventive_actions: riskData.prevention
      })
    }

    return alerts
  }

  /**
   * Calculate estimated ROI for a test based on recommendations
   */
  static calculateEstimatedROI(
    testCost: number,
    recommendations: Recommendation[],
    farmArea: number = 1
  ): {
    estimated_savings: number
    estimated_yield_impact: number
    estimated_roi: number
  } {
    let estimated_savings = 0
    let estimated_yield_impact = 0

    recommendations.forEach((rec) => {
      // Calculate savings from "skip unnecessary products" recommendations
      if (rec.type === 'savings') {
        // Extract savings amount from simple text (e.g., "Save ₹18,000")
        const savingsMatch = rec.simple.match(/₹([\d,]+)/)
        if (savingsMatch) {
          const savings = parseInt(savingsMatch[1].replace(/,/g, ''))
          estimated_savings += savings * farmArea
        }
      }

      // Estimate yield impact from critical/high priority actions
      if (rec.priority === 'critical') {
        // Critical deficiencies can cause 20-30% yield loss if not corrected
        estimated_yield_impact += 25 // percentage
      } else if (rec.priority === 'high') {
        // High priority issues cause 10-15% yield loss
        estimated_yield_impact += 12
      }
    })

    // Cap yield impact at 50% (realistic maximum improvement)
    estimated_yield_impact = Math.min(estimated_yield_impact, 50)

    // Calculate ROI
    const total_benefit = estimated_savings
    const estimated_roi = ((total_benefit - testCost) / testCost) * 100

    return {
      estimated_savings,
      estimated_yield_impact,
      estimated_roi
    }
  }

  /**
   * Get smart insights for a farm based on historical data
   */
  static async getFarmInsights(farmId: number): Promise<{
    soil_health_trend: 'improving' | 'stable' | 'declining' | 'unknown'
    total_roi: number
    recommendations_followed: number
    recommendations_total: number
    avg_satisfaction: number
    key_insights: string[]
  }> {
    // This would query the database for historical outcomes
    // For now, return placeholder structure
    return {
      soil_health_trend: 'unknown',
      total_roi: 0,
      recommendations_followed: 0,
      recommendations_total: 0,
      avg_satisfaction: 0,
      key_insights: []
    }
  }

  /**
   * Track recommendation outcome
   */
  static async trackOutcome(outcome: RecommendationOutcome): Promise<void> {
    // Save to database
    // This would use SupabaseService to insert into recommendation_outcomes table
    console.log('Tracking outcome:', outcome)
  }

  /**
   * Update ROI tracking
   */
  static async updateROI(roi: TestROI): Promise<void> {
    // Save to database
    // This would use SupabaseService to insert/update test_roi_tracking table
    console.log('Updating ROI:', roi)
  }

  /**
   * Save disease risk alert
   */
  static async saveDiseaseRiskAlert(alert: DiseaseRiskAlert): Promise<void> {
    // Save to database
    // This would use SupabaseService to insert into disease_risk_alerts table
    console.log('Saving disease risk alert:', alert)
  }
}
