import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Info } from 'lucide-react';
import type { Farm } from '@/lib/supabase';

interface DataSourceSelectorProps {
  user: any;
  farms: Farm[];
  selectedFarm: Farm | null;
  useCustomData: boolean;
  onFarmSelect: (farm: Farm) => void;
  onDataSourceChange: (useCustom: boolean) => void;
}

export function DataSourceSelector({
  user,
  farms,
  selectedFarm,
  useCustomData,
  onFarmSelect,
  onDataSourceChange
}: DataSourceSelectorProps) {
  return (
    <Card className="mx-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Data Source</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={useCustomData ? "default" : "ghost"}
              size="sm"
              onClick={() => onDataSourceChange(true)}
              className="text-xs px-3 py-1"
            >
              Manual
            </Button>
            {user && (
              <Button
                variant={!useCustomData ? "default" : "ghost"}
                size="sm"
                onClick={() => onDataSourceChange(false)}
                className="text-xs px-3 py-1"
              >
                My Farms
              </Button>
            )}
          </div>
        </div>

        {!useCustomData && user ? (
          <div className="space-y-2">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFarm?.id === farm.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onFarmSelect(farm)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{farm.name}</h4>
                    <p className="text-xs text-gray-500">{farm.region} • {farm.area}ha</p>
                  </div>
                  {selectedFarm?.id === farm.id && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
            {farms.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No farms found. Switch to Manual mode.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <Info className="h-4 w-4" />
              <span className="font-medium text-sm">Manual Entry Mode</span>
            </div>
            <p className="text-green-600 text-xs mt-1">
              {!user 
                ? "No sign-in required - enter your data below."
                : "Using manual data entry mode."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}