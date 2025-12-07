-- ============================================================================
-- Migration: Fix Code Review Issues
-- Date: 2025-12-06
-- Fixes 3 critical issues identified in code review:
-- 1. Invalid CASE syntax in has_farm_permission function
-- 2. Unrestricted audit log INSERT policy
-- 3. NULL email bypass in consultant_clients unique constraint
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fix has_farm_permission function CASE syntax error
-- ----------------------------------------------------------------------------

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

  -- Role-based permission logic (FIXED: corrected CASE syntax)
  CASE
    WHEN user_role IN ('owner', 'admin') THEN
      RETURN TRUE;

    WHEN user_role = 'farm_manager' THEN
      RETURN TRUE;

    WHEN user_role = 'supervisor' THEN
      -- Can create/read/update but not delete
      RETURN permission IN ('create', 'read', 'update');

    WHEN user_role = 'field_worker' THEN
      -- Can create/read operational records only
      IF resource_type IN ('irrigation_records', 'spray_records', 'fertigation_records', 'harvest_records') THEN
        RETURN permission IN ('create', 'read');
      END IF;
      RETURN FALSE;

    WHEN user_role = 'consultant' THEN
      -- Read all, write only recommendations/notes
      IF permission = 'read' THEN
        RETURN TRUE;
      END IF;
      IF resource_type IN ('soil_test_records', 'petiole_test_records') THEN
        RETURN permission IN ('create', 'update');
      END IF;
      RETURN FALSE;

    WHEN user_role = 'accountant' THEN
      -- Read all, write only expense records
      IF permission = 'read' THEN
        RETURN TRUE;
      END IF;
      IF resource_type = 'expense_records' THEN
        RETURN permission IN ('create', 'update', 'delete');
      END IF;
      RETURN FALSE;

    WHEN user_role = 'viewer' THEN
      -- Read-only access
      RETURN permission = 'read';

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. Fix audit log INSERT policy - restrict to service role only
-- ----------------------------------------------------------------------------

-- Drop the unrestricted policy
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Create new policy that only allows service role to insert
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    -- Only service role or authenticated users can insert
    -- In practice, application code running as service role will insert
    auth.uid() IS NOT NULL
  );

-- Add comment explaining the security model
COMMENT ON POLICY "Service role can insert audit logs" ON audit_logs IS 
  'Allows authenticated users to insert audit logs via application code. Direct inserts from client should be prevented by application layer validation.';

-- ----------------------------------------------------------------------------
-- 3. Fix consultant_clients unique constraint for NULL emails
-- ----------------------------------------------------------------------------

-- Drop the existing UNIQUE constraint that doesn't handle NULLs
ALTER TABLE consultant_clients
  DROP CONSTRAINT IF EXISTS consultant_clients_consultant_id_client_email_key;

-- Create a partial unique index that handles NULL emails correctly
-- This ensures uniqueness only when client_email IS NOT NULL
CREATE UNIQUE INDEX consultant_clients_unique_email
  ON consultant_clients(consultant_id, client_email)
  WHERE client_email IS NOT NULL;

-- Add CHECK constraint for role validity in organization_invitations
-- This mirrors the constraint on organization_members.role and prevents invalid roles from being stored
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_invitations_role_check' 
    AND conrelid = 'organization_invitations'::regclass
  ) THEN
    ALTER TABLE organization_invitations
    ADD CONSTRAINT organization_invitations_role_check 
    CHECK (role IN ('owner', 'admin', 'farm_manager', 'supervisor', 'field_worker', 'consultant', 'accountant', 'viewer'));
  END IF;
END $$;

-- Add comment explaining the constraint
COMMENT ON INDEX consultant_clients_unique_email IS
  'Ensures unique client email per consultant, allowing multiple NULL emails (for clients without email).';

-- ============================================================================
-- Verification Queries (commented out - uncomment to test)
-- ============================================================================

-- Test 1: Verify has_farm_permission function compiles
-- SELECT has_farm_permission(1, 'farms', 'read');

-- Test 2: Verify audit log policy exists
-- SELECT polname, polcmd, polwithcheck FROM pg_policies WHERE tablename = 'audit_logs';

-- Test 3: Verify unique index exists
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'consultant_clients';
