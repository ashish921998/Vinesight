-- ============================================================================
-- CONSULTANT DASHBOARD MIGRATION
-- Phase 3: AI-Powered Consultant Dashboard for Petiole Test Management
-- ============================================================================

-- ============================================================================
-- 1. NEW TABLES FOR TRIAGE, TEMPLATES, AND ACKNOWLEDGMENTS
-- ============================================================================

-- Petiole test triage results table
-- Stores AI classification results and review status
CREATE TABLE petiole_triage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petiole_test_id BIGINT NOT NULL REFERENCES petiole_test_records(id) ON DELETE CASCADE,
  farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  classification VARCHAR(20) NOT NULL CHECK (classification IN ('green', 'yellow', 'red')),
  classification_reason TEXT, -- AI explanation for the classification
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_draft_plan_id UUID REFERENCES fertilizer_plans(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  farmer_acknowledgment VARCHAR(20) CHECK (farmer_acknowledgment IN ('understood', 'questions', 'thanks')),
  farmer_acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plan templates for auto-drafting fertilizer plans
CREATE TABLE plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g., "Sandy soil - pruning stage - normal NPK"
  season_stage VARCHAR(50) NOT NULL, -- dormancy, pruning, flowering, fruiting, harvest, post_harvest
  soil_type VARCHAR(50), -- sandy, clay, loam, sandy_loam, etc.
  trigger_conditions JSONB NOT NULL, -- Nutrient thresholds for matching
  template_items JSONB NOT NULL, -- Fertilizer items as array
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plan acknowledgments (emoji reactions from farmers)
CREATE TABLE plan_acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES fertilizer_plans(id) ON DELETE CASCADE,
  farmer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction VARCHAR(20) NOT NULL CHECK (reaction IN ('understood', 'questions', 'thanks')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, farmer_user_id)
);

-- ============================================================================
-- 2. ALTER EXISTING TABLES
-- ============================================================================

-- Add assigned_to column to organization_clients for agronomist scoping
ALTER TABLE organization_clients ADD COLUMN IF NOT EXISTS assigned_to UUID 
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update organization_members role constraint to include 'agronomist'
-- First, migrate existing 'member' roles to 'agronomist' to avoid constraint violation
UPDATE organization_members SET role = 'agronomist' WHERE role = 'member';

-- Then alter the check constraint
ALTER TABLE organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE organization_members 
  ADD CONSTRAINT organization_members_role_check 
  CHECK (role IN ('owner', 'admin', 'agronomist'));

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Petiole triage indexes
CREATE INDEX idx_petiole_triage_classification ON petiole_triage(classification);
CREATE INDEX idx_petiole_triage_reviewed_by ON petiole_triage(reviewed_by) WHERE reviewed_by IS NULL;
CREATE INDEX idx_petiole_triage_farm_id ON petiole_triage(farm_id);
CREATE INDEX idx_petiole_triage_org_id ON petiole_triage(organization_id);
CREATE INDEX idx_petiole_triage_pending ON petiole_triage(organization_id, classification, reviewed_by) 
  WHERE reviewed_by IS NULL;
CREATE INDEX idx_petiole_triage_created_at ON petiole_triage(created_at);
CREATE UNIQUE INDEX idx_petiole_triage_petiole_test_id_unique ON petiole_triage(petiole_test_id);

-- Plan templates indexes
CREATE INDEX idx_plan_templates_org_id ON plan_templates(organization_id);
CREATE INDEX idx_plan_templates_match ON plan_templates(organization_id, season_stage, soil_type, is_active);

-- Plan acknowledgments indexes
CREATE INDEX idx_plan_acknowledgments_plan_id ON plan_acknowledgments(plan_id);

-- Organization clients assignment index
CREATE INDEX idx_organization_clients_assigned_to ON organization_clients(assigned_to);

-- ============================================================================
-- 4. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Petiole triage RLS
ALTER TABLE petiole_triage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view triage" ON petiole_triage FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = petiole_triage.organization_id
    AND om.user_id = auth.uid()
    AND (
      om.role IN ('owner', 'admin')
      OR (
        om.role = 'agronomist'
        AND EXISTS (
          SELECT 1
          FROM farms f
          JOIN organization_clients oc
            ON oc.client_user_id = f.user_id
           AND oc.organization_id = petiole_triage.organization_id
          WHERE f.id = petiole_triage.farm_id
            AND oc.assigned_to = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Org members can insert triage" ON petiole_triage FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = petiole_triage.organization_id 
    AND om.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Org members can update triage" ON petiole_triage;

CREATE POLICY "Org members can update triage" ON petiole_triage FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = petiole_triage.organization_id
      AND om.user_id = auth.uid()
      AND (
        om.role IN ('owner', 'admin')
        OR (
          om.role = 'agronomist'
          AND EXISTS (
            SELECT 1
            FROM farms f
            JOIN organization_clients oc
              ON oc.client_user_id = f.user_id
             AND oc.organization_id = petiole_triage.organization_id
            WHERE f.id = petiole_triage.farm_id
              AND oc.assigned_to = auth.uid()
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = petiole_triage.organization_id
      AND om.user_id = auth.uid()
      AND (
        om.role IN ('owner', 'admin')
        OR (
          om.role = 'agronomist'
          AND EXISTS (
            SELECT 1
            FROM farms f
            JOIN organization_clients oc
              ON oc.client_user_id = f.user_id
             AND oc.organization_id = petiole_triage.organization_id
            WHERE f.id = petiole_triage.farm_id
              AND oc.assigned_to = auth.uid()
          )
        )
      )
  )
);

CREATE POLICY "Farm owners can acknowledge triage" ON petiole_triage FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM farms f
    JOIN petiole_triage pt ON pt.farm_id = f.id
    WHERE pt.id = petiole_triage.id
      AND f.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM farms f
    JOIN petiole_triage pt ON pt.farm_id = f.id
    WHERE pt.id = petiole_triage.id
      AND f.user_id = auth.uid()
  )
);

-- Plan templates RLS
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view templates" ON plan_templates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = plan_templates.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can insert templates" ON plan_templates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = plan_templates.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can update templates" ON plan_templates FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = plan_templates.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can delete templates" ON plan_templates FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = plan_templates.organization_id 
    AND om.user_id = auth.uid()
  )
);

-- Plan acknowledgments RLS
ALTER TABLE plan_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view their own acknowledgments" ON plan_acknowledgments FOR SELECT USING (
  farmer_user_id = auth.uid()
);

CREATE POLICY "Org members can view acknowledgments for their plans" ON plan_acknowledgments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM fertilizer_plans fp
    JOIN organization_members om ON om.organization_id = fp.organization_id
    WHERE fp.id = plan_acknowledgments.plan_id AND om.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Farmers can insert their own acknowledgment" ON plan_acknowledgments;

CREATE POLICY "Farmers can insert their own acknowledgment" ON plan_acknowledgments FOR INSERT WITH CHECK (
  farmer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM fertilizer_plans fp
    JOIN farms f ON f.id = fp.farm_id
    WHERE fp.id = plan_acknowledgments.plan_id
      AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Farmers can update their own acknowledgment" ON plan_acknowledgments FOR UPDATE
USING (
  farmer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM fertilizer_plans fp
    JOIN farms f ON f.id = fp.farm_id
    WHERE fp.id = plan_acknowledgments.plan_id
      AND f.user_id = auth.uid()
  )
)
WITH CHECK (
  farmer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM fertilizer_plans fp
    JOIN farms f ON f.id = fp.farm_id
    WHERE fp.id = plan_acknowledgments.plan_id
      AND f.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. ORG-BASED RLS FOR FARM DATA (Consultant access to client farms)
-- ============================================================================

-- Org-based SELECT for farms (consultants can see their client farms)
CREATE POLICY "Org members can view client farms" ON farms FOR SELECT USING (
  user_id = auth.uid() -- Farmer owns the farm
  OR EXISTS (
    -- Consultant/org member with this farmer as a client
    SELECT 1
    FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    WHERE oc.client_user_id = farms.user_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for petiole_test_records
CREATE POLICY "Org members can view client petiole tests" ON petiole_test_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = petiole_test_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = petiole_test_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for soil_test_records
CREATE POLICY "Org members can view client soil tests" ON soil_test_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_test_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = soil_test_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for spray_records
CREATE POLICY "Org members can view client spray records" ON spray_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = spray_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = spray_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for fertigation_records
CREATE POLICY "Org members can view client fertigation records" ON fertigation_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertigation_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = fertigation_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for irrigation_records
CREATE POLICY "Org members can view client irrigation records" ON irrigation_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = irrigation_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = irrigation_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- Org-based SELECT for harvest_records
CREATE POLICY "Org members can view client harvest records" ON harvest_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_records.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_clients oc
    JOIN organization_members om
      ON om.organization_id = oc.organization_id
     AND om.user_id = auth.uid()
    JOIN farms f ON f.user_id = oc.client_user_id
    WHERE f.id = harvest_records.farm_id
      AND (
        om.role IN ('owner', 'admin')
        OR (om.role = 'agronomist' AND oc.assigned_to = auth.uid())
      )
  )
);

-- ============================================================================
-- 6. AGRONOMIST-SPECIFIC RLS (Scoped to assigned farmers only)
-- ============================================================================

-- Assignment scope is enforced directly in the policies above:
-- admins/owners can view all organization clients; agronomists can view only assigned clients.

-- ============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_petiole_triage_updated_at
  BEFORE UPDATE ON petiole_triage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_templates_updated_at
  BEFORE UPDATE ON plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. FUNCTION FOR CLUSTER INTELLIGENCE
-- ============================================================================

-- Function to get farm clusters with similar nutrient deficiencies
CREATE OR REPLACE FUNCTION get_farm_clusters(p_org_id UUID, p_days_ago INTEGER DEFAULT 30)
RETURNS TABLE (
  region TEXT,
  soil_type TEXT,
  classification VARCHAR(20),
  farm_count BIGINT,
  affected_farm_ids BIGINT[],
  primary_deficiency TEXT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for organization %', p_org_id
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT 
    f.region,
    f.soil_texture_class as soil_type,
    t.classification,
    COUNT(*) as farm_count,
    array_agg(t.farm_id) as affected_farm_ids,
    -- Extract primary deficiency from classification_reason
    CASE 
      WHEN COALESCE(t.classification_reason, '') ~* '\m(nitrogen|n)\M' THEN 'Nitrogen'
      WHEN COALESCE(t.classification_reason, '') ~* '\m(phosphorus|p)\M' THEN 'Phosphorus'
      WHEN COALESCE(t.classification_reason, '') ~* '\m(potassium|k)\M' THEN 'Potassium'
      ELSE 'Multiple/Other'
    END as primary_deficiency
  FROM petiole_triage t
  JOIN farms f ON f.id = t.farm_id
  WHERE t.organization_id = p_org_id
    AND t.classification IN ('yellow', 'red')
    AND t.created_at > NOW() - INTERVAL '1 day' * p_days_ago
    AND f.region IS NOT NULL
  GROUP BY f.region, f.soil_texture_class, t.classification, 
    CASE 
      WHEN COALESCE(t.classification_reason, '') ~* '\m(nitrogen|n)\M' THEN 'Nitrogen'
      WHEN COALESCE(t.classification_reason, '') ~* '\m(phosphorus|p)\M' THEN 'Phosphorus'
      WHEN COALESCE(t.classification_reason, '') ~* '\m(potassium|k)\M' THEN 'Potassium'
      ELSE 'Multiple/Other'
    END
  HAVING COUNT(*) >= 3
  ORDER BY farm_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_farm_clusters(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- 9. FUNCTION TO GET TRIAGE QUEUE WITH FARM DETAILS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_triage_queue(
  p_org_id UUID,
  p_classification VARCHAR(20) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  triage_id UUID,
  petiole_test_id BIGINT,
  farm_id BIGINT,
  farmer_id UUID,
  farm_name TEXT,
  farm_region TEXT,
  classification VARCHAR(20),
  classification_reason TEXT,
  confidence_score DECIMAL(3,2),
  ai_draft_plan_id UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  farmer_name TEXT,
  latest_petiole_date DATE,
  nutrient_n DECIMAL(10,2),
  nutrient_p DECIMAL(10,2),
  nutrient_k DECIMAL(10,2)
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for organization %', p_org_id
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT 
    t.id as triage_id,
    t.petiole_test_id,
    t.farm_id,
    f.user_id as farmer_id,
    f.name as farm_name,
    f.region as farm_region,
    t.classification,
    t.classification_reason,
    t.confidence_score,
    t.ai_draft_plan_id,
    t.reviewed_by,
    t.reviewed_at,
    t.created_at,
    p.full_name as farmer_name,
    ptr.date as latest_petiole_date,
    (ptr.parameters->>'N')::DECIMAL as nutrient_n,
    (ptr.parameters->>'P')::DECIMAL as nutrient_p,
    (ptr.parameters->>'K')::DECIMAL as nutrient_k
  FROM petiole_triage t
  JOIN farms f ON f.id = t.farm_id
  JOIN profiles p ON p.id = f.user_id
  JOIN petiole_test_records ptr ON ptr.id = t.petiole_test_id
  WHERE t.organization_id = p_org_id
    AND t.reviewed_by IS NULL
    AND (p_classification IS NULL OR t.classification = p_classification)
  ORDER BY 
    CASE t.classification 
      WHEN 'red' THEN 1 
      WHEN 'yellow' THEN 2 
      WHEN 'green' THEN 3 
    END,
    t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION get_triage_queue(UUID, VARCHAR, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
