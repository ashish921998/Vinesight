-- Enterprise RBAC System Migration
-- Multi-tenant architecture with role-based access control
-- Backwards compatible with existing individual users

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations table (multi-tenant foundation)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'business', 'enterprise')),

  -- Subscription & Billing
  subscription_tier VARCHAR(50) DEFAULT 'business' CHECK (subscription_tier IN ('free', 'business', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial')),
  max_users INTEGER DEFAULT 5,
  max_farms INTEGER DEFAULT 20,

  -- Organization Details
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Features & Settings
  features JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Organization Members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role & Permissions
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'owner', 'admin', 'farm_manager', 'supervisor',
    'field_worker', 'consultant', 'accountant', 'viewer'
  )),
  custom_permissions JSONB DEFAULT '{}',

  -- Farm-level assignments (NULL = access based on role)
  assigned_farm_ids BIGINT[],

  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  UNIQUE(organization_id, user_id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Invitations table
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned_farm_ids BIGINT[],

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Audit
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  farm_id BIGINT REFERENCES farms(id) ON DELETE SET NULL,

  -- User & Action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,

  -- Resource Details
  resource_type VARCHAR(100) NOT NULL,
  resource_id TEXT,

  -- Changes (for update actions)
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),

  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Role Permissions Configuration table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  role_name VARCHAR(100) NOT NULL,
  role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('system', 'custom')),

  -- Permission matrix (JSONB for flexibility)
  permissions JSONB NOT NULL DEFAULT '{
    "farms": {"create": false, "read": false, "update": false, "delete": false},
    "irrigation_records": {"create": false, "read": false, "update": false, "delete": false},
    "spray_records": {"create": false, "read": false, "update": false, "delete": false},
    "fertigation_records": {"create": false, "read": false, "update": false, "delete": false},
    "harvest_records": {"create": false, "read": false, "update": false, "delete": false},
    "expense_records": {"create": false, "read": false, "update": false, "delete": false},
    "task_reminders": {"create": false, "read": false, "update": false, "delete": false},
    "soil_test_records": {"create": false, "read": false, "update": false, "delete": false},
    "petiole_test_records": {"create": false, "read": false, "update": false, "delete": false},
    "users": {"invite": false, "manage": false, "remove": false},
    "reports": {"generate": false, "export": false},
    "ai_features": {"chat": false, "disease_detection": false, "analytics": false},
    "calculators": {"basic": true, "advanced": false}
  }',

  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, role_name)
);

-- ============================================
-- UPDATE EXISTING FARMS TABLE
-- ============================================

-- Add organization columns to farms
ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('private', 'org_wide')),
  ADD COLUMN IF NOT EXISTS farm_manager_ids UUID[],
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================

-- Organizations
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);

-- Organization Members
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_status ON organization_members(status);
CREATE INDEX idx_org_members_assigned_farms ON organization_members USING GIN(assigned_farm_ids);

-- Invitations
CREATE INDEX idx_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_status ON organization_invitations(status);
CREATE INDEX idx_invitations_expires_at ON organization_invitations(expires_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_farm_id ON audit_logs(farm_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Role Permissions
CREATE INDEX idx_role_permissions_org_id ON role_permissions(organization_id);
CREATE INDEX idx_role_permissions_role_type ON role_permissions(role_type);

-- Farms organization
CREATE INDEX idx_farms_organization_id ON farms(organization_id);
CREATE INDEX idx_farms_visibility ON farms(visibility);
CREATE INDEX idx_farms_managers ON farms USING GIN(farm_manager_ids);

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Check if user is organization owner/admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = required_role
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access farm (direct ownership OR through organization)
CREATE OR REPLACE FUNCTION can_access_farm(farm_id_param BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  farm_org_id UUID;
  user_membership RECORD;
BEGIN
  -- Get farm's organization
  SELECT organization_id INTO farm_org_id
  FROM farms WHERE id = farm_id_param;

  -- Legacy: Direct ownership (backwards compatibility)
  IF EXISTS (
    SELECT 1 FROM farms
    WHERE id = farm_id_param
    AND user_id = auth.uid()
    AND organization_id IS NULL
  ) THEN
    RETURN TRUE;
  END IF;

  -- Organization-based access
  IF farm_org_id IS NOT NULL THEN
    SELECT * INTO user_membership
    FROM organization_members
    WHERE organization_id = farm_org_id
    AND user_id = auth.uid()
    AND status = 'active';

    -- No membership = no access
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Owner/Admin = full access to all farms
    IF user_membership.role IN ('owner', 'admin') THEN
      RETURN TRUE;
    END IF;

    -- Farm Manager: Check if restricted to specific farms
    IF user_membership.role = 'farm_manager' THEN
      IF user_membership.assigned_farm_ids IS NOT NULL
         AND array_length(user_membership.assigned_farm_ids, 1) > 0 THEN
        RETURN farm_id_param = ANY(user_membership.assigned_farm_ids);
      END IF;
      RETURN TRUE;
    END IF;

    -- Other roles: Check assigned_farm_ids
    IF user_membership.assigned_farm_ids IS NOT NULL THEN
      RETURN farm_id_param = ANY(user_membership.assigned_farm_ids);
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check specific permission for user in context of a farm
CREATE OR REPLACE FUNCTION has_farm_permission(
  farm_id_param BIGINT,
  resource_type TEXT,
  permission TEXT -- 'create', 'read', 'update', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  farm_org_id UUID;
  user_role TEXT;
BEGIN
  -- Get farm organization
  SELECT organization_id INTO farm_org_id
  FROM farms WHERE id = farm_id_param;

  -- Legacy direct ownership = full permissions
  IF EXISTS (
    SELECT 1 FROM farms
    WHERE id = farm_id_param
    AND user_id = auth.uid()
    AND organization_id IS NULL
  ) THEN
    RETURN TRUE;
  END IF;

  -- Get user's role in organization
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = farm_org_id
  AND user_id = auth.uid()
  AND status = 'active';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if user can access this farm
  IF NOT can_access_farm(farm_id_param) THEN
    RETURN FALSE;
  END IF;

  -- Role-based permission logic
  CASE user_role
    WHEN 'owner', 'admin' THEN
      RETURN TRUE;

    WHEN 'farm_manager' THEN
      RETURN TRUE;

    WHEN 'supervisor' THEN
      -- Can create/read/update but not delete
      RETURN permission IN ('create', 'read', 'update');

    WHEN 'field_worker' THEN
      -- Can create/read operational records only
      IF resource_type IN ('irrigation_records', 'spray_records', 'fertigation_records', 'harvest_records') THEN
        RETURN permission IN ('create', 'read');
      END IF;
      RETURN FALSE;

    WHEN 'consultant' THEN
      -- Read all, write only recommendations/notes
      IF permission = 'read' THEN
        RETURN TRUE;
      END IF;
      IF resource_type IN ('soil_test_records', 'petiole_test_records') THEN
        RETURN permission IN ('create', 'update');
      END IF;
      RETURN FALSE;

    WHEN 'accountant' THEN
      -- Read all, write only expense records
      IF permission = 'read' THEN
        RETURN TRUE;
      END IF;
      IF resource_type = 'expense_records' THEN
        RETURN permission IN ('create', 'update', 'delete');
      END IF;
      RETURN FALSE;

    WHEN 'viewer' THEN
      -- Read-only access
      RETURN permission = 'read';

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ORGANIZATIONS
-- ============================================

CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (
    is_org_admin(id)
  );

CREATE POLICY "Owners can delete their organizations" ON organizations
  FOR DELETE USING (
    has_org_role(id, 'owner')
  );

-- ============================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================

CREATE POLICY "Users can view org members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can add org members" ON organization_members
  FOR INSERT WITH CHECK (
    is_org_admin(organization_id)
  );

CREATE POLICY "Admins can update org members" ON organization_members
  FOR UPDATE USING (
    is_org_admin(organization_id)
    AND (role != 'owner' OR user_id = auth.uid())
  );

CREATE POLICY "Admins can remove org members" ON organization_members
  FOR DELETE USING (
    is_org_admin(organization_id)
    AND role != 'owner'
  );

-- ============================================
-- RLS POLICIES - INVITATIONS
-- ============================================

CREATE POLICY "Admins can view org invitations" ON organization_invitations
  FOR SELECT USING (
    is_org_admin(organization_id)
  );

CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    is_org_admin(organization_id)
  );

CREATE POLICY "Admins can update invitations" ON organization_invitations
  FOR UPDATE USING (
    is_org_admin(organization_id)
  );

CREATE POLICY "Admins can delete invitations" ON organization_invitations
  FOR DELETE USING (
    is_org_admin(organization_id)
  );

-- ============================================
-- RLS POLICIES - AUDIT LOGS
-- Audit Logs: Admin can read, system can insert
CREATE POLICY "Admins/owners can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = audit_logs.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Only allow inserting audit logs where the user_id matches the authenticated user
-- This prevents users from creating fake audit entries for other users
CREATE POLICY "Users can insert their own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================
-- RLS POLICIES - ROLE PERMISSIONS
-- ============================================

CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL USING (
    is_org_admin(organization_id)
  );

-- ============================================
-- UPDATE FARMS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own farms" ON farms;
DROP POLICY IF EXISTS "Users can insert their own farms" ON farms;
DROP POLICY IF EXISTS "Users can update their own farms" ON farms;
DROP POLICY IF EXISTS "Users can delete their own farms" ON farms;

-- New multi-tenant policies
CREATE POLICY "Users can view accessible farms" ON farms
  FOR SELECT USING (
    -- Legacy direct ownership
    (user_id = auth.uid() AND organization_id IS NULL)
    OR
    -- Organization-based access
    can_access_farm(id)
  );

CREATE POLICY "Users can create farms" ON farms
  FOR INSERT WITH CHECK (
    -- Legacy: direct ownership
    (auth.uid() = user_id AND organization_id IS NULL)
    OR
    -- Organization: admins and farm managers
    (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'farm_manager')
        AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can update accessible farms" ON farms
  FOR UPDATE USING (
    has_farm_permission(id, 'farms', 'update')
  );

CREATE POLICY "Users can delete managed farms" ON farms
  FOR DELETE USING (
    has_farm_permission(id, 'farms', 'delete')
  );

-- ============================================
-- UPDATE RECORD TABLES RLS POLICIES
-- ============================================

-- Drop existing irrigation policies
DROP POLICY IF EXISTS "Users can view their farm irrigation records" ON irrigation_records;
DROP POLICY IF EXISTS "Users can insert irrigation records for their farms" ON irrigation_records;
DROP POLICY IF EXISTS "Users can update irrigation records for their farms" ON irrigation_records;
DROP POLICY IF EXISTS "Users can delete irrigation records for their farms" ON irrigation_records;

-- New irrigation policies with granular permissions
CREATE POLICY "Users can view irrigation records" ON irrigation_records
  FOR SELECT USING (
    has_farm_permission(farm_id, 'irrigation_records', 'read')
  );

CREATE POLICY "Users can create irrigation records" ON irrigation_records
  FOR INSERT WITH CHECK (
    has_farm_permission(farm_id, 'irrigation_records', 'create')
  );

CREATE POLICY "Users can update irrigation records" ON irrigation_records
  FOR UPDATE USING (
    has_farm_permission(farm_id, 'irrigation_records', 'update')
  );

CREATE POLICY "Users can delete irrigation records" ON irrigation_records
  FOR DELETE USING (
    has_farm_permission(farm_id, 'irrigation_records', 'delete')
  );

-- Spray records
DROP POLICY IF EXISTS "Users can view their farm spray records" ON spray_records;
DROP POLICY IF EXISTS "Users can insert spray records for their farms" ON spray_records;
DROP POLICY IF EXISTS "Users can update spray records for their farms" ON spray_records;
DROP POLICY IF EXISTS "Users can delete spray records for their farms" ON spray_records;

CREATE POLICY "Users can view spray records" ON spray_records
  FOR SELECT USING (has_farm_permission(farm_id, 'spray_records', 'read'));

CREATE POLICY "Users can create spray records" ON spray_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'spray_records', 'create'));

CREATE POLICY "Users can update spray records" ON spray_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'spray_records', 'update'));

CREATE POLICY "Users can delete spray records" ON spray_records
  FOR DELETE USING (has_farm_permission(farm_id, 'spray_records', 'delete'));

-- Fertigation records
DROP POLICY IF EXISTS "Users can view their farm fertigation records" ON fertigation_records;
DROP POLICY IF EXISTS "Users can insert fertigation records for their farms" ON fertigation_records;
DROP POLICY IF EXISTS "Users can update fertigation records for their farms" ON fertigation_records;
DROP POLICY IF EXISTS "Users can delete fertigation records for their farms" ON fertigation_records;

CREATE POLICY "Users can view fertigation records" ON fertigation_records
  FOR SELECT USING (has_farm_permission(farm_id, 'fertigation_records', 'read'));

CREATE POLICY "Users can create fertigation records" ON fertigation_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'fertigation_records', 'create'));

CREATE POLICY "Users can update fertigation records" ON fertigation_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'fertigation_records', 'update'));

CREATE POLICY "Users can delete fertigation records" ON fertigation_records
  FOR DELETE USING (has_farm_permission(farm_id, 'fertigation_records', 'delete'));

-- Harvest records
DROP POLICY IF EXISTS "Users can view their farm harvest records" ON harvest_records;
DROP POLICY IF EXISTS "Users can insert harvest records for their farms" ON harvest_records;
DROP POLICY IF EXISTS "Users can update harvest records for their farms" ON harvest_records;
DROP POLICY IF EXISTS "Users can delete harvest records for their farms" ON harvest_records;

CREATE POLICY "Users can view harvest records" ON harvest_records
  FOR SELECT USING (has_farm_permission(farm_id, 'harvest_records', 'read'));

CREATE POLICY "Users can create harvest records" ON harvest_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'harvest_records', 'create'));

CREATE POLICY "Users can update harvest records" ON harvest_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'harvest_records', 'update'));

CREATE POLICY "Users can delete harvest records" ON harvest_records
  FOR DELETE USING (has_farm_permission(farm_id, 'harvest_records', 'delete'));

-- Expense records
DROP POLICY IF EXISTS "Users can view their farm expense records" ON expense_records;
DROP POLICY IF EXISTS "Users can insert expense records for their farms" ON expense_records;
DROP POLICY IF EXISTS "Users can update expense records for their farms" ON expense_records;
DROP POLICY IF EXISTS "Users can delete expense records for their farms" ON expense_records;

CREATE POLICY "Users can view expense records" ON expense_records
  FOR SELECT USING (has_farm_permission(farm_id, 'expense_records', 'read'));

CREATE POLICY "Users can create expense records" ON expense_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'expense_records', 'create'));

CREATE POLICY "Users can update expense records" ON expense_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'expense_records', 'update'));

CREATE POLICY "Users can delete expense records" ON expense_records
  FOR DELETE USING (has_farm_permission(farm_id, 'expense_records', 'delete'));

-- Task reminders
DROP POLICY IF EXISTS "Users can view their farm task reminders" ON task_reminders;
DROP POLICY IF EXISTS "Users can insert task reminders for their farms" ON task_reminders;
DROP POLICY IF EXISTS "Users can update task reminders for their farms" ON task_reminders;
DROP POLICY IF EXISTS "Users can delete task reminders for their farms" ON task_reminders;

CREATE POLICY "Users can view task reminders" ON task_reminders
  FOR SELECT USING (has_farm_permission(farm_id, 'task_reminders', 'read'));

CREATE POLICY "Users can create task reminders" ON task_reminders
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'task_reminders', 'create'));

CREATE POLICY "Users can update task reminders" ON task_reminders
  FOR UPDATE USING (has_farm_permission(farm_id, 'task_reminders', 'update'));

CREATE POLICY "Users can delete task reminders" ON task_reminders
  FOR DELETE USING (has_farm_permission(farm_id, 'task_reminders', 'delete'));

-- Soil test records
DROP POLICY IF EXISTS "Users can view their farm soil test records" ON soil_test_records;
DROP POLICY IF EXISTS "Users can insert soil test records for their farms" ON soil_test_records;
DROP POLICY IF EXISTS "Users can update soil test records for their farms" ON soil_test_records;
DROP POLICY IF EXISTS "Users can delete soil test records for their farms" ON soil_test_records;

CREATE POLICY "Users can view soil test records" ON soil_test_records
  FOR SELECT USING (has_farm_permission(farm_id, 'soil_test_records', 'read'));

CREATE POLICY "Users can create soil test records" ON soil_test_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'soil_test_records', 'create'));

CREATE POLICY "Users can update soil test records" ON soil_test_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'soil_test_records', 'update'));

CREATE POLICY "Users can delete soil test records" ON soil_test_records
  FOR DELETE USING (has_farm_permission(farm_id, 'soil_test_records', 'delete'));

-- Petiole test records
DROP POLICY IF EXISTS "Users can view their farm petiole test records" ON petiole_test_records;
DROP POLICY IF EXISTS "Users can insert petiole test records for their farms" ON petiole_test_records;
DROP POLICY IF EXISTS "Users can update petiole test records for their farms" ON petiole_test_records;
DROP POLICY IF EXISTS "Users can delete petiole test records for their farms" ON petiole_test_records;

CREATE POLICY "Users can view petiole test records" ON petiole_test_records
  FOR SELECT USING (has_farm_permission(farm_id, 'petiole_test_records', 'read'));

CREATE POLICY "Users can create petiole test records" ON petiole_test_records
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'petiole_test_records', 'create'));

CREATE POLICY "Users can update petiole test records" ON petiole_test_records
  FOR UPDATE USING (has_farm_permission(farm_id, 'petiole_test_records', 'update'));

CREATE POLICY "Users can delete petiole test records" ON petiole_test_records
  FOR DELETE USING (has_farm_permission(farm_id, 'petiole_test_records', 'delete'));

-- Calculation history
DROP POLICY IF EXISTS "Users can view their farm calculation history" ON calculation_history;
DROP POLICY IF EXISTS "Users can insert calculation history for their farms" ON calculation_history;
DROP POLICY IF EXISTS "Users can update calculation history for their farms" ON calculation_history;
DROP POLICY IF EXISTS "Users can delete calculation history for their farms" ON calculation_history;

CREATE POLICY "Users can view calculation history" ON calculation_history
  FOR SELECT USING (has_farm_permission(farm_id, 'calculation_history', 'read'));

CREATE POLICY "Users can create calculation history" ON calculation_history
  FOR INSERT WITH CHECK (has_farm_permission(farm_id, 'calculation_history', 'create'));

CREATE POLICY "Users can update calculation history" ON calculation_history
  FOR UPDATE USING (has_farm_permission(farm_id, 'calculation_history', 'update'));

CREATE POLICY "Users can delete calculation history" ON calculation_history
  FOR DELETE USING (has_farm_permission(farm_id, 'calculation_history', 'delete'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for organization_members
CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to migrate individual user to organization
CREATE OR REPLACE FUNCTION migrate_user_to_organization(
  p_user_id UUID,
  p_org_name TEXT,
  p_org_type TEXT DEFAULT 'business'
) RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Authorization check: Only the user themselves can migrate their account
  -- This prevents arbitrary users from being migrated by others
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only migrate your own account'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- Create new organization
  INSERT INTO organizations (name, type, created_by, subscription_tier)
  VALUES (p_org_name, p_org_type, p_user_id, 'business')
  RETURNING id INTO new_org_id;

  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, p_user_id, 'owner', 'active');

  -- Migrate all user's farms to organization
  UPDATE farms
  SET organization_id = new_org_id
  WHERE user_id = p_user_id AND organization_id IS NULL;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in context of a farm
CREATE OR REPLACE FUNCTION get_user_farm_role(p_farm_id BIGINT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  farm_org_id UUID;
  user_role TEXT;
BEGIN
  -- Get farm's organization
  SELECT organization_id INTO farm_org_id
  FROM farms WHERE id = p_farm_id;

  -- No organization = direct owner
  IF farm_org_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM farms WHERE id = p_farm_id AND user_id = p_user_id) THEN
      RETURN 'owner';
    END IF;
    RETURN NULL;
  END IF;

  -- Get user's role in organization
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = farm_org_id
  AND user_id = p_user_id
  AND status = 'active';

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations for business and enterprise customers';
COMMENT ON TABLE organization_members IS 'User memberships in organizations with role-based access';
COMMENT ON TABLE organization_invitations IS 'Pending invitations for users to join organizations';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and accountability';
COMMENT ON TABLE role_permissions IS 'Custom role definitions for enterprise customers';

COMMENT ON FUNCTION can_access_farm IS 'Check if user can access a farm through direct ownership or organization membership';
COMMENT ON FUNCTION has_farm_permission IS 'Check if user has specific permission (create/read/update/delete) for a resource on a farm';
COMMENT ON FUNCTION is_org_admin IS 'Check if user is owner or admin of an organization';
COMMENT ON FUNCTION migrate_user_to_organization IS 'Utility to migrate individual user to organization structure';
