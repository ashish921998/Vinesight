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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Activity,
  Beaker,
  DollarSign,
  TestTube
} from "lucide-react";
import { SupabaseService } from "@/lib/supabase-service";
import { type Farm } from "@/lib/supabase";

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
  const [showFertigationModal, setShowFertigationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSoilTestModal, setShowSoilTestModal] = useState(false);
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

  const [fertigationForm, setFertigationForm] = useState({
    fertilizer: "",
    quantity: "",
    notes: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    description: "",
    notes: ""
  });

  const [soilTestForm, setSoilTestForm] = useState({
    testType: "",
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organic_matter: "",
    recommendations: "",
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
      const data = await SupabaseService.getDashboardSummary(farmId);
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
      await SupabaseService.completeTask(taskId);
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

  const handleFertigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fertigationForm.fertilizer || !fertigationForm.quantity) return;
    
    setIsSubmitting(true);
    try {
      await SupabaseService.addFertigationRecord({
        farm_id: farmId,
        date: new Date().toISOString().split('T')[0],
        fertilizer: fertigationForm.fertilizer,
        dose: fertigationForm.quantity,
        purpose: "", // Default value
        area: 0, // Default value
        notes: fertigationForm.notes
      });
      
      setFertigationForm({ fertilizer: "", quantity: "", notes: "" });
      setShowFertigationModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging fertigation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.description) return;
    
    setIsSubmitting(true);
    try {
      await SupabaseService.addExpenseRecord({
        farm_id: farmId,
        date: new Date().toISOString().split('T')[0],
        type: expenseForm.category as 'labor' | 'materials' | 'equipment' | 'other',
        description: expenseForm.description,
        cost: parseFloat(expenseForm.amount),
        remarks: expenseForm.notes
      });
      
      setExpenseForm({ amount: "", category: "", description: "", notes: "" });
      setShowExpenseModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoilTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soilTestForm.testType) return;
    
    setIsSubmitting(true);
    try {
      // Build parameters object from form data
      const parameters: Record<string, number> = {};
      if (soilTestForm.ph) parameters.pH = parseFloat(soilTestForm.ph);
      if (soilTestForm.nitrogen) parameters.N = parseFloat(soilTestForm.nitrogen);
      if (soilTestForm.phosphorus) parameters.P = parseFloat(soilTestForm.phosphorus);
      if (soilTestForm.potassium) parameters.K = parseFloat(soilTestForm.potassium);
      if (soilTestForm.organic_matter) parameters.organic_matter = parseFloat(soilTestForm.organic_matter);
      
      await SupabaseService.addSoilTestRecord({
        farm_id: farmId,
        date: new Date().toISOString().split('T')[0],
        parameters,
        recommendations: soilTestForm.recommendations,
        notes: `Test Type: ${soilTestForm.testType}${soilTestForm.notes ? ` | ${soilTestForm.notes}` : ''}`
      });
      
      setSoilTestForm({ 
        testType: "", ph: "", nitrogen: "", phosphorus: "", potassium: "", 
        organic_matter: "", recommendations: "", notes: "" 
      });
      setShowSoilTestModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error logging soil test:", error);
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
              <div className="text-xs text-green-600 mt-1">{farm.grape_variety}</div>
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
                {Math.floor((Date.now() - new Date(farm.planting_date).getTime()) / (1000 * 60 * 60 * 24 * 365))}
              </div>
              <div className="text-sm text-gray-500">years old</div>
              <div className="text-xs text-green-600 mt-1">
                since {new Date(farm.planting_date).getFullYear()}
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
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <SprayCan className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Pest & Disease Control</div>
                  <div className="text-xs text-gray-500 mt-1">Foliar spray application</div>
                </CardContent>
              </Card>
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowFertigationModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Beaker className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Fertilizer Application</div>
                  <div className="text-xs text-gray-500 mt-1">Through irrigation system</div>
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
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowExpenseModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Track Expenses</div>
                  <div className="text-xs text-gray-500 mt-1">Labor & material costs</div>
                </CardContent>
              </Card>
              <Card 
                className="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transform"
                onClick={() => setShowSoilTestModal(true)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TestTube className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Soil Testing</div>
                  <div className="text-xs text-gray-500 mt-1">Lab results & analysis</div>
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
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SprayCan className="h-8 w-8 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Pest & Disease Control
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log foliar spray/pesticide application for {dashboardData.farm?.name}
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
                {isSubmitting ? "Saving..." : "Log Application"}
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

      {/* Fertigation Modal */}
      <Dialog open={showFertigationModal} onOpenChange={setShowFertigationModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beaker className="h-8 w-8 text-purple-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Fertilizer Application
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log fertigation/fertilizer through irrigation system for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFertigationSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="fertilizer" className="text-sm font-medium text-gray-700">Fertilizer/Chemical</Label>
              <Input
                id="fertilizer"
                value={fertigationForm.fertilizer}
                onChange={(e) => setFertigationForm(prev => ({ ...prev, fertilizer: e.target.value }))}
                placeholder="e.g., NPK 19:19:19, Urea, DAP"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                value={fertigationForm.quantity}
                onChange={(e) => setFertigationForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="10"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fertigation-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="fertigation-notes"
                value={fertigationForm.notes}
                onChange={(e) => setFertigationForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Growth stage, concentration, application method"
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFertigationModal(false)}
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
                {isSubmitting ? "Saving..." : "Log Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Track Expenses
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log farm expenses and costs for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="1000"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12">
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor & Workers</SelectItem>
                  <SelectItem value="materials">Materials & Inputs</SelectItem>
                  <SelectItem value="fuel">Fuel & Transport</SelectItem>
                  <SelectItem value="equipment">Equipment & Tools</SelectItem>
                  <SelectItem value="services">Services & Consultation</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure & Repairs</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Input
                id="description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Pruning labor, Fertilizer purchase"
                required
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="expense-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., 5 workers for 8 hours, receipt number, vendor details"
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExpenseModal(false)}
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
                {isSubmitting ? "Saving..." : "Log Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soil Test Modal */}
      <Dialog open={showSoilTestModal} onOpenChange={setShowSoilTestModal}>
        <DialogContent className="sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Soil/Water/Plant Testing
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Log laboratory test results for {dashboardData.farm?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSoilTestSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Test Type</Label>
              <Select
                value={soilTestForm.testType}
                onValueChange={(value) => setSoilTestForm(prev => ({ ...prev, testType: value }))}
              >
                <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soil">Soil Analysis</SelectItem>
                  <SelectItem value="water">Water Quality</SelectItem>
                  <SelectItem value="plant">Plant Tissue</SelectItem>
                  <SelectItem value="compost">Compost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph" className="text-sm font-medium text-gray-700">pH Level (optional)</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={soilTestForm.ph}
                onChange={(e) => setSoilTestForm(prev => ({ ...prev, ph: e.target.value }))}
                placeholder="6.5"
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nitrogen" className="text-sm font-medium text-gray-700">Nitrogen (ppm)</Label>
                <Input
                  id="nitrogen"
                  type="number"
                  step="0.1"
                  min="0"
                  value={soilTestForm.nitrogen}
                  onChange={(e) => setSoilTestForm(prev => ({ ...prev, nitrogen: e.target.value }))}
                  placeholder="20"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phosphorus" className="text-sm font-medium text-gray-700">Phosphorus (ppm)</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  step="0.1"
                  min="0"
                  value={soilTestForm.phosphorus}
                  onChange={(e) => setSoilTestForm(prev => ({ ...prev, phosphorus: e.target.value }))}
                  placeholder="15"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="potassium" className="text-sm font-medium text-gray-700">Potassium (ppm)</Label>
                <Input
                  id="potassium"
                  type="number"
                  step="0.1"
                  min="0"
                  value={soilTestForm.potassium}
                  onChange={(e) => setSoilTestForm(prev => ({ ...prev, potassium: e.target.value }))}
                  placeholder="200"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organic_matter" className="text-sm font-medium text-gray-700">Organic Matter (%)</Label>
                <Input
                  id="organic_matter"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={soilTestForm.organic_matter}
                  onChange={(e) => setSoilTestForm(prev => ({ ...prev, organic_matter: e.target.value }))}
                  placeholder="3.5"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations" className="text-sm font-medium text-gray-700">Lab Recommendations (optional)</Label>
              <Textarea
                id="recommendations"
                value={soilTestForm.recommendations}
                onChange={(e) => setSoilTestForm(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="e.g., Add lime to increase pH, apply phosphorus fertilizer"
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soil-notes" className="text-sm font-medium text-gray-700">Notes (optional)</Label>
              <Textarea
                id="soil-notes"
                value={soilTestForm.notes}
                onChange={(e) => setSoilTestForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Lab name, sample location, additional observations"
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-16 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSoilTestModal(false)}
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
                {isSubmitting ? "Saving..." : "Log Test Results"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}