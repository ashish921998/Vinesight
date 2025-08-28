"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Droplets, 
  SprayCan, 
  Scissors, 
  DollarSign,
  TestTube,
  Beaker,
  Plus
} from "lucide-react";

interface QuickActionsProps {
  onIrrigationClick: () => void;
  onSprayClick: () => void;
  onHarvestClick: () => void;
  onExpenseClick: () => void;
  onFertigationClick: () => void;
  onSoilTestClick: () => void;
}

export function QuickActions({
  onIrrigationClick,
  onSprayClick,
  onHarvestClick,
  onExpenseClick,
  onFertigationClick,
  onSoilTestClick
}: QuickActionsProps) {
  const quickActions = [
    {
      title: "Log Irrigation",
      description: "Record watering details",
      icon: Droplets,
      color: "bg-blue-100 text-blue-600 hover:bg-blue-200",
      onClick: onIrrigationClick
    },
    {
      title: "Spray Record", 
      description: "Log pest/disease treatment",
      icon: SprayCan,
      color: "bg-green-100 text-green-600 hover:bg-green-200",
      onClick: onSprayClick
    },
    {
      title: "Record Harvest",
      description: "Log harvest quantities",
      icon: Scissors,
      color: "bg-purple-100 text-purple-600 hover:bg-purple-200",
      onClick: onHarvestClick
    },
    {
      title: "Add Expense",
      description: "Track farm expenses",
      icon: DollarSign,
      color: "bg-amber-100 text-amber-600 hover:bg-amber-200",
      onClick: onExpenseClick
    },
    {
      title: "Fertigation",
      description: "Log nutrient application",
      icon: Beaker,
      color: "bg-emerald-100 text-emerald-600 hover:bg-emerald-200",
      onClick: onFertigationClick
    },
    {
      title: "Soil Test",
      description: "Record soil analysis",
      icon: TestTube,
      color: "bg-orange-100 text-orange-600 hover:bg-orange-200",
      onClick: onSoilTestClick
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <Plus className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Card 
              key={action.title}
              className="border-gray-200 cursor-pointer hover:border-gray-300 transition-all active:scale-98"
              onClick={action.onClick}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-2xl ${action.color} transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}