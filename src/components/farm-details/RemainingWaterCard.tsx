"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Calculator, Clock } from "lucide-react";
import type { Farm } from "@/types/types";

interface RemainingWaterCardProps {
  farm: Farm;
  onCalculateClick: () => void;
}

export function RemainingWaterCard({ farm, onCalculateClick }: RemainingWaterCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getWaterStatus = (remainingWater: number) => {
    if (remainingWater < 10) return { color: 'text-red-600 bg-red-50 border-red-200', text: 'Low' };
    if (remainingWater < 25) return { color: 'text-orange-600 bg-orange-50 border-orange-200', text: 'Medium' };
    return { color: 'text-green-600 bg-green-50 border-green-200', text: 'Good' };
  };

  // Don't show the card if farm doesn't have tank capacity configured
  if (!farm.totalTankCapacity) {
    return null;
  }

  const hasWaterData = farm.remainingWater !== null && farm.remainingWater !== undefined;
  const status = hasWaterData ? getWaterStatus(farm.remainingWater!) : null;

  return (
    <Card className={`border-0 shadow-sm ${status?.color || 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">Soil Water Level</CardTitle>
          </div>
          {hasWaterData && status && (
            <div className="text-xs font-medium px-2 py-1 rounded-full bg-current/10">
              {status.text}
            </div>
          )}
        </div>
        <CardDescription className="text-xs">
          Tank Capacity: {farm.totalTankCapacity} L
          {farm.waterCalculationUpdatedAt && (
            <span className="ml-2 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Last calculated: {formatDate(farm.waterCalculationUpdatedAt)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {hasWaterData ? (
          <div className="space-y-4">
            {/* Main water level display */}
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {farm.remainingWater!.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                mm available water
              </div>
            </div>

            {/* Status message */}
            <div className="text-center">
              {farm.remainingWater! < 10 && (
                <div className="text-sm text-red-600 font-medium">
                  ⚠️ Low water level - consider irrigation
                </div>
              )}
              {farm.remainingWater! >= 10 && farm.remainingWater! < 25 && (
                <div className="text-sm text-orange-600 font-medium">
                  💧 Medium water level - monitor closely
                </div>
              )}
              {farm.remainingWater! >= 25 && (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Good water level
                </div>
              )}
            </div>

            {/* Update button */}
            <div className="pt-2">
              <Button
                onClick={onCalculateClick}
                variant="outline"
                className="w-full h-10 text-sm"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Update Calculation
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              No water calculation available
            </p>
            <Button
              onClick={onCalculateClick}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Water Level
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}