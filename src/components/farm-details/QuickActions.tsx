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
  Plus,
  BarChart3
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  onDataLogsClick: () => void;
}

export function QuickActions({
  onDataLogsClick
}: QuickActionsProps) {
  const router = useRouter();
  const quickActions = [
    {
      title: "Add Data Logs",
      description: "Record all farm activities",
      icon: Plus,
      color: "bg-green-100 text-green-600 hover:bg-green-200",
      onClick: onDataLogsClick,
      featured: true
    },
    {
      title: "View Reports",
      description: "Generate & export reports",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-600 hover:bg-blue-200",
      onClick: () => router.push('/reports')
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <Plus className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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