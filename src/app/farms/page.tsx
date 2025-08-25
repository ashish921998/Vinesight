"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Sprout } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupabaseService } from "@/lib/supabase-service";
import type { Farm } from "@/lib/supabase";

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
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
      const farmList = await SupabaseService.getAllFarms();
      setFarms(farmList);
    } catch (error) {
      console.error("Error loading farms:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Sprout className="h-8 w-8" />
            Farm Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your grape farms and vineyard details
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Farm
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingFarm ? "Edit Farm" : "Add New Farm"}
            </CardTitle>
            <CardDescription>
              Enter the details of your vineyard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Farm Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Nashik Vineyard"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange("region", e.target.value)}
                    placeholder="e.g., Nashik, Maharashtra"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="area">Area (hectares)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grape_variety">Grape Variety</Label>
                  <Input
                    id="grape_variety"
                    value={formData.grape_variety}
                    onChange={(e) => handleInputChange("grape_variety", e.target.value)}
                    placeholder="e.g., Thompson Seedless"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="planting_date">Planting Date</Label>
                  <Input
                    id="planting_date"
                    type="date"
                    value={formData.planting_date}
                    onChange={(e) => handleInputChange("planting_date", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vine_spacing">Vine Spacing (meters)</Label>
                  <Input
                    id="vine_spacing"
                    type="number"
                    step="0.1"
                    value={formData.vine_spacing}
                    onChange={(e) => handleInputChange("vine_spacing", e.target.value)}
                    placeholder="e.g., 3"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="row_spacing">Row Spacing (meters)</Label>
                  <Input
                    id="row_spacing"
                    type="number"
                    step="0.1"
                    value={formData.row_spacing}
                    onChange={(e) => handleInputChange("row_spacing", e.target.value)}
                    placeholder="e.g., 9"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingFarm ? "Update Farm" : "Add Farm"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <Card key={farm.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{farm.name}</CardTitle>
                  <CardDescription>{farm.region}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(farm)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(farm.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area:</span>
                  <span>{farm.area} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variety:</span>
                  <span>{farm.grape_variety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planted:</span>
                  <span>{new Date(farm.planting_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spacing:</span>
                  <span>{farm.vine_spacing}m × {farm.row_spacing}m</span>
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = `/farms/${farm.id}`}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {farms.length === 0 && !showAddForm && (
          <Card className="col-span-full text-center py-12">
            <CardContent>
              <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No farms added yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first vineyard to begin tracking operations
              </p>
              <Button onClick={() => setShowAddForm(true)}>
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