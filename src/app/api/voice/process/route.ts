// Voice Processing API Route
// Uses GPT-4 with Function Calling to extract structured data from transcripts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { globalRateLimiter } from '@/lib/validation'
import OpenAI from 'openai'
import {
  detectIntent,
  generateFollowUpQuestion,
  generateSummary,
  parseRelativeDate,
  matchFarmName,
  validateIrrigationData,
  validateSprayData,
  validateFertigationData,
  validateHarvestData,
  generateConversationId
} from '@/lib/voice-hybrid-service'
import {
  GPT_FUNCTION_SCHEMAS,
  type SupportedLanguage,
  type VoiceIntent,
  type VoiceProcessRequest,
  type ConversationMessage
} from '@/types/voice'

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    const rateLimitResult = globalRateLimiter.checkLimit(`voice-process-${clientIP}`)
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
    const body = (await request.json()) as VoiceProcessRequest
    const { transcript, language, conversationId, conversationHistory = [], userId } = body

    if (!transcript) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transcript is required',
          errorType: 'processing-failed'
        } as const,
        { status: 400 }
      )
    }

    // Get user's farms for context
    const { data: farms } = await supabase
      .from('farms')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const farmList = farms || []

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(language, farmList, conversationHistory)

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ]

    // Add conversation history
    for (const msg of conversationHistory.slice(-5)) {
      // Keep last 5 messages for context
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Add current transcript
    messages.push({
      role: 'user',
      content: transcript
    })

    // Call GPT-4 with function calling
    let extractedData: Record<string, unknown> | null = null
    let detectedIntent: VoiceIntent = 'unknown'
    let followUpQuestion: string | undefined
    let clarificationField: string | undefined
    let responseText = ''
    let conversationIdToUse = conversationId

    try {
      const openai = getOpenAIClient()

      // Convert function schemas to tools format
      const tools = Object.values(GPT_FUNCTION_SCHEMAS).map(schema => ({
        type: 'function' as const,
        function: schema
      }))

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as any,
        tools,
        tool_choice: 'auto',
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 500
      })

      const choice = response.choices[0]

      // Check if tool was called
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0]
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        detectedIntent = functionName as VoiceIntent
        extractedData = functionArgs

        // Add farmId if farmName matches
        if (extractedData.farmName && typeof extractedData.farmName === 'string') {
          const matchedFarmId = matchFarmName(extractedData.farmName, farmList, language)
          if (matchedFarmId) {
            extractedData.farmId = matchedFarmId
          }
        }

        // Parse relative dates
        if (extractedData.date && typeof extractedData.date === 'string') {
          const parsedDate = parseRelativeDate(extractedData.date)
          extractedData.date = parsedDate
        }

        // Validate based on intent
        const validation = validateByIntent(detectedIntent, extractedData)

        if (!validation.valid) {
          // Need clarification
          const missingField = validation.missing?.[0] || 'data'
          followUpQuestion = generateFollowUpQuestion(missingField, language, extractedData)
          clarificationField = missingField

          // Generate response text
          responseText = followUpQuestion

          return NextResponse.json({
            success: true,
            intent: detectedIntent,
            data: extractedData,
            followUpQuestion,
            clarificationField,
            responseText,
            confidence: 0.7,
            conversationId: conversationIdToUse
          } as const)
        }

        // Generate confirmation response
        responseText = generateConfirmationResponse(extractedData, detectedIntent, language)

        // Create new conversation if none exists
        if (!conversationIdToUse) {
          conversationIdToUse = await createConversationInDb(supabase, user.id, detectedIntent, transcript)
        }

      } else {
        // No function called - generate a conversational response
        const assistantMessage = choice.message.content || ''

        // Try to detect intent from text
        detectedIntent = detectIntent(transcript)

        responseText = assistantMessage || generateGenericResponse(transcript, language, detectedIntent)

        return NextResponse.json({
          success: true,
          intent: detectedIntent,
          responseText,
          confidence: 0.5,
          conversationId: conversationIdToUse
        } as const)
      }

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)

      if (openaiError instanceof Error) {
        if (openaiError.message.includes('rate limit')) {
          return NextResponse.json(
            {
              success: false,
              error: 'API rate limit exceeded. Please try again later.',
              errorType: 'quota-exceeded'
            } as const,
            { status: 429 }
          )
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process request. Please try again.',
          errorType: 'processing-failed'
        } as const,
        { status: 500 }
      )
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      intent: detectedIntent,
      data: extractedData,
      responseText,
      confidence: extractedData ? 0.9 : 0.5,
      conversationId: conversationIdToUse,
      processingTime
    } as const)

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Process API error:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request. Please try again.',
        errorType: 'api-error'
      } as const,
      { status: 500 }
    )
  }
}

/**
 * Build system prompt with farming context
 */
function buildSystemPrompt(
  language: SupportedLanguage,
  farms: Array<{ id: number; name: string }>,
  conversationHistory: ConversationMessage[]
): string {
  const langInstruction = getLanguageInstruction(language)

  const farmList = farms.length > 0
    ? farms.map((f, i) => `${i + 1}. ${f.name} (ID: ${f.id})`).join('\n')
    : 'No farms configured'

  const recentContext = conversationHistory.length > 0
    ? `\n\nRecent conversation:\n${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : ''

  return `You are VineSight, an intelligent voice assistant for grape farmers in India. ${langInstruction}

Your task is to extract structured farming data from voice commands and help farmers log their activities.

**Available Farms:**
${farmList}

**IMPORTANT Instructions:**
1. Extract data accurately from the transcript
2. Use function calling when you can extract sufficient information
3. If critical information is missing, indicate what's needed
4. Handle relative dates (today/tomorrow/yesterday/काल/आज/उद्या) correctly
5. Match farm names to the available list, or use the exact name spoken
6. For quantities, always extract the number and unit separately
7. Be concise and helpful in your responses${recentContext}

**Date Handling:**
- "आज", "today" → today's date
- "काल", "yesterday" → yesterday's date
- "उद्या", "tomorrow" → tomorrow's date

**Number Handling:**
- Parse numbers in English, Hindi, and Marathi (१, २, ३, etc.)
- Handle fractional amounts like "अर्धा" (half), "दीड" (1.5)

**Response Guidelines:**
- Confirm the extracted data in ${language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}
- Keep responses brief and farmer-friendly
- If information is incomplete, ask specifically for what's needed`
}

/**
 * Get language-specific instruction
 */
function getLanguageInstruction(language: SupportedLanguage): string {
  switch (language) {
    case 'mr':
      return 'तुम्ही मराठीत उत्तर द्यावे. शेतीशी संबंधित माहिती काढण्यासाठी फंक्शन कॉलिंग वापरा.'
    case 'hi':
      return 'आप हिंदी में उत्तर दें। खेती से संबंधित जानकारी निकालने के लिए फंक्शन कॉलिंग का उपयोग करें.'
    default:
      return 'You respond in English. Use function calling to extract farming-related information.'
  }
}

/**
 * Validate data based on intent
 */
function validateByIntent(
  intent: VoiceIntent,
  data: Record<string, unknown>
): { valid: boolean; missing?: string[]; errors?: string[] } {
  switch (intent) {
    case 'irrigation':
      return validateIrrigationData(data)
    case 'spray':
      return validateSprayData(data)
    case 'fertigation':
      return validateFertigationData(data)
    case 'harvest':
      return validateHarvestData(data)
    default:
      return { valid: true }
  }
}

/**
 * Generate confirmation response
 */
function generateConfirmationResponse(
  data: Record<string, unknown>,
  intent: VoiceIntent,
  language: SupportedLanguage
): string {
  const summary = generateSummary(data, language)

  const intentNames: Record<VoiceIntent, Record<SupportedLanguage, string>> = {
    irrigation: { en: 'irrigation', hi: 'सिंचाई', mr: 'सिंचन' },
    spray: { en: 'spray', hi: 'स्प्रे', mr: 'फवारणी' },
    fertigation: { en: 'fertigation', hi: 'फर्टीगेशन', mr: 'खत देणे' },
    harvest: { en: 'harvest', hi: 'फसल कटाई', mr: 'कापणी' },
    unknown: { en: 'activity', hi: 'गतिविधि', mr: 'क्रिया' },
    clarification_needed: { en: 'activity', hi: 'गतिविधि', mr: 'क्रिया' }
  }

  const intentName = intentNames[intent]?.[language] || intentNames[intent]?.en || 'activity'

  const confirmations: Record<SupportedLanguage, string> = {
    en: `Got it! I've recorded your ${intentName}: ${summary}. Shall I save this?`,
    hi: `समझ गया! मैंने आपकी ${intentName} दर्ज कर ली है: ${summary}. क्या मैं इसे सहेजूं?`,
    mr: `समजले! मी तुमची ${intentName} नोंदवली आहे: ${summary}. मी हे जमवावे का?`
  }

  return confirmations[language] || confirmations.en
}

/**
 * Generate generic response when no intent is detected
 */
function generateGenericResponse(
  transcript: string,
  language: SupportedLanguage,
  intent: VoiceIntent
): string {
  if (intent === 'unknown') {
    const responses: Record<SupportedLanguage, string> = {
      en: 'I can help you log irrigation, spraying, fertilization, or harvest activities. Could you please tell me more about what you did?',
      hi: 'मैं आपकी सिंचाई, छिड़काव, उर्वरक लगाने या फसल कटाई की जानकारी दर्ज करने में मदद कर सकता हूं। क्या आप मुझे और बता सकते हैं?',
      mr: 'मी तुमची सिंचन, फवारणी, खत देणे किंवा कापणीची माहिती नोंदवण्यात मदत करू शकतो. तुम्ही आणखी सांगू शकाल का?'
    }
    return responses[language] || responses.en
  }

  return transcript
}

/**
 * Create a new conversation in the database
 */
async function createConversationInDb(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  intent: VoiceIntent,
  firstMessage: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: generateConversationTitle(intent, firstMessage),
        topic_category: intent,
        message_count: 1,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Failed to create conversation:', error)
      return generateConversationId()
    }

    return data.id.toString()

  } catch (e) {
    console.error('Error creating conversation:', e)
    return generateConversationId()
  }
}

/**
 * Generate a title for the conversation
 */
function generateConversationTitle(intent: VoiceIntent, transcript: string): string {
  const intentTitles: Record<VoiceIntent, string> = {
    irrigation: 'Irrigation Log',
    spray: 'Spray Log',
    fertigation: 'Fertigation Log',
    harvest: 'Harvest Log',
    unknown: 'Voice Log',
    clarification_needed: 'Voice Conversation'
  }

  const baseTitle = intentTitles[intent] || 'Voice Log'

  // Truncate transcript for title
  const excerpt = transcript.length > 30 ? transcript.substring(0, 30) + '...' : transcript

  return `${baseTitle}: ${excerpt}`
}

// ============================================================================
// OPTIONS Handler for CORS
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
