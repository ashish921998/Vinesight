import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets } from 'lucide-react';
import type { GrapeGrowthStage } from '@/lib/etc-calculator';

interface CropInformationFormProps {
  formData: {
    growthStage: GrapeGrowthStage;
    irrigationMethod: 'drip' | 'sprinkler' | 'surface';
    soilType: 'sandy' | 'loamy' | 'clay';
  };
  activeSection: 'weather' | 'crop' | 'location';
  onInputChange: (field: string, value: string) => void;
  onSectionToggle: (section: 'weather' | 'crop' | 'location') => void;
}

const growthStages = [
  { value: 'dormant', label: 'Dormant', period: 'Dec-Jan' },
  { value: 'budbreak', label: 'Bud Break', period: 'Feb-Mar' },
  { value: 'flowering', label: 'Flowering', period: 'Apr-May' },
  { value: 'fruit_set', label: 'Fruit Set', period: 'May-Jun' },
  { value: 'veraison', label: 'Veraison', period: 'Jul-Aug' },
  { value: 'harvest', label: 'Harvest', period: 'Aug-Oct' },
  { value: 'post_harvest', label: 'Post Harvest', period: 'Oct-Nov' }
];

export function CropInformationForm({
  formData,
  activeSection,
  onInputChange,
  onSectionToggle
}: CropInformationFormProps) {
  const selectedGrowthStage = growthStages.find(stage => stage.value === formData.growthStage);

  return (
    <Card>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => onSectionToggle('crop')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base">Crop Information</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">Required</Badge>
        </div>
        <CardDescription className="text-xs">
          Growth stage and farming method details
        </CardDescription>
      </CardHeader>
      
      {activeSection === 'crop' && (
        <CardContent className="pt-0 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Growth Stage</Label>
            <Select
              value={formData.growthStage}
              onValueChange={(value) => onInputChange('growthStage', value)}
            >
              <SelectTrigger className="h-11 text-base mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {growthStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex flex-col">
                      <span>{stage.label}</span>
                      <span className="text-xs text-gray-500">{stage.period}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGrowthStage && (
              <p className="text-xs text-green-600 mt-1">
                {selectedGrowthStage.label} ({selectedGrowthStage.period})
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Irrigation Method</Label>
            <Select
              value={formData.irrigationMethod}
              onValueChange={(value: 'drip' | 'sprinkler' | 'surface') => onInputChange('irrigationMethod', value)}
            >
              <SelectTrigger className="h-11 text-base mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drip">Drip Irrigation</SelectItem>
                <SelectItem value="sprinkler">Sprinkler</SelectItem>
                <SelectItem value="surface">Surface Irrigation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Soil Type</Label>
            <Select
              value={formData.soilType}
              onValueChange={(value: 'sandy' | 'loamy' | 'clay') => onInputChange('soilType', value)}
            >
              <SelectTrigger className="h-11 text-base mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandy">Sandy Soil</SelectItem>
                <SelectItem value="loamy">Loamy Soil</SelectItem>
                <SelectItem value="clay">Clay Soil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}