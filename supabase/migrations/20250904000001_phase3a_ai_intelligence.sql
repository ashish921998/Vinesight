-- Phase 3A: Advanced AI Intelligence Database Schema
-- Deploy tables for pest predictions, AI profiles, and task recommendations

-- Farmer AI Profiles for Personalization
CREATE TABLE farmer_ai_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  farm_id INTEGER REFERENCES farms(id),
  risk_tolerance REAL DEFAULT 0.5, -- 0 = risk-averse, 1 = risk-taking
  decision_patterns JSONB DEFAULT '{}', -- Historical decision preferences
  success_metrics JSONB DEFAULT '{}', -- Yield, profitability, efficiency tracking
  learning_preferences JSONB DEFAULT '{}', -- Voice, text, visual, timing preferences
  seasonal_patterns JSONB DEFAULT '{}', -- Activity patterns by season/month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Task Recommendations
CREATE TABLE ai_task_recommendations (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  user_id UUID REFERENCES auth.users(id),
  task_type TEXT NOT NULL, -- irrigation, spray, harvest, fertigation, pruning, soil_test
  recommended_date DATE,
  priority_score REAL, -- 0-1 priority ranking
  weather_dependent BOOLEAN DEFAULT false,
  reasoning TEXT, -- AI explanation for recommendation
  confidence_score REAL, -- AI confidence in recommendation
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
  farmer_feedback TEXT, -- Optional farmer notes
  outcome_tracked BOOLEAN DEFAULT false,
  task_details JSONB DEFAULT '{}', -- Duration, resources, conditions, alternatives
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pest & Disease Prediction System
CREATE TABLE pest_disease_predictions (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  user_id UUID REFERENCES auth.users(id),
  region TEXT, -- For community intelligence
  pest_disease_type TEXT NOT NULL,
  risk_level TEXT NOT NULL, -- low, medium, high, critical
  probability_score REAL, -- 0-1 likelihood
  predicted_onset_date DATE,
  weather_triggers JSONB DEFAULT '{}', -- Weather conditions driving risk
  prevention_window JSONB DEFAULT '{}', -- Optimal treatment timing
  recommended_treatments JSONB DEFAULT '[]', -- Chemical, organic, cultural methods
  community_reports INTEGER DEFAULT 0, -- Nearby confirmed cases
  status TEXT DEFAULT 'active', -- active, resolved, false_alarm
  farmer_action_taken TEXT, -- What farmer actually did
  outcome TEXT, -- Successful prevention, outbreak occurred, etc.
  alert_priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Analysis & Profitability Insights
CREATE TABLE profitability_analyses (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  user_id UUID REFERENCES auth.users(id),
  analysis_period_start DATE,
  analysis_period_end DATE,
  total_expenses DECIMAL(10,2),
  expense_breakdown JSONB DEFAULT '{}', -- Category-wise breakdown
  efficiency_scores JSONB DEFAULT '{}', -- Resource utilization metrics
  roi_calculation DECIMAL(5,2), -- Return on investment %
  benchmark_comparison JSONB DEFAULT '{}', -- Anonymous comparison data
  improvement_opportunities JSONB DEFAULT '[]', -- AI-identified savings
  predicted_impact JSONB DEFAULT '{}', -- Projected outcomes of recommendations
  farmer_implemented JSONB DEFAULT '[]', -- Which recommendations were followed
  actual_outcomes JSONB DEFAULT '{}', -- Results after implementation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced AI Conversation Context for Memory
CREATE TABLE ai_conversation_context (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES ai_conversations(id),
  context_type TEXT NOT NULL, -- farm_state, decision_history, preference, outcome
  context_data JSONB NOT NULL,
  relevance_score REAL DEFAULT 1.0, -- Importance for future conversations
  decay_factor REAL DEFAULT 0.95, -- How quickly context loses relevance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_referenced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for all new tables
ALTER TABLE farmer_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_disease_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profitability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Farmer AI Profiles RLS
CREATE POLICY "Users can manage their own AI profiles" ON farmer_ai_profiles
  USING (auth.uid() = user_id);

-- Task Recommendations RLS
CREATE POLICY "Users can see their farm task recommendations" ON ai_task_recommendations
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM farms WHERE farms.id = ai_task_recommendations.farm_id AND farms.user_id = auth.uid())
  );

-- Pest Predictions RLS
CREATE POLICY "Users can see predictions for their farms" ON pest_disease_predictions
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM farms WHERE farms.id = pest_disease_predictions.farm_id AND farms.user_id = auth.uid())
  );

-- Profitability Analysis RLS
CREATE POLICY "Users can access their own profitability data" ON profitability_analyses
  USING (auth.uid() = user_id);

-- AI Conversation Context RLS
CREATE POLICY "Users can access context from their conversations" ON ai_conversation_context
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_conversation_context.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Performance Indexes

-- Farmer AI Profiles indexes
CREATE INDEX idx_farmer_ai_profiles_user_farm ON farmer_ai_profiles(user_id, farm_id);
CREATE INDEX idx_farmer_ai_profiles_updated ON farmer_ai_profiles(updated_at DESC);

-- Task Recommendations indexes
CREATE INDEX idx_ai_task_recommendations_farm_date ON ai_task_recommendations(farm_id, recommended_date DESC);
CREATE INDEX idx_ai_task_recommendations_user_status ON ai_task_recommendations(user_id, status);
CREATE INDEX idx_ai_task_recommendations_priority ON ai_task_recommendations(priority_score DESC);

-- Pest Predictions indexes
CREATE INDEX idx_pest_predictions_farm_date ON pest_disease_predictions(farm_id, predicted_onset_date);
CREATE INDEX idx_pest_predictions_priority ON pest_disease_predictions(alert_priority, created_at DESC);
CREATE INDEX idx_pest_predictions_status ON pest_disease_predictions(farm_id, status);
CREATE INDEX idx_pest_predictions_region_type ON pest_disease_predictions(region, pest_disease_type);

-- Profitability Analysis indexes
CREATE INDEX idx_profitability_analyses_farm_period ON profitability_analyses(farm_id, analysis_period_end DESC);
CREATE INDEX idx_profitability_analyses_user ON profitability_analyses(user_id, created_at DESC);

-- AI Conversation Context indexes
CREATE INDEX idx_ai_conversation_context_conversation ON ai_conversation_context(conversation_id, relevance_score DESC);
CREATE INDEX idx_ai_conversation_context_type ON ai_conversation_context(context_type, last_referenced DESC);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_farmer_ai_profiles_updated_at 
    BEFORE UPDATE ON farmer_ai_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pest_disease_predictions_updated_at 
    BEFORE UPDATE ON pest_disease_predictions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();