-- Phase 3A: AI Intelligence & Outcome Tracking
-- Add tables for tracking recommendation outcomes and calculating ROI

-- Recommendation Outcomes Tracking
CREATE TABLE IF NOT EXISTS recommendation_outcomes (
  id BIGSERIAL PRIMARY KEY,

  -- Link to source test and recommendation
  test_id BIGINT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('soil', 'petiole')),
  farm_id BIGINT NOT NULL,
  recommendation_parameter TEXT NOT NULL, -- e.g., 'pH', 'Nitrogen', 'Potassium'
  recommendation_priority TEXT NOT NULL CHECK (recommendation_priority IN ('critical', 'high', 'moderate', 'low', 'optimal')),
  recommendation_text TEXT NOT NULL,

  -- Farmer action
  followed BOOLEAN DEFAULT NULL, -- true = followed, false = didn't follow, null = unknown
  action_taken TEXT, -- What farmer actually did
  action_date DATE,

  -- Outcome metrics
  cost_spent DECIMAL(10,2), -- Amount spent (₹)
  yield_impact DECIMAL(10,2), -- Yield change (kg)
  soil_parameter_change JSONB, -- Changes in next test
  disease_incidents INTEGER DEFAULT 0, -- Number of disease cases

  -- Farmer feedback
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ROI Tracking for Lab Tests
CREATE TABLE IF NOT EXISTS test_roi_tracking (
  id BIGSERIAL PRIMARY KEY,

  -- Link to test
  test_id BIGINT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('soil', 'petiole')),
  farm_id BIGINT NOT NULL,
  test_date DATE NOT NULL,

  -- Test cost
  test_cost DECIMAL(10,2) NOT NULL DEFAULT 1000.00, -- Lab test cost

  -- Benefits (tracked over time)
  fertilizer_savings DECIMAL(10,2) DEFAULT 0, -- Saved by skipping unnecessary products
  yield_increase_kg DECIMAL(10,2) DEFAULT 0,
  yield_increase_value DECIMAL(10,2) DEFAULT 0, -- ₹ value
  disease_prevention_savings DECIMAL(10,2) DEFAULT 0,
  water_savings DECIMAL(10,2) DEFAULT 0, -- From leaching, efficiency

  -- Total ROI
  total_benefit DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(10,2) DEFAULT 0, -- (benefit - cost) / cost * 100

  -- Outcome period
  outcome_measured_date DATE, -- When outcomes were measured
  season TEXT, -- e.g., "2024-2025"

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_farm_roi FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Disease Risk Alerts (based on nutrient deficiencies)
CREATE TABLE IF NOT EXISTS disease_risk_alerts (
  id BIGSERIAL PRIMARY KEY,

  -- Link to test
  test_id BIGINT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('soil', 'petiole')),
  farm_id BIGINT NOT NULL,

  -- Risk details
  nutrient_deficiency TEXT NOT NULL, -- e.g., 'calcium', 'potassium'
  disease_risks JSONB NOT NULL, -- Array of disease names
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_explanation TEXT NOT NULL,

  -- Prevention recommendations
  preventive_actions JSONB, -- Array of actions

  -- Outcome tracking
  disease_occurred BOOLEAN DEFAULT NULL, -- Did disease actually happen?
  preventive_action_taken BOOLEAN DEFAULT NULL, -- Did farmer take action?

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Foreign keys
  CONSTRAINT fk_farm_alert FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendation_outcomes_farm ON recommendation_outcomes(farm_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_outcomes_test ON recommendation_outcomes(test_id, test_type);
CREATE INDEX IF NOT EXISTS idx_test_roi_farm ON test_roi_tracking(farm_id);
CREATE INDEX IF NOT EXISTS idx_test_roi_test ON test_roi_tracking(test_id, test_type);
CREATE INDEX IF NOT EXISTS idx_disease_alerts_farm ON disease_risk_alerts(farm_id);

-- Row Level Security
ALTER TABLE recommendation_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_risk_alerts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own farm's data
CREATE POLICY "Users can manage their own recommendation outcomes" ON recommendation_outcomes
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = recommendation_outcomes.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own ROI tracking" ON test_roi_tracking
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = test_roi_tracking.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own disease alerts" ON disease_risk_alerts
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = disease_risk_alerts.farm_id
      AND farms.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE recommendation_outcomes IS 'Tracks outcomes of lab test recommendations to enable AI learning';
COMMENT ON TABLE test_roi_tracking IS 'Calculates and tracks ROI for lab test investments';
COMMENT ON TABLE disease_risk_alerts IS 'Links nutrient deficiencies to disease risks for early prevention';
