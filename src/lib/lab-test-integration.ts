import { SupabaseService } from './supabase-service'
import type { Database } from '@/types/database'
import {
  generateSoilTestRecommendations,
  generatePetioleTestRecommendations,
  type Recommendation
} from './lab-test-recommendations'
import { differenceInDays, addMonths, format } from 'date-fns'
import type { LabTestRecord } from '@/types/lab-tests'

type SoilTestRecord = Database['public']['Tables']['soil_test_records']['Row']
type PetioleTestRecord = Database['public']['Tables']['petiole_test_records']['Row']

export interface LabTestWithRecommendations {
  test: LabTestRecord
  type: 'soil' | 'petiole'
  recommendations: Recommendation[]
  age: number // days since test
}

/**
 * Get the latest soil test for a farm
 */
export async function getLatestSoilTest(
  farmId: number
): Promise<LabTestWithRecommendations | null> {
  try {
    const tests = await SupabaseService.getSoilTestRecords(farmId, 1)
    if (!tests || tests.length === 0) return null

    const test = tests[0]
    // Only generate recommendations if parameters exist
    const recommendations = test.parameters
      ? generateSoilTestRecommendations(test.parameters as any)
      : []
    const age = differenceInDays(new Date(), new Date(test.date))

    return {
      test,
      type: 'soil',
      recommendations,
      age
    }
  } catch (error) {
    console.error('Error fetching latest soil test:', error)
    return null
  }
}

/**
 * Get the latest petiole test for a farm
 */
export async function getLatestPetioleTest(
  farmId: number
): Promise<LabTestWithRecommendations | null> {
  try {
    const tests = await SupabaseService.getPetioleTestRecords(farmId, 1)
    if (!tests || tests.length === 0) return null

    const test = tests[0]
    // Only generate recommendations if parameters exist
    const recommendations = test.parameters
      ? generatePetioleTestRecommendations(test.parameters as any)
      : []
    const age = differenceInDays(new Date(), new Date(test.date))

    return {
      test,
      type: 'petiole',
      recommendations,
      age
    }
  } catch (error) {
    console.error('Error fetching latest petiole test:', error)
    return null
  }
}

/**
 * Check if a farm needs a new test (last test is old)
 */
export async function checkTestReminders(farmId: number): Promise<{
  soilTestNeeded: boolean
  petioleTestNeeded: boolean
  soilTestAge?: number
  petioleTestAge?: number
}> {
  const SOIL_TEST_INTERVAL_DAYS = 730 // 2 years
  const PETIOLE_TEST_INTERVAL_DAYS = 90 // 3 months

  const [latestSoil, latestPetiole] = await Promise.all([
    getLatestSoilTest(farmId),
    getLatestPetioleTest(farmId)
  ])

  return {
    soilTestNeeded: !latestSoil || latestSoil.age > SOIL_TEST_INTERVAL_DAYS,
    petioleTestNeeded: !latestPetiole || latestPetiole.age > PETIOLE_TEST_INTERVAL_DAYS,
    soilTestAge: latestSoil?.age,
    petioleTestAge: latestPetiole?.age
  }
}

/**
 * Generate fertilizer plan from soil test recommendations
 */
export interface FertilizerPlanItem {
  month: string // e.g., "January 2025"
  date: Date
  growthStage: string
  applications: Array<{
    product: string
    dosage: string
    method: string // soil, foliar, fertigation
    purpose: string
    recommendationSource: string // Which recommendation triggered this
  }>
  notes: string
}

export function generateFertilizerPlan(
  soilTest: SoilTestRecord,
  recommendations: Recommendation[],
  startDate: Date = new Date()
): FertilizerPlanItem[] {
  const plan: FertilizerPlanItem[] = []

  // Extract action recommendations
  const actionRecs = recommendations.filter(
    (r) => (r.priority === 'critical' || r.priority === 'high') && r.type === 'action'
  )

  if (actionRecs.length === 0) return plan

  // Month 1: Immediate actions
  const immediateApplications: FertilizerPlanItem['applications'] = []

  actionRecs.forEach((rec) => {
    // Parse technical recommendation to extract dosage
    const technical = rec.technical.toLowerCase()

    // pH correction
    if (rec.parameter === 'pH') {
      if (technical.includes('lime')) {
        immediateApplications.push({
          product: 'Agricultural Lime (CaCO₃)',
          dosage: technical.match(/(\d+[-–]\d+)\s*tons?\/acre/)?.[1] || '2-3 tons/acre',
          method: 'soil',
          purpose: 'Raise soil pH to optimal range (6.5-7.5)',
          recommendationSource: rec.parameter
        })
      } else if (technical.includes('gypsum')) {
        immediateApplications.push({
          product: 'Gypsum (CaSO₄)',
          dosage: technical.match(/(\d+[-–]\d+)\s*(kg|tons?)\/acre/)?.[0] || '500-1000 kg/acre',
          method: 'soil',
          purpose: 'Lower soil pH to optimal range',
          recommendationSource: rec.parameter
        })
      } else if (technical.includes('sulfur')) {
        immediateApplications.push({
          product: 'Elemental Sulfur',
          dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '200-400 kg/acre',
          method: 'soil',
          purpose: 'Lower soil pH',
          recommendationSource: rec.parameter
        })
      }
    }

    // EC correction (leaching)
    if (rec.parameter === 'EC' && technical.includes('leaching')) {
      immediateApplications.push({
        product: 'Water (Leaching Irrigation)',
        dosage: technical.match(/(\d+)%/)?.[0] || '120-150% of normal',
        method: 'fertigation',
        purpose: 'Flush excess salts from soil',
        recommendationSource: rec.parameter
      })
    }

    // Nitrogen
    if (rec.parameter === 'Nitrogen' && technical.includes('urea')) {
      immediateApplications.push({
        product: 'Urea (46-0-0)',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '25-30 kg/acre',
        method: 'soil',
        purpose: 'Correct nitrogen deficiency',
        recommendationSource: rec.parameter
      })
    }

    // Phosphorus
    if (
      rec.parameter === 'Phosphorus' &&
      (technical.includes('dap') || technical.includes('ssp'))
    ) {
      immediateApplications.push({
        product: 'DAP (18-46-0) or SSP',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '50-60 kg/acre',
        method: 'soil',
        purpose: 'Correct phosphorus deficiency',
        recommendationSource: rec.parameter
      })
    }

    // Potassium
    if (rec.parameter === 'Potassium' && technical.includes('mop')) {
      immediateApplications.push({
        product: 'Muriate of Potash (MOP)',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '40-50 kg/acre',
        method: 'soil',
        purpose: 'Correct potassium deficiency',
        recommendationSource: rec.parameter
      })
    }

    // Organic Matter
    if (rec.parameter === 'Organic Matter') {
      immediateApplications.push({
        product: 'Well-decomposed FYM or Compost',
        dosage: technical.match(/(\d+[-–]\d+)\s*tons?\/acre/)?.[0] || '3-5 tons/acre',
        method: 'soil',
        purpose: 'Improve soil structure and microbial activity',
        recommendationSource: rec.parameter
      })
    }

    // Micronutrients
    if (rec.parameter === 'Zinc') {
      immediateApplications.push({
        product: 'Zinc Sulfate (ZnSO₄)',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '10-15 kg/acre',
        method: technical.includes('foliar') ? 'foliar' : 'soil',
        purpose: 'Correct zinc deficiency',
        recommendationSource: rec.parameter
      })
    }

    if (rec.parameter === 'Boron') {
      immediateApplications.push({
        product: 'Borax',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '5-10 kg/acre',
        method: 'soil',
        purpose: 'Correct boron deficiency (essential for fruit set)',
        recommendationSource: rec.parameter
      })
    }

    if (rec.parameter === 'Iron') {
      immediateApplications.push({
        product: 'Ferrous Sulfate or Chelated Iron',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '20-25 kg/acre',
        method: technical.includes('foliar') ? 'foliar' : 'soil',
        purpose: 'Correct iron deficiency',
        recommendationSource: rec.parameter
      })
    }
  })

  // Create plan entries
  if (immediateApplications.length > 0) {
    plan.push({
      month: format(startDate, 'MMMM yyyy'),
      date: startDate,
      growthStage: 'Pre-season / Bud Break',
      applications: immediateApplications,
      notes: 'Priority applications based on soil test. Apply before active growth begins.'
    })
  }

  // Month 2-3: Follow-up applications (if pH correction was needed)
  const pHCorrection = actionRecs.find((r) => r.parameter === 'pH')
  if (pHCorrection) {
    const month2 = addMonths(startDate, 2)
    plan.push({
      month: format(month2, 'MMMM yyyy'),
      date: month2,
      growthStage: 'Vegetative Growth',
      applications: [
        {
          product: 'Soil Test (Follow-up)',
          dosage: '1 test',
          method: 'soil',
          purpose: 'Verify pH correction was successful',
          recommendationSource: 'pH monitoring'
        }
      ],
      notes: 'Test soil again to confirm pH has reached optimal range after correction.'
    })
  }

  // Month 4: Maintenance fertilization (based on optimal parameters)
  const month4 = addMonths(startDate, 3)
  const maintenanceApps: FertilizerPlanItem['applications'] = []

  // Check optimal parameters
  const params = soilTest.parameters as any
  if (params.nitrogen >= 150 && params.nitrogen <= 400) {
    maintenanceApps.push({
      product: 'Balanced NPK (19-19-19) through fertigation',
      dosage: '2-3 kg/acre/week',
      method: 'fertigation',
      purpose: 'Maintain nitrogen levels during active growth',
      recommendationSource: 'Maintenance'
    })
  }

  if (maintenanceApps.length > 0) {
    plan.push({
      month: format(month4, 'MMMM yyyy'),
      date: month4,
      growthStage: 'Flowering / Fruit Set',
      applications: maintenanceApps,
      notes: 'Regular fertigation schedule to support fruit development.'
    })
  }

  return plan
}

/**
 * Generate petiole test-based corrective actions
 */
export function generateCorrectiveActions(
  petioleTest: PetioleTestRecord,
  recommendations: Recommendation[]
): FertilizerPlanItem[] {
  const plan: FertilizerPlanItem[] = []
  const now = new Date()

  const criticalRecs = recommendations.filter(
    (r) => (r.priority === 'critical' || r.priority === 'high') && r.type === 'action'
  )

  if (criticalRecs.length === 0) return plan

  const applications: FertilizerPlanItem['applications'] = []

  criticalRecs.forEach((rec) => {
    const technical = rec.technical.toLowerCase()

    // Nitrogen correction
    if (rec.parameter === 'Nitrogen') {
      if (technical.includes('urea')) {
        applications.push({
          product: 'Urea Foliar Spray (1-2%)',
          dosage: '1-2% solution',
          method: 'foliar',
          purpose: 'Immediate nitrogen correction',
          recommendationSource: rec.parameter
        })
      }
      if (technical.includes('fertigation')) {
        applications.push({
          product: 'Calcium Ammonium Nitrate through drip',
          dosage: 'Increase by 20% for 2 weeks',
          method: 'fertigation',
          purpose: 'Boost nitrogen uptake',
          recommendationSource: rec.parameter
        })
      }
    }

    // Phosphorus correction
    if (rec.parameter === 'Phosphorus') {
      if (technical.includes('phosphoric acid')) {
        applications.push({
          product: 'Phosphoric Acid (H₃PO₄)',
          dosage: '5-7 liters/acre through drip',
          method: 'fertigation',
          purpose: 'Correct phosphorus deficiency',
          recommendationSource: rec.parameter
        })
      }
      if (technical.includes('dap')) {
        applications.push({
          product: 'DAP Foliar Spray (2%)',
          dosage: '2% solution',
          method: 'foliar',
          purpose: 'Quick phosphorus boost',
          recommendationSource: rec.parameter
        })
      }
    }

    // Potassium correction
    if (rec.parameter === 'Potassium') {
      applications.push({
        product: 'Potassium Sulfate (SOP)',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '15-20 kg/acre',
        method: 'fertigation',
        purpose: 'Improve fruit quality and color development',
        recommendationSource: rec.parameter
      })
    }

    // Calcium correction
    if (rec.parameter === 'Calcium') {
      applications.push({
        product: 'Calcium Nitrate',
        dosage: '10-15 kg/acre through drip',
        method: 'fertigation',
        purpose: 'Improve disease resistance and cell wall strength',
        recommendationSource: rec.parameter
      })
    }

    // Magnesium correction
    if (rec.parameter === 'Magnesium') {
      applications.push({
        product: 'Epsom Salt (MgSO₄)',
        dosage: technical.match(/(\d+[-–]\d+)\s*kg\/acre/)?.[0] || '10-15 kg/acre',
        method: technical.includes('foliar') ? 'foliar' : 'fertigation',
        purpose: 'Improve chlorophyll production and photosynthesis',
        recommendationSource: rec.parameter
      })
    }

    // Micronutrients
    if (rec.parameter === 'Zinc' || rec.parameter === 'Boron' || rec.parameter === 'Iron') {
      applications.push({
        product: `${rec.parameter} Foliar Spray`,
        dosage: '0.5-1% solution',
        method: 'foliar',
        purpose: `Correct ${rec.parameter.toLowerCase()} deficiency`,
        recommendationSource: rec.parameter
      })
    }
  })

  if (applications.length > 0) {
    plan.push({
      month: format(now, 'MMMM yyyy'),
      date: now,
      growthStage: 'Immediate Corrective Action',
      applications,
      notes:
        'Apply within 7 days based on petiole test results. Monitor plant response after 10-14 days.'
    })
  }

  return plan
}

/**
 * Check if an expense/activity is related to a test recommendation
 */
export function matchExpenseToRecommendation(
  expenseDescription: string,
  recommendations: Recommendation[]
): { matched: boolean; recommendation?: Recommendation } {
  const descLower = expenseDescription.toLowerCase()

  for (const rec of recommendations) {
    const techLower = rec.technical.toLowerCase()

    // Check for product mentions
    if (
      (descLower.includes('lime') && techLower.includes('lime')) ||
      (descLower.includes('gypsum') && techLower.includes('gypsum')) ||
      (descLower.includes('urea') && techLower.includes('urea')) ||
      (descLower.includes('dap') && techLower.includes('dap')) ||
      (descLower.includes('mop') && techLower.includes('mop')) ||
      (descLower.includes('potash') && techLower.includes('potash')) ||
      (descLower.includes('zinc') && techLower.includes('zinc')) ||
      (descLower.includes('boron') && techLower.includes('boron')) ||
      (descLower.includes('iron') && techLower.includes('iron')) ||
      (descLower.includes('calcium') && techLower.includes('calcium')) ||
      (descLower.includes('magnesium') && techLower.includes('magnesium')) ||
      (descLower.includes('compost') && techLower.includes('compost'))
    ) {
      return { matched: true, recommendation: rec }
    }
  }

  return { matched: false }
}
