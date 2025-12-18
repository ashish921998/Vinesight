-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update the updated_at column
-- Defined early so all triggers can reference it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================

-- Profiles table - stores additional user information
-- This table is typically auto-populated via a trigger on auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  phone VARCHAR(50),
  user_type VARCHAR(50) CHECK (user_type IN ('farmer', 'consultant', 'admin')),
  consultant_organization_id UUID, -- Will reference organizations table (added after organizations table is created)
  area_unit_preference VARCHAR(10) DEFAULT 'hectares' CHECK (area_unit_preference IN ('hectares', 'acres')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_consultant_organization_id ON profiles(consultant_organization_id);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Basic policies - org-based access is added after organization_members table is created
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger to auto-update profiles updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END PROFILES TABLE
-- ============================================================================

-- Create farms table
CREATE TABLE farms (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  area DECIMAL(10,2) NOT NULL,
  crop VARCHAR(255) NOT NULL,
  crop_variety VARCHAR(255) NOT NULL,
  planting_date DATE NOT NULL,
  vine_spacing DECIMAL(5,2), -- in meters
  row_spacing DECIMAL(5,2), -- in meters
  total_tank_capacity DECIMAL(12,2),
  system_discharge DECIMAL(10,4),
  remaining_water DECIMAL(12,2),
  water_calculation_updated_at TIMESTAMP WITH TIME ZONE,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  elevation DECIMAL(8,2),
  timezone VARCHAR(50),
  location_name VARCHAR(255),
  location_source VARCHAR(50),
  location_updated_at TIMESTAMP WITH TIME ZONE,
  bulk_density DECIMAL(6,4),
  cation_exchange_capacity DECIMAL(7,3),
  soil_water_retention DECIMAL(7,2),
  soil_texture_class VARCHAR(100),
  sand_percentage DECIMAL(7,2),
  silt_percentage DECIMAL(7,2),
  clay_percentage DECIMAL(7,2),
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create irrigation_records table
CREATE TABLE irrigation_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration DECIMAL(5,2) NOT NULL, -- in hours
  area DECIMAL(10,2) NOT NULL, -- area irrigated in hectares
  growth_stage VARCHAR(100) NOT NULL,
  moisture_status VARCHAR(50) NOT NULL,
  system_discharge DECIMAL(8,2) NOT NULL, -- in liters per hour
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spray_records table
CREATE TABLE spray_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  chemical VARCHAR(255) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  area DECIMAL(10,2) NOT NULL, -- in hectares
  weather VARCHAR(255) NOT NULL,
  operator VARCHAR(255) NOT NULL,
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create fertigation_records table
CREATE TABLE fertigation_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fertilizers JSONB, -- Array of fertilizer objects: [{name: string, unit: "kg/acre"|"liter/acre", quantity: number}]
  area DECIMAL(10,2) NOT NULL, -- in hectares
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_fertilizers_array CHECK (
    fertilizers IS NULL OR
    jsonb_typeof(fertilizers) = 'array'
  )
);

-- Add comment to document the fertilizers column structure
COMMENT ON COLUMN fertigation_records.fertilizers IS 'Array of fertilizer objects with structure: [{name: string, unit: "kg/acre"|"liter/acre", quantity: number}]';

-- Create harvest_records table
CREATE TABLE harvest_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity DECIMAL(12,2) NOT NULL, -- in kg
  grade VARCHAR(100) NOT NULL,
  price DECIMAL(10,2), -- per kg
  buyer VARCHAR(255),
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expense_records table
CREATE TABLE expense_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('labor', 'materials', 'equipment', 'fuel', 'other')) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  remarks TEXT,
  -- Labor-specific fields (nullable, only used when type = 'labor')
  num_workers INTEGER, -- Number of laborers
  hours_worked DECIMAL(6,2), -- Total hours worked
  work_type VARCHAR(50), -- Type of work (pruning, harvesting, spraying, weeding, etc.)
  rate_per_unit DECIMAL(10,2), -- Hourly or daily wage rate
  worker_names TEXT, -- Comma-separated worker names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create calculation_history table
CREATE TABLE calculation_history (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  calculation_type VARCHAR(20) CHECK (calculation_type IN ('etc', 'nutrients', 'lai', 'discharge')) NOT NULL,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task_reminders table
-- Enhanced task_reminders table for tracking farm tasks
-- Supports all data log types: irrigation, spray, fertigation, harvest, soil_test, petiole_test, note
CREATE TABLE task_reminders (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('irrigation', 'spray', 'fertigation', 'harvest', 'soil_test', 'petiole_test', 'expense', 'note')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending' NOT NULL,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes >= 0),
  location TEXT,
  linked_record_type VARCHAR(50),
  linked_record_id BIGINT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Ensure consistency between completed boolean and status field
  CONSTRAINT task_status_consistency CHECK (
    (completed = TRUE AND status = 'completed') OR
    (completed = FALSE AND status IN ('pending', 'in_progress', 'cancelled'))
  )
);

-- Create indexes for task_reminders
CREATE INDEX idx_task_reminders_farm_id ON task_reminders(farm_id);
CREATE INDEX idx_task_reminders_status ON task_reminders(status);
CREATE INDEX idx_task_reminders_farm_status_due ON task_reminders(farm_id, status, due_date);
CREATE INDEX idx_task_reminders_assignee_status ON task_reminders(assigned_to_user_id, status);
CREATE INDEX idx_task_reminders_farm_type ON task_reminders(farm_id, type);
CREATE INDEX idx_task_reminders_linked_record ON task_reminders(linked_record_type, linked_record_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_reminders_updated_at_trigger
  BEFORE UPDATE ON task_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_task_reminders_updated_at();

-- Function to validate linked_record references
CREATE OR REPLACE FUNCTION validate_task_linked_record()
RETURNS TRIGGER AS $$
BEGIN
  -- If linked_record_type is set, linked_record_id must also be set
  IF NEW.linked_record_type IS NOT NULL AND NEW.linked_record_id IS NULL THEN
    RAISE EXCEPTION 'linked_record_id must be set when linked_record_type is specified';
  END IF;

  -- If linked_record_id is set, linked_record_type must also be set
  IF NEW.linked_record_id IS NOT NULL AND NEW.linked_record_type IS NULL THEN
    RAISE EXCEPTION 'linked_record_type must be set when linked_record_id is specified';
  END IF;

  -- Validate that the linked record exists and belongs to the same farm
  IF NEW.linked_record_type IS NOT NULL AND NEW.linked_record_id IS NOT NULL THEN
    CASE NEW.linked_record_type
      WHEN 'irrigation' THEN
        IF NOT EXISTS (SELECT 1 FROM irrigation_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced irrigation record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'spray' THEN
        IF NOT EXISTS (SELECT 1 FROM spray_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced spray record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'fertigation' THEN
        IF NOT EXISTS (SELECT 1 FROM fertigation_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced fertigation record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'harvest' THEN
        IF NOT EXISTS (SELECT 1 FROM harvest_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced harvest record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'expense' THEN
        IF NOT EXISTS (SELECT 1 FROM expense_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced expense record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'soil_test' THEN
        IF NOT EXISTS (SELECT 1 FROM soil_test_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced soil test record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'petiole_test' THEN
        IF NOT EXISTS (SELECT 1 FROM petiole_test_records WHERE id = NEW.linked_record_id AND farm_id = NEW.farm_id) THEN
          RAISE EXCEPTION 'Referenced petiole test record % does not exist in this farm', NEW.linked_record_id;
        END IF;
      WHEN 'note' THEN
        -- Note type tasks don't link to specific records, skip validation
        RAISE NOTICE 'Note type tasks do not support linked records';
      ELSE
        -- For other types, just log a warning but allow it
        RAISE NOTICE 'Unknown linked_record_type: %', NEW.linked_record_type;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_linked_record_trigger
  BEFORE INSERT OR UPDATE ON task_reminders
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_linked_record();

-- Enable Row Level Security
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

-- Create soil_test_records table
CREATE TABLE soil_test_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  parameters JSONB NOT NULL, -- pH, N, P, K, etc.
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  recommendations TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create petiole_test_records table
CREATE TABLE petiole_test_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  parameters JSONB NOT NULL, -- N, P, K, Ca, Mg, etc.
  date_of_pruning DATE, -- Date when pruning was done (used as reference for log calculations)
  recommendations TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Soil profile tables
CREATE TABLE soil_profiles (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  fusarium_pct REAL,
  sections JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_date_of_pruning ON farms(date_of_pruning);
CREATE INDEX idx_irrigation_records_farm_id ON irrigation_records(farm_id);
CREATE INDEX idx_irrigation_records_date ON irrigation_records(date);
CREATE INDEX idx_irrigation_records_date_of_pruning ON irrigation_records(date_of_pruning);
CREATE INDEX idx_spray_records_farm_id ON spray_records(farm_id);
CREATE INDEX idx_spray_records_date ON spray_records(date);
CREATE INDEX idx_spray_records_date_of_pruning ON spray_records(date_of_pruning);
CREATE INDEX idx_fertigation_records_farm_id ON fertigation_records(farm_id);
CREATE INDEX idx_fertigation_records_date ON fertigation_records(date);
CREATE INDEX idx_fertigation_records_date_of_pruning ON fertigation_records(date_of_pruning);
CREATE INDEX idx_fertigation_records_fertilizers ON fertigation_records USING GIN (fertilizers);
CREATE INDEX idx_harvest_records_farm_id ON harvest_records(farm_id);
CREATE INDEX idx_harvest_records_date ON harvest_records(date);
CREATE INDEX idx_harvest_records_date_of_pruning ON harvest_records(date_of_pruning);
CREATE INDEX idx_expense_records_farm_id ON expense_records(farm_id);
CREATE INDEX idx_expense_records_date ON expense_records(date);
CREATE INDEX idx_expense_records_date_of_pruning ON expense_records(date_of_pruning);
CREATE INDEX idx_calculation_history_farm_id ON calculation_history(farm_id);
CREATE INDEX idx_calculation_history_date ON calculation_history(date);
CREATE INDEX idx_soil_test_records_farm_id ON soil_test_records(farm_id);
CREATE INDEX idx_soil_test_records_date ON soil_test_records(date);
CREATE INDEX idx_soil_test_records_date_of_pruning ON soil_test_records(date_of_pruning);
CREATE INDEX idx_petiole_test_records_farm_id ON petiole_test_records(farm_id);
CREATE INDEX idx_petiole_test_records_date ON petiole_test_records(date);
CREATE INDEX idx_petiole_test_records_date_of_pruning ON petiole_test_records(date_of_pruning);
CREATE INDEX idx_soil_profiles_farm_id ON soil_profiles(farm_id);

-- Enable Row Level Security (RLS)
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE petiole_test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for farms table
CREATE POLICY "Users can view their own farms" ON farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own farms" ON farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own farms" ON farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own farms" ON farms FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for irrigation_records table
CREATE POLICY "Users can view their farm irrigation records" ON irrigation_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = irrigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert irrigation records for their farms" ON irrigation_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = irrigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update irrigation records for their farms" ON irrigation_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = irrigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete irrigation records for their farms" ON irrigation_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = irrigation_records.farm_id AND farms.user_id = auth.uid())
);

-- Apply similar RLS policies for all other tables
-- Spray records
CREATE POLICY "Users can view their farm spray records" ON spray_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = spray_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert spray records for their farms" ON spray_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = spray_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update spray records for their farms" ON spray_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = spray_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete spray records for their farms" ON spray_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = spray_records.farm_id AND farms.user_id = auth.uid())
);

-- Fertigation records
CREATE POLICY "Users can view their farm fertigation records" ON fertigation_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert fertigation records for their farms" ON fertigation_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update fertigation records for their farms" ON fertigation_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertigation_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete fertigation records for their farms" ON fertigation_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertigation_records.farm_id AND farms.user_id = auth.uid())
);

-- Harvest records
CREATE POLICY "Users can view their farm harvest records" ON harvest_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert harvest records for their farms" ON harvest_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update harvest records for their farms" ON harvest_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete harvest records for their farms" ON harvest_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = harvest_records.farm_id AND farms.user_id = auth.uid())
);

-- Expense records
CREATE POLICY "Users can view their farm expense records" ON expense_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expense_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert expense records for their farms" ON expense_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expense_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update expense records for their farms" ON expense_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expense_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete expense records for their farms" ON expense_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expense_records.farm_id AND farms.user_id = auth.uid())
);

-- Calculation history
CREATE POLICY "Users can view their farm calculation history" ON calculation_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = calculation_history.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert calculation history for their farms" ON calculation_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = calculation_history.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update calculation history for their farms" ON calculation_history FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = calculation_history.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete calculation history for their farms" ON calculation_history FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = calculation_history.farm_id AND farms.user_id = auth.uid())
);

-- Task reminders RLS policies
-- Farm owners and assignees can view tasks
CREATE POLICY "Users can view farm tasks" ON task_reminders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM farms
    WHERE farms.id = task_reminders.farm_id
    AND farms.user_id = auth.uid()
  )
  OR assigned_to_user_id = auth.uid()
);

-- Farm owners can insert tasks
CREATE POLICY "Users can insert farm tasks" ON task_reminders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM farms
    WHERE farms.id = task_reminders.farm_id
    AND farms.user_id = auth.uid()
  )
);

-- Farm owners can update their tasks
CREATE POLICY "Users can update farm tasks" ON task_reminders FOR UPDATE USING (
  -- Allow farm owners OR assigned users to update tasks
  EXISTS (
    SELECT 1 FROM farms
    WHERE farms.id = task_reminders.farm_id
    AND farms.user_id = auth.uid()
  ) OR task_reminders.assigned_to_user_id = auth.uid()
) WITH CHECK (
  -- Allow farm owners OR assigned users to update tasks
  EXISTS (
    SELECT 1 FROM farms
    WHERE farms.id = task_reminders.farm_id
    AND farms.user_id = auth.uid()
  ) OR task_reminders.assigned_to_user_id = auth.uid()
);

-- Farm owners can delete their tasks
CREATE POLICY "Users can delete farm tasks" ON task_reminders FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM farms
    WHERE farms.id = task_reminders.farm_id
    AND farms.user_id = auth.uid()
  )
);

-- Soil test records
CREATE POLICY "Users can view their farm soil test records" ON soil_test_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert soil test records for their farms" ON soil_test_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update soil test records for their farms" ON soil_test_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete soil test records for their farms" ON soil_test_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_test_records.farm_id AND farms.user_id = auth.uid())
);

-- Petiole test records
CREATE POLICY "Users can view their farm petiole test records" ON petiole_test_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = petiole_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert petiole test records for their farms" ON petiole_test_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = petiole_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update petiole test records for their farms" ON petiole_test_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = petiole_test_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete petiole test records for their farms" ON petiole_test_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = petiole_test_records.farm_id AND farms.user_id = auth.uid())
);

-- Soil profiles
CREATE POLICY "Users can view their soil profiles" ON soil_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_profiles.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert soil profiles" ON soil_profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_profiles.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update their soil profiles" ON soil_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_profiles.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete their soil profiles" ON soil_profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = soil_profiles.farm_id AND farms.user_id = auth.uid())
);


-- Trigger to automatically update updated_at for farms
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORKER / LABOR MANAGEMENT TABLES
-- ============================================================================

-- Work types table (custom and system default work types)
CREATE TABLE work_types (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system defaults
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default work types
INSERT INTO work_types (user_id, name, is_default) VALUES
  (NULL, 'Pruning', TRUE),
  (NULL, 'Harvesting', TRUE),
  (NULL, 'Spraying', TRUE),
  (NULL, 'Weeding', TRUE),
  (NULL, 'Fertigation', TRUE),
  (NULL, 'General', TRUE);

-- Workers table
CREATE TABLE workers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  advance_balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Worker attendance table
CREATE TABLE worker_attendance (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  farm_ids BIGINT[] NOT NULL, -- Array of farm IDs where work was performed
  date DATE NOT NULL,
  work_status VARCHAR(20) NOT NULL CHECK (work_status IN ('full_day', 'half_day', 'absent')),
  work_type VARCHAR(100) NOT NULL,
  daily_rate_override DECIMAL(10,2), -- NULL means use worker's default rate
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Prevent duplicate attendance entries for same worker on same date
  UNIQUE(worker_id, date)
);

-- Worker settlements table
CREATE TABLE worker_settlements (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  farm_id BIGINT REFERENCES farms(id) ON DELETE SET NULL, -- NULL if settlement spans multiple farms
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_worked DECIMAL(10,2) NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  advance_deducted DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_payment DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
  notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure period_start <= period_end
  CONSTRAINT valid_settlement_period CHECK (period_start <= period_end)
);

-- Worker transactions table
CREATE TABLE worker_transactions (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  farm_id BIGINT REFERENCES farms(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('advance_given', 'advance_deducted', 'payment')),
  amount DECIMAL(10,2) NOT NULL,
  settlement_id BIGINT REFERENCES worker_settlements(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Temporary worker entries table (for one-off/daily laborers)
CREATE TABLE temporary_worker_entries (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hours_worked DECIMAL(6,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for worker tables
CREATE INDEX idx_work_types_user_id ON work_types(user_id);
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_is_active ON workers(is_active);
CREATE INDEX idx_worker_attendance_worker_id ON worker_attendance(worker_id);
CREATE INDEX idx_worker_attendance_date ON worker_attendance(date);
CREATE INDEX idx_worker_attendance_worker_date ON worker_attendance(worker_id, date);
CREATE INDEX idx_worker_settlements_worker_id ON worker_settlements(worker_id);
CREATE INDEX idx_worker_settlements_status ON worker_settlements(status);
CREATE INDEX idx_worker_settlements_period ON worker_settlements(period_start, period_end);
CREATE INDEX idx_worker_transactions_worker_id ON worker_transactions(worker_id);
CREATE INDEX idx_worker_transactions_date ON worker_transactions(date);
CREATE INDEX idx_worker_transactions_type ON worker_transactions(type);
CREATE INDEX idx_temporary_worker_entries_farm_id ON temporary_worker_entries(farm_id);
CREATE INDEX idx_temporary_worker_entries_user_id ON temporary_worker_entries(user_id);
CREATE INDEX idx_temporary_worker_entries_date ON temporary_worker_entries(date);

-- Enable RLS for worker tables
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_worker_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_types
CREATE POLICY "Users can view default and own work types" ON work_types FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid()
);
CREATE POLICY "Users can insert own work types" ON work_types FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "Users can update own work types" ON work_types FOR UPDATE USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can delete own work types" ON work_types FOR DELETE USING (
  user_id = auth.uid()
);

-- RLS Policies for workers
CREATE POLICY "Users can view their own workers" ON workers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own workers" ON workers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own workers" ON workers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own workers" ON workers FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for worker_attendance
CREATE POLICY "Users can view attendance for their workers" ON worker_attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_attendance.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can insert attendance for their workers" ON worker_attendance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_attendance.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can update attendance for their workers" ON worker_attendance FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_attendance.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can delete attendance for their workers" ON worker_attendance FOR DELETE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_attendance.worker_id AND workers.user_id = auth.uid())
);

-- RLS Policies for worker_settlements
CREATE POLICY "Users can view settlements for their workers" ON worker_settlements FOR SELECT USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_settlements.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can insert settlements for their workers" ON worker_settlements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_settlements.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can update settlements for their workers" ON worker_settlements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_settlements.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can delete settlements for their workers" ON worker_settlements FOR DELETE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_settlements.worker_id AND workers.user_id = auth.uid())
);

-- RLS Policies for worker_transactions
CREATE POLICY "Users can view transactions for their workers" ON worker_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_transactions.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can insert transactions for their workers" ON worker_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_transactions.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can update transactions for their workers" ON worker_transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_transactions.worker_id AND workers.user_id = auth.uid())
);
CREATE POLICY "Users can delete transactions for their workers" ON worker_transactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM workers WHERE workers.id = worker_transactions.worker_id AND workers.user_id = auth.uid())
);

-- RLS Policies for temporary_worker_entries
CREATE POLICY "Users can view their temporary worker entries" ON temporary_worker_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their temporary worker entries" ON temporary_worker_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their temporary worker entries" ON temporary_worker_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their temporary worker entries" ON temporary_worker_entries FOR DELETE USING (user_id = auth.uid());

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_attendance_updated_at BEFORE UPDATE ON worker_attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_settlements_updated_at BEFORE UPDATE ON worker_settlements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temporary_worker_entries_updated_at BEFORE UPDATE ON temporary_worker_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END WORKER / LABOR MANAGEMENT TABLES
-- ============================================================================

-- Atomic settlement confirmation helper
DROP FUNCTION IF EXISTS confirm_settlement_atomic(BIGINT);

CREATE OR REPLACE FUNCTION confirm_settlement_atomic(settlement_id_param BIGINT)
RETURNS TABLE (
  id BIGINT,
  worker_id BIGINT,
  farm_id BIGINT,
  period_start DATE,
  period_end DATE,
  days_worked DECIMAL(10,2),
  gross_amount DECIMAL(10,2),
  advance_deducted DECIMAL(10,2),
  net_payment DECIMAL(10,2),
  status TEXT,
  notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settlement_record RECORD;
  worker_owner_id UUID;
  current_user_id UUID;
  current_timestamp_val TIMESTAMP WITH TIME ZONE := NOW();
  current_date_val DATE := CURRENT_DATE;
BEGIN
  -- Get the current user ID from JWT claims
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT * INTO settlement_record
  FROM worker_settlements ws
  WHERE ws.id = settlement_id_param
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Settlement with id % not found', settlement_id_param;
  END IF;

  IF settlement_record.status = 'confirmed' THEN
    RAISE EXCEPTION 'Settlement with id % is already confirmed', settlement_id_param;
  END IF;

  IF settlement_record.status != 'draft' THEN
    RAISE EXCEPTION 'Settlement with id % is not in draft status', settlement_id_param;
  END IF;

  -- Verify ownership: fetch the worker's owner (user_id) from the workers table
  SELECT user_id INTO worker_owner_id
  FROM workers
  WHERE id = settlement_record.worker_id;

  IF worker_owner_id IS NULL THEN
    RAISE EXCEPTION 'Worker with id % not found', settlement_record.worker_id;
  END IF;

  -- Compare the worker's owner with the current user
  IF worker_owner_id != current_user_id THEN
    RAISE EXCEPTION 'Access denied: User % does not own worker %', current_user_id, settlement_record.worker_id;
  END IF;

  IF settlement_record.advance_deducted > 0 THEN
    UPDATE workers
    SET advance_balance = GREATEST(0, advance_balance - settlement_record.advance_deducted),
        updated_at = current_timestamp_val
    WHERE id = settlement_record.worker_id;

    INSERT INTO worker_transactions (worker_id, farm_id, date, type, amount, settlement_id, notes)
    VALUES (
      settlement_record.worker_id,
      settlement_record.farm_id,
      current_date_val,
      'advance_deducted',
      settlement_record.advance_deducted,
      settlement_id_param,
      'Advance deduction for settlement ' || settlement_record.period_start || ' to ' || settlement_record.period_end
    );
  END IF;

  IF settlement_record.net_payment > 0 THEN
    INSERT INTO worker_transactions (worker_id, farm_id, date, type, amount, settlement_id, notes)
    VALUES (
      settlement_record.worker_id,
      settlement_record.farm_id,
      current_date_val,
      'payment',
      settlement_record.net_payment,
      settlement_id_param,
      'Payment for settlement ' || settlement_record.period_start || ' to ' || settlement_record.period_end
    );
  END IF;

  UPDATE worker_settlements
  SET status = 'confirmed', confirmed_at = current_timestamp_val, updated_at = current_timestamp_val
  WHERE worker_settlements.id = settlement_id_param;

  RETURN QUERY
  SELECT ws.id, ws.worker_id, ws.farm_id, ws.period_start, ws.period_end, ws.days_worked, ws.gross_amount,
         ws.advance_deducted, ws.net_payment, ws.status, ws.notes, ws.confirmed_at, ws.created_at, ws.updated_at
  FROM worker_settlements ws
  WHERE ws.id = settlement_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_settlement_atomic(INTEGER) TO authenticated;

-- ============================================================================
-- ORGANIZATION / RBAC TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_owner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

-- Farmer invitations table
CREATE TABLE farmer_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fertilizer plans table (organization recommendations for farms)
CREATE TABLE fertilizer_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fertilizer plan items table
CREATE TABLE fertilizer_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES fertilizer_plans(id) ON DELETE CASCADE,
  application_date DATE,
  fertilizer_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'kg',
  application_method VARCHAR(100),
  application_frequency INTEGER DEFAULT 1,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to farms table (for farms managed by organizations)
-- Note: This is an ALTER TABLE statement - run separately if table already exists
-- ALTER TABLE farms ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for organization tables
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_farmer_invitations_organization_id ON farmer_invitations(organization_id);
CREATE INDEX idx_farmer_invitations_token ON farmer_invitations(token);
CREATE INDEX idx_farmer_invitations_status ON farmer_invitations(status);
CREATE INDEX idx_fertilizer_plans_farm_id ON fertilizer_plans(farm_id);
CREATE INDEX idx_fertilizer_plans_organization_id ON fertilizer_plans(organization_id);
CREATE INDEX idx_fertilizer_plan_items_plan_id ON fertilizer_plan_items(plan_id);

-- Composite indexes for AI and analytics queries
CREATE INDEX idx_organization_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX idx_fertilizer_plans_org_farm ON fertilizer_plans(organization_id, farm_id);
CREATE INDEX idx_fertilizer_plan_items_plan_date ON fertilizer_plan_items(plan_id, application_date);


-- Enable Row Level Security for organization tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Users can insert organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update their organizations" ON organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid() AND organization_members.is_owner = TRUE)
);
CREATE POLICY "Owners can delete their organizations" ON organizations FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid() AND organization_members.is_owner = TRUE)
);

-- RLS Policies for organization_members
CREATE POLICY "Members can view organization members" ON organization_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Admins can insert organization members" ON organization_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);
CREATE POLICY "Admins can update organization members" ON organization_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);
CREATE POLICY "Admins can delete organization members" ON organization_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);

-- Additional profiles RLS policy for org-based access (added here after organization_members exists)
CREATE POLICY "Users can view org member profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
  )
);

-- RLS Policies for farmer_invitations
CREATE POLICY "Members can view invitations" ON farmer_invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = farmer_invitations.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Admins can insert invitations" ON farmer_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = farmer_invitations.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);
CREATE POLICY "Admins can update invitations" ON farmer_invitations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = farmer_invitations.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);
CREATE POLICY "Admins can delete invitations" ON farmer_invitations FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = farmer_invitations.organization_id AND om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR om.is_owner = TRUE))
);

-- RLS Policies for fertilizer_plans
CREATE POLICY "Users can view fertilizer plans for their farms" ON fertilizer_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = fertilizer_plans.farm_id AND farms.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = fertilizer_plans.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Org members can insert fertilizer plans" ON fertilizer_plans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = fertilizer_plans.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Org members can update fertilizer plans" ON fertilizer_plans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = fertilizer_plans.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Org members can delete fertilizer plans" ON fertilizer_plans FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = fertilizer_plans.organization_id AND om.user_id = auth.uid())
);

-- RLS Policies for fertilizer_plan_items
CREATE POLICY "Users can view fertilizer plan items" ON fertilizer_plan_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM fertilizer_plans fp
    WHERE fp.id = fertilizer_plan_items.plan_id
    AND (
      EXISTS (SELECT 1 FROM farms WHERE farms.id = fp.farm_id AND farms.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = fp.organization_id AND om.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Org members can insert fertilizer plan items" ON fertilizer_plan_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM fertilizer_plans fp
    JOIN organization_members om ON om.organization_id = fp.organization_id
    WHERE fp.id = fertilizer_plan_items.plan_id AND om.user_id = auth.uid()
  )
);
CREATE POLICY "Org members can update fertilizer plan items" ON fertilizer_plan_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM fertilizer_plans fp
    JOIN organization_members om ON om.organization_id = fp.organization_id
    WHERE fp.id = fertilizer_plan_items.plan_id AND om.user_id = auth.uid()
  )
);
CREATE POLICY "Org members can delete fertilizer plan items" ON fertilizer_plan_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM fertilizer_plans fp
    JOIN organization_members om ON om.organization_id = fp.organization_id
    WHERE fp.id = fertilizer_plan_items.plan_id AND om.user_id = auth.uid()
  )
);

-- Trigger to update fertilizer_plans updated_at timestamp
CREATE TRIGGER update_fertilizer_plans_updated_at
  BEFORE UPDATE ON fertilizer_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add FK constraint from profiles to organizations (must be done after organizations table exists)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_consultant_organization_id_fkey
  FOREIGN KEY (consultant_organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;

-- ============================================================================
-- END ORGANIZATION / RBAC TABLES
-- ============================================================================

-- Insert some sample data (optional - you can remove this section)
-- Note: This will only work after you set up authentication
/*
INSERT INTO farms (name, region, area, crop, crop_variety, planting_date, vine_spacing, row_spacing, user_id) VALUES
('Nashik Vineyard Main', 'Nashik, Maharashtra', 2.5, 'Grapes', 'Thompson Seedless', '2020-03-15', 3.0, 9.0, auth.uid()),
('Pune Valley Farm', 'Pune, Maharashtra', 1.8, 'Grapes', 'Flame Seedless', '2019-11-20', 2.5, 8.0, auth.uid()),
('Sangli Export Vineyard', 'Sangli, Maharashtra', 4.2, 'Grapes', 'Red Globe', '2018-12-10', 3.5, 10.0, auth.uid());
*/
