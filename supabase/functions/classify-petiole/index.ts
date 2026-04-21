// ============================================================================
// SUPABASE EDGE FUNCTION: classify-petiole
//
// Triggered by database webhook on petiole_test_records INSERT
// Classifies petiole tests as green/yellow/red and auto-drafts plans from templates
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

// Types
interface PetioleParameters {
  N?: number
  P?: number
  K?: number
  Ca?: number
  Mg?: number
  Fe?: number
  Zn?: number
  B?: number
  [key: string]: number | undefined
}

interface PetioleTestRecord {
  id: number
  farm_id: number
  date: string
  parameters: PetioleParameters
}

interface Farm {
  id: number
  region: string | null
  date_of_pruning: string | null
  soil_texture_class: string | null
  soil_water_retention: number | null
  sand_percentage: number | null
  silt_percentage: number | null
  clay_percentage: number | null
}

interface Template {
  id: string
  name: string
  season_stage: string
  soil_type: string | null
  trigger_conditions: {
    nutrients?: Record<string, { min?: number; max?: number }>
    classification?: string[]
  }
  template_items: Array<{
    fertilizer_name: string
    base_quantity: number
    unit: string
    method?: string
    frequency?: number
  }>
}

type Classification = 'green' | 'yellow' | 'red'

// ============================================================================
// CLASSIFICATION RULES (Extracted for testability)
// ============================================================================

export function classifyPetioleTest(
  currentParams: PetioleParameters,
  previousTests: PetioleTestRecord[],
  confidence: number
): { classification: Classification; reason: string; useAI: boolean } {
  const macros = ['N', 'P', 'K'] as const

  // Check for missing macronutrients
  const missingMacros = macros.filter(
    (m) => currentParams[m] === null || currentParams[m] === undefined
  )
  if (missingMacros.length > 0) {
    return {
      classification: 'yellow',
      reason: `Incomplete data: missing ${missingMacros.join(', ')} values. Manual review recommended.`,
      useAI: false
    }
  }

  // No baseline - first test for this farm
  if (previousTests.length === 0) {
    return {
      classification: 'red',
      reason:
        'First petiole test for this farm. No baseline available for comparison. Manual review required to establish norms.',
      useAI: false
    }
  }

  // Get the most recent previous test
  const previousTest = previousTests[0]
  const previousParams = previousTest.parameters

  // Calculate percentage changes for macronutrients
  const changes: Record<string, number> = {}
  let maxDrop = 0
  let droppedNutrient = ''

  for (const macro of macros) {
    const current = currentParams[macro]
    const previous = previousParams[macro]

    if (current !== undefined && previous !== undefined && previous !== 0) {
      const change = ((current - previous) / previous) * 100
      changes[macro] = change

      if (change < maxDrop) {
        maxDrop = change
        droppedNutrient = macro
      }
    }
  }

  // CRITICAL: >30% drop in any macronutrient
  if (maxDrop <= -30) {
    return {
      classification: 'red',
      reason: `${droppedNutrient} dropped ${Math.abs(maxDrop).toFixed(1)}% from previous test (${previousParams[droppedNutrient]} → ${currentParams[droppedNutrient]}). Requires immediate consultant review.`,
      useAI: true
    }
  }

  // WATCH: 15-30% drop in any macronutrient
  if (maxDrop <= -15) {
    return {
      classification: 'yellow',
      reason: `${droppedNutrient} declined ${Math.abs(maxDrop).toFixed(1)}% from previous test. Monitor closely.`,
      useAI: true
    }
  }

  // Check confidence threshold
  if (confidence < 0.6) {
    return {
      classification: 'red',
      reason: 'Low confidence in automated analysis. Manual review recommended.',
      useAI: true
    }
  }

  // All checks passed - GREEN
  return {
    classification: 'green',
    reason: 'All nutrient values within normal ranges. Consistent with historical trends.',
    useAI: false
  }
}

// ============================================================================
// TEMPLATE MATCHING
// ============================================================================

export function matchTemplate(
  classification: Classification,
  seasonStage: string,
  soilType: string | null,
  templates: Template[],
  params: PetioleParameters
): Template | null {
  // Filter by classification, season stage, and soil type
  const candidates = templates.filter((t) => {
    // Match classification if specified in trigger_conditions
    const matchesClassification =
      !t.trigger_conditions.classification ||
      t.trigger_conditions.classification.includes(classification)

    // Match season stage
    const matchesSeason = t.season_stage === seasonStage

    // Match soil type (or if template has no soil_type, it's a wildcard)
    const matchesSoil = !t.soil_type || t.soil_type === soilType
    // Match nutrient trigger conditions (if provided)
    const nutrientConditions = t.trigger_conditions.nutrients || {}
    const matchesNutrientConditions = Object.entries(nutrientConditions).every(
      ([nutrient, range]) => {
        const nutrientValue =
          params[nutrient] ?? params[nutrient.toUpperCase()] ?? params[nutrient.toLowerCase()]

        if (nutrientValue === undefined || nutrientValue === null) {
          return false
        }

        if (range.min !== undefined && nutrientValue < range.min) {
          return false
        }

        if (range.max !== undefined && nutrientValue > range.max) {
          return false
        }

        return true
      }
    )

    return matchesClassification && matchesSeason && matchesSoil && matchesNutrientConditions
  })

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  // Multiple matches - pick the one with most specific trigger conditions
  // (nutrient + soil + classification specificity).
  let bestMatch = candidates[0]
  let bestSpecificity = 0

  for (const template of candidates) {
    const nutrientSpecificity = Object.keys(template.trigger_conditions.nutrients || {}).length
    const soilSpecificity = template.soil_type ? 1 : 0
    const classificationSpecificity = template.trigger_conditions.classification?.length ? 1 : 0
    const specificity = nutrientSpecificity * 2 + soilSpecificity + classificationSpecificity
    if (specificity > bestSpecificity) {
      bestSpecificity = specificity
      bestMatch = template
    }
  }

  return bestMatch
}

// ============================================================================
// GPT-4O DRAFTING (For complex/yellow/red cases)
// ============================================================================

async function generatePlanWithGPT4o(
  openai: OpenAI,
  currentParams: PetioleParameters,
  previousTests: PetioleTestRecord[],
  farm: Farm,
  seasonStage: string,
  classification: Classification,
  reason: string
): Promise<{
  items: Array<{
    fertilizer_name: string
    quantity: number
    unit: string
    method?: string
    frequency?: number
    notes?: string
  }>
} | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert agricultural consultant specializing in Indian grape farming. 
Generate a personalized fertilizer plan based on petiole test results. 

Current petiole test values (in % dry matter):
- N: ${currentParams.N ?? 'N/A'}
- P: ${currentParams.P ?? 'N/A'}
- K: ${currentParams.K ?? 'N/A'}
- Ca: ${currentParams.Ca ?? 'N/A'}
- Mg: ${currentParams.Mg ?? 'N/A'}
- Fe: ${currentParams.Fe ?? 'N/A'} ppm
- Zn: ${currentParams.Zn ?? 'N/A'} ppm
- B: ${currentParams.B ?? 'N/A'} ppm

Farm details:
- Season stage: ${seasonStage}
- Soil type: ${farm.soil_texture_class ?? 'Unknown'}
- Soil water retention: ${farm.soil_water_retention ?? 'Unknown'}%

Classification: ${classification.toUpperCase()}
Reason: ${reason}

Provide a JSON response with fertilizer recommendations. Format:
{
  "items": [
    {
      "fertilizer_name": "string",
      "quantity": number (per acre),
      "unit": "kg" | "liters",
      "method": "foliar" | "soil" | "fertigation",
      "frequency": number (times per season),
      "notes": "string (optional)"
    }
  ]
}

Guidelines:
- Focus on correcting the identified deficiencies
- Adjust for soil type (sandy = higher rates, clay = slower release)
- Consider season stage (dormancy, pruning, flowering, fruiting, harvest)
- Provide practical, implementable recommendations for Indian grape farmers
- Quantities should be per acre

Return ONLY valid JSON. No markdown, no explanation.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    // Parse JSON
    try {
      const parsed = JSON.parse(content)
      if (parsed.items && Array.isArray(parsed.items)) {
        return parsed
      }
      return null
    } catch {
      console.error('Failed to parse GPT-4o response:', content)
      return null
    }
  } catch (error) {
    console.error('GPT-4o API error:', error)
    return null
  }
}

// ============================================================================
// SEASON STAGE CALCULATION
// ============================================================================

export function calculateSeasonStage(dateOfPruning: string | null, testDate: string): string {
  if (!dateOfPruning) return 'unknown'

  const pruning = new Date(dateOfPruning)
  const test = new Date(testDate)

  // Calculate days since pruning
  const daysSincePruning = Math.floor((test.getTime() - pruning.getTime()) / (1000 * 60 * 60 * 24))

  // Grape growth stages (approximate for Indian conditions)
  if (daysSincePruning < 0) return 'dormancy'
  if (daysSincePruning < 30) return 'pruning' // Bud break to flowering
  if (daysSincePruning < 60) return 'flowering' // Flowering to fruit set
  if (daysSincePruning < 90) return 'fruiting' // Berry development
  if (daysSincePruning < 120) return 'harvest' // Harvest period
  return 'post_harvest'
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type, x-webhook-secret'
      }
    })
  }
  let supabase: ReturnType<typeof createClient> | null = null
  let claimedTriageId: string | null = null

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    // Authenticate webhook caller before processing payload
    const webhookSecret =
      Deno.env.get('CLASSIFY_PETIOLE_WEBHOOK_SECRET') || Deno.env.get('SUPABASE_WEBHOOK_SECRET')
    const authorizationHeader = req.headers.get('authorization')
    const bearerToken =
      authorizationHeader && authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length)
        : null
    const providedWebhookSecret = req.headers.get('x-webhook-secret')

    const isAuthorized =
      (webhookSecret && providedWebhookSecret === webhookSecret) ||
      (bearerToken !== null && bearerToken === supabaseServiceKey)

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized webhook request' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get OpenAI client
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable')
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Parse webhook payload
    const payload = await req.json()
    const record = payload.record

    if (!record || !record.id || !record.farm_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload: missing record data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const petioleTestId = Number(record.id)
    const farmId = Number(record.farm_id)

    if (Number.isNaN(petioleTestId) || Number.isNaN(farmId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: record ids must be numeric' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch farm details
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single()

    if (farmError || !farm) {
      console.error('Farm not found:', farmError)

      return new Response(
        JSON.stringify({
          error: 'Farm not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Get organization ID from the farm's user
    const { data: orgClient } = await supabase
      .from('organization_clients')
      .select('organization_id')
      .eq('client_user_id', farm.user_id)
      .maybeSingle()

    const organizationId = orgClient?.organization_id

    if (!organizationId) {
      return new Response(
        JSON.stringify({
          error: 'Farm is not linked to an organization'
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Atomically claim this petiole test for processing to avoid duplicate triage and plan work
    const claimResult = await claimTriageForProcessing(supabase, {
      petioleTestId,
      farmId,
      organizationId
    })

    if (!claimResult.claimed) {
      return new Response(
        JSON.stringify({ message: 'Already classified', triageId: claimResult.triageId }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    claimedTriageId = claimResult.triageId

    // Fetch previous petiole tests for this farm (last 3)
    const { data: previousTests } = await supabase
      .from('petiole_test_records')
      .select('*')
      .eq('farm_id', farmId)
      .neq('id', petioleTestId)
      .order('date', { ascending: false })
      .limit(3)

    const currentParams = record.parameters as PetioleParameters

    // Calculate season stage
    const seasonStage = calculateSeasonStage(farm.date_of_pruning, record.date)

    // Run classification
    const classificationResult = classifyPetioleTest(
      currentParams,
      previousTests || [],
      0.85 // Default confidence for rule-based classification
    )

    let aiDraftPlanId: string | null = null
    let templateMatched = false
    let gptGenerated = false
    let planItems: Array<{
      fertilizer_name: string
      quantity: number
      unit: string
      method?: string
      frequency?: number
      notes?: string
    }> | null = null

    // If classification is green or yellow, try template matching
    if (
      organizationId &&
      (classificationResult.classification === 'green' ||
        classificationResult.classification === 'yellow')
    ) {
      // Fetch templates for this org
      const { data: templates } = await supabase
        .from('plan_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('season_stage', seasonStage)

      const matchedTemplate = matchTemplate(
        classificationResult.classification,
        seasonStage,
        farm.soil_texture_class,
        templates || [],
        currentParams
      )

      if (matchedTemplate) {
        templateMatched = true
        // Create plan items from template with farm-specific adjustments
        planItems = matchedTemplate.template_items.map((item) => ({
          fertilizer_name: item.fertilizer_name,
          quantity: item.base_quantity,
          unit: item.unit,
          method: item.method,
          frequency: item.frequency,
          notes: `Auto-generated from template: ${matchedTemplate.name}`
        }))
      }
    }

    // If no template match and useAI is true, use GPT-4o
    if (!planItems && classificationResult.useAI) {
      const gptResult = await generatePlanWithGPT4o(
        openai,
        currentParams,
        previousTests || [],
        farm,
        seasonStage,
        classificationResult.classification,
        classificationResult.reason
      )

      if (gptResult) {
        gptGenerated = true
        planItems = gptResult.items
      }
    }

    // If we have plan items, create the plan
    if (planItems && planItems.length > 0 && organizationId) {
      const planTitle = `AI Draft - ${new Date(record.date).toLocaleDateString('en-IN')} - ${classificationResult.classification.toUpperCase()}`

      const { data: plan, error: planError } = await supabase
        .from('fertilizer_plans')
        .insert({
          farm_id: farmId,
          organization_id: organizationId,
          created_by: null, // System generated
          title: planTitle,
          notes: `Classification: ${classificationResult.classification}. Reason: ${classificationResult.reason}`
        })
        .select()
        .single()

      if (planError) {
        console.error('Failed to create plan:', planError)
      } else {
        aiDraftPlanId = plan.id

        // Insert plan items
        const itemsToInsert = planItems.map((item, index) => ({
          plan_id: plan.id,
          fertilizer_name: item.fertilizer_name,
          quantity: item.quantity,
          unit: item.unit,
          application_method: item.method || null,
          application_frequency: item.frequency || 1,
          notes: item.notes || null,
          sort_order: index
        }))

        const { error: itemsError } = await supabase
          .from('fertilizer_plan_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Failed to insert plan items:', itemsError)
        }
      }
    }

    if (!claimedTriageId) {
      throw new Error('Failed to claim triage row for finalization')
    }

    // Finalize triage result for the claimed row
    await finalizeTriageResult(supabase, claimedTriageId, {
      classification: classificationResult.classification,
      reason: classificationResult.reason,
      confidence: classificationResult.useAI ? 0.75 : 0.9,
      aiDraftPlanId
    })

    return new Response(
      JSON.stringify({
        classification: classificationResult.classification,
        reason: classificationResult.reason,
        triageId: claimedTriageId,
        aiDraftPlanId,
        seasonStage,
        templateMatched,
        gptGenerated
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)

    // Mark claimed triage row as failed so it does not remain in "processing" state
    if (supabase && claimedTriageId) {
      try {
        await finalizeTriageResult(supabase, claimedTriageId, {
          classification: 'red',
          reason: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
          aiDraftPlanId: null
        })
      } catch (finalizeError) {
        console.error('Failed to finalize failed triage state:', finalizeError)
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Classification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        classification: 'red' // Fail-safe
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

async function claimTriageForProcessing(
  supabase: any,
  params: {
    petioleTestId: number
    farmId: number
    organizationId: string
  }
): Promise<{ claimed: boolean; triageId: string | null }> {
  const { data: claim, error: claimError } = await supabase
    .from('petiole_triage')
    .insert(
      {
        petiole_test_id: params.petioleTestId,
        farm_id: params.farmId,
        organization_id: params.organizationId,
        classification: 'yellow',
        classification_reason: 'Processing classification request',
        confidence_score: 0,
        ai_draft_plan_id: null
      },
      {
        onConflict: 'petiole_test_id',
        ignoreDuplicates: true
      }
    )
    .select('id')
    .maybeSingle()

  if (claimError) {
    throw claimError
  }

  if (claim?.id) {
    return { claimed: true, triageId: claim.id }
  }

  const { data: existing, error: existingError } = await supabase
    .from('petiole_triage')
    .select('id')
    .eq('petiole_test_id', params.petioleTestId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  return { claimed: false, triageId: existing?.id ?? null }
}

async function finalizeTriageResult(
  supabase: any,
  triageId: string,
  params: {
    classification: Classification
    reason: string
    confidence: number
    aiDraftPlanId: string | null
  }
): Promise<string | null> {
  const { error } = await supabase
    .from('petiole_triage')
    .update({
      classification: params.classification,
      classification_reason: params.reason,
      confidence_score: params.confidence,
      ai_draft_plan_id: params.aiDraftPlanId,
      updated_at: new Date().toISOString()
    })
    .eq('id', triageId)

  if (error) {
    throw error
  }

  return triageId
}
