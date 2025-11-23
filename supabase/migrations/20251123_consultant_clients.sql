-- ============================================================================
-- Consultant Clients Management System
-- Allows consultants to manage their farmer clients and provide recommendations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Consultant Clients Table
-- Links consultants to their farmer clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultant_clients (
  id SERIAL PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: linked VineSight user

  -- Client Information (for non-VineSight users or additional info)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_village TEXT,
  client_district TEXT,
  client_state TEXT DEFAULT 'Maharashtra',

  -- Metadata
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique client per consultant
  UNIQUE(consultant_id, client_email)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_consultant_clients_consultant ON consultant_clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_status ON consultant_clients(status);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_client_user ON consultant_clients(client_user_id);

-- ----------------------------------------------------------------------------
-- 2. Client Farms Table (for consultants to track client farms)
-- Allows consultants to add farms for clients who are not VineSight users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_farms (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES consultant_clients(id) ON DELETE CASCADE,
  linked_farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL, -- Link to actual farm if client is VineSight user

  -- Farm details (for non-VineSight users)
  farm_name TEXT NOT NULL,
  area DECIMAL(10,2),
  area_unit TEXT DEFAULT 'acres',
  grape_variety TEXT,
  village TEXT,
  district TEXT,
  soil_type TEXT,
  irrigation_type TEXT,

  -- Pruning info
  date_of_pruning DATE,
  expected_harvest_date DATE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_farms_client ON client_farms(client_id);

-- ----------------------------------------------------------------------------
-- 3. Client Lab Reports (for consultants to track client reports)
-- Stores soil/petiole test data for clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_lab_reports (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES consultant_clients(id) ON DELETE CASCADE,
  client_farm_id INTEGER REFERENCES client_farms(id) ON DELETE SET NULL,
  linked_soil_test_id INTEGER REFERENCES soil_test_records(id) ON DELETE SET NULL,
  linked_petiole_test_id INTEGER REFERENCES petiole_test_records(id) ON DELETE SET NULL,

  -- Report type and date
  report_type TEXT NOT NULL CHECK (report_type IN ('soil', 'petiole')),
  test_date DATE NOT NULL,
  lab_name TEXT,

  -- Parameters (JSON to allow flexibility)
  parameters JSONB DEFAULT '{}'::jsonb,

  -- Report file
  report_url TEXT,
  report_filename TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_lab_reports_client ON client_lab_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_client_lab_reports_farm ON client_lab_reports(client_farm_id);
CREATE INDEX IF NOT EXISTS idx_client_lab_reports_type ON client_lab_reports(report_type);

-- ----------------------------------------------------------------------------
-- 4. Fertilizer Recommendations Table
-- Detailed fertilizer plans created by consultants for clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
  id SERIAL PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES consultant_clients(id) ON DELETE CASCADE,
  client_farm_id INTEGER REFERENCES client_farms(id) ON DELETE SET NULL,

  -- Recommendation details
  title TEXT NOT NULL,
  description TEXT,
  growth_stage TEXT, -- e.g., 'Vegetative', 'Flowering', 'Fruit Development'
  days_after_pruning_start INTEGER,
  days_after_pruning_end INTEGER,

  -- Based on lab report (optional reference)
  based_on_soil_report_id INTEGER REFERENCES client_lab_reports(id) ON DELETE SET NULL,
  based_on_petiole_report_id INTEGER REFERENCES client_lab_reports(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'completed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_recommendations_consultant ON fertilizer_recommendations(consultant_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_recommendations_client ON fertilizer_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_recommendations_status ON fertilizer_recommendations(status);

-- ----------------------------------------------------------------------------
-- 5. Fertilizer Recommendation Items
-- Individual fertilizer items in a recommendation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fertilizer_recommendation_items (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER NOT NULL REFERENCES fertilizer_recommendations(id) ON DELETE CASCADE,

  -- Fertilizer details
  fertilizer_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, gm, L, mL
  brand TEXT, -- Optional brand name

  -- Application details
  application_method TEXT, -- e.g., 'Soil application', 'Foliar spray', 'Fertigation'
  frequency TEXT, -- e.g., 'Once', 'Weekly', 'Bi-weekly'
  timing TEXT, -- e.g., 'Morning', 'Evening', 'Before irrigation'

  -- Pricing (optional)
  estimated_cost DECIMAL(10,2),

  -- Order in the list
  sort_order INTEGER DEFAULT 0,

  -- Notes for this specific item
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_items_recommendation ON fertilizer_recommendation_items(recommendation_id);

-- ----------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE consultant_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_recommendation_items ENABLE ROW LEVEL SECURITY;

-- Consultant Clients: Consultants can only see/manage their own clients
CREATE POLICY "Consultants can manage their own clients"
  ON consultant_clients
  FOR ALL
  USING (auth.uid() = consultant_id)
  WITH CHECK (auth.uid() = consultant_id);

-- Client Farms: Access through parent client
CREATE POLICY "Access client farms through parent client"
  ON client_farms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM consultant_clients cc
      WHERE cc.id = client_farms.client_id
      AND cc.consultant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultant_clients cc
      WHERE cc.id = client_farms.client_id
      AND cc.consultant_id = auth.uid()
    )
  );

-- Client Lab Reports: Access through parent client
CREATE POLICY "Access client lab reports through parent client"
  ON client_lab_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM consultant_clients cc
      WHERE cc.id = client_lab_reports.client_id
      AND cc.consultant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultant_clients cc
      WHERE cc.id = client_lab_reports.client_id
      AND cc.consultant_id = auth.uid()
    )
  );

-- Fertilizer Recommendations: Consultants manage their own
CREATE POLICY "Consultants can manage their own recommendations"
  ON fertilizer_recommendations
  FOR ALL
  USING (auth.uid() = consultant_id)
  WITH CHECK (auth.uid() = consultant_id);

-- Recommendation Items: Access through parent recommendation
CREATE POLICY "Access recommendation items through parent"
  ON fertilizer_recommendation_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fertilizer_recommendations fr
      WHERE fr.id = fertilizer_recommendation_items.recommendation_id
      AND fr.consultant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fertilizer_recommendations fr
      WHERE fr.id = fertilizer_recommendation_items.recommendation_id
      AND fr.consultant_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7. Triggers for updated_at
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_consultant_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_clients_timestamp
  BEFORE UPDATE ON consultant_clients
  FOR EACH ROW EXECUTE FUNCTION update_consultant_tables_timestamp();

CREATE TRIGGER update_client_farms_timestamp
  BEFORE UPDATE ON client_farms
  FOR EACH ROW EXECUTE FUNCTION update_consultant_tables_timestamp();

CREATE TRIGGER update_client_lab_reports_timestamp
  BEFORE UPDATE ON client_lab_reports
  FOR EACH ROW EXECUTE FUNCTION update_consultant_tables_timestamp();

CREATE TRIGGER update_fertilizer_recommendations_timestamp
  BEFORE UPDATE ON fertilizer_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_consultant_tables_timestamp();

-- ----------------------------------------------------------------------------
-- 8. Comments for documentation
-- ----------------------------------------------------------------------------

COMMENT ON TABLE consultant_clients IS 'Stores consultant-client relationships. Consultants can add farmers as clients.';
COMMENT ON TABLE client_farms IS 'Farms belonging to consultant clients. Can link to actual VineSight farms or be standalone.';
COMMENT ON TABLE client_lab_reports IS 'Lab test reports (soil/petiole) for consultant clients.';
COMMENT ON TABLE fertilizer_recommendations IS 'Fertilizer recommendation plans created by consultants for their clients.';
COMMENT ON TABLE fertilizer_recommendation_items IS 'Individual fertilizer items within a recommendation plan.';
