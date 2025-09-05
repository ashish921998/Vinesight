import { supabase } from './supabase';
import type { FarmerAIProfile } from '@/types/ai';

export interface DecisionOutcome {
  taskType: string;
  decision: any;
  outcome: {
    success: boolean;
    yield?: number;
    costs?: number;
    timeToComplete?: number;
    satisfaction?: number; // 1-5 rating
  };
  context: {
    weatherConditions?: any;
    growthStage?: string;
    riskLevel?: number;
  };
}

export class AIProfileService {
  /**
   * Get or create farmer AI profile for personalization
   */
  static async getFarmerProfile(userId: string, farmId: number): Promise<FarmerAIProfile | null> {
    try {
      const { data, error } = await supabase
        .from('farmer_ai_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create default one
        return await this.createDefaultProfile(userId, farmId);
      }

      if (error) {
        console.error('Error fetching farmer AI profile:', error);
        return null;
      }

      return this.transformToFarmerAIProfile(data);
    } catch (error) {
      console.error('Error in getFarmerProfile:', error);
      return null;
    }
  }

  /**
   * Create default AI profile for new farmer
   */
  static async createDefaultProfile(userId: string, farmId: number): Promise<FarmerAIProfile | null> {
    try {
      const defaultProfile = {
        user_id: userId,
        farm_id: farmId,
        risk_tolerance: 0.5, // Moderate risk tolerance
        decision_patterns: {
          preferredTiming: 'early_morning',
          riskAversion: 0.5,
          adoptionSpeed: 'moderate',
          communicationStyle: 'detailed'
        },
        success_metrics: {
          averageYield: 0,
          costEfficiency: 0,
          profitability: 0,
          waterUseEfficiency: 0
        },
        learning_preferences: {
          preferredChannels: ['text', 'voice'],
          bestResponseTimes: ['06:00-09:00', '18:00-21:00'],
          languagePreference: 'en'
        },
        seasonal_patterns: {}
      };

      const { data, error } = await supabase
        .from('farmer_ai_profiles')
        .insert([defaultProfile as any])
        .select()
        .single();

      if (error) {
        console.error('Error creating default AI profile:', error);
        return null;
      }

      return this.transformToFarmerAIProfile(data);
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
      return null;
    }
  }

  /**
   * Update farmer profile based on decision outcomes
   */
  static async updateProfileFromDecision(
    userId: string, 
    farmId: number, 
    decisionOutcome: DecisionOutcome
  ): Promise<void> {
    try {
      const profile = await this.getFarmerProfile(userId, farmId);
      if (!profile) return;

      const learningRate = 0.1;
      const { decision, outcome, context } = decisionOutcome;

      // Update decision patterns based on outcomes
      const updatedPatterns = { ...profile.decisionPatterns };
      
      if (outcome.success) {
        // Reinforce successful decision patterns
        if (context.riskLevel !== undefined) {
          updatedPatterns.riskAversion = updatedPatterns.riskAversion + 
            learningRate * (context.riskLevel - updatedPatterns.riskAversion);
        }
      } else {
        // Adjust patterns away from unsuccessful decisions
        if (context.riskLevel !== undefined) {
          updatedPatterns.riskAversion = updatedPatterns.riskAversion - 
            learningRate * (context.riskLevel - updatedPatterns.riskAversion);
        }
      }

      // Update success metrics with exponential moving average
      const updatedMetrics = { ...profile.successMetrics };
      const alpha = 0.1; // Smoothing factor

      if (outcome.yield !== undefined) {
        updatedMetrics.averageYield = updatedMetrics.averageYield * (1 - alpha) + outcome.yield * alpha;
      }

      if (outcome.costs !== undefined && outcome.yield !== undefined) {
        const currentEfficiency = outcome.yield / outcome.costs;
        updatedMetrics.costEfficiency = updatedMetrics.costEfficiency * (1 - alpha) + currentEfficiency * alpha;
      }

      // Update risk tolerance based on satisfaction
      let newRiskTolerance = profile.riskTolerance;
      if (outcome.satisfaction !== undefined) {
        if (outcome.satisfaction >= 4 && outcome.success) {
          // High satisfaction with success -> slightly more risk tolerant
          newRiskTolerance = Math.min(1, newRiskTolerance + 0.05);
        } else if (outcome.satisfaction <= 2 || !outcome.success) {
          // Low satisfaction or failure -> slightly more risk averse
          newRiskTolerance = Math.max(0, newRiskTolerance - 0.05);
        }
      }

      await this.updateProfile({
        ...profile,
        riskTolerance: newRiskTolerance,
        decisionPatterns: updatedPatterns,
        successMetrics: updatedMetrics
      });

    } catch (error) {
      console.error('Error updating profile from decision:', error);
    }
  }

  /**
   * Update entire farmer profile
   */
  static async updateProfile(profile: FarmerAIProfile): Promise<void> {
    try {
      const updateData = {
        risk_tolerance: profile.riskTolerance,
        decision_patterns: profile.decisionPatterns,
        success_metrics: profile.successMetrics,
        learning_preferences: profile.learningPreferences,
        seasonal_patterns: profile.seasonalPatterns,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('farmer_ai_profiles')
        .update(updateData as any)
        .eq('user_id', profile.userId)
        .eq('farm_id', profile.farmId);

      if (error) {
        console.error('Error updating farmer AI profile:', error);
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
    }
  }

  /**
   * Get recommendation weight based on farmer's risk tolerance and past success
   */
  static getRecommendationWeight(
    profile: FarmerAIProfile, 
    recommendationType: string,
    riskLevel: number
  ): number {
    // Base weight starts at 1.0
    let weight = 1.0;

    // Adjust based on risk tolerance vs recommendation risk level
    const riskDiff = Math.abs(profile.riskTolerance - riskLevel);
    weight *= (1 - riskDiff * 0.3); // Reduce weight for mismatched risk levels

    // Adjust based on past success in similar recommendations
    if (profile.successMetrics.averageYield > 0) {
      const successFactor = Math.min(profile.successMetrics.averageYield / 100, 1.0);
      weight *= (0.8 + successFactor * 0.4); // Weight between 0.8-1.2 based on success
    }

    // Adjust based on adoption speed
    const adoptionMultiplier = {
      'conservative': 0.7,
      'moderate': 1.0,
      'early_adopter': 1.3
    };
    weight *= adoptionMultiplier[profile.decisionPatterns.adoptionSpeed] || 1.0;

    return Math.max(0.1, Math.min(2.0, weight)); // Clamp between 0.1 and 2.0
  }

  /**
   * Update seasonal patterns based on farmer activity
   */
  static async updateSeasonalPattern(
    userId: string,
    farmId: number,
    month: string,
    activityType: string,
    timing: string
  ): Promise<void> {
    try {
      const profile = await this.getFarmerProfile(userId, farmId);
      if (!profile) return;

      const seasonalPatterns = { ...profile.seasonalPatterns };
      
      if (!seasonalPatterns[month]) {
        seasonalPatterns[month] = {};
      }
      
      if (!seasonalPatterns[month][activityType]) {
        seasonalPatterns[month][activityType] = [];
      }

      // Add timing if not already present
      if (!seasonalPatterns[month][activityType].includes(timing)) {
        seasonalPatterns[month][activityType].push(timing);
      }

      await this.updateProfile({
        ...profile,
        seasonalPatterns
      });

    } catch (error) {
      console.error('Error updating seasonal pattern:', error);
    }
  }

  /**
   * Get personalized communication preferences
   */
  static getCommunicationPreferences(profile: FarmerAIProfile): {
    preferredChannels: ('voice' | 'text' | 'visual')[];
    bestTimes: string[];
    language: string;
    style: string;
  } {
    return {
      preferredChannels: profile.learningPreferences.preferredChannels,
      bestTimes: profile.learningPreferences.bestResponseTimes,
      language: profile.learningPreferences.languagePreference,
      style: profile.decisionPatterns.communicationStyle
    };
  }

  /**
   * Calculate farmer similarity for community matching
   */
  static calculateFarmerSimilarity(profile1: FarmerAIProfile, profile2: FarmerAIProfile): number {
    let similarity = 0;
    let factors = 0;

    // Risk tolerance similarity (0-1)
    const riskSimilarity = 1 - Math.abs(profile1.riskTolerance - profile2.riskTolerance);
    similarity += riskSimilarity * 0.3;
    factors += 0.3;

    // Adoption speed similarity
    const adoptionScore = profile1.decisionPatterns.adoptionSpeed === profile2.decisionPatterns.adoptionSpeed ? 1 : 0.5;
    similarity += adoptionScore * 0.2;
    factors += 0.2;

    // Success metrics similarity
    if (profile1.successMetrics.averageYield > 0 && profile2.successMetrics.averageYield > 0) {
      const yieldDiff = Math.abs(profile1.successMetrics.averageYield - profile2.successMetrics.averageYield);
      const maxYield = Math.max(profile1.successMetrics.averageYield, profile2.successMetrics.averageYield);
      const yieldSimilarity = 1 - (yieldDiff / maxYield);
      similarity += yieldSimilarity * 0.3;
      factors += 0.3;
    }

    // Communication style similarity
    const commScore = profile1.decisionPatterns.communicationStyle === profile2.decisionPatterns.communicationStyle ? 1 : 0.7;
    similarity += commScore * 0.2;
    factors += 0.2;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Transform database row to FarmerAIProfile interface
   */
  private static transformToFarmerAIProfile(data: any): FarmerAIProfile {
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

  /**
   * Get all profiles for analytics (anonymized)
   */
  static async getAnonymizedProfiles(region?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('farmer_ai_profiles')
        .select(`
          risk_tolerance,
          decision_patterns,
          success_metrics,
          farms!inner(region, area, grape_variety)
        `);

      if (region) {
        query = query.eq('farms.region', region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching anonymized profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnonymizedProfiles:', error);
      return [];
    }
  }
}