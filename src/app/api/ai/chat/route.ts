import { NextRequest } from 'next/server'
import { convertToModelMessages, streamText, validateUIMessages } from 'ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  hasServerExceededQuota,
  incrementServerQuestionCount,
  getServerQuotaStatus
} from '@/lib/server-quota-service'
import { supermemoryTools } from '@supermemory/tools/ai-sdk'
import { openai } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
  try {
    // Handle Next.js 15 async cookies properly
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    const {
      data: { user },
      error: sessionError
    } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check daily quota limit
    if (hasServerExceededQuota(user.id)) {
      const quotaStatus = getServerQuotaStatus(user.id)
      return new Response(
        JSON.stringify({
          error: 'Daily question limit exceeded',
          code: 'QUOTA_EXCEEDED',
          quotaStatus
        }),
        {
          status: 429, // Too Many Requests
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const body = await request.json()
    const { messages: rawMessages, data = {} } = body ?? {}

    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let validatedMessages: Awaited<ReturnType<typeof validateUIMessages>>
    try {
      validatedMessages = await validateUIMessages({ messages: rawMessages })
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid message payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.SUPERMEMORY_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Supermemory API key missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Increment question count for this user
    incrementServerQuestionCount(user.id)

    const systemPrompt = buildSystemPrompt(data?.context)
    const modelMessages = convertToModelMessages(validatedMessages)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a highly personalized Agriculture and farming AI assistant. Your primary goal is to learn about the user and provide increasingly personalized help over time.
      MEMORY MANAGEMENT:
      1. When users share personal information, preferences, or context, immediately use addMemory to store it
      2. Before responding to requests, search your memories for relevant context about the user
      3. Use past conversations to inform current responses
      4. Remember user's communication style, preferences, and frequently discussed topics
      
      PERSONALITY:
      - Adapt your communication style to match the user's preferences
      - Reference past conversations naturally when relevant
      - Proactively offer help based on learned patterns
      - Be genuinely helpful while respecting privacy
      
      EXAMPLES OF WHAT TO REMEMBER:
      - Work schedule and role
      - Dietary preferences/restrictions
      - Communication preferences (formal/casual)
      - Frequent topics of interest
      - Goals and projects they're working on
      - Family/personal context they share
      - Preferred tools and workflows
      - Time zone and availability
      
      Always search memories before responding to provide personalized, contextual help.`,
      messages: modelMessages,
      tools: {
        ...supermemoryTools(apiKey, {
          containerTags: [user.id]
        })
      },
      stopWhen: ({ steps }) => {
        if (steps.length === 0) return false
        const lastStep = steps[steps.length - 1]
        return lastStep.finishReason !== 'tool-calls'
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    // Handle authentication errors
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (
      errorMsg.includes('Authentication') ||
      errorMsg.includes('Unauthorized') ||
      errorMsg.includes('session')
    ) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Provider error:', error)
    }

    return new Response(generateFallbackResponse('', {}), {
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

function buildSystemPrompt(context: any): string {
  const language = context?.language || 'en'
  const langInstruction =
    language === 'hi'
      ? 'Respond in Hindi with Devanagari script'
      : language === 'mr'
        ? 'Respond in Marathi with Devanagari script'
        : 'Respond in English'

  return `You are FarmAI, an expert agricultural assistant specializing in grape farming and viticulture. ${langInstruction}.

Your expertise includes:
- Grape disease identification, treatment, and prevention
- Irrigation scheduling and water management for vineyards  
- Soil health optimization and fertilization programs
- Integrated pest management strategies
- Harvest timing and quality optimization
- Weather-based farming decisions
- Sustainable and organic farming practices

Guidelines:
- Provide specific, actionable advice tailored to grape farming
- Be concise but comprehensive (under 120 words for optimal speed)
- Prioritize farmer safety and sustainable practices
- Reference specific grape varieties and regional considerations when relevant
- Use practical measurements and timing recommendations
- Focus on immediate, actionable solutions

${
  context?.recentAnalysis?.length
    ? `Recent vineyard analysis: ${context.recentAnalysis.length} plant health assessments available`
    : ''
}

${context?.farmData ? 'Personalized farm data available for customized recommendations' : ''}

${
  context?.recentTopics?.length
    ? `Previous conversation topics: ${context.recentTopics.join(', ')}`
    : ''
}`
}

function generateFallbackResponse(message: string, context: any): string {
  const language = context?.language || 'en'
  return language === 'hi'
    ? 'मैं आपकी सहायता करने के लिए यहाँ हूँ। कृपया अपना प्रश्न स्पष्ट रूप से बताएं।'
    : language === 'mr'
      ? 'मी तुमची मदत करण्यासाठी येथे आहे. कृपया तुमचा प्रश्न स्पष्टपणे लिहा.'
      : "I'm here to help with your farming questions. Please provide more specific details about what you need assistance with."
}
