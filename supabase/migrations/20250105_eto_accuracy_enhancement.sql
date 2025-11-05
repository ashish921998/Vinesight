-- ============================================================================
-- ETo Accuracy Enhancement Database Schema
--
-- Tables to support multi-strategy ETo accuracy improvement:
-- 1. regional_calibrations - Store regional bias corrections
-- 2. local_sensor_data - Store local weather sensor readings
-- 3. eto_validations - Track API vs actual ETo comparisons
-- 4. provider_performance - Track provider accuracy by region
-- ============================================================================

-- Table 1: Regional Calibrations
-- Stores correction factors for each provider by region and season
CREATE TABLE IF NOT EXISTS regional_calibrations (
  id SERIAL PRIMARY KEY,
  region_key TEXT NOT NULL, -- lat,lon grid cell (e.g., "19.0,73.5")
  provider TEXT NOT NULL CHECK (provider IN ('open-meteo', 'visual-crossing', 'weatherbit', 'tomorrow-io')),
  season TEXT NOT NULL CHECK (season IN ('winter', 'spring', 'summer', 'monsoon', 'post-monsoon')),

  -- Correction parameters
  correction_factor REAL NOT NULL DEFAULT 1.0, -- Multiply API ETo by this
  bias REAL NOT NULL DEFAULT 0.0, -- Systematic error in mm/day

  -- Statistical metrics
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  rmse REAL, -- Root mean square error
  mae REAL, -- Mean absolute error

  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one calibration per region+provider+season
  UNIQUE(region_key, provider, season)
);

CREATE INDEX idx_regional_calibrations_lookup
  ON regional_calibrations(region_key, provider, season);

-- Table 2: Local Sensor Data
-- Stores weather data from local sensors (manual entry or IoT)
CREATE TABLE IF NOT EXISTS local_sensor_data (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Date and time
  date DATE NOT NULL,
  time TIME, -- Optional: for hourly data

  -- Sensor readings (all optional, farmer may only have some sensors)
  temperature_max REAL,
  temperature_min REAL,
  temperature_current REAL,
  humidity REAL, -- Relative humidity %
  wind_speed REAL, -- m/s
  solar_radiation REAL, -- W/m² or MJ/m²/day
  rainfall REAL, -- mm
  soil_moisture REAL, -- Volumetric water content (0-1)

  -- Data source
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'iot', 'station')),
  device_id TEXT, -- For IoT devices

  -- Quality flag
  quality_checked BOOLEAN DEFAULT false,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One record per farm per date (can be updated)
  UNIQUE(farm_id, date)
);

CREATE INDEX idx_local_sensor_data_farm_date
  ON local_sensor_data(farm_id, date DESC);

-- Table 3: ETo Validations
-- Stores comparisons between API ETo and measured/validated ETo
CREATE TABLE IF NOT EXISTS eto_validations (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Date and location
  date DATE NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,

  -- API data
  provider TEXT NOT NULL,
  api_eto REAL NOT NULL, -- mm/day from API

  -- Validated/measured data
  measured_eto REAL NOT NULL, -- mm/day from local station/calculation
  validation_source TEXT NOT NULL CHECK (
    validation_source IN ('weather_station', 'sensor_calculation', 'crop_stress', 'expert_estimate')
  ),

  -- Error metrics
  error REAL GENERATED ALWAYS AS (api_eto - measured_eto) STORED,
  error_percent REAL GENERATED ALWAYS AS (
    CASE WHEN measured_eto > 0
    THEN ((api_eto - measured_eto) / measured_eto * 100)
    ELSE 0 END
  ) STORED,

  -- Context
  weather_conditions JSONB, -- Temperature, humidity, etc.
  crop_type TEXT,
  irrigation_status TEXT, -- 'irrigated' or 'rainfed'

  -- Quality and notes
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_eto_validations_farm
  ON eto_validations(farm_id, date DESC);

CREATE INDEX idx_eto_validations_provider
  ON eto_validations(provider, date DESC);

CREATE INDEX idx_eto_validations_location
  ON eto_validations(latitude, longitude);

-- Table 4: Provider Performance Tracking
-- Aggregated performance metrics for each provider by region
CREATE TABLE IF NOT EXISTS provider_performance (
  id SERIAL PRIMARY KEY,
  region_key TEXT NOT NULL, -- lat,lon grid cell
  provider TEXT NOT NULL,

  -- Performance metrics (updated periodically from eto_validations)
  validation_count INTEGER NOT NULL DEFAULT 0,
  avg_error REAL, -- Average error in mm/day
  avg_error_percent REAL, -- Average % error
  rmse REAL, -- Root mean square error
  mae REAL, -- Mean absolute error
  r_squared REAL, -- Correlation coefficient

  -- Accuracy score (0-1, higher is better)
  accuracy_score REAL GENERATED ALWAYS AS (
    CASE WHEN rmse > 0
    THEN GREATEST(0, 1 - (rmse / 5.0)) -- Normalize by 5mm/day
    ELSE 0 END
  ) STORED,

  -- Time period
  period_start DATE,
  period_end DATE,

  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(region_key, provider, period_start, period_end)
);

CREATE INDEX idx_provider_performance_lookup
  ON provider_performance(region_key, provider);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE regional_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE eto_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_performance ENABLE ROW LEVEL SECURITY;

-- Regional calibrations: Public read, authenticated write
CREATE POLICY "Anyone can read regional calibrations"
  ON regional_calibrations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can contribute calibrations"
  ON regional_calibrations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update calibrations"
  ON regional_calibrations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Local sensor data: Users can only access their own farm data
CREATE POLICY "Users can read their farm sensor data"
  ON local_sensor_data FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = local_sensor_data.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their farm sensor data"
  ON local_sensor_data FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their farm sensor data"
  ON local_sensor_data FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their farm sensor data"
  ON local_sensor_data FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farm_id
      AND farms.user_id = auth.uid()
    )
  );

-- ETo validations: Users own their data, but aggregated stats are public
CREATE POLICY "Users can read their validations"
  ON eto_validations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = eto_validations.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert validations"
  ON eto_validations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their validations"
  ON eto_validations FOR UPDATE
  USING (auth.uid() = user_id);

-- Provider performance: Public read
CREATE POLICY "Anyone can read provider performance"
  ON provider_performance FOR SELECT
  USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate region key from lat/lon
CREATE OR REPLACE FUNCTION get_region_key(lat REAL, lon REAL)
RETURNS TEXT AS $$
BEGIN
  RETURN FLOOR(lat * 2) / 2 || ',' || FLOOR(lon * 2) / 2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update provider performance from validations
CREATE OR REPLACE FUNCTION update_provider_performance()
RETURNS TRIGGER AS $$
DECLARE
  region TEXT;
BEGIN
  -- Get region key
  region := get_region_key(NEW.latitude, NEW.longitude);

  -- Update or insert provider performance
  INSERT INTO provider_performance (
    region_key,
    provider,
    validation_count,
    avg_error,
    avg_error_percent,
    rmse,
    mae,
    period_start,
    period_end,
    last_updated
  )
  SELECT
    region,
    NEW.provider,
    COUNT(*),
    AVG(error),
    AVG(error_percent),
    SQRT(AVG(POWER(error, 2))),
    AVG(ABS(error)),
    MIN(date),
    MAX(date),
    NOW()
  FROM eto_validations
  WHERE
    get_region_key(latitude, longitude) = region
    AND provider = NEW.provider
  ON CONFLICT (region_key, provider, period_start, period_end)
  DO UPDATE SET
    validation_count = EXCLUDED.validation_count,
    avg_error = EXCLUDED.avg_error,
    avg_error_percent = EXCLUDED.avg_error_percent,
    rmse = EXCLUDED.rmse,
    mae = EXCLUDED.mae,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update performance on new validations
CREATE TRIGGER update_provider_performance_trigger
  AFTER INSERT ON eto_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_performance();

-- ============================================================================
-- Sample Data / Comments
-- ============================================================================

COMMENT ON TABLE regional_calibrations IS
  'Stores correction factors for weather provider ETo data by region and season';

COMMENT ON TABLE local_sensor_data IS
  'Stores weather measurements from local sensors (manual or IoT) to improve API accuracy';

COMMENT ON TABLE eto_validations IS
  'Tracks comparisons between API-provided ETo and actual measured ETo for validation';

COMMENT ON TABLE provider_performance IS
  'Aggregated performance metrics for each weather provider by geographic region';

COMMENT ON COLUMN regional_calibrations.correction_factor IS
  'Multiply API ETo by this factor to correct systematic bias (e.g., 0.85 for 15% overestimation)';

COMMENT ON COLUMN regional_calibrations.bias IS
  'Systematic error in mm/day to subtract after applying correction factor';

COMMENT ON COLUMN eto_validations.validation_source IS
  'Source of validated ETo: weather_station (most accurate), sensor_calculation, crop_stress, expert_estimate';

COMMENT ON COLUMN provider_performance.accuracy_score IS
  'Normalized accuracy score (0-1) where 1 is perfect, based on RMSE';
