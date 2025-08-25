# VineSight Full-Stack Database Schema

## Core Entities

### Users
```sql
users {
  id: uuid (primary key)
  email: string (unique)
  name: string
  phone: string?
  language: enum ('en', 'hi', 'mr')
  timezone: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Farms
```sql
farms {
  id: uuid (primary key)
  user_id: uuid (foreign key -> users.id)
  name: string
  region: string
  area: decimal(8,2) -- hectares
  grape_variety: string
  planting_date: date
  vine_spacing: decimal(5,2) -- meters
  row_spacing: decimal(5,2) -- meters
  latitude: decimal(10,8)?
  longitude: decimal(11,8)?
  soil_type: string?
  irrigation_system: enum ('drip', 'sprinkler', 'flood', 'other')
  created_at: timestamp
  updated_at: timestamp
}
```

### Irrigation Records
```sql
irrigation_records {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  date: date
  duration: decimal(5,2) -- hours
  area: decimal(8,2) -- hectares irrigated
  growth_stage: string
  moisture_status: enum ('dry', 'moderate', 'wet')
  system_discharge: decimal(8,2) -- liters per hour
  water_source: string?
  notes: text?
  created_at: timestamp
}
```

### Spray Records
```sql
spray_records {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  date: date
  pest_disease: string
  chemical: string
  dose: string
  area: decimal(8,2) -- hectares
  weather_conditions: string
  operator: string
  cost: decimal(10,2)?
  supplier: string?
  notes: text?
  created_at: timestamp
}
```

### Harvest Records
```sql
harvest_records {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  date: date
  quantity: decimal(10,2) -- kg
  grade: enum ('export_premium', 'export', 'local_premium', 'local', 'processing')
  price_per_kg: decimal(8,2)?
  buyer: string?
  brix_level: decimal(4,2)? -- sugar content
  moisture_content: decimal(5,2)?
  total_value: decimal(12,2)?
  notes: text?
  created_at: timestamp
}
```

### Task Reminders
```sql
task_reminders {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  title: string
  description: text?
  due_date: date
  type: enum ('irrigation', 'spray', 'fertigation', 'training', 'harvest', 'other')
  priority: enum ('low', 'medium', 'high')
  completed: boolean (default false)
  completed_at: timestamp?
  created_at: timestamp
  updated_at: timestamp
}
```

### Weather Data (Cache)
```sql
weather_data {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  date: date
  temperature_max: decimal(5,2)
  temperature_min: decimal(5,2)
  humidity: decimal(5,2)
  rainfall: decimal(8,2) -- mm
  wind_speed: decimal(6,2) -- km/h
  solar_radiation: decimal(8,2)?
  evapotranspiration: decimal(6,2)? -- mm
  data_source: string
  created_at: timestamp
}
```

### Market Prices (Cache)
```sql
market_prices {
  id: uuid (primary key)
  grape_variety: string
  market_location: string
  date: date
  price_per_kg: decimal(8,2)
  grade: string
  data_source: string
  created_at: timestamp
}
```

### Calculation History
```sql
calculation_history {
  id: uuid (primary key)
  farm_id: uuid (foreign key -> farms.id)
  calculation_type: enum ('etc', 'lai', 'nutrients', 'discharge')
  inputs: jsonb
  outputs: jsonb
  date: date
  created_at: timestamp
}
```

## API Endpoints Design

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/profile
- PUT /api/auth/profile

### Farms
- GET /api/farms (user's farms)
- POST /api/farms (create farm)
- GET /api/farms/:id (farm details)
- PUT /api/farms/:id (update farm)
- DELETE /api/farms/:id (delete farm)

### Operations
- GET /api/farms/:id/irrigation (irrigation records)
- POST /api/farms/:id/irrigation (add irrigation record)
- GET /api/farms/:id/sprays (spray records)
- POST /api/farms/:id/sprays (add spray record)
- GET /api/farms/:id/harvests (harvest records)
- POST /api/farms/:id/harvests (add harvest record)

### Tasks & Reminders
- GET /api/farms/:id/tasks (farm tasks)
- POST /api/farms/:id/tasks (create task)
- PUT /api/tasks/:id (update task)
- DELETE /api/tasks/:id (delete task)
- PUT /api/tasks/:id/complete (mark complete)

### Analytics
- GET /api/farms/:id/analytics (farm analytics)
- GET /api/analytics/dashboard (user dashboard)

### External Integrations
- GET /api/weather/:farmId (weather data)
- GET /api/market-prices/:variety (market prices)

### Data Export
- GET /api/farms/:id/export/pdf (PDF report)
- GET /api/farms/:id/export/csv (CSV export)

## External APIs to Integrate

### Weather APIs
- **OpenWeatherMap API**: Current and forecast weather
- **Indian Meteorological Department**: Local weather data
- **NASA POWER**: Solar radiation and climate data

### Market Price APIs
- **Agmarknet**: Indian agricultural market prices
- **Government Agricultural APIs**: Local mandi prices
- **Commodity exchanges**: Futures pricing data

### Location & Mapping
- **Google Maps API**: Geocoding and mapping
- **Indian govt GIS**: Soil data and regional information

## Implementation Priority

1. **Phase 1**: Core API (auth, farms, basic operations)
2. **Phase 2**: Data sync and offline support
3. **Phase 3**: External API integrations (weather, prices)
4. **Phase 4**: Advanced analytics and reporting
5. **Phase 5**: Real-time features and notifications