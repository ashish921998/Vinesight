import { NextRequest } from 'next/server';
import { generateText, streamText } from 'ai';
import { validateUserSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Validate user authentication first
    const { user, error: authError } = await validateUserSession(request);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { message, context = {}, stream = false } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const systemPrompt = buildSystemPrompt(context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(context.conversationHistory?.slice(-5) || []),
      { role: 'user' as const, content: message }
    ];

    // Use streaming for better UX
    if (stream) {
      const result = streamText({
        model : 'google/gemini-2.0-flash-lite',
        messages,
        temperature: 0.7,
      });

      return result.toTextStreamResponse();
    }

    // Non-streaming response for compatibility  
    const result = await generateText({
      model: 'google/gemini-2.0-flash-lite',
      messages,
      temperature: 0.7,
    });
    
    return new Response(JSON.stringify({ response: result.text }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Check if the error is due to authentication issues
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Authentication') || errorMsg.includes('Unauthorized')) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log error for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Provider error:', error);
    }
    
    const { message: errorMessage = '', context: errorContext = {} } = await request.json().catch(() => ({}));
    
    return new Response(JSON.stringify({ 
      response: generateFallbackResponse(errorMessage, errorContext)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function buildSystemPrompt(context: any): string {
  const language = context?.language || 'en';
  const langInstruction = language === 'hi' ? 'Respond in Hindi with Devanagari script' : 
                         language === 'mr' ? 'Respond in Marathi with Devanagari script' : 'Respond in English';
  
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

${context?.recentAnalysis?.length ? 
  `Recent vineyard analysis: ${context.recentAnalysis.length} plant health assessments available` : ''}

${context?.farmData ? 'Personalized farm data available for customized recommendations' : ''}

${context?.recentTopics?.length ? 
  `Previous conversation topics: ${context.recentTopics.join(', ')}` : ''}`;
}

function generateFallbackResponse(message: string, context: any): string {
  const language = context?.language || 'en';
  
  // Simple keyword-based responses
  if (message.toLowerCase().includes('disease') || message.toLowerCase().includes('pest')) {
    return language === 'hi' ? 
      'रोग नियंत्रण के लिए पहले प्रभावित पत्तियों को हटाएं और उचित स्प्रे का उपयोग करें। अधिक जानकारी के लिए स्थानीय कृषि विशेषज्ञ से सलाह लें।' :
      'For disease control, first remove affected leaves and apply appropriate fungicide spray. Consider consulting your local agricultural extension officer for specific treatment recommendations.';
  }
  
  if (message.toLowerCase().includes('water') || message.toLowerCase().includes('irrigation')) {
    return language === 'hi' ?
      'सिंचाई मिट्टी की नमी के आधार पर करें। सुबह या शाम को पानी देना बेहतर होता है।' :
      'Water based on soil moisture levels. Early morning or evening irrigation is most effective to reduce water loss.';
  }
  
  return language === 'hi' ?
    'मैं आपकी सहायता करने के लिए यहाँ हूँ। कृपया अपना प्रश्न स्पष्ट रूप से बताएं।' :
    'I\'m here to help with your farming questions. Please provide more specific details about what you need assistance with.';
}