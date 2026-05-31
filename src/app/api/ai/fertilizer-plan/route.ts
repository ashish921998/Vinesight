import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createServerSupabaseClient } from '@/lib/auth-utils'

function getSeasonStage(dateOfPruning: string | null): string {
  if (!dateOfPruning) return 'unknown'
  const months = (Date.now() - new Date(dateOfPruning).getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (months < 1) return 'pruning'
  if (months < 2) return 'flowering'
  if (months < 4) return 'fruiting'
  if (months < 5) return 'harvest'
  if (months < 6) return 'post_harvest'
  return 'dormancy'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId, organizationId } = await request.json()

    if (!farmId || !organizationId) {
      return Response.json({ error: 'farmId and organizationId are required' }, { status: 400 })
    }

    // Verify user belongs to the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle()

    if (!membership) {
      return Response.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    // Fetch farm details
    const { data: farm } = await supabase
      .from('farms')
      .select('name, region, soil_texture_class, crop_variety, area, date_of_pruning')
      .eq('id', farmId)
      .single()

    if (!farm) {
      return Response.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Fetch latest 3 petiole tests
    const { data: petioleTests, error: petioleError } = await supabase
      .from('petiole_test_records')
      .select('date, parameters')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })
      .limit(3)

    if (petioleError) {
      console.error('Failed to fetch petiole tests:', petioleError)
      return Response.json({ error: 'Failed to fetch farm data' }, { status: 500 })
    }

    // Fetch latest soil test
    const { data: soilTests, error: soilError } = await supabase
      .from('soil_test_records')
      .select('date, parameters')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })
      .limit(1)

    if (soilError) {
      console.error('Failed to fetch soil tests:', soilError)
      return Response.json({ error: 'Failed to fetch farm data' }, { status: 500 })
    }

    // Fetch latest 5 spray records
    const { data: sprayRecords, error: sprayError } = await supabase
      .from('spray_records')
      .select('date, chemicals')
      .eq('farm_id', farmId)
      .order('date', { ascending: false })
      .limit(5)

    if (sprayError) {
      console.error('Failed to fetch spray records:', sprayError)
      return Response.json({ error: 'Failed to fetch farm data' }, { status: 500 })
    }

    const seasonStage = getSeasonStage(farm.date_of_pruning)

    const prompt = `You are an expert agronomist specializing in grape farming in Maharashtra, India.

Generate a fertilizer plan for this farm based on the data below.

## Farm Details
- Name: ${farm.name}
- Region: ${farm.region}
- Soil Type: ${farm.soil_texture_class || 'unknown'}
- Crop Variety: ${farm.crop_variety}
- Area: ${farm.area} acres
- Current Season Stage: ${seasonStage}
- Date of Pruning: ${farm.date_of_pruning || 'unknown'}

## Latest Petiole Test Results (most recent first)
${
  petioleTests && petioleTests.length > 0
    ? petioleTests
        .map((t) => `- Date: ${t.date}, Parameters: ${JSON.stringify(t.parameters)}`)
        .join('\n')
    : 'No petiole test data available'
}

## Latest Soil Test
${
  soilTests && soilTests.length > 0
    ? `Date: ${soilTests[0].date}, Parameters: ${JSON.stringify(soilTests[0].parameters)}`
    : 'No soil test data available'
}

## Recent Spray History
${
  sprayRecords && sprayRecords.length > 0
    ? sprayRecords
        .map((s) => `- Date: ${s.date}, Chemicals: ${JSON.stringify(s.chemicals)}`)
        .join('\n')
    : 'No spray records available'
}

Based on the nutrient levels, soil conditions, season stage, and spray history:
1. Identify any nutrient deficiencies or imbalances
2. Recommend specific fertilizers with quantities per acre
3. Specify application methods and timing

Return ONLY valid JSON in this exact format:
{
  "title": "descriptive plan title including farm name and season",
  "reasoning": "2-3 sentence explanation of why these fertilizers are recommended based on the data",
  "items": [
    {
      "fertilizer_name": "specific fertilizer name",
      "quantity": number_per_acre,
      "unit": "kg" or "liters" or "grams",
      "application_method": "soil" or "foliar" or "fertigation",
      "application_frequency": number_of_applications,
      "notes": "specific timing and application notes"
    }
  ],
  "warnings": ["any concerns or warnings about the farm conditions"],
  "confidence": number_between_0_and_1
}`

    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system' as const,
          content:
            'You are an expert agronomist specializing in Indian grape farming. Always respond with valid JSON only, no markdown or code blocks.'
        },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.3
    })

    // Parse the AI response
    const text = result.text
      .trim()
      .replace(/^```json?\s*/, '')
      .replace(/\s*```$/, '')
    const plan = JSON.parse(text)

    // Validate response shape before returning
    if (
      !plan ||
      typeof plan !== 'object' ||
      typeof plan.title !== 'string' ||
      typeof plan.reasoning !== 'string' ||
      !Array.isArray(plan.items) ||
      !Array.isArray(plan.warnings) ||
      typeof plan.confidence !== 'number'
    ) {
      console.error('AI returned malformed plan structure:', plan)
      return Response.json({ error: 'AI returned an invalid plan structure' }, { status: 500 })
    }

    return Response.json(plan)
  } catch (error) {
    console.error('AI plan generation failed:', error)
    return Response.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
