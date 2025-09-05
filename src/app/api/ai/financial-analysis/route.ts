import { NextRequest } from 'next/server';
import { generateText } from 'ai';

export interface FinancialAnalysisData {
  trend: 'increasing' | 'decreasing' | 'stable';
  varianceFromAverage: number;
  recommendation: string;
  confidence: number;
  nextReviewDate: string;
  riskFactors: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { expenses, historicalData } = await request.json();
    
    if (!expenses && !historicalData) {
      return new Response(JSON.stringify({ error: 'Expense data is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const context = {
      recentExpenses: expenses?.slice(0, 10) || [],
      totalCurrentSpend: expenses?.reduce((sum: number, exp: any) => sum + (exp.cost || 0), 0) || 0,
      historicalData: historicalData?.slice(0, 20) || []
    };

    const prompt = `
You are a financial analyst specializing in agricultural expenses for grape farming.

Analyze the spending pattern and provide insights:
${JSON.stringify(context)}

Compare current spending with historical patterns and identify:
1. Spending trends and variations
2. Unusual expenses or cost spikes
3. Optimization opportunities
4. Risk factors for budget overruns

Return ONLY valid JSON:
{
  "trend": "increasing|decreasing|stable",
  "varianceFromAverage": number (percentage, can be negative),
  "recommendation": "specific actionable advice",
  "confidence": number (0.0-1.0),
  "nextReviewDate": "YYYY-MM-DD",
  "riskFactors": ["list of identified risks"]
}`;

    try {
      const result = await generateText({
        model: 'google/gemini-2.0-flash-lite',
        messages: [
          { role: 'system' as const, content: 'You are a financial analyst specializing in agricultural expenses for grape farming.' },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.3
      });

      const parsed = JSON.parse(result.text);
      
      const analysis: FinancialAnalysisData = {
        trend: ['increasing', 'decreasing', 'stable'].includes(parsed.trend) 
          ? parsed.trend : 'stable',
        varianceFromAverage: parsed.varianceFromAverage || 0,
        recommendation: parsed.recommendation || 'Monitor expenses regularly',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
        nextReviewDate: parsed.nextReviewDate || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []
      };

      return new Response(JSON.stringify({ success: true, data: analysis }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (aiError) {
      // AI service failed, use fallback analysis
      const fallbackAnalysis: FinancialAnalysisData = {
        trend: 'stable',
        varianceFromAverage: 0,
        recommendation: 'Monitor expenses regularly for better insights',
        confidence: 0.5,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: []
      };

      return new Response(JSON.stringify({ 
        success: true, 
        data: fallbackAnalysis, 
        fallback: true 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Financial analysis API error:', error);
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to analyze financial data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}