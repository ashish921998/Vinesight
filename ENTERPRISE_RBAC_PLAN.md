# VineSight Enterprise & Multi-User RBAC Plan

## 🎯 Executive Summary

This plan transforms VineSight from a single-user app into an **enterprise-ready platform** with:
- ✅ **Multi-tenant architecture** for business & enterprise customers
- ✅ **Role-based access control (RBAC)** with granular permissions
- ✅ **Team collaboration** with hierarchical access levels
- ✅ **Audit trails** for compliance and accountability
- ✅ **No new authentication required** - leverages existing Supabase Auth

---

## 📊 Target Customer Segments

### **Individual Farmers** (Current - No changes required)
- Single user per farm
- Full access to all features
- Current pricing tier

### **Business Customers** (NEW)
- Small to medium agricultural businesses (5-20 farms)
- Multiple users with role-based access
- Team collaboration features
- **Use Cases:**
  - Family farming businesses with multiple members
  - Agricultural cooperatives
  - Contract farming operations
  - Farm management consultancies

### **Enterprise Customers** (NEW)
- Large agricultural corporations (20+ farms)
- Complex organizational hierarchies
- Advanced compliance and audit requirements
- **Use Cases:**
  - Large vineyard estates
  - Export-focused agribusinesses
  - Agricultural investment funds
  - Government agricultural departments

---

## 🏗️ Architecture Overview

### Current vs Enterprise Model

**CURRENT MODEL:**
```
User (auth.users) → Farms → Records
     ↓ (direct ownership)
  user_id
```

**ENTERPRISE MODEL:**
```
User (auth.users) → Organization Membership → Organization → Farms → Records
     ↓                      ↓                      ↓
  user_id              role & permissions    org_id (tenant)
```

### Key Design Principles

1. **Backward Compatibility**: Individual farmers continue using current flow
2. **Multi-tenancy**: Organizations are completely isolated from each other
3. **Hierarchical Permissions**: Organization → Farm → Record level access
4. **Flexibility**: Custom roles and permissions per organization
5. **Security First**: Enhanced RLS policies with defense-in-depth

---

## 🔐 Role-Based Access Control (RBAC)

### Standard User Roles

#### **1. Organization Owner** (Super Admin)
- **Access Level**: Full control over organization
- **Permissions:**
  - ✅ Manage all farms and data
  - ✅ Add/remove users and assign roles
  - ✅ Configure organization settings
  - ✅ View all audit logs
  - ✅ Manage billing and subscriptions
  - ✅ Export all data
  - ✅ Delete organization

#### **2. Organization Admin** (Business Manager)
- **Access Level**: Administrative control (cannot delete org)
- **Permissions:**
  - ✅ Manage all farms and data
  - ✅ Add/remove users (except owners)
  - ✅ Assign roles (up to admin level)
  - ✅ View audit logs
  - ✅ Configure farm settings
  - ❌ Delete organization
  - ❌ Manage billing

#### **3. Farm Manager** (Operations Lead)
- **Access Level**: Full access to assigned farms
- **Permissions:**
  - ✅ Manage assigned farms (CRUD operations)
  - ✅ View and edit all farm records
  - ✅ Assign farm supervisors and workers
  - ✅ Create and assign tasks
  - ✅ Generate reports for assigned farms
  - ✅ Use AI features
  - ❌ Add/remove organization users
  - ❌ Access other farms

#### **4. Farm Supervisor** (Field Manager)
- **Access Level**: Operational control of assigned farms
- **Permissions:**
  - ✅ View assigned farm details
  - ✅ Add/edit farm records (irrigation, spray, harvest, etc.)
  - ✅ Create and complete tasks
  - ✅ Use calculators and AI assistant
  - ✅ Generate basic reports
  - ❌ Modify farm configuration
  - ❌ Delete records
  - ❌ Manage users

#### **5. Field Worker** (Operator)
- **Access Level**: Task execution and data entry
- **Permissions:**
  - ✅ View assigned farm details (read-only farm config)
  - ✅ Add new records (irrigation, spray, harvest logs)
  - ✅ Complete assigned tasks
  - ✅ Use basic calculators
  - ❌ Edit/delete existing records
  - ❌ Create tasks
  - ❌ Access AI features
  - ❌ Generate reports

#### **6. Consultant/Advisor** (External Expert)
- **Access Level**: Advisory with limited write access
- **Permissions:**
  - ✅ View all assigned farm data
  - ✅ Add recommendations and notes
  - ✅ Use advanced calculators and AI
  - ✅ Generate analytical reports
  - ✅ Add soil/petiole test results
  - ❌ Edit operational records
  - ❌ Manage tasks
  - ❌ Access financial data

#### **7. Accountant/Analyst** (Read-only + Finance)
- **Access Level**: Financial analysis and reporting
- **Permissions:**
  - ✅ View all farm data (read-only)
  - ✅ Full access to expense records
  - ✅ Generate financial reports
  - ✅ Export data for analysis
  - ✅ View profitability analytics
  - ❌ Add/edit operational records
  - ❌ Manage users
  - ❌ Use AI features

#### **8. Viewer** (Stakeholder/Investor)
- **Access Level**: Read-only access
- **Permissions:**
  - ✅ View farm dashboards
  - ✅ View summary reports
  - ✅ View yield and harvest data
  - ❌ Add/edit any data
  - ❌ Access detailed operational logs
  - ❌ Use AI features
  - ❌ Export data

---

## 📁 Database Schema - Enterprise Extensions

### 1. Organizations Table

```sql
-- Core multi-tenant structure
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'business', 'enterprise')),

  -- Subscription & Billing
  subscription_tier VARCHAR(50) DEFAULT 'business', -- business, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  max_users INTEGER DEFAULT 5,
  max_farms INTEGER DEFAULT 20,

  -- Organization Details
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Features & Settings
  features JSONB DEFAULT '{}', -- Feature flags for enterprise customers
  settings JSONB DEFAULT '{}', -- Custom org-level settings

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indices for performance
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
```

### 2. Organization Members Table

```sql
-- User membership in organizations
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role & Permissions
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'owner', 'admin', 'farm_manager', 'supervisor',
    'field_worker', 'consultant', 'accountant', 'viewer'
  )),
  custom_permissions JSONB DEFAULT '{}', -- Override/extend role permissions

  -- Farm-level assignments (NULL = access to all farms based on role)
  assigned_farm_ids BIGINT[], -- Array of farm IDs this user can access

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

-- Indices
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_status ON organization_members(status);
CREATE INDEX idx_org_members_assigned_farms ON organization_members USING GIN(assigned_farm_ids);
```

### 3. User Invitations Table

```sql
-- Manage user invitations to organizations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned_farm_ids BIGINT[],

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token VARCHAR(255) UNIQUE NOT NULL, -- Secure invitation token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Audit
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  message TEXT, -- Optional welcome message
  metadata JSONB DEFAULT '{}'
);

-- Indices
CREATE INDEX idx_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_status ON organization_invitations(status);
CREATE INDEX idx_invitations_expires_at ON organization_invitations(expires_at);
```

### 4. Audit Logs Table

```sql
-- Comprehensive audit trail for compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  farm_id BIGINT REFERENCES farms(id) ON DELETE SET NULL,

  -- User & Action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL, -- create, update, delete, export, etc.

  -- Resource Details
  resource_type VARCHAR(100) NOT NULL, -- farm, irrigation_record, user, etc.
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

-- Indices for efficient querying
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_farm_id ON audit_logs(farm_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Partition by month for performance (enterprise feature)
-- CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 5. Update Farms Table

```sql
-- Add organization_id to farms table
ALTER TABLE farms
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('private', 'org_wide')),
  ADD COLUMN farm_manager_ids UUID[], -- Array of user IDs who manage this farm
  ADD COLUMN metadata JSONB DEFAULT '{}';

-- Index for organization farms
CREATE INDEX idx_farms_organization_id ON farms(organization_id);
CREATE INDEX idx_farms_visibility ON farms(visibility);
CREATE INDEX idx_farms_managers ON farms USING GIN(farm_manager_ids);

-- Backwards compatibility: Allow NULL organization_id for individual users
-- Farms without organization_id continue to use legacy user_id ownership
```

### 6. Permissions Configuration Table

```sql
-- Define granular permissions for enterprise custom roles
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  role_name VARCHAR(100) NOT NULL, -- Custom role name
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

-- Index
CREATE INDEX idx_role_permissions_org_id ON role_permissions(organization_id);
CREATE INDEX idx_role_permissions_role_type ON role_permissions(role_type);
```

---

## 🔒 Enhanced Row Level Security (RLS) Policies

### Strategy: Multi-Layer Access Control

```sql
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
CREATE OR REPLACE FUNCTION can_access_farm(farm_id_param BIGINT, permission_type TEXT)
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
    IF user_membership.role IN ('owner', 'admin', 'farm_manager') THEN
      -- Check if farm_manager is restricted to specific farms
      IF user_membership.role = 'farm_manager'
         AND user_membership.assigned_farm_ids IS NOT NULL
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
  can_access BOOLEAN;
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
  IF NOT can_access_farm(farm_id_param, permission) THEN
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
-- RLS POLICIES - ORGANIZATIONS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only organization creators can initially create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

-- Only owners can update organization details
CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (
    is_org_admin(id)
  );

-- Only owners can delete organizations
CREATE POLICY "Owners can delete their organizations" ON organizations
  FOR DELETE USING (
    has_org_role(id, 'owner')
  );

-- ============================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their organizations
CREATE POLICY "Users can view org members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Admins can add new members
CREATE POLICY "Admins can add org members" ON organization_members
  FOR INSERT WITH CHECK (
    is_org_admin(organization_id)
  );

-- Admins can update members (except changing owner role)
CREATE POLICY "Admins can update org members" ON organization_members
  FOR UPDATE USING (
    is_org_admin(organization_id)
    AND (role != 'owner' OR user_id = auth.uid()) -- Cannot modify owner unless self
  );

-- Admins can remove members (except owners)
CREATE POLICY "Admins can remove org members" ON organization_members
  FOR DELETE USING (
    is_org_admin(organization_id)
    AND role != 'owner'
  );

-- ============================================
-- RLS POLICIES - FARMS (UPDATED)
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
    can_access_farm(id, 'read')
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
-- RLS POLICIES - FARM RECORDS (EXAMPLE: IRRIGATION)
-- ============================================

-- Drop existing irrigation policies
DROP POLICY IF EXISTS "Users can view their farm irrigation records" ON irrigation_records;
DROP POLICY IF EXISTS "Users can insert irrigation records for their farms" ON irrigation_records;
DROP POLICY IF EXISTS "Users can update irrigation records for their farms" ON irrigation_records;
DROP POLICY IF EXISTS "Users can delete irrigation records for their farms" ON irrigation_records;

-- New policies with granular permissions
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

-- REPEAT SIMILAR POLICIES FOR:
-- - spray_records
-- - fertigation_records
-- - harvest_records
-- - expense_records
-- - task_reminders
-- - soil_test_records
-- - petiole_test_records
-- - calculation_history

-- ============================================
-- RLS POLICIES - AUDIT LOGS
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Nobody can update/delete audit logs (immutable)
-- No UPDATE/DELETE policies = denied by default
```

---

## 🎨 Frontend Components & Hooks

### 1. Organization Context Provider

**File:** `/src/contexts/OrganizationContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  type: 'individual' | 'business' | 'enterprise'
  subscriptionTier: string
  features: Record<string, boolean>
}

interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: string
  assignedFarmIds: number[] | null
  status: string
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  userMembership: OrganizationMember | null
  userRole: string | null
  isOrgAdmin: boolean
  canManageUsers: boolean
  setCurrentOrganization: (org: Organization) => void
  refreshMembership: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [userMembership, setUserMembership] = useState<OrganizationMember | null>(null)
  const supabase = getSupabaseClient()

  const refreshMembership = async () => {
    if (!currentOrganization) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (data) {
      setUserMembership(data)
    }
  }

  useEffect(() => {
    refreshMembership()
  }, [currentOrganization])

  const value: OrganizationContextType = {
    currentOrganization,
    userMembership,
    userRole: userMembership?.role || null,
    isOrgAdmin: ['owner', 'admin'].includes(userMembership?.role || ''),
    canManageUsers: ['owner', 'admin', 'farm_manager'].includes(userMembership?.role || ''),
    setCurrentOrganization,
    refreshMembership
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
```

### 2. Permission Checking Hook

**File:** `/src/hooks/usePermissions.ts`

```typescript
import { useOrganization } from '@/contexts/OrganizationContext'
import { useMemo } from 'react'

type Permission = 'create' | 'read' | 'update' | 'delete'
type ResourceType =
  | 'farms'
  | 'irrigation_records'
  | 'spray_records'
  | 'fertigation_records'
  | 'harvest_records'
  | 'expense_records'
  | 'task_reminders'
  | 'soil_test_records'
  | 'petiole_test_records'
  | 'users'
  | 'reports'
  | 'ai_features'

// Permission matrix for each role
const ROLE_PERMISSIONS: Record<string, Record<ResourceType, Permission[]>> = {
  owner: {
    farms: ['create', 'read', 'update', 'delete'],
    irrigation_records: ['create', 'read', 'update', 'delete'],
    spray_records: ['create', 'read', 'update', 'delete'],
    fertigation_records: ['create', 'read', 'update', 'delete'],
    harvest_records: ['create', 'read', 'update', 'delete'],
    expense_records: ['create', 'read', 'update', 'delete'],
    task_reminders: ['create', 'read', 'update', 'delete'],
    soil_test_records: ['create', 'read', 'update', 'delete'],
    petiole_test_records: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'update', 'delete'],
    ai_features: ['create', 'read', 'update', 'delete']
  },
  admin: {
    farms: ['create', 'read', 'update', 'delete'],
    irrigation_records: ['create', 'read', 'update', 'delete'],
    spray_records: ['create', 'read', 'update', 'delete'],
    fertigation_records: ['create', 'read', 'update', 'delete'],
    harvest_records: ['create', 'read', 'update', 'delete'],
    expense_records: ['create', 'read', 'update', 'delete'],
    task_reminders: ['create', 'read', 'update', 'delete'],
    soil_test_records: ['create', 'read', 'update', 'delete'],
    petiole_test_records: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'update', 'delete'],
    ai_features: ['create', 'read', 'update', 'delete']
  },
  farm_manager: {
    farms: ['read', 'update'],
    irrigation_records: ['create', 'read', 'update', 'delete'],
    spray_records: ['create', 'read', 'update', 'delete'],
    fertigation_records: ['create', 'read', 'update', 'delete'],
    harvest_records: ['create', 'read', 'update', 'delete'],
    expense_records: ['create', 'read', 'update', 'delete'],
    task_reminders: ['create', 'read', 'update', 'delete'],
    soil_test_records: ['create', 'read', 'update', 'delete'],
    petiole_test_records: ['create', 'read', 'update', 'delete'],
    users: ['read'],
    reports: ['create', 'read'],
    ai_features: ['create', 'read']
  },
  supervisor: {
    farms: ['read'],
    irrigation_records: ['create', 'read', 'update'],
    spray_records: ['create', 'read', 'update'],
    fertigation_records: ['create', 'read', 'update'],
    harvest_records: ['create', 'read', 'update'],
    expense_records: ['create', 'read', 'update'],
    task_reminders: ['create', 'read', 'update'],
    soil_test_records: ['create', 'read', 'update'],
    petiole_test_records: ['create', 'read', 'update'],
    users: ['read'],
    reports: ['read'],
    ai_features: ['read']
  },
  field_worker: {
    farms: ['read'],
    irrigation_records: ['create', 'read'],
    spray_records: ['create', 'read'],
    fertigation_records: ['create', 'read'],
    harvest_records: ['create', 'read'],
    expense_records: ['read'],
    task_reminders: ['read', 'update'],
    soil_test_records: ['read'],
    petiole_test_records: ['read'],
    users: ['read'],
    reports: ['read'],
    ai_features: []
  },
  consultant: {
    farms: ['read'],
    irrigation_records: ['read'],
    spray_records: ['read'],
    fertigation_records: ['read'],
    harvest_records: ['read'],
    expense_records: [],
    task_reminders: ['read'],
    soil_test_records: ['create', 'read', 'update'],
    petiole_test_records: ['create', 'read', 'update'],
    users: ['read'],
    reports: ['create', 'read'],
    ai_features: ['create', 'read']
  },
  accountant: {
    farms: ['read'],
    irrigation_records: ['read'],
    spray_records: ['read'],
    fertigation_records: ['read'],
    harvest_records: ['read'],
    expense_records: ['create', 'read', 'update', 'delete'],
    task_reminders: ['read'],
    soil_test_records: ['read'],
    petiole_test_records: ['read'],
    users: ['read'],
    reports: ['create', 'read'],
    ai_features: []
  },
  viewer: {
    farms: ['read'],
    irrigation_records: ['read'],
    spray_records: ['read'],
    fertigation_records: ['read'],
    harvest_records: ['read'],
    expense_records: ['read'],
    task_reminders: ['read'],
    soil_test_records: ['read'],
    petiole_test_records: ['read'],
    users: ['read'],
    reports: ['read'],
    ai_features: []
  }
}

export function usePermissions() {
  const { userRole, userMembership, currentOrganization } = useOrganization()

  const hasPermission = useMemo(() => {
    return (resource: ResourceType, permission: Permission, farmId?: number): boolean => {
      // No organization = individual user = full access (backwards compatibility)
      if (!currentOrganization) {
        return true
      }

      if (!userRole || !userMembership) {
        return false
      }

      // Check if user has access to specific farm (if provided)
      if (farmId && userMembership.assignedFarmIds) {
        if (userMembership.assignedFarmIds.length > 0) {
          if (!userMembership.assignedFarmIds.includes(farmId)) {
            return false
          }
        }
      }

      // Check role permissions
      const rolePermissions = ROLE_PERMISSIONS[userRole]
      if (!rolePermissions) {
        return false
      }

      const resourcePermissions = rolePermissions[resource]
      return resourcePermissions?.includes(permission) || false
    }
  }, [userRole, userMembership, currentOrganization])

  return { hasPermission, userRole, isOrgUser: !!currentOrganization }
}
```

### 3. Permission Guard Components

**File:** `/src/components/rbac/PermissionGuard.tsx`

```typescript
import { usePermissions } from '@/hooks/usePermissions'
import { ReactNode } from 'react'

interface PermissionGuardProps {
  resource: string
  permission: 'create' | 'read' | 'update' | 'delete'
  farmId?: number
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  resource,
  permission,
  farmId,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(resource as any, permission, farmId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Convenience components
export function CanCreate({ resource, children, fallback }: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard resource={resource} permission="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function CanUpdate({ resource, farmId, children, fallback }: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard resource={resource} permission="update" farmId={farmId} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function CanDelete({ resource, farmId, children, fallback }: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard resource={resource} permission="delete" farmId={farmId} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}
```

### 4. Organization Selector Component

**File:** `/src/components/organization/OrganizationSelector.tsx`

```typescript
'use client'

import { useOrganization } from '@/contexts/OrganizationContext'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export function OrganizationSelector() {
  const { currentOrganization, setCurrentOrganization } = useOrganization()
  const [organizations, setOrganizations] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all organizations user is member of
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (memberships) {
      const orgs = memberships.map(m => (m as any).organizations)
      setOrganizations(orgs)

      // Auto-select first org if none selected
      if (!currentOrganization && orgs.length > 0) {
        setCurrentOrganization(orgs[0])
      }
    }
  }

  if (organizations.length === 0) {
    return null // Individual user, no org selector needed
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Organization:</label>
      <select
        value={currentOrganization?.id || ''}
        onChange={(e) => {
          const org = organizations.find(o => o.id === e.target.value)
          if (org) setCurrentOrganization(org)
        }}
        className="border rounded px-3 py-1"
      >
        {organizations.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation** (Weeks 1-2)

- [ ] Database schema implementation
  - [ ] Create organizations, organization_members, audit_logs tables
  - [ ] Add organization_id to farms table
  - [ ] Create helper functions for RLS
- [ ] Migration scripts
  - [ ] Backwards compatibility for existing users
  - [ ] Data migration utilities
- [ ] Basic RLS policies
  - [ ] Organizations and members policies
  - [ ] Updated farms policies

### **Phase 2: Core RBAC** (Weeks 3-4)

- [ ] Enhanced RLS policies for all tables
  - [ ] has_farm_permission function implementation
  - [ ] Role-based access for all record types
- [ ] Frontend contexts and hooks
  - [ ] OrganizationContext provider
  - [ ] usePermissions hook
  - [ ] Permission guard components
- [ ] Basic organization management UI
  - [ ] Organization creation flow
  - [ ] Organization selector component

### **Phase 3: User Management** (Weeks 5-6)

- [ ] User invitation system
  - [ ] organization_invitations table
  - [ ] Email invitation service
  - [ ] Invitation acceptance flow
- [ ] Team management UI
  - [ ] User list with roles
  - [ ] Role assignment interface
  - [ ] Farm assignment interface
- [ ] Audit logging system
  - [ ] Audit log service
  - [ ] Trigger functions for auto-logging
  - [ ] Audit log viewer UI (admin only)

### **Phase 4: Advanced Features** (Weeks 7-8)

- [ ] Role permissions customization
  - [ ] role_permissions table implementation
  - [ ] Custom role creation UI (enterprise only)
  - [ ] Permission matrix editor
- [ ] Organization settings
  - [ ] Organization profile management
  - [ ] Feature flags and limits
  - [ ] Billing integration (basic)
- [ ] Enhanced audit trails
  - [ ] Activity timeline
  - [ ] Export audit logs
  - [ ] Compliance reports

### **Phase 5: Enterprise Features** (Weeks 9-10)

- [ ] SSO integration preparation
  - [ ] SAML configuration
  - [ ] OAuth provider setup
- [ ] Advanced reporting
  - [ ] Cross-farm analytics (org-wide)
  - [ ] Team performance metrics
  - [ ] Compliance dashboards
- [ ] API access controls
  - [ ] Rate limiting per organization
  - [ ] API key management
  - [ ] Webhook integrations

### **Phase 6: Testing & Migration** (Weeks 11-12)

- [ ] Comprehensive testing
  - [ ] RLS policy testing
  - [ ] Permission matrix validation
  - [ ] User flow testing (all roles)
  - [ ] Performance testing with large orgs
- [ ] Migration tools
  - [ ] Bulk user import
  - [ ] Farm transfer utilities
  - [ ] Data export/import
- [ ] Documentation
  - [ ] Admin documentation
  - [ ] End-user guides per role
  - [ ] API documentation

---

## 💡 Enterprise Feature Add-ons

### 1. SSO Integration (Optional)

**For very large enterprises:**
- SAML 2.0 integration
- OAuth providers (Google Workspace, Microsoft Azure AD)
- Implementation using Supabase Auth with custom OAuth flows

### 2. Advanced Analytics Dashboard

**Organization-level insights:**
- Cross-farm performance comparison
- Team productivity metrics
- Resource utilization analytics
- Predictive yield forecasting

### 3. Compliance & Certifications

**For export-focused businesses:**
- GAP (Good Agricultural Practices) tracking
- Organic certification management
- Traceability reports
- Export documentation

### 4. API Access

**For enterprise integrations:**
- REST API with organization-scoped authentication
- Webhooks for real-time data sync
- Integration with ERP systems (SAP, Oracle)
- Third-party agtech tool integrations

---

## 🎯 Pricing Model Suggestions

### **Individual Tier** (Current - Free/Basic)
- Single user
- Unlimited farms
- All core features
- Basic AI features

### **Business Tier** (NEW - ₹2999/month or $39/month)
- Up to 10 users
- Up to 50 farms
- Role-based access control (7 standard roles)
- Team collaboration
- Basic audit logs
- Priority support
- Advanced AI features

### **Enterprise Tier** (NEW - ₹9999/month or $129/month)
- Unlimited users
- Unlimited farms
- Custom role creation
- Advanced audit trails (with export)
- SSO integration
- Dedicated account manager
- White-label options
- API access
- 99.9% SLA

### **Add-ons**
- Extra users (Business): ₹300/user/month
- Advanced analytics module: ₹1500/month
- Compliance module: ₹2000/month
- Custom integrations: Quoted separately

---

## 🔐 Security Considerations

### 1. Data Isolation
- **Multi-tenancy**: Complete organization isolation via RLS
- **Namespace separation**: Organization ID in all queries
- **No cross-org data leakage**: Validated through RLS functions

### 2. Authentication
- **No specialized auth needed**: Supabase Auth is enterprise-ready
- **Session management**: Handled by Supabase
- **Token-based invitations**: Secure UUID tokens with expiration
- **SSO optional**: For enterprises requiring it

### 3. Authorization
- **RLS first**: All policies enforced at database level
- **Defense in depth**: Backend + frontend permission checks
- **Immutable audit logs**: Cannot be modified/deleted
- **Principle of least privilege**: Users get minimum required access

### 4. Compliance
- **GDPR ready**: Right to deletion, data export
- **Audit trails**: Complete activity logging
- **Data encryption**: At rest and in transit (Supabase default)
- **Backup retention**: Configurable per organization

---

## 📊 Migration Strategy for Existing Users

### Seamless Transition Plan

**For current individual users:**
1. **No action required**: Continue using app as-is
2. **Optional organization creation**: Can create organization anytime
3. **Farm migration**: One-click "Convert to Organization" button
4. **Data preservation**: All existing data remains intact

**Migration script:**
```sql
-- Function to migrate individual user to organization
CREATE OR REPLACE FUNCTION migrate_user_to_organization(
  p_user_id UUID,
  p_org_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create new organization
  INSERT INTO organizations (name, type, created_by, subscription_tier)
  VALUES (p_org_name, 'individual', p_user_id, 'business')
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
```

---

## 🎬 Getting Started (Post-Implementation)

### For Individual Users → Business
1. Go to Settings > Organization
2. Click "Create Organization"
3. Enter organization details
4. Invite team members
5. Assign roles and farms
6. Start collaborating!

### For New Business/Enterprise Customers
1. Sign up with business email
2. Create organization during onboarding
3. Invite team members (bulk CSV import supported)
4. Assign roles and permissions
5. Configure farms and access
6. Train team on their specific interfaces

---

## 📝 Summary

This comprehensive plan provides:

✅ **Multi-tenant architecture** ready for thousands of organizations
✅ **8 standard user roles** covering all farm operation scenarios
✅ **Granular permissions** at farm and record level
✅ **Complete audit trails** for compliance
✅ **Backwards compatible** with existing individual users
✅ **Scalable RLS** leveraging Supabase's built-in security
✅ **No specialized auth** required - uses existing Supabase Auth
✅ **Enterprise-ready** with SSO and advanced features
✅ **Clear pricing model** for monetization

**Estimated Implementation Time**: 10-12 weeks with 2-3 developers

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Create detailed UI/UX mockups for org management
5. Plan beta testing with pilot business customers

---

*This plan positions VineSight as the most sophisticated multi-user grape farming platform in India, ready to serve everyone from individual farmers to large agricultural corporations.*
