# Weather Provider System

## Overview

VineSight now supports multiple weather data providers, allowing farmers to choose the most accurate source for their location. This feature enables real-world testing and comparison of weather APIs to find which one best matches actual conditions.

## Supported Providers

### 1. Open-Meteo (Default)
- **Status**: Free forever, no API key required
- **Features**:
  - FAO-56 Penman-Monteith evapotranspiration (ETo)
  - Solar radiation data
  - Historical data from 1940
  - Hourly solar radiation (lux)
  - Global coverage
- **Best For**: Budget-conscious users, testing, development
- **API Docs**: https://open-meteo.com/

### 2. Visual Crossing
- **Status**: Free tier (1000 calls/day), requires API key
- **Features**:
  - Pre-calculated agricultural parameters
  - 50 years of historical data
  - High accuracy weather forecasting
  - Growing degree days
  - Global coverage
- **Best For**: Users needing premium accuracy, historical analysis
- **API Docs**: https://www.visualcrossing.com/weather-api

## How to Use

### For Farmers

1. **Navigate to Farm Details Page**
   - Go to your farm's detail page
   - Find the weather card

2. **Switch Weather Provider**
   - Look for "Data Source" dropdown in the weather card
   - Select between "Open-Meteo" (Free) or "Visual Crossing"
   - Weather data will automatically refresh with the new provider

3. **Compare Accuracy**
   - Test both providers to see which matches your local conditions better
   - Your preference is saved per farm
   - You can switch anytime

### For Developers

#### Setup Visual Crossing

1. **Get API Key**
   ```bash
   # Sign up at https://www.visualcrossing.com/weather-api
   # Free tier: 1000 calls/day
   ```

2. **Add to Environment**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local

   # Add your Visual Crossing API key
   NEXT_PUBLIC_VISUAL_CROSSING_API_KEY=your_api_key_here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

#### Using the Weather Provider Manager

```typescript
import { WeatherProviderManager } from '@/lib/weather-providers'

// Get weather data using farm's preferred provider
const weatherData = await WeatherProviderManager.getCurrentWeatherData(
  latitude,
  longitude,
  farmId
)

// Switch provider for a specific farm
WeatherProviderManager.setProviderPreference('visual-crossing', farmId)

// Compare both providers
const comparison = await WeatherProviderManager.compareProviders(
  latitude,
  longitude,
  '2025-11-04'
)
```

## Architecture

### File Structure

```
src/lib/weather-providers/
├── index.ts                        # Public exports
├── types.ts                        # Common interfaces
├── weather-provider-manager.ts     # Provider switching logic
├── open-meteo-provider.ts          # Open-Meteo adapter
└── visual-crossing-provider.ts     # Visual Crossing implementation
```

### Interface

All weather providers implement the `IWeatherProvider` interface:

```typescript
interface IWeatherProvider {
  getWeatherData(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherData[]>

  getCurrentWeatherData(
    latitude: number,
    longitude: number
  ): Promise<WeatherData>

  getHourlySolarRadiation(
    latitude: number,
    longitude: number,
    date?: string
  ): Promise<HourlySolarData | null>

  getWeatherForecast(
    latitude: number,
    longitude: number,
    days?: number
  ): Promise<WeatherData[]>
}
```

### Unified Weather Data Format

All providers return data in a consistent format:

```typescript
interface WeatherData {
  date: string
  provider: 'open-meteo' | 'visual-crossing'

  // Temperature (°C)
  temperatureMax: number
  temperatureMin: number
  temperatureMean: number

  // Humidity (%)
  relativeHumidityMax: number
  relativeHumidityMin: number
  relativeHumidityMean: number

  // Wind (m/s)
  windSpeed10m: number
  windSpeedMax: number

  // Precipitation (mm)
  precipitationSum: number

  // Solar radiation (MJ/m²/day)
  shortwaveRadiationSum: number
  sunshineDuration: number // hours

  // Evapotranspiration (mm/day)
  et0FaoEvapotranspiration: number

  // Location context
  latitude: number
  longitude: number
  elevation: number
  timezone: string
}
```

## Storage

User preferences are stored in browser localStorage:

```
Key: weather-provider-{farmId}
Value: "open-meteo" | "visual-crossing"
```

This allows per-farm preferences to persist across sessions.

## Adding New Providers

To add a new weather provider:

1. **Create Provider Class**
   ```typescript
   // src/lib/weather-providers/new-provider.ts
   export class NewProvider implements IWeatherProvider {
     async getWeatherData(...) { /* implementation */ }
     async getCurrentWeatherData(...) { /* implementation */ }
     async getHourlySolarRadiation(...) { /* implementation */ }
     async getWeatherForecast(...) { /* implementation */ }
   }
   ```

2. **Add to Types**
   ```typescript
   // src/lib/weather-providers/types.ts
   export type WeatherProvider = 'open-meteo' | 'visual-crossing' | 'new-provider'

   export const WEATHER_PROVIDERS = {
     // ...existing providers
     'new-provider': {
       id: 'new-provider',
       name: 'New Provider',
       description: '...',
       features: [...],
       isFree: true,
       requiresApiKey: false
     }
   }
   ```

3. **Register in Manager**
   ```typescript
   // src/lib/weather-providers/weather-provider-manager.ts
   private static providers: Map<WeatherProvider, IWeatherProvider> = new Map([
     ['open-meteo', new OpenMeteoProvider()],
     ['visual-crossing', new VisualCrossingProvider()],
     ['new-provider', new NewProvider()]
   ])
   ```

## Testing

### Manual Testing

1. Add both API keys to `.env.local`
2. Navigate to a farm's details page
3. Switch between providers using the dropdown
4. Compare:
   - Temperature accuracy
   - Precipitation data
   - ETo calculations
   - Solar radiation measurements

### Automated Testing

```typescript
import { WeatherProviderManager } from '@/lib/weather-providers'

// Compare both providers for accuracy
const comparison = await WeatherProviderManager.compareProviders(
  19.0825,  // Nashik, Maharashtra
  73.1963,
  '2025-11-04'
)

console.log('Temperature difference:', comparison.differences.temperatureDiff)
console.log('ETo difference:', comparison.differences.etoDiff)
```

## Performance Considerations

- **Caching**: Weather data is fetched on demand, consider implementing caching for production
- **Rate Limits**:
  - Open-Meteo: No rate limits (free tier)
  - Visual Crossing: 1000 calls/day (free tier)
- **Response Time**: Both providers typically respond in < 2 seconds

## Future Enhancements

- [ ] Add database storage for provider preferences (currently localStorage)
- [ ] Implement weather data caching layer
- [ ] Add more providers (AccuWeather, IBM Weather, etc.)
- [ ] Provider accuracy analytics dashboard
- [ ] Automatic provider selection based on accuracy history
- [ ] Weather data comparison view (side-by-side)
- [ ] Historical accuracy tracking

## Troubleshooting

### Visual Crossing Returns Error

**Problem**: "Visual Crossing API key is invalid or missing"

**Solution**:
1. Verify API key is set in `.env.local`
2. Restart development server
3. Check API key is valid at https://www.visualcrossing.com/account
4. Ensure you haven't exceeded rate limits

### No Weather Data Displayed

**Problem**: Weather card shows "No weather data available"

**Solution**:
1. Verify farm has latitude/longitude coordinates
2. Check browser console for errors
3. Try switching to the other provider
4. Verify internet connection

### Provider Preference Not Saving

**Problem**: Selected provider resets after page refresh

**Solution**:
1. Check browser localStorage is enabled
2. Clear browser cache and try again
3. Verify farmId is being passed correctly to the WeatherCard component

## Support

For issues or questions:
- GitHub Issues: https://github.com/vinesight/issues
- Documentation: See CLAUDE.md for project overview
- API Docs: Check individual provider documentation

## License

This feature is part of VineSight and follows the project's license terms.
