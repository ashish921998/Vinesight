-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create farms table
CREATE TABLE farms (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  area DECIMAL(10,2) NOT NULL, -- in hectares
  grape_variety VARCHAR(255) NOT NULL,
  planting_date DATE NOT NULL,
  vine_spacing DECIMAL(5,2) NOT NULL, -- in meters
  row_spacing DECIMAL(5,2) NOT NULL, -- in meters
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create fertigation_records table
CREATE TABLE fertigation_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fertilizer VARCHAR(255) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  area DECIMAL(10,2) NOT NULL, -- in hectares
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create harvest_records table
CREATE TABLE harvest_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity DECIMAL(12,2) NOT NULL, -- in kg
  grade VARCHAR(100) NOT NULL,
  price DECIMAL(10,2), -- per kg
  buyer VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expense_records table
CREATE TABLE expense_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('labor', 'materials', 'equipment', 'other')) NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  remarks TEXT,
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
CREATE TABLE task_reminders (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('irrigation', 'spray', 'fertigation', 'training', 'harvest', 'other')) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create soil_test_records table
CREATE TABLE soil_test_records (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  parameters JSONB NOT NULL, -- pH, N, P, K, etc.
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
  recommendations TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_irrigation_records_farm_id ON irrigation_records(farm_id);
CREATE INDEX idx_irrigation_records_date ON irrigation_records(date);
CREATE INDEX idx_spray_records_farm_id ON spray_records(farm_id);
CREATE INDEX idx_spray_records_date ON spray_records(date);
CREATE INDEX idx_fertigation_records_farm_id ON fertigation_records(farm_id);
CREATE INDEX idx_fertigation_records_date ON fertigation_records(date);
CREATE INDEX idx_harvest_records_farm_id ON harvest_records(farm_id);
CREATE INDEX idx_harvest_records_date ON harvest_records(date);
CREATE INDEX idx_expense_records_farm_id ON expense_records(farm_id);
CREATE INDEX idx_expense_records_date ON expense_records(date);
CREATE INDEX idx_calculation_history_farm_id ON calculation_history(farm_id);
CREATE INDEX idx_calculation_history_date ON calculation_history(date);
CREATE INDEX idx_task_reminders_farm_id ON task_reminders(farm_id);
CREATE INDEX idx_task_reminders_due_date ON task_reminders(due_date);
CREATE INDEX idx_task_reminders_completed ON task_reminders(completed);
CREATE INDEX idx_soil_test_records_farm_id ON soil_test_records(farm_id);
CREATE INDEX idx_soil_test_records_date ON soil_test_records(date);
CREATE INDEX idx_petiole_test_records_farm_id ON petiole_test_records(farm_id);
CREATE INDEX idx_petiole_test_records_date ON petiole_test_records(date);

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

-- Task reminders
CREATE POLICY "Users can view their farm task reminders" ON task_reminders FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = task_reminders.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert task reminders for their farms" ON task_reminders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = task_reminders.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update task reminders for their farms" ON task_reminders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = task_reminders.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete task reminders for their farms" ON task_reminders FOR DELETE USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = task_reminders.farm_id AND farms.user_id = auth.uid())
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

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for farms
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - you can remove this section)
-- Note: This will only work after you set up authentication
/*
INSERT INTO farms (name, region, area, grape_variety, planting_date, vine_spacing, row_spacing, user_id) VALUES
('Nashik Vineyard Main', 'Nashik, Maharashtra', 2.5, 'Thompson Seedless', '2020-03-15', 3.0, 9.0, auth.uid()),
('Pune Valley Farm', 'Pune, Maharashtra', 1.8, 'Flame Seedless', '2019-11-20', 2.5, 8.0, auth.uid()),
('Sangli Export Vineyard', 'Sangli, Maharashtra', 4.2, 'Red Globe', '2018-12-10', 3.5, 10.0, auth.uid());
*/