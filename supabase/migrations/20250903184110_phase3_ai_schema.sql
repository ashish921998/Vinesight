-- Phase 3: Advanced AI Intelligence Database Schema
-- Migration: 20250903_phase3_ai_schema.sql

-- Farmer AI Profiles for Personalization
CREATE TABLE farmer_ai_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  risk_tolerance REAL DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1), -- 0 = risk-averse, 1 = risk-taking
  decision_patterns JSONB DEFAULT '{}', -- Historical decision preferences
  success_metrics JSONB DEFAULT '{}', -- Yield, profitability, efficiency tracking
  learning_preferences JSONB DEFAULT '{}', -- Voice, text, visual, timing preferences
  seasonal_patterns JSONB DEFAULT '{}', -- Activity patterns by season/month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, farm_id)
);

-- Smart Task Recommendations
CREATE TABLE ai_task_recommendations (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('irrigation', 'spray', 'harvest', 'fertigation', 'pruning', 'soil_test', 'maintenance')),
  recommended_date DATE NOT NULL,
  priority_score REAL NOT NULL CHECK (priority_score >= 0 AND priority_score <= 1), -- 0-1 priority ranking
  weather_dependent BOOLEAN DEFAULT false,
  reasoning TEXT NOT NULL, -- AI explanation for recommendation
  confidence_score REAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1), -- AI confidence in recommendation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')),
  farmer_feedback TEXT, -- Optional farmer notes
  outcome_tracked BOOLEAN DEFAULT false,
  task_details JSONB DEFAULT '{}', -- Duration, resources, conditions, alternatives
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') -- Auto-expire after 1 week
);

-- Pest & Disease Prediction System
CREATE TABLE pest_disease_predictions (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  region TEXT NOT NULL, -- For community intelligence
  pest_disease_type TEXT NOT NULL, -- downy_mildew, powdery_mildew, black_rot, etc.
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  probability_score REAL NOT NULL CHECK (probability_score >= 0 AND probability_score <= 1), -- 0-1 likelihood
  predicted_onset_date DATE NOT NULL,
  weather_triggers JSONB NOT NULL DEFAULT '{}', -- Weather conditions driving risk
  prevention_window JSONB NOT NULL DEFAULT '{}', -- Optimal treatment timing
  recommended_treatments JSONB NOT NULL DEFAULT '{}', -- Chemical, organic, cultural methods
  community_reports INTEGER DEFAULT 0, -- Nearby confirmed cases
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  farmer_action_taken TEXT, -- What farmer actually did
  outcome TEXT, -- Successful prevention, outbreak occurred, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Expense Analysis & Profitability Insights
CREATE TABLE profitability_analyses (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  expense_breakdown JSONB DEFAULT '{}', -- Category-wise breakdown
  efficiency_scores JSONB DEFAULT '{}', -- Resource utilization metrics
  roi_calculation DECIMAL(5,2), -- Return on investment %
  benchmark_comparison JSONB DEFAULT '{}', -- Anonymous comparison data
  improvement_opportunities JSONB DEFAULT '[]', -- AI-identified savings
  predicted_impact JSONB DEFAULT '{}', -- Projected outcomes of recommendations
  farmer_implemented JSONB DEFAULT '[]', -- Which recommendations were followed
  actual_outcomes JSONB DEFAULT '{}', -- Results after implementation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (analysis_period_start <= analysis_period_end)
);

-- Market Intelligence Data
CREATE TABLE market_intelligence (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  grape_variety TEXT,
  price_data JSONB NOT NULL DEFAULT '{}', -- Historical and current prices
  quality_premiums JSONB DEFAULT '{}', -- Grade-based price differences
  demand_forecast JSONB DEFAULT '{}', -- Predicted market demand
  seasonal_trends JSONB DEFAULT '{}', -- Price patterns by month/season
  supply_chain_insights JSONB DEFAULT '{}', -- Logistics, buyers, contracts
  prediction_date DATE NOT NULL,
  confidence_interval JSONB DEFAULT '{}', -- Price forecast confidence bounds
  data_sources JSONB DEFAULT '[]', -- Mandi prices, export data, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Community Learning Platform
CREATE TABLE community_insights (
  id SERIAL PRIMARY KEY,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('practice', 'outcome', 'lesson', 'alert')),
  farm_characteristics JSONB NOT NULL DEFAULT '{}', -- Anonymous farm profile for matching
  practice_description TEXT NOT NULL,
  outcome_metrics JSONB DEFAULT '{}', -- Yield, cost, efficiency results
  seasonal_timing TEXT, -- When practice was implemented
  regional_relevance TEXT[] DEFAULT '{}', -- Applicable regions/climates
  success_score REAL DEFAULT 0 CHECK (success_score >= 0 AND success_score <= 1), -- 0-1 effectiveness rating
  adoption_count INTEGER DEFAULT 0, -- How many farmers tried it
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'expert_verified', 'community_validated', 'disputed')),
  anonymized_details JSONB DEFAULT '{}', -- Specific implementation details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced AI Conversations with Long-term Memory
CREATE TABLE ai_conversation_context (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('farm_state', 'decision_history', 'preference', 'outcome', 'seasonal_note')),
  context_data JSONB NOT NULL,
  relevance_score REAL DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1), -- Importance for future conversations
  decay_factor REAL DEFAULT 0.95 CHECK (decay_factor >= 0 AND decay_factor <= 1), -- How quickly context loses relevance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_referenced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_farmer_ai_profiles_user_farm ON farmer_ai_profiles(user_id, farm_id);
CREATE INDEX idx_ai_task_recommendations_farm_status ON ai_task_recommendations(farm_id, status, recommended_date);
CREATE INDEX idx_ai_task_recommendations_user_status ON ai_task_recommendations(user_id, status);
CREATE INDEX idx_pest_predictions_farm_region ON pest_disease_predictions(farm_id, region, status);
CREATE INDEX idx_pest_predictions_region_risk ON pest_disease_predictions(region, risk_level, predicted_onset_date);
CREATE INDEX idx_profitability_analyses_farm_period ON profitability_analyses(farm_id, analysis_period_start, analysis_period_end);
CREATE INDEX idx_market_intelligence_region_variety ON market_intelligence(region, grape_variety, prediction_date);
CREATE INDEX idx_community_insights_type_region ON community_insights(insight_type, regional_relevance);
CREATE INDEX idx_ai_conversation_context_conv_type ON ai_conversation_context(conversation_id, context_type);
CREATE INDEX idx_ai_conversation_context_relevance ON ai_conversation_context(relevance_score, last_referenced);

-- Row Level Security Policies
ALTER TABLE farmer_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_disease_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profitability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_context ENABLE ROW LEVEL SECURITY;

-- Farmer AI Profiles RLS
CREATE POLICY "Users can manage their own AI profiles" ON farmer_ai_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Task Recommendations RLS
CREATE POLICY "Users can see their farm task recommendations" ON ai_task_recommendations
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM farms WHERE farms.id = ai_task_recommendations.farm_id AND farms.user_id = auth.uid())
  );

-- Pest Predictions RLS
CREATE POLICY "Users can see predictions for their farms" ON pest_disease_predictions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = pest_disease_predictions.farm_id AND farms.user_id = auth.uid())
  );

-- Profitability Analysis RLS
CREATE POLICY "Users can access their own profitability data" ON profitability_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Market Intelligence RLS (Regional data accessible to all authenticated users)
CREATE POLICY "Authenticated users can access market data" ON market_intelligence
  FOR SELECT USING (auth.role() = 'authenticated');

-- Community Insights RLS (Anonymous sharing with access controls)
CREATE POLICY "Users can access community insights" ON community_insights
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can contribute community insights" ON community_insights
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AI Conversation Context RLS
CREATE POLICY "Users can access context from their conversations" ON ai_conversation_context
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_conversation_context.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Create functions for automated tasks
CREATE OR REPLACE FUNCTION update_farmer_ai_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for farmer AI profiles
CREATE TRIGGER update_farmer_ai_profiles_updated_at
  BEFORE UPDATE ON farmer_ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_farmer_ai_profile_timestamp();

-- Function to decay AI conversation context relevance
CREATE OR REPLACE FUNCTION decay_context_relevance()
RETURNS void AS $$
BEGIN
  UPDATE ai_conversation_context 
  SET relevance_score = relevance_score * decay_factor
  WHERE last_referenced < NOW() - INTERVAL '7 days'
  AND relevance_score > 0.1;
  
  -- Clean up very low relevance contexts
  DELETE FROM ai_conversation_context 
  WHERE relevance_score < 0.05;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old task recommendations
CREATE OR REPLACE FUNCTION expire_old_task_recommendations()
RETURNS void AS $$
BEGIN
  UPDATE ai_task_recommendations 
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE farmer_ai_profiles IS 'Stores personalized AI profiles for each farmer-farm combination to enable adaptive recommendations';
COMMENT ON TABLE ai_task_recommendations IS 'AI-generated task recommendations with reasoning and farmer feedback tracking';
COMMENT ON TABLE pest_disease_predictions IS 'Weather-based pest/disease predictions with community intelligence and treatment recommendations';
COMMENT ON TABLE profitability_analyses IS 'Comprehensive expense analysis and profitability optimization insights';
COMMENT ON TABLE market_intelligence IS 'Market price predictions, trends, and selling optimization data';
COMMENT ON TABLE community_insights IS 'Anonymous sharing of successful farming practices and outcomes';
COMMENT ON TABLE ai_conversation_context IS 'Long-term memory system for AI conversations with relevance decay';