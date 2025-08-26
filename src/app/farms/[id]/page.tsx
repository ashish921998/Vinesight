"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Droplets, 
  SprayCan, 
  Scissors, 
  CheckSquare, 
  TrendingUp,
  Calendar,
  MapPin,
  Grape,
  MoreHorizontal,
  Clock,
  Target,
  Activity
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
  
  // Modal states
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showSprayModal, setShowSprayModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data states
  const [irrigationForm, setIrrigationForm] = useState({
    duration: "",
    notes: ""
  });
  
  const [sprayForm, setSprayForm] = useState({
    product: "",
    notes: ""
  });
  
  const [harvestForm, setHarvestForm] = useState({
    quantity: "",
    notes: ""
  });

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

  // Form submission handlers
  const handleIrrigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!irrigationForm.duration) return;
    
    setIsSubmitting(true);
    try {
      // Here you would call your API to save irrigation data
      console.log("Irrigation logged:", {
        farmId,
        duration: parseFloat(irrigationForm.duration),
        notes: irrigationForm.notes,
        date: new Date().toISOString()
      });
      
      // Reset form and close modal
      setIrrigationForm({ duration: "", notes: "" });
      setShowIrrigationModal(false);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error logging irrigation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpraySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprayForm.product) return;
    
    setIsSubmitting(true);
    try {
      console.log("Spray logged:", {
        farmId,
        product: sprayForm.product,
        notes: sprayForm.notes,
        date: new Date().toISOString()
      });
      
      setSprayForm({ product: "", notes: "" });
      setShowSprayModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging spray:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestForm.quantity) return;
    
    setIsSubmitting(true);
    try {
      console.log("Harvest logged:", {
        farmId,
        quantity: parseFloat(harvestForm.quantity),
        notes: harvestForm.notes,
        date: new Date().toISOString()
      });
      
      setHarvestForm({ quantity: "", notes: "" });
      setShowHarvestModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging harvest:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData.farm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grape className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Farm not found</h2>
          <p className="text-gray-500 mb-6">The requested farm could not be found.</p>
          <Button onClick={() => window.history.back()} className="h-12 px-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { farm, pendingTasksCount, recentIrrigations, totalHarvest, pendingTasks } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="h-10 w-10 p-0 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Grape className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-gray-900 truncate">{farm.name}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{farm.region}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{farm.area}</div>
              <div className="text-sm text-gray-500">hectares</div>
              <div className="text-xs text-green-600 mt-1">{farm.grapeVariety}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{totalHarvest}</div>
              <div className="text-sm text-gray-500">kg harvest</div>
              <div className="text-xs text-green-600 mt-1">this season</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{pendingTasksCount}</div>
              <div className="text-sm text-gray-500">pending tasks</div>
              <div className="text-xs text-green-600 mt-1">due soon</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.floor((Date.now() - new Date(farm.plantingDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}
              </div>
              <div className="text-sm text-gray-500">years old</div>
              <div className="text-xs text-green-600 mt-1">
                since {new Date(farm.plantingDate).getFullYear()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Log your daily farm activities
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowIrrigationModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Droplets className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Add Irrigation</div>
                </CardContent>
              </Card>
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowSprayModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <SprayCan className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Record Spray</div>
                </CardContent>
              </Card>
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowHarvestModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Scissors className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Add Harvest</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">View Analytics</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-green-600" />
              </div>
              Pending Tasks
              {pendingTasksCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {pendingTasksCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{task.title}</h4>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeTask(task.id)}
                      className="ml-2 h-8 px-3 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <Button variant="ghost" className="w-full mt-3 text-sm">
                    View all {pendingTasks.length} tasks
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400">No pending tasks</p>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentIrrigations.length > 0 ? (
              <div className="space-y-3">
                {recentIrrigations.slice(0, 3).map((irrigation, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Droplets className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900">Irrigation</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(irrigation.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {irrigation.growthStage} • {irrigation.duration}h • {irrigation.area}ha
                      </p>
                    </div>
                  </div>
                ))}
                {recentIrrigations.length > 3 && (
                  <Button variant="ghost" className="w-full mt-3 text-sm">
                    View all activities
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No recent activities</p>
                <p className="text-xs text-gray-400">Start logging your farm activities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Irrigation Modal */}
      <Dialog open={showIrrigationModal} onOpenChange={setShowIrrigationModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Irrigation
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log irrigation activity for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIrrigationSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium text-gray-700">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                step="0.5"
                min="0.5"
                value={irrigationForm.duration}
                onChange={(e) => setIrrigationForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="2.5"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="irrigation-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="irrigation-notes"
                value={irrigationForm.notes}
                onChange={(e) => setIrrigationForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Drip irrigation, fruit development stage"
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIrrigationModal(false)}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Log Irrigation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Spray Modal */}
      <Dialog open={showSprayModal} onOpenChange={setShowSprayModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SprayCan className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Record Spray
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log spray/pesticide application for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSpraySubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="product" className="text-sm font-medium text-gray-700">Product/Chemical</Label>
              <Input
                id="product"
                value={sprayForm.product}
                onChange={(e) => setSprayForm(prev => ({ ...prev, product: e.target.value }))}
                placeholder="e.g., Fungicide, Insecticide name"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spray-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="spray-notes"
                value={sprayForm.notes}
                onChange={(e) => setSprayForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Concentration, weather conditions, target pest/disease"
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSprayModal(false)}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Log Spray"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Harvest Modal */}
      <Dialog open={showHarvestModal} onOpenChange={setShowHarvestModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Harvest
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log harvest data for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHarvestSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                value={harvestForm.quantity}
                onChange={(e) => setHarvestForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="100"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="harvest-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="harvest-notes"
                value={harvestForm.notes}
                onChange={(e) => setHarvestForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Quality grade, market destination, storage location"
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHarvestModal(false)}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Log Harvest"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}