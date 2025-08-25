"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Sprout, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupabaseService } from "@/lib/supabase-service";
import type { Farm } from "@/lib/supabase";

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    area: "",
    grape_variety: "",
    planting_date: "",
    vine_spacing: "",
    row_spacing: ""
  });

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const farmList = await SupabaseService.getAllFarms();
      setFarms(farmList);
    } catch (error) {
      console.error("Error loading farms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitLoading(true);
      if (editingFarm) {
        await SupabaseService.updateFarm(editingFarm.id!, {
          name: formData.name,
          region: formData.region,
          area: parseFloat(formData.area),
          grape_variety: formData.grape_variety,
          planting_date: formData.planting_date,
          vine_spacing: parseFloat(formData.vine_spacing),
          row_spacing: parseFloat(formData.row_spacing)
        });
      } else {
        await SupabaseService.createFarm({
          name: formData.name,
          region: formData.region,
          area: parseFloat(formData.area),
          grape_variety: formData.grape_variety,
          planting_date: formData.planting_date,
          vine_spacing: parseFloat(formData.vine_spacing),
          row_spacing: parseFloat(formData.row_spacing)
        });
      }
      
      await loadFarms();
      resetForm();
    } catch (error) {
      console.error("Error saving farm:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      region: farm.region,
      area: farm.area.toString(),
      grape_variety: farm.grape_variety,
      planting_date: farm.planting_date,
      vine_spacing: farm.vine_spacing.toString(),
      row_spacing: farm.row_spacing.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this farm? This will also delete all associated records.")) {
      try {
        await SupabaseService.deleteFarm(id);
        await loadFarms();
      } catch (error) {
        console.error("Error deleting farm:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      region: "",
      area: "",
      grape_variety: "",
      planting_date: "",
      vine_spacing: "",
      row_spacing: ""
    });
    setShowAddForm(false);
    setEditingFarm(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <Sprout className="h-6 w-6 sm:h-8 sm:w-8" />
              Farm Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage your grape farms and vineyard details
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 h-12 px-4 w-full sm:w-auto touch-manipulation active:scale-95 transition-transform text-base font-semibold"
          >
            <Plus className="h-5 w-5" />
            Add New Farm
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                {editingFarm ? "Edit Farm" : "Add New Farm"}
              </CardTitle>
              <CardDescription className="text-sm">
                Enter the details of your vineyard
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium">Farm Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., Nashik Vineyard"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="region" className="text-sm font-medium">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleInputChange("region", e.target.value)}
                      placeholder="e.g., Nashik, Maharashtra"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="area" className="text-sm font-medium">Area (hectares)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => handleInputChange("area", e.target.value)}
                      placeholder="e.g., 2.5"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grape_variety" className="text-sm font-medium">Grape Variety</Label>
                    <Input
                      id="grape_variety"
                      value={formData.grape_variety}
                      onChange={(e) => handleInputChange("grape_variety", e.target.value)}
                      placeholder="e.g., Thompson Seedless"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="planting_date" className="text-sm font-medium">Planting Date</Label>
                    <Input
                      id="planting_date"
                      type="date"
                      value={formData.planting_date}
                      onChange={(e) => handleInputChange("planting_date", e.target.value)}
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vine_spacing" className="text-sm font-medium">Vine Spacing (meters)</Label>
                    <Input
                      id="vine_spacing"
                      type="number"
                      step="0.1"
                      value={formData.vine_spacing}
                      onChange={(e) => handleInputChange("vine_spacing", e.target.value)}
                      placeholder="e.g., 3"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="row_spacing" className="text-sm font-medium">Row Spacing (meters)</Label>
                    <Input
                      id="row_spacing"
                      type="number"
                      step="0.1"
                      value={formData.row_spacing}
                      onChange={(e) => handleInputChange("row_spacing", e.target.value)}
                      placeholder="e.g., 9"
                      required
                      className="h-11 text-base"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button type="submit" disabled={submitLoading} className="h-11 flex-1 sm:flex-none">
                    {submitLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingFarm ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editingFarm ? "Update Farm" : "Add Farm"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitLoading} className="h-11 flex-1 sm:flex-none">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            // Skeleton loading cards
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="h-9 w-9 bg-gray-200 rounded"></div>
                      <div className="h-9 w-9 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl truncate">{farm.name}</CardTitle>
                    <CardDescription className="text-sm truncate">{farm.region}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(farm)}
                      className="h-10 w-10 p-0 touch-manipulation active:scale-95 transition-transform"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(farm.id!)}
                      className="h-10 w-10 p-0 touch-manipulation active:scale-95 transition-transform hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-medium">{farm.area} ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variety:</span>
                    <span className="font-medium truncate">{farm.grape_variety}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planted:</span>
                    <span className="font-medium">{new Date(farm.planting_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spacing:</span>
                    <span className="font-medium">{farm.vine_spacing}m × {farm.row_spacing}m</span>
                  </div>
                </div>
                
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base touch-manipulation active:scale-95 transition-transform"
                    onClick={() => window.location.href = `/farms/${farm.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          )}
          
          {!loading && farms.length === 0 && !showAddForm && (
            <Card className="col-span-full text-center py-8 sm:py-12">
              <CardContent>
                <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No farms added yet</h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  Start by adding your first vineyard to begin tracking operations
                </p>
                <Button onClick={() => setShowAddForm(true)} className="h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Farm
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}