import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wind } from 'lucide-react';

interface LocationFormProps {
  formData: {
    latitude: string;
    longitude: string;
    elevation: string;
  };
  activeSection: 'weather' | 'crop' | 'location';
  onInputChange: (field: string, value: string) => void;
  onSectionToggle: (section: 'weather' | 'crop' | 'location') => void;
}

export function LocationForm({
  formData,
  activeSection,
  onInputChange,
  onSectionToggle
}: LocationFormProps) {
  return (
    <Card>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => onSectionToggle('location')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">Location (Optional)</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">Optional</Badge>
        </div>
        <CardDescription className="text-xs">
          Geographic coordinates for more accuracy
        </CardDescription>
      </CardHeader>
      
      {activeSection === 'location' && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Latitude</Label>
              <Input
                type="number"
                placeholder="19.0760"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => onInputChange('latitude', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Longitude</Label>
              <Input
                type="number"
                placeholder="72.8777"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => onInputChange('longitude', e.target.value)}
                className="h-11 text-base mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Elevation (m)</Label>
            <Input
              type="number"
              placeholder="500"
              value={formData.elevation}
              onChange={(e) => onInputChange('elevation', e.target.value)}
              className="h-11 text-base mt-1"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}