"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  Droplets,
  Scissors,
  TrendingUp, 
  DollarSign,
  Activity,
  Clock
} from "lucide-react";

interface FarmOverviewProps {
  dashboardData: {
    pendingTasksCount: number;
    totalHarvest: number;
    totalWaterUsage: number;
    recordCounts: {
      irrigation: number;
      spray: number;
      fertigation: number;
      harvest: number;
      expense: number;
      soilTest: number;
    };
  } | null;
  loading: boolean;
}

export function FarmOverview({ dashboardData, loading }: FarmOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Remove the overview cards section - component now returns null
  return null;
}