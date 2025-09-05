import { NextRequest } from 'next/server';
import { generateText } from 'ai';

export interface WeatherInsightData {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  confidence: number;
  timeRelevant: boolean;
  actionLabel: string;
}

export async function POST(request: NextRequest) {
  try {
    const { weatherData, farmData, history } = await request.json();
    
    if (!weatherData) {
      return new Response(JSON.stringify({ error: 'Weather data is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const context = {
      currentWeather: {
        temperature: weatherData?.temperature,
        humidity: weatherData?.humidity,
        wind_speed: weatherData?.wind_speed,
        precipitation: weatherData?.precipitation
      },
      farmLocation: farmData?.region,
      recentActivities: history?.slice(0, 5) || []
    };

    const prompt = `
You are an agricultural AI expert specializing in grape farming in India.

Analyze weather data and generate 2-3 actionable insights for immediate farmer action:
${JSON.stringify(context)}

Focus on:
1. Immediate risks or opportunities from current weather
2. Optimal timing for activities based on conditions  
3. Prevention measures needed for upcoming weather

Return ONLY valid JSON array:
[{
  "type": "weather_advisory",
  "priority": "critical|high|medium|low", 
  "title": "concise title",
  "subtitle": "specific conditions and metrics",
  "confidence": number (0.0-1.0),
  "timeRelevant": boolean,
  "actionLabel": "specific action button text"
}]`;

    try {
      const result = await generateText({
        model: 'google/gemini-2.0-flash-lite',
        messages: [
          { role: 'system' as const, content: 'You are an agricultural AI expert specializing in grape farming in India.' },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.4
      });

      const parsed = JSON.parse(result.text);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array response');
      }

      const insights: WeatherInsightData[] = parsed.slice(0, 3).map(insight => ({
        type: insight.type || 'weather_advisory',
        priority: ['critical', 'high', 'medium', 'low'].includes(insight.priority) 
          ? insight.priority : 'medium',
        title: insight.title || 'Weather Advisory',
        subtitle: insight.subtitle || 'Check current conditions',
        confidence: Math.min(Math.max(insight.confidence || 0.5, 0), 1),
        timeRelevant: Boolean(insight.timeRelevant),
        actionLabel: insight.actionLabel || 'View Details'
      }));

      return new Response(JSON.stringify({ success: true, data: insights }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (aiError) {
      // AI service failed, return empty array as fallback
      return new Response(JSON.stringify({ 
        success: true, 
        data: [], 
        fallback: true 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Weather insights API error:', error);
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to generate weather insights',
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}