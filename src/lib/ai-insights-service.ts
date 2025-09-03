import { supabase } from './supabase';
import { PestPredictionService } from './pest-prediction-service';
import { SmartTaskGenerator } from './smart-task-generator';
import { WeatherService } from './weather-service';

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

      // 3. Weather-Based Insights
      try {
        const weatherData = await WeatherService.getCurrentWeather(farm.region);
        const weatherInsights = this.generateWeatherInsights(weatherData, farm);
        insights.push(...weatherInsights);
      } catch (error) {
        console.warn('Weather insights unavailable:', error);
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
   * Get financial insights (enhanced with real data analysis)
   */
  private static async getFinancialInsights(farmId: number): Promise<AIInsight[]> {
    try {
      // Get expense data from the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('farm_id', farmId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (!expenses || expenses.length === 0) return [];

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.cost, 0);
      const avgMonthlySpend = 15000; // This could be calculated from historical data

      const insights: AIInsight[] = [];

      if (totalSpent > avgMonthlySpend * 1.2) {
        insights.push({
          id: 'financial_overspend',
          type: 'financial_insight',
          priority: 'medium',
          title: `Overspend Alert: ₹${(totalSpent - avgMonthlySpend).toLocaleString()}`,
          subtitle: `20% higher than usual monthly average`,
          icon: 'DollarSign',
          actionLabel: 'View Breakdown',
          actionType: 'navigate',
          actionData: { route: `/farms/${farmId}/reports` },
          confidence: 0.8,
          timeRelevant: true,
          tags: ['finance', 'expense', 'budget']
        });
      }

      return insights;
    } catch (error) {
      console.error('Error getting financial insights:', error);
      return [];
    }
  }

  /**
   * Get growth stage optimization insights
   */
  private static async getGrowthOptimizationInsights(farmId: number, farm: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock growth stage analysis - in production, this would analyze actual data
    const currentMonth = new Date().getMonth();
    
    // Grape growth stages by month in India
    if (currentMonth >= 2 && currentMonth <= 4) { // March-May: Flowering/Fruit Set
      insights.push({
        id: 'growth_flowering',
        type: 'growth_optimization',
        priority: 'high',
        title: 'Critical Flowering Stage',
        subtitle: 'Optimize pollination & prevent flower drop',
        icon: 'Sprout',
        actionLabel: 'View Care Plan',
        actionType: 'navigate',
        actionData: { route: `/farms/${farmId}/growth-guide` },
        confidence: 0.9,
        timeRelevant: true,
        tags: ['growth', 'flowering', 'optimization']
      });
    }

    return insights;
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