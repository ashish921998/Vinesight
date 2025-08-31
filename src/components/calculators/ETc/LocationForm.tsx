import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wind, MapPin, Navigation, Globe } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { OpenMeteoGeocodingService, type LocationResult } from '@/lib/open-meteo-geocoding';

interface LocationFormProps {
  formData: {
    latitude: string;
    longitude: string;
    elevation: string;
    locationName?: string;
  };
  onInputChange: (field: string, value: string) => void;
  onLocationSelect?: (location: LocationResult) => void;
}

export function LocationForm({
  formData,
  onInputChange,
  onLocationSelect,
}: LocationFormProps) {
  const [searchQuery, setSearchQuery] = useState(formData.locationName || '');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle search input changes with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await OpenMeteoGeocodingService.getLocationSuggestions(searchQuery, 8);
          setSuggestions(results);
          setShowSuggestions(true);
          setIsSearching(false);
        } catch (error) {
          console.error('Location search error:', error);
          setSuggestions([]);
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: LocationResult) => {
    setSearchQuery(OpenMeteoGeocodingService.formatLocationDisplay(location));
    setShowSuggestions(false);
    
    // Update form data
    onInputChange('latitude', location.latitude.toString());
    onInputChange('longitude', location.longitude.toString());
    onInputChange('elevation', location.elevation.toString());
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleCurrentLocation = async () => {
    setIsLoadingCurrentLocation(true);
    try {
      const coords = await OpenMeteoGeocodingService.getCurrentLocation();
      if (coords) {
        onInputChange('latitude', coords.latitude.toString());
        onInputChange('longitude', coords.longitude.toString());
        
        // Try to get location name
        const locationInfo = await OpenMeteoGeocodingService.reverseGeocode(coords.latitude, coords.longitude);
        if (locationInfo) {
          setSearchQuery(OpenMeteoGeocodingService.formatLocationDisplay(locationInfo));
          onInputChange('elevation', locationInfo.elevation.toString());
        } else {
          setSearchQuery(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  };

  const popularLocations = OpenMeteoGeocodingService.getPopularFarmingLocations();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <CardTitle className="text-base">Location Search</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">Auto-detect coordinates</Badge>
        </div>
        <CardDescription className="text-xs">
          Search for your location or use current position for accurate weather data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Location Search */}
        <div className="relative">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Search Location
          </Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for city, farm, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 text-base pr-24"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={isLoadingCurrentLocation}
              className="absolute right-1 top-1 h-9 px-3"
            >
              {isLoadingCurrentLocation ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && (suggestions.length > 0 || isSearching) && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Searching...</span>
                </div>
              ) : (
                suggestions.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">
                      {OpenMeteoGeocodingService.formatLocationDisplay(location)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} • {location.elevation}m elevation
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Popular Locations */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Popular Farming Locations
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {popularLocations.slice(0, 6).map((location) => (
              <Button
                key={location.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLocationSelect(location)}
                className="h-auto py-2 px-3 text-xs justify-start"
              >
                <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{location.name}, {location.admin1}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Coordinate Input */}
        <div className="pt-4 border-t border-gray-100">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Manual Coordinates (Optional Override)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Latitude</Label>
              <Input
                type="number"
                placeholder="19.0760"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => onInputChange('latitude', e.target.value)}
                className="h-10 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Longitude</Label>
              <Input
                type="number"
                placeholder="72.8777"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => onInputChange('longitude', e.target.value)}
                className="h-10 text-sm mt-1"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs text-gray-600">Elevation (m)</Label>
            <Input
              type="number"
              placeholder="500"
              value={formData.elevation}
              onChange={(e) => onInputChange('elevation', e.target.value)}
              className="h-10 text-sm mt-1"
            />
          </div>
        </div>

        {/* Current Location Display */}
        {(formData.latitude && formData.longitude) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Selected Location
              </span>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              <div>Coordinates: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}</div>
              {formData.elevation && <div>Elevation: {formData.elevation}m</div>}
              {searchQuery && <div>Location: {searchQuery}</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}