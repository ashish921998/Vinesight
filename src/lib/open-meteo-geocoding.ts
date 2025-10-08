/**
 * Open-Meteo Geocoding Service
 * Convert location names to coordinates for weather data fetching
 */

export interface LocationResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation: number
  feature_code: string
  country_code: string
  country: string
  admin1?: string // State/Province
  admin2?: string // County/District
  admin3?: string // City/Municipality
  admin4?: string // Neighborhood
  timezone: string
  population?: number
  postcodes?: string[]
}

export interface GeocodingApiResponse {
  results?: LocationResult[]
  generationtime_ms: number
}

export interface LocationSearchParams {
  name: string
  count?: number
  language?: string
  format?: 'json' | 'protobuf'
}

export class OpenMeteoGeocodingService {
  private static readonly BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

  /**
   * Search for locations by name
   */
  static async searchLocations(params: LocationSearchParams): Promise<LocationResult[]> {
    const searchParams = new URLSearchParams({
      name: params.name,
      count: (params.count || 10).toString(),
      language: params.language || 'en',
      format: params.format || 'json'
    })

    const url = `${this.BASE_URL}?${searchParams}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`)
      }

      const data: GeocodingApiResponse = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error fetching geocoding data:', error)
      throw new Error('Failed to search locations')
    }
  }

  /**
   * Search for locations with automatic suggestion formatting
   */
  static async getLocationSuggestions(
    query: string,
    maxResults: number = 5
  ): Promise<LocationResult[]> {
    if (query.length < 2) {
      return []
    }

    try {
      const results = await this.searchLocations({
        name: query,
        count: maxResults
      })

      // Filter and sort results for better UX
      return results
        .filter(
          (result) =>
            result.feature_code === 'PPLC' || // Capital cities
            result.feature_code === 'PPL' || // Populated places
            result.feature_code === 'PPLA' || // First-order admin division seats
            result.feature_code === 'PPLA2' || // Second-order admin division seats
            result.feature_code === 'PPLA3' || // Third-order admin division seats
            result.feature_code === 'PPLA4' // Fourth-order admin division seats
        )
        .sort((a, b) => {
          // Prioritize by population (if available)
          if (a.population && b.population) {
            return b.population - a.population
          }
          // Then by feature code importance
          const importance = {
            PPLC: 5, // Capital
            PPLA: 4, // State capital
            PPLA2: 3,
            PPLA3: 2,
            PPL: 1,
            PPLA4: 1
          }
          return (
            (importance[b.feature_code as keyof typeof importance] || 0) -
            (importance[a.feature_code as keyof typeof importance] || 0)
          )
        })
    } catch (error) {
      console.error('Error getting location suggestions:', error)
      return []
    }
  }

  /**
   * Format location for display in UI
   */
  static formatLocationDisplay(location: LocationResult): string {
    const parts = [location.name]

    if (location.admin1 && location.admin1 !== location.name) {
      parts.push(location.admin1)
    }

    if (location.country && location.country !== location.admin1) {
      parts.push(location.country)
    }

    return parts.join(', ')
  }

  /**
   * Get location details by coordinates (reverse geocoding)
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationResult | null> {
    try {
      // For reverse geocoding, we search for nearby locations
      // Open-Meteo doesn't have direct reverse geocoding, so we find the closest match
      const searchRadius = 0.1 // degrees (roughly 11km)
      const results = await this.searchLocations({
        name: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        count: 1
      })

      if (results.length > 0) {
        const result = results[0]
        // Check if the result is reasonably close to our coordinates
        const distance = this.calculateDistance(
          latitude,
          longitude,
          result.latitude,
          result.longitude
        )
        if (distance < 50) {
          // Within 50km
          return result
        }
      }

      return null
    } catch (error) {
      console.error('Error in reverse geocoding:', error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates in km
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1)
    const dLon = this.degreesToRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Get current location using browser geolocation API
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  /**
   * Get popular farming locations in India for quick selection
   */
  static getPopularFarmingLocations(): LocationResult[] {
    return [
      {
        id: 1,
        name: 'Nashik',
        latitude: 19.9975,
        longitude: 73.7898,
        elevation: 560,
        feature_code: 'PPL',
        country_code: 'IN',
        country: 'India',
        admin1: 'Maharashtra',
        timezone: 'Asia/Kolkata',
        population: 1486053
      },
      {
        id: 2,
        name: 'Pune',
        latitude: 18.5204,
        longitude: 73.8567,
        elevation: 560,
        feature_code: 'PPL',
        country_code: 'IN',
        country: 'India',
        admin1: 'Maharashtra',
        timezone: 'Asia/Kolkata',
        population: 2935744
      },
      {
        id: 3,
        name: 'Sangli',
        latitude: 16.8544,
        longitude: 74.5648,
        elevation: 570,
        feature_code: 'PPL',
        country_code: 'IN',
        country: 'India',
        admin1: 'Maharashtra',
        timezone: 'Asia/Kolkata',
        population: 502697
      },
      {
        id: 4,
        name: 'Solapur',
        latitude: 17.6599,
        longitude: 75.9064,
        elevation: 472,
        feature_code: 'PPL',
        country_code: 'IN',
        country: 'India',
        admin1: 'Maharashtra',
        timezone: 'Asia/Kolkata',
        population: 951118
      },
      {
        id: 5,
        name: 'Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        elevation: 920,
        feature_code: 'PPLC',
        country_code: 'IN',
        country: 'India',
        admin1: 'Karnataka',
        timezone: 'Asia/Kolkata',
        population: 8443675
      }
    ]
  }

  /**
   * Validate coordinates
   */
  static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    )
  }

  /**
   * Get location info summary for display
   */
  static getLocationSummary(location: LocationResult): {
    displayName: string
    coordinates: string
    elevation: string
    timezone: string
  } {
    return {
      displayName: this.formatLocationDisplay(location),
      coordinates: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      elevation: `${location.elevation}m`,
      timezone: location.timezone
    }
  }
}
