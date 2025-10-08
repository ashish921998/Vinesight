import { NextRequest } from 'next/server'
import { generateText } from 'ai'

export interface GrowthStageAnalysis {
  stage: string
  confidence: number
  recommendations: string[]
  timeRelevant: boolean
  nextStageDate: string
  description: string
}

export async function POST(request: NextRequest) {
  try {
    const { farmData, activities, weather } = await request.json()

    if (!farmData) {
      return new Response(JSON.stringify({ error: 'Farm data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const prompt = `
Analyze grape growth stage based on:
- Location: ${farmData?.region || 'Unknown'}
- Planting Date: ${farmData?.planting_date || 'Unknown'}
- Recent Activities: ${JSON.stringify(activities?.slice(0, 5) || [])}
- Weather Patterns: ${JSON.stringify(weather || {})}
- Current Date: ${new Date().toISOString()}

Consider Indian grape growing seasons:
- Bud Break: December-January
- Leaf Development: February-March  
- Flowering: March-April
- Fruit Set: April-May
- Veraison: June-July
- Harvest: July-September

Return ONLY valid JSON:
{
  "stage": "string (bud_break|leaf_development|flowering|fruit_set|veraison|harvest|dormancy)",
  "confidence": number (0.0-1.0),
  "recommendations": ["specific actionable advice"],
  "timeRelevant": boolean,
  "nextStageDate": "YYYY-MM-DD",
  "description": "brief explanation"
}`

    try {
      const result = await generateText({
        model: 'google/gemini-2.0-flash-lite',
        messages: [
          {
            role: 'system' as const,
            content: 'You are an expert viticulturist analyzing grape growth stages in India.'
          },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.3
      })

      const parsed = JSON.parse(result.text)

      // Validate required fields
      if (!parsed.stage || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid AI response structure')
      }

      const analysis: GrowthStageAnalysis = {
        stage: parsed.stage,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        timeRelevant: Boolean(parsed.timeRelevant),
        nextStageDate:
          parsed.nextStageDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: parsed.description || 'AI analysis of current growth stage'
      }

      return new Response(JSON.stringify({ success: true, data: analysis }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (aiError) {
      // AI service failed, use fallback
      const currentMonth = new Date().getMonth()
      let fallbackAnalysis: GrowthStageAnalysis

      if (currentMonth >= 2 && currentMonth <= 4) {
        fallbackAnalysis = {
          stage: 'flowering',
          confidence: 0.6,
          recommendations: ['Monitor flower drop', 'Ensure proper pollination'],
          timeRelevant: true,
          nextStageDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          description: 'Fallback analysis - flowering season'
        }
      } else {
        fallbackAnalysis = {
          stage: 'leaf_development',
          confidence: 0.5,
          recommendations: ['Monitor vine health', 'Check irrigation needs'],
          timeRelevant: true,
          nextStageDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          description: 'Fallback analysis - general growth'
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: fallbackAnalysis,
          fallback: true
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Growth analysis API error:', error)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to analyze growth stage'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
