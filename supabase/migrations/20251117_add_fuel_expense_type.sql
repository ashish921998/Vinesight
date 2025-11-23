-- Add 'fuel' as a valid expense type and labor-specific fields
-- This migration updates the expense_records table to:
-- 1. Include 'fuel' as a valid expense category
-- 2. Add labor-specific fields for detailed labor expense tracking

-- Drop the existing CHECK constraint
ALTER TABLE expense_records
DROP CONSTRAINT IF EXISTS expense_records_type_check;

-- Add the new CHECK constraint with 'fuel' included
ALTER TABLE expense_records
ADD CONSTRAINT expense_records_type_check
CHECK (type IN ('labor', 'materials', 'equipment', 'fuel', 'other'));

-- Add labor-specific columns (nullable, only used when type = 'labor')
ALTER TABLE expense_records
ADD COLUMN IF NOT EXISTS num_workers INTEGER,
ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS work_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS rate_per_unit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS worker_names TEXT;

-- Add comments for documentation
COMMENT ON COLUMN expense_records.num_workers IS 'Number of laborers (only for labor type expenses)';
COMMENT ON COLUMN expense_records.hours_worked IS 'Total hours worked (only for labor type expenses)';
COMMENT ON COLUMN expense_records.work_type IS 'Type of work: pruning, harvesting, spraying, weeding, planting, maintenance, other';
COMMENT ON COLUMN expense_records.rate_per_unit IS 'Hourly or daily wage rate (only for labor type expenses)';
COMMENT ON COLUMN expense_records.worker_names IS 'Comma-separated list of worker names (only for labor type expenses)';
