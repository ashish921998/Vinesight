-- Add 'fuel' as a valid expense type
-- This migration updates the expense_records table to include 'fuel' as a valid expense category

-- Drop the existing CHECK constraint
ALTER TABLE expense_records
DROP CONSTRAINT IF EXISTS expense_records_type_check;

-- Add the new CHECK constraint with 'fuel' included
ALTER TABLE expense_records
ADD CONSTRAINT expense_records_type_check
CHECK (type IN ('labor', 'materials', 'equipment', 'fuel', 'other'));
