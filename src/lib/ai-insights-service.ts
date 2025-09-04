import { supabase } from './supabase';
import { PestPredictionService } from './pest-prediction-service';
import { SmartTaskGenerator } from './smart-task-generator';
import { WeatherService } from './weather-service';
import { GeminiAIService } from './gemini-ai-service';

export interface AIInsight {
  id: string;
  type: 'pest_alert' | 'task_recommendation' | 'weather_advisory' | 'financial_insight' | 'growth_optimization' | 'market_intelligence';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  description?: string;
  icon: string;
  actionLabel: string;
  actionType: 'navigate' | 'execute' | 'view';
  actionData?: any;
  confidence: number;
  timeRelevant: boolean;
  expiresAt?: Date;
  tags?: string[];
  data?: any;
}

export class AIInsightsService {
  /**
   * Get all AI insights for a farm, sorted by priority and relevance
   */
  static async getInsightsForFarm(farmId: number, userId: string, limit = 10): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];

      // Get farm data for context
      const { data: farm } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single();

      if (!farm) return [];

      // 1. Pest & Disease Alerts
      const pestPredictions = await PestPredictionService.getActivePredictions(farmId);
      const criticalPests = pestPredictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
      
      criticalPests.forEach(pest => {
        const daysUntil = Math.ceil((pest.predictedOnsetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        insights.push({
          id: `pest_${pest.id}`,
          type: 'pest_alert',
          priority: pest.riskLevel === 'critical' ? 'critical' : 'high',
          title: `${pest.pestDiseaseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Risk`,
          subtitle: daysUntil > 0 ? `Prevention window: ${daysUntil} days` : 'Immediate action needed',
          icon: 'AlertTriangle',
          actionLabel: pest.riskLevel === 'critical' ? 'Apply Treatment' : 'View Prevention',
          actionType: 'navigate',
          actionData: { route: `/farms/${farmId}/pest-alerts`, pestId: pest.id },
          confidence: pest.probabilityScore,
          timeRelevant: daysUntil <= 7,
          expiresAt: pest.predictedOnsetDate,
          tags: ['pest', 'disease', 'prevention'],
          data: pest
        });
      });

      // 2. Smart Task Recommendations
      const taskRecommendations = await SmartTaskGenerator.getActiveRecommendations(farmId);
      const highPriorityTasks = taskRecommendations.filter(t => t.priorityScore >= 0.7);
      
      highPriorityTasks.slice(0, 3).forEach(task => {
        insights.push({
          id: `task_${task.id}`,
          type: 'task_recommendation',
          priority: task.priorityScore >= 0.9 ? 'critical' : task.priorityScore >= 0.8 ? 'high' : 'medium',
          title: this.getTaskTitle(task.taskType),
          subtitle: task.reasoning.substring(0, 60) + '...',
          icon: this.getTaskIcon(task.taskType),
          actionLabel: task.weatherDependent ? 'Check Weather & Execute' : 'Execute Now',
          actionType: 'execute',
          actionData: { taskId: task.id, taskType: task.taskType },
          confidence: task.confidenceScore,
          timeRelevant: true,
          expiresAt: task.expiresAt ? new Date(task.expiresAt) : undefined,
          tags: ['task', 'recommendation', task.taskType],
          data: task
        });
      });

      // 3. AI-Powered Weather-Based Insights
      try {
        const weatherData = await WeatherService.getCurrentWeather(farm.region);
        const activities = await this.getRecentActivities(farmId);
        const aiWeatherInsights = await GeminiAIService.generateWeatherInsights(
          weatherData, 
          farm, 
          activities
        );
        
        // Convert AI insights to our format
        aiWeatherInsights.forEach((aiInsight, index) => {
          insights.push({
            id: `ai_weather_${index}`,
            type: 'weather_advisory',
            priority: aiInsight.priority,
            title: aiInsight.title,
            subtitle: aiInsight.subtitle,
            icon: 'CloudRain',
            actionLabel: aiInsight.actionLabel,
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/weather` },
            confidence: aiInsight.confidence,
            timeRelevant: aiInsight.timeRelevant,
            tags: ['weather', 'ai', 'advisory']
          });
        });
      } catch (error) {
        console.warn('AI weather insights unavailable, falling back:', error);
        // Fallback to basic weather insights
        try {
          const weatherData = await WeatherService.getCurrentWeather(farm.region);
          const basicWeatherInsights = this.generateWeatherInsights(weatherData, farm);
          insights.push(...basicWeatherInsights);
        } catch (fallbackError) {
          console.warn('Weather insights completely unavailable:', fallbackError);
        }
      }

      // 4. Financial Insights (Mock for now - can be enhanced with real data)
      const financialInsights = await this.getFinancialInsights(farmId);
      insights.push(...financialInsights);

      // 5. Growth Stage Optimization
      const growthInsights = await this.getGrowthOptimizationInsights(farmId, farm);
      insights.push(...growthInsights);

      // Sort by priority and time relevance
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      return insights
        .sort((a, b) => {
          // First by priority
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          if (aPriority !== bPriority) return aPriority - bPriority;
          
          // Then by time relevance
          if (a.timeRelevant && !b.timeRelevant) return -1;
          if (!a.timeRelevant && b.timeRelevant) return 1;
          
          // Finally by confidence
          return b.confidence - a.confidence;
        })
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting AI insights:', error);
      return [];
    }
  }

  /**
   * Generate weather-based insights
   */
  private static generateWeatherInsights(weatherData: any, farm: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (weatherData.humidity > 80 && weatherData.temperature > 20) {
      insights.push({
        id: 'weather_fungal_risk',
        type: 'weather_advisory',
        priority: 'high',
        title: 'High Fungal Disease Risk',
        subtitle: `${weatherData.humidity}% humidity, ${weatherData.temperature}°C`,
        icon: 'CloudRain',
        actionLabel: 'Check Prevention Plan',
        actionType: 'navigate',
        actionData: { route: `/farms/${farm.id}/pest-alerts` },
        confidence: 0.85,
        timeRelevant: true,
        tags: ['weather', 'disease', 'prevention']
      });
    }

    if (weatherData.wind_speed > 15) {
      insights.push({
        id: 'weather_spray_warning',
        type: 'weather_advisory',
        priority: 'medium',
        title: 'High Wind - Avoid Spraying',
        subtitle: `Wind speed: ${weatherData.wind_speed} km/h`,
        icon: 'Wind',
        actionLabel: 'Check Forecast',
        actionType: 'navigate',
        actionData: { route: `/farms/${farm.id}/weather` },
        confidence: 0.9,
        timeRelevant: true,
        tags: ['weather', 'spray', 'safety']
      });
    }

    return insights;
  }

  /**
   * Get AI-powered financial insights with dynamic baselines
   */
  private static async getFinancialInsights(farmId: number): Promise<AIInsight[]> {
    try {
      // Get recent expense data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (!recentExpenses || recentExpenses.length === 0) return [];

      // Get historical data for AI analysis
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const { data: historicalExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .lt('date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Use AI to analyze financial patterns
      const aiAnalysis = await GeminiAIService.analyzeFinancialData(
        recentExpenses,
        historicalExpenses || []
      );

      const insights: AIInsight[] = [];
      const totalSpent = recentExpenses.reduce((sum, exp) => sum + exp.cost, 0);

      // Create insights based on AI analysis
      if (aiAnalysis.confidence > 0.7) {
        const priority = Math.abs(aiAnalysis.varianceFromAverage) > 25 ? 'high' : 'medium';
        
        insights.push({
          id: 'ai_financial_analysis',
          type: 'financial_insight',
          priority,
          title: this.getFinancialInsightTitle(aiAnalysis.trend, aiAnalysis.varianceFromAverage),
          subtitle: aiAnalysis.recommendation.substring(0, 60) + '...',
          icon: aiAnalysis.trend === 'increasing' ? 'TrendingUp' : 
                aiAnalysis.trend === 'decreasing' ? 'TrendingDown' : 'DollarSign',
          actionLabel: 'View Analysis',
          actionType: 'navigate',
          actionData: { 
            route: `/farms/${farmId}/reports`,
            analysis: aiAnalysis
          },
          confidence: aiAnalysis.confidence,
          timeRelevant: true,
          tags: ['finance', 'ai', aiAnalysis.trend, 'analysis'],
          data: aiAnalysis
        });
      }

      // Add risk factors as separate insights if significant
      if (aiAnalysis.riskFactors.length > 0 && aiAnalysis.confidence > 0.8) {
        aiAnalysis.riskFactors.slice(0, 2).forEach((risk, index) => {
          insights.push({
            id: `financial_risk_${index}`,
            type: 'financial_insight',
            priority: 'medium',
            title: 'Financial Risk Detected',
            subtitle: risk.substring(0, 60) + '...',
            icon: 'AlertTriangle',
            actionLabel: 'Review Risk',
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/reports` },
            confidence: aiAnalysis.confidence,
            timeRelevant: true,
            tags: ['finance', 'risk', 'ai']
          });
        });
      }

      return insights;
    } catch (error) {
      console.warn('AI financial analysis failed, using fallback:', error);
      
      // Fallback to basic analysis
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const { data: expenses } = await supabase
          .from('expenses')
          .select('*')
          .eq('farm_id', farmId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

        if (!expenses || expenses.length === 0) return [];

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.cost, 0);
        const avgMonthlySpend = 15000; // Basic fallback baseline

        const insights: AIInsight[] = [];

        if (totalSpent > avgMonthlySpend * 1.2) {
          insights.push({
            id: 'financial_overspend_fallback',
            type: 'financial_insight',
            priority: 'medium',
            title: `Spending Above Average: ₹${totalSpent.toLocaleString()}`,
            subtitle: 'Basic analysis - consider detailed review',
            icon: 'DollarSign',
            actionLabel: 'View Breakdown',
            actionType: 'navigate',
            actionData: { route: `/farms/${farmId}/reports` },
            confidence: 0.6,
            timeRelevant: true,
            tags: ['finance', 'expense', 'fallback']
          });
        }

        return insights;
      } catch (fallbackError) {
        console.error('Financial insights completely failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Generate financial insight title based on AI analysis
   */
  private static getFinancialInsightTitle(trend: string, variance: number): string {
    const absVariance = Math.abs(variance);
    
    if (trend === 'increasing') {
      return absVariance > 30 ? 'High Spending Increase Detected' : 
             absVariance > 15 ? 'Moderate Spending Increase' : 'Spending Trending Up';
    } else if (trend === 'decreasing') {
      return absVariance > 30 ? 'Significant Cost Reduction' : 
             absVariance > 15 ? 'Spending Optimization Detected' : 'Costs Trending Down';
    } else {
      return 'Stable Spending Pattern';
    }
  }

  /**
   * Get AI-powered growth stage optimization insights
   */
  private static async getGrowthOptimizationInsights(farmId: number, farm: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Get recent activities for context
      const activities = await this.getRecentActivities(farmId);
      const weatherData = await WeatherService.getCurrentWeather(farm.region);
      
      // AI-powered growth stage analysis
      const growthAnalysis = await GeminiAIService.analyzeGrowthStage(
        farm,
        activities,
        weatherData
      );

      if (growthAnalysis.confidence > 0.6) {
        insights.push({
          id: 'ai_growth_stage',
          type: 'growth_optimization',
          priority: growthAnalysis.timeRelevant ? 'high' : 'medium',
          title: this.getGrowthStageTitle(growthAnalysis.stage),
          subtitle: growthAnalysis.description,
          icon: 'Sprout',
          actionLabel: 'View Recommendations',
          actionType: 'navigate',
          actionData: { 
            route: `/farms/${farmId}/growth-guide`,
            recommendations: growthAnalysis.recommendations
          },
          confidence: growthAnalysis.confidence,
          timeRelevant: growthAnalysis.timeRelevant,
          tags: ['growth', 'ai', growthAnalysis.stage, 'optimization'],
          data: growthAnalysis
        });
      }
    } catch (error) {
      console.warn('AI growth stage analysis failed, using fallback:', error);
      
      // Fallback to basic month-based analysis
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 2 && currentMonth <= 4) { // March-May: Flowering/Fruit Set
        insights.push({
          id: 'growth_flowering_fallback',
          type: 'growth_optimization',
          priority: 'high',
          title: 'Critical Flowering Stage',
          subtitle: 'Traditional seasonal analysis - optimize pollination',
          icon: 'Sprout',
          actionLabel: 'View Care Plan',
          actionType: 'navigate',
          actionData: { route: `/farms/${farmId}/growth-guide` },
          confidence: 0.6,
          timeRelevant: true,
          tags: ['growth', 'flowering', 'fallback']
        });
      }
    }

    return insights;
  }

  /**
   * Get human-readable growth stage title
   */
  private static getGrowthStageTitle(stage: string): string {
    const titles: Record<string, string> = {
      bud_break: 'Bud Break Stage',
      leaf_development: 'Leaf Development Phase',
      flowering: 'Critical Flowering Stage',
      fruit_set: 'Fruit Set Period',
      veraison: 'Veraison Stage',
      harvest: 'Harvest Time',
      dormancy: 'Dormancy Period'
    };
    
    return titles[stage] || `${stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Stage`;
  }

  /**
   * Get recent activities for context
   */
  private static async getRecentActivities(farmId: number): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

      return activities || [];
    } catch (error) {
      console.warn('Could not fetch recent activities:', error);
      return [];
    }
  }

  /**
   * Helper methods for task formatting
   */
  private static getTaskTitle(taskType: string): string {
    switch (taskType) {
      case 'irrigation': return 'Irrigation Recommended';
      case 'spray': return 'Protective Spray Due';
      case 'fertigation': return 'Nutrition Application';
      case 'pruning': return 'Pruning Required';
      default: return 'Farm Task Pending';
    }
  }

  private static getTaskIcon(taskType: string): string {
    switch (taskType) {
      case 'irrigation': return 'Droplets';
      case 'spray': return 'SprayCan';
      case 'fertigation': return 'Zap';
      case 'pruning': return 'Scissors';
      default: return 'CheckCircle';
    }
  }

  /**
   * Get insights by category for the detailed page
   */
  static async getInsightsByCategory(farmId: number, userId: string): Promise<Record<string, AIInsight[]>> {
    const allInsights = await this.getInsightsForFarm(farmId, userId, 50);
    
    return allInsights.reduce((categories, insight) => {
      if (!categories[insight.type]) {
        categories[insight.type] = [];
      }
      categories[insight.type].push(insight);
      return categories;
    }, {} as Record<string, AIInsight[]>);
  }

  /**
   * Execute an AI insight action
   */
  static async executeInsightAction(insight: AIInsight): Promise<{ success: boolean; message: string }> {
    try {
      switch (insight.actionType) {
        case 'execute':
          // Handle task execution
          if (insight.type === 'task_recommendation' && insight.data) {
            // Mark task as executed or create a pending task
            return { success: true, message: 'Task scheduled for execution' };
          }
          break;
        
        case 'navigate':
          // Navigation is handled by the UI component
          return { success: true, message: 'Navigating to details' };
        
        case 'view':
          // View action for detailed information
          return { success: true, message: 'Opening detailed view' };
        
        default:
          return { success: false, message: 'Unknown action type' };
      }
      
      return { success: true, message: 'Action completed' };
    } catch (error) {
      console.error('Error executing insight action:', error);
      return { success: false, message: 'Action failed' };
    }
  }
}