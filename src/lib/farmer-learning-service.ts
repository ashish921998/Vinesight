// @ts-nocheck
// Phase 3A: Farmer Action Tracking & Learning System
// Service for tracking farmer decisions and improving AI recommendations

import { createClient } from '@/lib/supabase';
import type { 
  FarmerAIProfile, 
  AITaskRecommendation, 
  PestDiseasePrediction,
  AIConversationContext 
} from '@/types/ai';

interface FarmerAction {
  id: string;
  userId: string;
  farmId: number;
  actionType: 'accept_recommendation' | 'reject_recommendation' | 'modify_recommendation' | 'implement_treatment' | 'ignore_alert';
  contextData: {
    predictionId?: string;
    recommendationId?: string;
    originalSuggestion?: any;
    farmerModification?: any;
    reasoning?: string;
    outcome?: 'successful' | 'failed' | 'partial' | 'pending';
    effectivenessScore?: number; // 0-1 rating from farmer
  };
  timestamp: Date;
  weatherConditions?: any;
  seasonalContext?: string;
}

interface LearningInsight {
  pattern: string;
  confidence: number;
  recommendation: string;
  evidenceCount: number;
  lastSeen: Date;
}

class FarmerLearningService {
  private supabase = createClient();

  /**
   * Track a farmer's action for learning purposes
   */
  async trackFarmerAction(
    userId: string,
    farmId: number,
    actionType: FarmerAction['actionType'],
    contextData: FarmerAction['contextData']
  ): Promise<void> {
    try {
      const action: Omit<FarmerAction, 'id'> = {
        userId,
        farmId,
        actionType,
        contextData,
        timestamp: new Date(),
        seasonalContext: this.getCurrentSeason()
      };

      // Store the action for learning
      await this.storeFarmerAction(action);

      // Update farmer AI profile based on action
      await this.updateFarmerProfile(userId, farmId, action);

      // Generate learning insights from pattern
      await this.analyzeFarmerPatterns(userId, farmId);

    } catch (error) {
      console.error('Error tracking farmer action:', error);
    }
  }

  /**
   * Get farmer AI profile with learning-based adaptations
   */
  async getFarmerProfile(userId: string | null, farmId: number): Promise<FarmerAIProfile | null> {
    if (!userId) {
      // Return a default profile for anonymous users
      return this.createMockProfile('anonymous', farmId);
    }
    try {
      const { data, error } = await this.supabase
        .from('farmer_ai_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        // If table doesn't exist, return a mock profile
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('farmer_ai_profiles table not found, returning mock profile');
          return this.createMockProfile(userId, farmId);
        }
        throw error;
      }

      if (!data) {
        // Try to create default profile, fallback to mock if table doesn't exist
        try {
          return await this.createDefaultProfile(userId, farmId);
        } catch (createError: any) {
          console.warn('Could not create farmer profile, using mock data:', createError.message);
          return this.createMockProfile(userId, farmId);
        }
      }

      return this.mapDbToProfile(data);
    } catch (error) {
      console.warn('Error getting farmer profile, using mock data:', error);
      return this.createMockProfile(userId, farmId);
    }
  }

  /**
   * Update AI recommendations based on farmer learning patterns
   */
  async getPersonalizedRecommendations(
    userId: string,
    farmId: number,
    baseRecommendations: AITaskRecommendation[]
  ): Promise<AITaskRecommendation[]> {
    try {
      const profile = await this.getFarmerProfile(userId, farmId);
      if (!profile) return baseRecommendations;

      const learningInsights = await this.getLearningInsights(userId, farmId);
      
      return baseRecommendations.map(recommendation => {
        // Adjust priority based on farmer's historical acceptance patterns
        const adjustedRecommendation = { ...recommendation };
        
        // Find relevant learning patterns
        const relevantInsights = learningInsights.filter(insight => 
          insight.pattern.includes(recommendation.taskType) ||
          insight.pattern.includes('timing_preference') ||
          insight.pattern.includes('risk_tolerance')
        );

        // Adjust confidence and priority based on farmer's profile
        if (profile.riskTolerance < 0.5 && recommendation.priorityScore > 0.8) {
          // Conservative farmer - reduce urgency of high-risk recommendations
          adjustedRecommendation.priorityScore *= 0.8;
          adjustedRecommendation.reasoning += ` [Adjusted for conservative approach]`;
        }

        if (profile.riskTolerance > 0.7 && recommendation.priorityScore < 0.6) {
          // Risk-taking farmer - might be more receptive to experimental approaches
          adjustedRecommendation.priorityScore *= 1.2;
          adjustedRecommendation.reasoning += ` [Enhanced for proactive approach]`;
        }

        // Adjust timing based on preferred patterns
        const timingPreference = profile.decisionPatterns?.preferredTiming;
        if (timingPreference && recommendation.taskDetails.duration) {
          adjustedRecommendation.reasoning += ` [Best time: ${timingPreference}]`;
        }

        return adjustedRecommendation;
      });
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return baseRecommendations;
    }
  }

  /**
   * Learn from farmer feedback on pest predictions
   */
  async processPestPredictionFeedback(
    userId: string,
    farmId: number,
    predictionId: string,
    feedback: {
      implemented: boolean;
      treatmentUsed?: string;
      effectiveness?: number; // 0-1 scale
      outbreak_occurred?: boolean;
      notes?: string;
    }
  ): Promise<void> {
    try {
      // Track the feedback action
      await this.trackFarmerAction(userId, farmId, 'implement_treatment', {
        predictionId,
        farmerModification: feedback,
        outcome: feedback.effectiveness ? 
          (feedback.effectiveness > 0.7 ? 'successful' : 
           feedback.effectiveness > 0.4 ? 'partial' : 'failed') : 'pending',
        effectivenessScore: feedback.effectiveness
      });

      // Update prediction outcome in database
      const { error } = await this.supabase
        .from('pest_disease_predictions')
        .update({
          farmer_action_taken: feedback.treatmentUsed || 'custom_treatment',
          outcome: feedback.outbreak_occurred ? 'outbreak_occurred' : 'prevented',
          status: 'resolved'
        })
        .eq('id', predictionId);

      if (error) {
        console.error('Error updating prediction outcome:', error);
      }

    } catch (error) {
      console.error('Error processing pest prediction feedback:', error);
    }
  }

  /**
   * Generate adaptive insights based on learning patterns
   */
  async generateAdaptiveInsights(userId: string, farmId: number): Promise<LearningInsight[]> {
    try {
      const profile = await this.getFarmerProfile(userId, farmId);
      const recentActions = await this.getRecentActions(userId, farmId, 30); // Last 30 days
      
      const insights: LearningInsight[] = [];

      // Pattern: Preferred timing
      const timingPatterns = recentActions.filter(action => 
        action.actionType === 'accept_recommendation'
      ).reduce((acc: Record<string, number>, action) => {
        const hour = action.timestamp.getHours();
        const timeOfDay = hour < 10 ? 'early_morning' : 
                         hour < 15 ? 'afternoon' : 'evening';
        acc[timeOfDay] = (acc[timeOfDay] || 0) + 1;
        return acc;
      }, {});

      const preferredTiming = Object.keys(timingPatterns).reduce((a, b) => 
        timingPatterns[a] > timingPatterns[b] ? a : b
      );

      if (Object.keys(timingPatterns).length > 0) {
        insights.push({
          pattern: 'timing_preference',
          confidence: timingPatterns[preferredTiming] / recentActions.length,
          recommendation: `Farmer prefers ${preferredTiming} recommendations`,
          evidenceCount: timingPatterns[preferredTiming],
          lastSeen: new Date()
        });
      }

      // Pattern: Risk tolerance based on acceptance rates
      const riskPatterns = recentActions.reduce((acc: { high: number; low: number }, action) => {
        if (action.contextData.originalSuggestion?.priorityScore > 0.7) {
          acc.high += action.actionType === 'accept_recommendation' ? 1 : 0;
        } else {
          acc.low += action.actionType === 'accept_recommendation' ? 1 : 0;
        }
        return acc;
      }, { high: 0, low: 0 });

      if (riskPatterns.high + riskPatterns.low > 0) {
        const riskTolerance = (riskPatterns.high / (riskPatterns.high + riskPatterns.low));
        insights.push({
          pattern: 'risk_tolerance',
          confidence: 0.8,
          recommendation: riskTolerance > 0.6 ? 
            'Farmer accepts high-priority recommendations' : 
            'Farmer prefers conservative recommendations',
          evidenceCount: riskPatterns.high + riskPatterns.low,
          lastSeen: new Date()
        });
      }

      // Pattern: Successful treatment preferences
      const treatmentPatterns = recentActions
        .filter(action => 
          action.actionType === 'implement_treatment' && 
          action.contextData.outcome === 'successful'
        )
        .reduce((acc: Record<string, number>, action) => {
          const treatment = action.contextData.farmerModification?.treatmentUsed;
          if (treatment) {
            acc[treatment] = (acc[treatment] || 0) + 1;
          }
          return acc;
        }, {});

      Object.entries(treatmentPatterns).forEach(([treatment, count]) => {
        insights.push({
          pattern: `successful_treatment_${treatment}`,
          confidence: count / recentActions.length,
          recommendation: `Farmer has success with ${treatment}`,
          evidenceCount: count,
          lastSeen: new Date()
        });
      });

      return insights;
    } catch (error) {
      console.error('Error generating adaptive insights:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private async storeFarmerAction(action: Omit<FarmerAction, 'id'>): Promise<void> {
    // Store in a dedicated learning table or use AI conversation context
    const { error } = await this.supabase
      .from('ai_conversation_context')
      .insert({
        context_type: 'farmer_action',
        context_data: {
          action_type: action.actionType,
          context_data: action.contextData,
          timestamp: action.timestamp.toISOString(),
          seasonal_context: action.seasonalContext,
          weather_conditions: action.weatherConditions
        },
        relevance_score: 1.0,
        decay_factor: 0.98 // Slowly decaying relevance
      });

    if (error) {
      console.error('Error storing farmer action:', error);
    }
  }

  private async updateFarmerProfile(
    userId: string, 
    farmId: number, 
    action: Omit<FarmerAction, 'id'>
  ): Promise<void> {
    try {
      const profile = await this.getFarmerProfile(userId, farmId);
      if (!profile) return;

      const updates: Partial<FarmerAIProfile> = {
        updatedAt: new Date()
      };

      // Update risk tolerance based on actions
      if (action.actionType === 'accept_recommendation' && 
          action.contextData.originalSuggestion?.priorityScore > 0.7) {
        // Accepting high-priority recommendations increases risk tolerance
        updates.riskTolerance = Math.min(1.0, (profile.riskTolerance || 0.5) + 0.05);
      } else if (action.actionType === 'reject_recommendation' && 
                 action.contextData.originalSuggestion?.priorityScore > 0.7) {
        // Rejecting high-priority recommendations decreases risk tolerance
        updates.riskTolerance = Math.max(0.0, (profile.riskTolerance || 0.5) - 0.05);
      }

      // Update success metrics based on outcomes
      if (action.contextData.outcome === 'successful' && action.contextData.effectivenessScore) {
        const currentMetrics = profile.successMetrics || {};
        updates.successMetrics = {
          ...currentMetrics,
          averageYield: (currentMetrics.averageYield || 0) * 0.9 + action.contextData.effectivenessScore * 0.1,
          profitability: (currentMetrics.profitability || 0) * 0.9 + action.contextData.effectivenessScore * 0.1
        };
      }

      // Update decision patterns
      const hour = action.timestamp.getHours();
      const timeOfDay = hour < 10 ? 'early_morning' : hour < 15 ? 'afternoon' : 'evening';
      
      updates.decisionPatterns = {
        ...profile.decisionPatterns,
        preferredTiming: timeOfDay,
        riskAversion: updates.riskTolerance ? 1 - updates.riskTolerance : profile.decisionPatterns?.riskAversion || 0.5
      };

      // Save updates
      const { error } = await this.supabase
        .from('farmer_ai_profiles')
        .update({
          risk_tolerance: updates.riskTolerance,
          success_metrics: updates.successMetrics,
          decision_patterns: updates.decisionPatterns,
          updated_at: updates.updatedAt?.toISOString()
        })
        .eq('user_id', userId)
        .eq('farm_id', farmId);

      if (error) {
        console.error('Error updating farmer profile:', error);
      }
    } catch (error) {
      console.error('Error in updateFarmerProfile:', error);
    }
  }

  private createMockProfile(userId: string, farmId: number): FarmerAIProfile {
    return {
      id: `mock_${farmId}_${userId}`,
      userId,
      farmId,
      riskTolerance: 0.6, // Slightly risk-taking for demo
      decisionPatterns: {
        preferredTiming: 'afternoon',
        riskAversion: 0.4,
        adoptionSpeed: 'moderate',
        communicationStyle: 'detailed'
      },
      successMetrics: {
        averageYield: 75, // Mock success metrics
        costEfficiency: 80,
        profitability: 70,
        waterUseEfficiency: 85
      },
      learningPreferences: {
        preferredChannels: ['text', 'visual'],
        bestResponseTimes: ['09:00', '15:00'],
        languagePreference: 'en'
      },
      seasonalPatterns: {
        spring: 'high_activity',
        summer: 'irrigation_focus',
        autumn: 'harvest_period',
        winter: 'planning_phase'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async createDefaultProfile(userId: string, farmId: number): Promise<FarmerAIProfile> {
    const defaultProfile: Omit<FarmerAIProfile, 'id'> = {
      userId,
      farmId,
      riskTolerance: 0.5, // Moderate risk tolerance by default
      decisionPatterns: {
        preferredTiming: 'afternoon',
        riskAversion: 0.5,
        adoptionSpeed: 'moderate',
        communicationStyle: 'detailed'
      },
      successMetrics: {
        averageYield: 0,
        costEfficiency: 0,
        profitability: 0,
        waterUseEfficiency: 0
      },
      learningPreferences: {
        preferredChannels: ['text', 'visual'],
        bestResponseTimes: ['09:00', '15:00'],
        languagePreference: 'en'
      },
      seasonalPatterns: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { data, error } = await this.supabase
      .from('farmer_ai_profiles')
      .insert({
        user_id: userId,
        farm_id: farmId,
        risk_tolerance: defaultProfile.riskTolerance,
        decision_patterns: defaultProfile.decisionPatterns,
        success_metrics: defaultProfile.successMetrics,
        learning_preferences: defaultProfile.learningPreferences,
        seasonal_patterns: defaultProfile.seasonalPatterns
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create farmer profile: ${error.message}`);
    }

    return {
      ...defaultProfile,
      id: data.id.toString()
    };
  }

  private async getRecentActions(userId: string, farmId: number, days: number): Promise<FarmerAction[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.supabase
      .from('ai_conversation_context')
      .select('*')
      .eq('context_type', 'farmer_action')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting recent actions:', error);
      return [];
    }

    return data.map(record => ({
      id: record.id.toString(),
      userId,
      farmId,
      actionType: record.context_data.action_type,
      contextData: record.context_data.context_data,
      timestamp: new Date(record.context_data.timestamp),
      weatherConditions: record.context_data.weather_conditions,
      seasonalContext: record.context_data.seasonal_context
    }));
  }

  private async getLearningInsights(userId: string, farmId: number): Promise<LearningInsight[]> {
    // This would typically be cached or computed periodically
    return await this.generateAdaptiveInsights(userId, farmId);
  }

  private async analyzeFarmerPatterns(userId: string, farmId: number): Promise<void> {
    // Analyze patterns and update AI model parameters
    // This is a placeholder for more sophisticated learning algorithms
    const insights = await this.generateAdaptiveInsights(userId, farmId);
    
    // Store insights for future reference
    for (const insight of insights) {
      await this.supabase
        .from('ai_conversation_context')
        .insert({
          context_type: 'learning_insight',
          context_data: insight,
          relevance_score: insight.confidence,
          decay_factor: 0.95
        });
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private mapDbToProfile(data: any): FarmerAIProfile {
    return {
      id: data.id.toString(),
      userId: data.user_id,
      farmId: data.farm_id,
      riskTolerance: data.risk_tolerance,
      decisionPatterns: data.decision_patterns,
      successMetrics: data.success_metrics,
      learningPreferences: data.learning_preferences,
      seasonalPatterns: data.seasonal_patterns,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const farmerLearningService = new FarmerLearningService();
export default FarmerLearningService;