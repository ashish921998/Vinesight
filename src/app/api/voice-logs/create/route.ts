// Voice Logs API Route
// Saves extracted farming data to the appropriate Supabase table

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { globalRateLimiter } from '@/lib/validation'
import type {
  VoiceIntent,
  IrrigationLogData,
  SprayLogData,
  FertigationLogData,
  HarvestLogData,
  CreatedVia
} from '@/types/voice'

const CREATED_VIA: CreatedVia = 'voice_assistant'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    const rateLimitResult = globalRateLimiter.checkLimit(`voice-logs-${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          errorType: 'quota-exceeded'
        } as const,
        { status: 429 }
      )
    }

    // Authenticate user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          errorType: 'api-error'
        } as const,
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      intent,
      data,
      conversationId,
      transcript,
      confidence = 1.0
    }: {
      intent: VoiceIntent
      data: Record<string, unknown>
      conversationId?: string
      transcript?: string
      confidence?: number
    } = body

    if (!intent || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intent and data are required',
          errorType: 'api-error'
        } as const,
        { status: 400 }
      )
    }

    // Get farm_id from data or fetch from farm name
    let farmId = data.farmId as number | undefined
    if (!farmId && data.farmName && typeof data.farmName === 'string') {
      const { data: farm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', `%${data.farmName}%`)
        .single()

      farmId = farm?.id
    }

    if (!farmId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not identify farm. Please specify a valid farm name.',
          errorType: 'api-error'
        } as const,
        { status: 400 }
      )
    }

    // Save to appropriate table based on intent
    let recordId: number | undefined
    let error: string | undefined

    switch (intent) {
      case 'irrigation': {
        const irrigationResult = await saveIrrigationLog(
          supabase,
          farmId,
          data as IrrigationLogData,
          conversationId,
          transcript,
          confidence
        )
        recordId = irrigationResult.recordId
        error = irrigationResult.error
        break
      }

      case 'spray': {
        const sprayResult = await saveSprayLog(
          supabase,
          farmId,
          data as SprayLogData,
          conversationId,
          transcript,
          confidence
        )
        recordId = sprayResult.recordId
        error = sprayResult.error
        break
      }

      case 'fertigation': {
        const fertigationResult = await saveFertigationLog(
          supabase,
          farmId,
          data as FertigationLogData,
          conversationId,
          transcript,
          confidence
        )
        recordId = fertigationResult.recordId
        error = fertigationResult.error
        break
      }

      case 'harvest': {
        const harvestResult = await saveHarvestLog(
          supabase,
          farmId,
          data as HarvestLogData,
          conversationId,
          transcript,
          confidence
        )
        recordId = harvestResult.recordId
        error = harvestResult.error
        break
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported intent: ${intent}`,
            errorType: 'api-error'
          } as const,
          { status: 400 }
        )
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
          errorType: 'api-error'
        } as const,
        { status: 500 }
      )
    }

    // Update conversation if provided
    if (conversationId && recordId) {
      await updateConversation(supabase, parseInt(conversationId), intent)
    }

    return NextResponse.json({
      success: true,
      recordId
    } as const)

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Voice logs API error:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save record. Please try again.',
        errorType: 'api-error'
      } as const,
      { status: 500 }
    )
  }
}

// ============================================================================
// Log Save Functions
// ============================================================================

async function saveIrrigationLog(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  farmId: number,
  data: IrrigationLogData,
  conversationId?: string,
  transcript?: string,
  confidence?: number
): Promise<{ recordId?: number; error?: string }> {
  try {
    // Get date_of_pruning from farm if not provided
    const { data: farm } = await supabase
      .from('farms')
      .select('date_of_pruning')
      .eq('id', farmId)
      .single()

    const record = {
      farm_id: farmId,
      date: data.date,
      duration: data.duration,
      area: data.area,
      growth_stage: data.growthStage || 'unknown',
      moisture_status: data.moistureStatus || 'unknown',
      system_discharge: data.systemDischarge || 0,
      notes: data.notes || null,
      date_of_pruning: farm?.date_of_pruning || null,
      conversation_id: conversationId ? parseInt(conversationId) : null,
      created_via: CREATED_VIA,
      voice_command_transcript: transcript || null,
      processing_confidence: confidence
    }

    const { data: inserted, error } = await supabase
      .from('irrigation_records')
      .insert(record)
      .select('id')
      .single()

    if (error || !inserted) {
      return { error: error?.message || 'Failed to save irrigation log' }
    }

    return { recordId: inserted.id }
  } catch (e) {
    return { error: 'Error saving irrigation log' }
  }
}

async function saveSprayLog(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  farmId: number,
  data: SprayLogData,
  conversationId?: string,
  transcript?: string,
  confidence?: number
): Promise<{ recordId?: number; error?: string }> {
  try {
    // Get date_of_pruning from farm if not provided
    const { data: farm } = await supabase
      .from('farms')
      .select('date_of_pruning')
      .eq('id', farmId)
      .single()

    // Convert chemicals array to JSON format
    const chemicalsJson = data.chemicals.map(c => ({
      name: c.name,
      dose: c.dose || '',
      quantity: c.quantity
    }))

    // Calculate total quantity_amount and quantity_unit
    const totalQuantity = data.chemicals.reduce((sum, c) => sum + c.quantity, 0)
    const primaryUnit = data.chemicals[0]?.unit || 'ml'

    const record = {
      farm_id: farmId,
      date: data.date,
      chemical: data.chemicals[0]?.name || null,
      chemicals: chemicalsJson,
      dose: data.chemicals[0]?.dose || null,
      area: data.area,
      operator: data.operator,
      weather: data.weather,
      water_volume: data.waterVolume || null,
      quantity_amount: totalQuantity,
      quantity_unit: primaryUnit,
      notes: data.notes || null,
      date_of_pruning: farm?.date_of_pruning || null,
      conversation_id: conversationId ? parseInt(conversationId) : null,
      created_via: CREATED_VIA,
      voice_command_transcript: transcript || null,
      processing_confidence: confidence
    }

    const { data: inserted, error } = await supabase
      .from('spray_records')
      .insert(record)
      .select('id')
      .single()

    if (error || !inserted) {
      return { error: error?.message || 'Failed to save spray log' }
    }

    return { recordId: inserted.id }
  } catch (e) {
    return { error: 'Error saving spray log' }
  }
}

async function saveFertigationLog(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  farmId: number,
  data: FertigationLogData,
  conversationId?: string,
  transcript?: string,
  confidence?: number
): Promise<{ recordId?: number; error?: string }> {
  try {
    // Get date_of_pruning from farm if not provided
    const { data: farm } = await supabase
      .from('farms')
      .select('date_of_pruning')
      .eq('id', farmId)
      .single()

    // Convert fertilizers array to JSON format
    const fertilizersJson = data.fertilizers.map(f => ({
      name: f.name,
      unit: f.unit,
      quantity: f.quantity
    }))

    const record = {
      farm_id: farmId,
      date: data.date,
      fertilizers: fertilizersJson,
      area: data.area,
      notes: data.notes || null,
      date_of_pruning: farm?.date_of_pruning || null,
      conversation_id: conversationId ? parseInt(conversationId) : null,
      created_via: CREATED_VIA,
      voice_command_transcript: transcript || null,
      processing_confidence: confidence
    }

    const { data: inserted, error } = await supabase
      .from('fertigation_records')
      .insert(record)
      .select('id')
      .single()

    if (error || !inserted) {
      return { error: error?.message || 'Failed to save fertigation log' }
    }

    return { recordId: inserted.id }
  } catch (e) {
    return { error: 'Error saving fertigation log' }
  }
}

async function saveHarvestLog(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  farmId: number,
  data: HarvestLogData,
  conversationId?: string,
  transcript?: string,
  confidence?: number
): Promise<{ recordId?: number; error?: string }> {
  try {
    // Get date_of_pruning from farm if not provided
    const { data: farm } = await supabase
      .from('farms')
      .select('date_of_pruning')
      .eq('id', farmId)
      .single()

    const record = {
      farm_id: farmId,
      date: data.date,
      quantity: data.quantity,
      grade: data.grade,
      price: data.price || null,
      buyer: data.buyer || null,
      notes: data.notes || null,
      date_of_pruning: farm?.date_of_pruning || null,
      conversation_id: conversationId ? parseInt(conversationId) : null,
      created_via: CREATED_VIA,
      voice_command_transcript: transcript || null,
      processing_confidence: confidence
    }

    const { data: inserted, error } = await supabase
      .from('harvest_records')
      .insert(record)
      .select('id')
      .single()

    if (error || !inserted) {
      return { error: error?.message || 'Failed to save harvest log' }
    }

    return { recordId: inserted.id }
  } catch (e) {
    return { error: 'Error saving harvest log' }
  }
}

async function updateConversation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  conversationId: number,
  intent: VoiceIntent
): Promise<void> {
  try {
    // Use RPC for atomic increment to avoid race conditions
    const { error } = await supabase.rpc('increment_conversation_message_count', {
      conversation_id: conversationId
    })

    if (error) {
      // Fallback to direct update if RPC doesn't exist
      await supabase
        .from('ai_conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)
    }
  } catch (e) {
    console.error('Failed to update conversation:', e)
  }
}

// ============================================================================
// OPTIONS Handler for CORS
// ============================================================================

// Get allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || ''
  return allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
}

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false
  const allowedOrigins = getAllowedOrigins()
  if (allowedOrigins.length === 0) {
    return false
  }
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      return origin.endsWith(`.${domain}`) || origin === domain
    }
    return origin === allowed
  })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, {
      status: 403
    })
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin'
    }
  })
}
