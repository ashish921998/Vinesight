"use client";

import { ArrowLeft, MapPin, Calendar, Grape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Farm } from "@/lib/supabase";

interface FarmHeaderProps {
  farm: Farm | null;
  loading: boolean;
  onBack: () => void;
}

export function FarmHeader({ farm, loading, onBack }: FarmHeaderProps) {
  if (loading) {
    return (
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!farm) return null;

  return (
    <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
      <div className="p-6">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="mb-4 text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Farms
        </Button>
        
        {/* Farm Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-2xl">
            <Grape className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{farm.name}</h1>
            
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{farm.region}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Since {new Date(farm.planting_date).getFullYear()}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {farm.grape_variety || 'Grape Vineyard'}
              </Badge>
              
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                {farm.area} hectares
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}