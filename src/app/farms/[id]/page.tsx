"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Droplets, 
  SprayCan, 
  Scissors, 
  CheckSquare, 
  TrendingUp,
  Calendar,
  MapPin,
  Grape
} from "lucide-react";
import { DatabaseService, Farm } from "@/lib/db-utils";

interface DashboardData {
  farm: Farm | null;
  pendingTasksCount: number;
  recentIrrigations: any[];
  totalHarvest: number;
  pendingTasks: any[];
}

export default function FarmDetailsPage() {
  const params = useParams();
  const farmId = parseInt(params.id as string);
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    farm: null,
    pendingTasksCount: 0,
    recentIrrigations: [],
    totalHarvest: 0,
    pendingTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmId) {
      loadDashboardData();
    }
  }, [farmId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getDashboardSummary(farmId);
      setDashboardData({
        ...data,
        farm: data.farm || null
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      await DatabaseService.completeTask(taskId);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading farm details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData.farm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Farm not found</h2>
          <p className="text-muted-foreground mb-4">The requested farm could not be found.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { farm, pendingTasksCount, recentIrrigations, totalHarvest, pendingTasks } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Grape className="h-8 w-8" />
            {farm.name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {farm.region}
          </p>
        </div>
      </div>

      {/* Farm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farm.area} ha</div>
            <p className="text-xs text-muted-foreground">
              {farm.grapeVariety}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Harvest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHarvest} kg</div>
            <p className="text-xs text-muted-foreground">
              Current season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">
              Due tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plant Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(farm.plantingDate).getTime()) / (1000 * 60 * 60 * 24 / 365))} yr
            </div>
            <p className="text-xs text-muted-foreground">
              Since {new Date(farm.plantingDate).getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Pending Tasks
            </CardTitle>
            <CardDescription>
              Upcoming farming activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeTask(task.id)}
                      className="ml-2"
                    >
                      Done
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No pending tasks
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Irrigation History
            </CardTitle>
            <CardDescription>
              Latest irrigation activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentIrrigations.length > 0 ? (
              <div className="space-y-4">
                {recentIrrigations.map((irrigation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Droplets className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Irrigation - {irrigation.growthStage}</h4>
                        <p className="text-sm text-muted-foreground">
                          {irrigation.duration}h • {irrigation.area}ha • {irrigation.systemDischarge}L/h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(irrigation.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {irrigation.moistureStatus}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent irrigations recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common farming operations and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Droplets className="h-6 w-6" />
              <span className="text-sm">Add Irrigation</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <SprayCan className="h-6 w-6" />
              <span className="text-sm">Record Spray</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Scissors className="h-6 w-6" />
              <span className="text-sm">Add Harvest</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}