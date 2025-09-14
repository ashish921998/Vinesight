import { NextRequest } from 'next/server'
import { generateText } from 'ai'

export interface TaskRecommendationData {
  taskType: string
  priority: number
  reasoning: string
  confidence: number
  weatherDependent: boolean
  estimatedDuration: string
  expiresAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const { farmContext } = await request.json()

    if (!farmContext) {
      return new Response(JSON.stringify({ error: 'Farm context is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = `
You are an AI agricultural advisor specializing in grape farming in India.

Analyze farm conditions and generate 3-5 prioritized task recommendations:
${JSON.stringify(farmContext)}

Consider:
- Weather patterns and forecasts
- Current growth stage requirements  
- Historical activity patterns
- Pest/disease risks based on conditions
- Resource optimization opportunities

Return ONLY valid JSON array:
[{
  "taskType": "irrigation|spray|fertigation|pruning|monitoring|harvesting",
  "priority": number (0.0-1.0),
  "reasoning": "specific explanation for why this task is needed",
  "confidence": number (0.0-1.0),
  "weatherDependent": boolean,
  "estimatedDuration": "human readable duration",
  "expiresAt": "YYYY-MM-DD or null"
}]`

    try {
      const result = await generateText({
        model: 'google/gemini-2.0-flash-lite',
        messages: [
          {
            role: 'system' as const,
            content: 'You are an AI agricultural advisor specializing in grape farming in India.',
          },
          { role: 'user' as const, content: prompt },
        ],
        temperature: 0.5,
      })

      const parsed = JSON.parse(result.text)

      if (!Array.isArray(parsed)) {
        throw new Error('Expected array response')
      }

      const tasks: TaskRecommendationData[] = parsed.slice(0, 5).map((task) => ({
        taskType: [
          'irrigation',
          'spray',
          'fertigation',
          'pruning',
          'monitoring',
          'harvesting',
        ].includes(task.taskType)
          ? task.taskType
          : 'monitoring',
        priority: Math.min(Math.max(task.priority || 0.5, 0), 1),
        reasoning: task.reasoning || 'AI-recommended task',
        confidence: Math.min(Math.max(task.confidence || 0.7, 0), 1),
        weatherDependent: Boolean(task.weatherDependent),
        estimatedDuration: task.estimatedDuration || '30-60 minutes',
        expiresAt: task.expiresAt || undefined,
      }))

      return new Response(JSON.stringify({ success: true, data: tasks }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (aiError) {
      // AI service failed, return empty array as fallback
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          fallback: true,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Task recommendations API error:', error)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate task recommendations',
        data: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
