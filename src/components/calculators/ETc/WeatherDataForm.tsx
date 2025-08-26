import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThermometerSun } from 'lucide-react';

interface WeatherDataFormProps {
  formData: {
    date: string;
    temperatureMax: string;
    temperatureMin: string;
    humidity: string;
    windSpeed: string;
    rainfall: string;
  };
  activeSection: 'weather' | 'crop' | 'location';
  onInputChange: (field: string, value: string) => void;
  onSectionToggle: (section: 'weather' | 'crop' | 'location') => void;
}

export function WeatherDataForm({
  formData,
  activeSection,
  onInputChange,
  onSectionToggle
}: WeatherDataFormProps) {
  return (
    <Card>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => onSectionToggle('weather')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base">Weather Data</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">Required</Badge>
        </div>
        <CardDescription className="text-xs">
          Current weather conditions for your location
        </CardDescription>
      </CardHeader>
      
      {activeSection === 'weather' && (
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
              <Label className="text-sm font-medium text-gray-700">Rainfall (mm) - Optional</Label>
              <Input
                type="number"
                placeholder="0"
                step="0.1"
                value={formData.rainfall}
                onChange={(e) => onInputChange('rainfall', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}