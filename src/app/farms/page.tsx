"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Sprout, Loader2, MapPin, Calendar, MoreVertical, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HybridDataService } from "@/lib/hybrid-data-service";
import type { Farm } from "@/lib/supabase";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      const farmList = await HybridDataService.getAllFarms();
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
        await HybridDataService.updateFarm(editingFarm.id!, {
          name: formData.name,
          region: formData.region,
          area: parseFloat(formData.area),
          grape_variety: formData.grape_variety,
          planting_date: formData.planting_date,
          vine_spacing: parseFloat(formData.vine_spacing),
          row_spacing: parseFloat(formData.row_spacing)
        });
      } else {
        await HybridDataService.createFarm({
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
        await HybridDataService.deleteFarm(id);
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
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-green-600" />
                  My Farms
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {farms.length} {farms.length === 1 ? 'vineyard' : 'vineyards'}
                </p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="h-9 px-3 text-sm font-medium bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Farm
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {showAddForm && (
            <Card className="mb-4 border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {editingFarm ? "Edit Farm" : "Add New Farm"}
                </CardTitle>
                <CardDescription className="text-sm">
                  Enter your vineyard details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Farm Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Nashik Vineyard"
                        required
                        className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region" className="text-sm font-medium text-gray-700">Region</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) => handleInputChange("region", e.target.value)}
                        placeholder="e.g., Nashik, Maharashtra"
                        required
                        className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="area" className="text-sm font-medium text-gray-700">Area (ha)</Label>
                        <Input
                          id="area"
                          type="number"
                          step="0.1"
                          value={formData.area}
                          onChange={(e) => handleInputChange("area", e.target.value)}
                          placeholder="2.5"
                          required
                          className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="grape_variety" className="text-sm font-medium text-gray-700">Variety</Label>
                        <Input
                          id="grape_variety"
                          value={formData.grape_variety}
                          onChange={(e) => handleInputChange("grape_variety", e.target.value)}
                          placeholder="Thompson Seedless"
                          required
                          className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="planting_date" className="text-sm font-medium text-gray-700">Planting Date</Label>
                      <Input
                        id="planting_date"
                        type="date"
                        value={formData.planting_date}
                        onChange={(e) => handleInputChange("planting_date", e.target.value)}
                        required
                        className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="vine_spacing" className="text-sm font-medium text-gray-700">Vine Spacing (m)</Label>
                        <Input
                          id="vine_spacing"
                          type="number"
                          step="0.1"
                          value={formData.vine_spacing}
                          onChange={(e) => handleInputChange("vine_spacing", e.target.value)}
                          placeholder="3"
                          required
                          className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="row_spacing" className="text-sm font-medium text-gray-700">Row Spacing (m)</Label>
                        <Input
                          id="row_spacing"
                          type="number"
                          step="0.1"
                          value={formData.row_spacing}
                          onChange={(e) => handleInputChange("row_spacing", e.target.value)}
                          placeholder="9"
                          required
                          className="h-12 text-base mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm} 
                      disabled={submitLoading} 
                      className="flex-1 h-12 border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitLoading} 
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingFarm ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        editingFarm ? "Update Farm" : "Add Farm"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {loading ? (
              // Modern skeleton loading
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-12 mx-auto"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-8 mx-auto"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-3 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-6 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              farms.map((farm) => (
                <Card key={farm.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <CardContent className="p-0">
                    <Link href={`/farms/${farm.id}`} className="block">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Sprout className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate">{farm.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{farm.region}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0 min-w-[60px]">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                                <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleEdit(farm);}}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Farm
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {e.preventDefault(); handleDelete(farm.id!);}}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Farm
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{farm.area}</div>
                              <div className="text-xs text-gray-500">hectares</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{farm.grape_variety}</div>
                              <div className="text-xs text-gray-500">variety</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {Math.floor((Date.now() - new Date(farm.planting_date).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                              </div>
                              <div className="text-xs text-gray-500">years old</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
            
            {!loading && farms.length === 0 && !showAddForm && (
              <Card className="border-0 shadow-sm text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sprout className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No farms added yet</h3>
                  <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                    Start by adding your first vineyard to begin tracking your farming operations
                  </p>
                  <Button 
                    onClick={() => setShowAddForm(true)} 
                    className="h-12 px-6 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Farm
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}