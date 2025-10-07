import { NextRequest } from 'next/server'
import { convertToModelMessages, streamText } from 'ai'
import { supermemoryTools } from '@supermemory/tools/ai-sdk'
import { openai } from '@ai-sdk/openai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
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

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToModelMessages(messages),
      tools: {
        ...supermemoryTools(apiKey, {
          containerTags: ['bf1d22a3-88bc-48c4-816c-a7da242f91b8']
        })
      },
      stopWhen: ({ steps }) => {
        if (steps.length === 0) return false
        const { finishReason } = steps[steps.length - 1]
        return finishReason !== 'tool-calls'
      },
      system: `You are a highly personalized AI assistant. Your primary goal is to learn about the user and provide increasingly personalized help over time.

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

Always search memories before responding to provide personalized, contextual help.`
    })
    return result.toUIMessageStreamResponse()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('simple-chat route error', error)
    }

    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
