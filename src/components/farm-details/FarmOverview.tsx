"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Droplets, 
  SprayCan, 
  Scissors, 
  CheckSquare, 
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

  if (!dashboardData) return null;

  const overviewCards = [
    {
      title: "Pending Tasks",
      value: dashboardData.pendingTasksCount,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
      suffix: "tasks"
    },
    {
      title: "Irrigations",
      value: dashboardData.recordCounts.irrigation,
      icon: Activity,
      color: "bg-blue-100 text-blue-600",
      suffix: "logs"
    },
    {
      title: "Water Usage",
      value: Math.round(dashboardData.totalWaterUsage / 1000), // Convert to thousands of liters
      icon: Droplets,
      color: "bg-cyan-100 text-cyan-600",
      suffix: "k liters"
    },
    {
      title: "Total Harvest",
      value: dashboardData.totalHarvest,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      suffix: "kg"
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Farm Overview</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {card.suffix}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-gray-700 mt-2">
                  {card.title}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Scissors className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Harvest</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {dashboardData.recordCounts.harvest}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Expenses</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {dashboardData.recordCounts.expense}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Tests</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {dashboardData.recordCounts.soilTest}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}