import { generateText } from 'ai';

export interface GrowthStageAnalysis {
  stage: string;
  confidence: number;
  recommendations: string[];
  timeRelevant: boolean;
  nextStageDate: string;
  description: string;
}

export interface WeatherInsightData {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  confidence: number;
  timeRelevant: boolean;
  actionLabel: string;
}

export interface TaskRecommendationData {
  taskType: string;
  priority: number;
  reasoning: string;
  confidence: number;
  weatherDependent: boolean;
  estimatedDuration: string;
  expiresAt?: string;
}

export interface FinancialAnalysisData {
  trend: 'increasing' | 'decreasing' | 'stable';
  varianceFromAverage: number;
  recommendation: string;
  confidence: number;
  nextReviewDate: string;
  riskFactors: string[];
}

export class GeminiAIService {
  private static readonly MODEL = 'google/gemini-2.0-flash-lite';

  /**
   * Analyze grape growth stage using AI instead of hardcoded month logic
   */
  static async analyzeGrowthStage(
    farmData: any,
    activities: any[],
    weather: any
  ): Promise<GrowthStageAnalysis> {
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
}`;

    try {
      const result = await generateText({
        model: this.MODEL,
        messages: [
          { role: 'system' as const, content: 'You are an expert viticulturist analyzing grape growth stages in India.' },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.3
      });

      const parsed = JSON.parse(result.text);
      
      // Validate required fields
      if (!parsed.stage || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid AI response structure');
      }

      return {
        stage: parsed.stage,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        timeRelevant: Boolean(parsed.timeRelevant),
        nextStageDate: parsed.nextStageDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: parsed.description || 'AI analysis of current growth stage'
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Gemini growth stage analysis failed:', error);
      }
      
      // Fallback to basic month-based analysis
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 2 && currentMonth <= 4) {
        return {
          stage: 'flowering',
          confidence: 0.6,
          recommendations: ['Monitor flower drop', 'Ensure proper pollination'],
          timeRelevant: true,
          nextStageDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Fallback analysis - flowering season'
        };
      }
      
      return {
        stage: 'leaf_development',
        confidence: 0.5,
        recommendations: ['Monitor vine health', 'Check irrigation needs'],
        timeRelevant: true,
        nextStageDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Fallback analysis - general growth'
      };
    }
  }

  /**
   * Generate intelligent weather insights using AI
   */
  static async generateWeatherInsights(
    weatherData: any,
    farmData: any,
    history: any[]
  ): Promise<WeatherInsightData[]> {
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
        model: this.MODEL,
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

      return parsed.slice(0, 3).map(insight => ({
        type: insight.type || 'weather_advisory',
        priority: ['critical', 'high', 'medium', 'low'].includes(insight.priority) 
          ? insight.priority : 'medium',
        title: insight.title || 'Weather Advisory',
        subtitle: insight.subtitle || 'Check current conditions',
        confidence: Math.min(Math.max(insight.confidence || 0.5, 0), 1),
        timeRelevant: Boolean(insight.timeRelevant),
        actionLabel: insight.actionLabel || 'View Details'
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Gemini weather insights failed:', error);
      }
      return [];
    }
  }

  /**
   * Generate intelligent task recommendations
   */
  static async generateTaskRecommendations(
    farmContext: any
  ): Promise<TaskRecommendationData[]> {
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
}]`;

    try {
      const result = await generateText({
        model: this.MODEL,
        messages: [
          { role: 'system' as const, content: 'You are an AI agricultural advisor specializing in grape farming in India.' },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.5
      });

      const parsed = JSON.parse(result.text);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array response');
      }

      return parsed.slice(0, 5).map(task => ({
        taskType: ['irrigation', 'spray', 'fertigation', 'pruning', 'monitoring', 'harvesting']
          .includes(task.taskType) ? task.taskType : 'monitoring',
        priority: Math.min(Math.max(task.priority || 0.5, 0), 1),
        reasoning: task.reasoning || 'AI-recommended task',
        confidence: Math.min(Math.max(task.confidence || 0.7, 0), 1),
        weatherDependent: Boolean(task.weatherDependent),
        estimatedDuration: task.estimatedDuration || '30-60 minutes',
        expiresAt: task.expiresAt || undefined
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Gemini task recommendations failed:', error);
      }
      return [];
    }
  }

  /**
   * Analyze financial data and provide insights
   */
  static async analyzeFinancialData(
    expenses: any[],
    historicalData: any[]
  ): Promise<FinancialAnalysisData> {
    const context = {
      recentExpenses: expenses?.slice(0, 10) || [],
      totalCurrentSpend: expenses?.reduce((sum, exp) => sum + (exp.cost || 0), 0) || 0,
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
        model: this.MODEL,
        messages: [
          { role: 'system' as const, content: 'You are a financial analyst specializing in agricultural expenses for grape farming.' },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.3
      });

      const parsed = JSON.parse(result.text);
      
      return {
        trend: ['increasing', 'decreasing', 'stable'].includes(parsed.trend) 
          ? parsed.trend : 'stable',
        varianceFromAverage: parsed.varianceFromAverage || 0,
        recommendation: parsed.recommendation || 'Monitor expenses regularly',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
        nextReviewDate: parsed.nextReviewDate || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Gemini financial analysis failed:', error);
      }
      return {
        trend: 'stable',
        varianceFromAverage: 0,
        recommendation: 'Monitor expenses regularly for better insights',
        confidence: 0.5,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskFactors: []
      };
    }
  }

  /**
   * Generic AI analysis with context
   */
  static async analyzeWithContext(data: any, analysisType: string): Promise<any> {
    const prompt = `
Analyze the following ${analysisType} data and provide structured insights:
${JSON.stringify(data)}

Return your analysis as valid JSON with appropriate structure for ${analysisType}.
`;

    try {
      const result = await generateText({
        model: this.MODEL,
        messages: [
          { role: 'system' as const, content: `You are an AI assistant specialized in ${analysisType} analysis.` },
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.4
      });

      return JSON.parse(result.text);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Gemini ${analysisType} analysis failed:`, error);
      }
      return { error: 'Analysis failed', type: analysisType };
    }
  }
}