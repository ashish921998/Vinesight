import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThermometerSun, CloudSun, Download, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { OpenMeteoWeatherService, type OpenMeteoWeatherData } from '@/lib/open-meteo-weather';

interface WeatherDataFormProps {
  formData: {
    date: string;
    temperatureMax: string;
    temperatureMin: string;
    humidity: string;
    windSpeed: string;
    rainfall: string;
    solarRadiation: string;
    solarRadiationLux: string;
    sunshineHours: string;
  };
  locationData?: {
    latitude: string;
    longitude: string;
    locationName?: string;
  };
  onInputChange: (field: string, value: string) => void;
  onOpenMeteoDataLoad?: (data: OpenMeteoWeatherData) => void;
}

export function WeatherDataForm({
  formData,
  locationData,
  onInputChange,
  onOpenMeteoDataLoad,
}: WeatherDataFormProps) {
  const [solarRadiationType, setSolarRadiationType] = useState<'MJ' | 'lux'>('MJ');
  const [isLoadingWeatherData, setIsLoadingWeatherData] = useState(false);
  const [lastFetchedDate, setLastFetchedDate] = useState<string | null>(null);

  const fetchOpenMeteoWeather = useCallback(async () => {
    if (!locationData?.latitude || !locationData?.longitude || !formData.date) {
      return;
    }

    setIsLoadingWeatherData(true);
    try {
      const lat = parseFloat(locationData.latitude);
      const lon = parseFloat(locationData.longitude);
      
      const weatherData = await OpenMeteoWeatherService.getWeatherData(lat, lon, formData.date, formData.date);
      
      if (weatherData.length > 0) {
        const dayData = weatherData[0];
        const convertedData = OpenMeteoWeatherService.convertToETcWeatherData(dayData);
        
        // Update form with Open-Meteo data
        onInputChange('temperatureMax', convertedData.temperatureMax.toString());
        onInputChange('temperatureMin', convertedData.temperatureMin.toString());
        onInputChange('humidity', convertedData.humidity.toString());
        onInputChange('windSpeed', convertedData.windSpeed.toString());
        onInputChange('rainfall', convertedData.rainfall.toString());
        onInputChange('solarRadiation', convertedData.solarRadiation.toString());
        onInputChange('sunshineHours', convertedData.sunshineHours.toString());
        
        setLastFetchedDate(formData.date);
        
        // Notify parent component about Open-Meteo data for validation
        if (onOpenMeteoDataLoad) {
          onOpenMeteoDataLoad(dayData);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching Open-Meteo weather data:', error);
      }
    } finally {
      setIsLoadingWeatherData(false);
    }
  }, [locationData, formData.date, onInputChange, onOpenMeteoDataLoad]);

  const hasLocationAndDate = locationData?.latitude && locationData?.longitude && formData.date;
  const hasDataChanged = lastFetchedDate !== formData.date;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base">Weather Data</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasLocationAndDate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchOpenMeteoWeather}
                disabled={isLoadingWeatherData || (!hasDataChanged && Boolean(lastFetchedDate))}
                className="h-8 px-3 text-xs"
              >
                {isLoadingWeatherData ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <CloudSun className="w-3 h-3 mr-1" />
                )}
                Auto-fetch
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">Required</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {hasLocationAndDate 
            ? `Weather conditions for ${locationData?.locationName || 'selected location'} on ${formData.date || 'selected date'}`
            : 'Enter location and date to auto-fetch weather data, or input manually'
          }
        </CardDescription>
        
        {lastFetchedDate && (
          <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-xs text-blue-800">
              <Download className="w-3 h-3" />
              <span>Data loaded from Open-Meteo for {lastFetchedDate}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => onInputChange('date', e.target.value)}
              className="h-11 text-base mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Max Temp (°C)</Label>
              <Input
                type="number"
                placeholder="35"
                value={formData.temperatureMax}
                onChange={(e) => onInputChange('temperatureMax', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Min Temp (°C)</Label>
              <Input
                type="number"
                placeholder="22"
                value={formData.temperatureMin}
                onChange={(e) => onInputChange('temperatureMin', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Humidity (%)</Label>
              <Input
                type="number"
                placeholder="65"
                min="0"
                max="100"
                value={formData.humidity}
                onChange={(e) => onInputChange('humidity', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Wind (m/s)</Label>
              <Input
                type="number"
                placeholder="2.5"
                step="0.1"
                value={formData.windSpeed}
                onChange={(e) => onInputChange('windSpeed', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Rainfall (mm) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              placeholder="0"
              step="0.1"
              min="0"
              max="500"
              value={formData.rainfall}
              onChange={(e) => onInputChange('rainfall', e.target.value)}
              className="h-11 text-base mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter 0 if no rain today</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Solar Radiation <span className="text-red-500">*</span></Label>
                <Select value={solarRadiationType} onValueChange={(value: 'MJ' | 'lux') => setSolarRadiationType(value)}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MJ">MJ/m²</SelectItem>
                    <SelectItem value="lux">Lux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {solarRadiationType === 'MJ' ? (
                <Input
                  type="number"
                  placeholder="25.5"
                  step="0.1"
                  min="0"
                  max="45"
                  value={formData.solarRadiation}
                  onChange={(e) => onInputChange('solarRadiation', e.target.value)}
                  className="h-11 text-base"
                  required
                />
              ) : (
                <Input
                  type="number"
                  placeholder="50000"
                  step="100"
                  min="0"
                  max="150000"
                  value={formData.solarRadiationLux}
                  onChange={(e) => onInputChange('solarRadiationLux', e.target.value)}
                  className="h-11 text-base"
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {solarRadiationType === 'MJ' 
                  ? 'Direct solar radiation measurement (MJ/m²/day)'
                  : 'Light intensity in lux (0-150,000 typical range)'
                }
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Sunshine Hours - Alternative</Label>
              <Input
                type="number"
                placeholder="8.5"
                step="0.1"
                min="0"
                max="16"
                value={formData.sunshineHours}
                onChange={(e) => onInputChange('sunshineHours', e.target.value)}
                className="h-11 text-base mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Alternative to solar radiation - hours of bright sunshine per day</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}