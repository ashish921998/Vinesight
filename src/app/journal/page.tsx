"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Droplets, 
  SprayCan, 
  Scissors, 
  Plus,
  Calendar,
  IndianRupee
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupabaseService } from "@/lib/supabase-service";
import type { Farm } from "@/lib/supabase";
import { FertigationForm } from "@/components/journal/FertigationForm";
import { ExpenseForm } from "@/components/journal/ExpenseForm";

type RecordType = 'irrigation' | 'spray' | 'fertigation' | 'harvest' | 'expense';

export default function JournalPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<RecordType>('irrigation');
  const [showAddForm, setShowAddForm] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  const [irrigationForm, setIrrigationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: "",
    area: "",
    growthStage: "",
    moistureStatus: "",
    systemDischarge: "",
    notes: ""
  });

  const [sprayForm, setSprayForm] = useState({
    date: new Date().toISOString().split('T')[0],
    pestDisease: "",
    chemical: "",
    dose: "",
    area: "",
    weather: "",
    operator: "",
    notes: ""
  });

  const [harvestForm, setHarvestForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: "",
    grade: "",
    price: "",
    buyer: "",
    notes: ""
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadRecords();
    }
  }, [selectedFarm, activeTab]);

  const loadFarms = async () => {
    try {
      const farmList = await SupabaseService.getAllFarms();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarm) {
        setSelectedFarm(farmList[0]);
      }
    } catch (error) {
      console.error("Error loading farms:", error);
    }
  };

  const loadRecords = async () => {
    if (!selectedFarm) return;
    
    try {
      let recordList: any[] = [];
      switch (activeTab) {
        case 'irrigation':
          recordList = await SupabaseService.getIrrigationRecords(selectedFarm.id!);
          break;
        case 'spray':
          recordList = await SupabaseService.getSprayRecords(selectedFarm.id!);
          break;
        case 'fertigation':
          recordList = await SupabaseService.getFertigationRecords(selectedFarm.id!);
          break;
        case 'harvest':
          recordList = await SupabaseService.getHarvestRecords(selectedFarm.id!);
          break;
        case 'expense':
          recordList = await SupabaseService.getExpenseRecords(selectedFarm.id!);
          break;
      }
      setRecords(recordList);
    } catch (error) {
      console.error("Error loading records:", error);
    }
  };

  const handleSubmitIrrigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm) return;

    try {
      await SupabaseService.addIrrigationRecord({
        farm_id: selectedFarm.id!,
        date: irrigationForm.date,
        duration: parseFloat(irrigationForm.duration),
        area: parseFloat(irrigationForm.area),
        growth_stage: irrigationForm.growthStage,
        moisture_status: irrigationForm.moistureStatus,
        system_discharge: parseFloat(irrigationForm.systemDischarge),
        notes: irrigationForm.notes
      });
      
      resetForms();
      await loadRecords();
    } catch (error) {
      console.error("Error adding irrigation record:", error);
    }
  };

  const handleSubmitSpray = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm) return;

    try {
      await SupabaseService.addSprayRecord({
        farm_id: selectedFarm.id!,
        date: sprayForm.date,
        pest_disease: sprayForm.pestDisease,
        chemical: sprayForm.chemical,
        dose: sprayForm.dose,
        area: parseFloat(sprayForm.area),
        weather: sprayForm.weather,
        operator: sprayForm.operator,
        notes: sprayForm.notes
      });
      
      resetForms();
      await loadRecords();
    } catch (error) {
      console.error("Error adding spray record:", error);
    }
  };

  const handleSubmitHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm) return;

    try {
      await SupabaseService.addHarvestRecord({
        farm_id: selectedFarm.id!,
        date: harvestForm.date,
        quantity: parseFloat(harvestForm.quantity),
        grade: harvestForm.grade,
        price: harvestForm.price ? parseFloat(harvestForm.price) : undefined,
        buyer: harvestForm.buyer,
        notes: harvestForm.notes
      });
      
      resetForms();
      await loadRecords();
    } catch (error) {
      console.error("Error adding harvest record:", error);
    }
  };

  const resetForms = () => {
    setShowAddForm(false);
    setIrrigationForm({
      date: new Date().toISOString().split('T')[0],
      duration: "",
      area: "",
      growthStage: "",
      moistureStatus: "",
      systemDischarge: "",
      notes: ""
    });
    setSprayForm({
      date: new Date().toISOString().split('T')[0],
      pestDisease: "",
      chemical: "",
      dose: "",
      area: "",
      weather: "",
      operator: "",
      notes: ""
    });
    setHarvestForm({
      date: new Date().toISOString().split('T')[0],
      quantity: "",
      grade: "",
      price: "",
      buyer: "",
      notes: ""
    });
  };

  const tabs = [
    { id: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-blue-600' },
    { id: 'spray', label: 'Spray/Pesticide', icon: SprayCan, color: 'text-green-600' },
    { id: 'fertigation', label: 'Fertigation', icon: SprayCan, color: 'text-purple-600' },
    { id: 'harvest', label: 'Harvest', icon: Scissors, color: 'text-orange-600' },
    { id: 'expense', label: 'Expenses', icon: IndianRupee, color: 'text-red-600' }
  ];

  const IrrigationForm = () => (
    <form onSubmit={handleSubmitIrrigation} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={irrigationForm.date}
            onChange={(e) => setIrrigationForm(prev => ({...prev, date: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (hours)</Label>
          <Input
            id="duration"
            type="number"
            step="0.1"
            placeholder="e.g., 4"
            value={irrigationForm.duration}
            onChange={(e) => setIrrigationForm(prev => ({...prev, duration: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="area">Area Irrigated (ha)</Label>
          <Input
            id="area"
            type="number"
            step="0.1"
            placeholder="e.g., 2.5"
            value={irrigationForm.area}
            onChange={(e) => setIrrigationForm(prev => ({...prev, area: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="growthStage">Growth Stage</Label>
          <Input
            id="growthStage"
            placeholder="e.g., Fruit Development"
            value={irrigationForm.growthStage}
            onChange={(e) => setIrrigationForm(prev => ({...prev, growthStage: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="moistureStatus">Moisture Status</Label>
          <Input
            id="moistureStatus"
            placeholder="e.g., Dry, Moderate"
            value={irrigationForm.moistureStatus}
            onChange={(e) => setIrrigationForm(prev => ({...prev, moistureStatus: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="systemDischarge">System Discharge (L/h)</Label>
          <Input
            id="systemDischarge"
            type="number"
            placeholder="e.g., 150"
            value={irrigationForm.systemDischarge}
            onChange={(e) => setIrrigationForm(prev => ({...prev, systemDischarge: e.target.value}))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Additional observations or remarks"
          value={irrigationForm.notes}
          onChange={(e) => setIrrigationForm(prev => ({...prev, notes: e.target.value}))}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Irrigation Record</Button>
        <Button type="button" variant="outline" onClick={resetForms}>Cancel</Button>
      </div>
    </form>
  );

  const SprayForm = () => (
    <form onSubmit={handleSubmitSpray} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sprayDate">Date</Label>
          <Input
            id="sprayDate"
            type="date"
            value={sprayForm.date}
            onChange={(e) => setSprayForm(prev => ({...prev, date: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="pestDisease">Pest/Disease</Label>
          <Input
            id="pestDisease"
            placeholder="e.g., Powdery Mildew"
            value={sprayForm.pestDisease}
            onChange={(e) => setSprayForm(prev => ({...prev, pestDisease: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="chemical">Chemical/Treatment</Label>
          <Input
            id="chemical"
            placeholder="e.g., Sulfur Dust"
            value={sprayForm.chemical}
            onChange={(e) => setSprayForm(prev => ({...prev, chemical: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="dose">Dose</Label>
          <Input
            id="dose"
            placeholder="e.g., 2kg/acre"
            value={sprayForm.dose}
            onChange={(e) => setSprayForm(prev => ({...prev, dose: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="sprayArea">Area Treated (ha)</Label>
          <Input
            id="sprayArea"
            type="number"
            step="0.1"
            placeholder="e.g., 2.5"
            value={sprayForm.area}
            onChange={(e) => setSprayForm(prev => ({...prev, area: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="weather">Weather Conditions</Label>
          <Input
            id="weather"
            placeholder="e.g., Clear, Low humidity"
            value={sprayForm.weather}
            onChange={(e) => setSprayForm(prev => ({...prev, weather: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="operator">Operator</Label>
          <Input
            id="operator"
            placeholder="e.g., Ramesh Kumar"
            value={sprayForm.operator}
            onChange={(e) => setSprayForm(prev => ({...prev, operator: e.target.value}))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="sprayNotes">Notes (optional)</Label>
        <Input
          id="sprayNotes"
          placeholder="Additional observations or remarks"
          value={sprayForm.notes}
          onChange={(e) => setSprayForm(prev => ({...prev, notes: e.target.value}))}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Spray Record</Button>
        <Button type="button" variant="outline" onClick={resetForms}>Cancel</Button>
      </div>
    </form>
  );

  const HarvestForm = () => (
    <form onSubmit={handleSubmitHarvest} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="harvestDate">Date</Label>
          <Input
            id="harvestDate"
            type="date"
            value={harvestForm.date}
            onChange={(e) => setHarvestForm(prev => ({...prev, date: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity (kg)</Label>
          <Input
            id="quantity"
            type="number"
            step="0.1"
            placeholder="e.g., 1500"
            value={harvestForm.quantity}
            onChange={(e) => setHarvestForm(prev => ({...prev, quantity: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Input
            id="grade"
            placeholder="e.g., Premium, Export, Local"
            value={harvestForm.grade}
            onChange={(e) => setHarvestForm(prev => ({...prev, grade: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price per kg (optional)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="e.g., 45.50"
            value={harvestForm.price}
            onChange={(e) => setHarvestForm(prev => ({...prev, price: e.target.value}))}
          />
        </div>
        <div>
          <Label htmlFor="buyer">Buyer (optional)</Label>
          <Input
            id="buyer"
            placeholder="e.g., ABC Export Co."
            value={harvestForm.buyer}
            onChange={(e) => setHarvestForm(prev => ({...prev, buyer: e.target.value}))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="harvestNotes">Notes (optional)</Label>
        <Input
          id="harvestNotes"
          placeholder="Additional observations or remarks"
          value={harvestForm.notes}
          onChange={(e) => setHarvestForm(prev => ({...prev, notes: e.target.value}))}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Harvest Record</Button>
        <Button type="button" variant="outline" onClick={resetForms}>Cancel</Button>
      </div>
    </form>
  );

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Operations Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Record and track all farming operations and activities
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Record
        </Button>
      </div>

      {/* Farm Selection */}
      {farms.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Farm</CardTitle>
            <CardDescription>Choose a farm to view and add records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {farms.map((farm) => (
                <Button
                  key={farm.id}
                  variant={selectedFarm?.id === farm.id ? "default" : "outline"}
                  onClick={() => setSelectedFarm(farm)}
                >
                  {farm.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFarm && (
        <>
          {/* Operation Type Tabs */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Operation Type</CardTitle>
              <CardDescription>Select the type of farming operation to record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      onClick={() => setActiveTab(tab.id as RecordType)}
                      className="flex items-center gap-2"
                    >
                      <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Add {tabs.find(t => t.id === activeTab)?.label} Record
                </CardTitle>
                <CardDescription>
                  Record details for {selectedFarm.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'irrigation' && selectedFarm && (
                  <div className="p-4 text-center text-muted-foreground">
                    Irrigation form temporarily disabled for deployment
                  </div>
                )}
                {activeTab === 'spray' && selectedFarm && (
                  <div className="p-4 text-center text-muted-foreground">
                    Spray form temporarily disabled for deployment
                  </div>
                )}
                {activeTab === 'harvest' && selectedFarm && (
                  <div className="p-4 text-center text-muted-foreground">
                    Harvest form temporarily disabled for deployment
                  </div>
                )}
                {activeTab === 'fertigation' && selectedFarm && (
                  <div className="p-4 text-center text-muted-foreground">
                    Fertigation form temporarily disabled for deployment
                  </div>
                )}
                {activeTab === 'expense' && selectedFarm && (
                  <div className="p-4 text-center text-muted-foreground">
                    Expense form temporarily disabled for deployment
                  </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Records List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {tabs.find(t => t.id === activeTab)?.label} Records
              </CardTitle>
              <CardDescription>
                Recent {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} activities for {selectedFarm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {new Date(record.date).toLocaleDateString()}
                          </Badge>
                          {activeTab === 'irrigation' && (
                            <Badge>{record.growth_stage}</Badge>
                          )}
                          {activeTab === 'spray' && (
                            <Badge>{record.pest_disease}</Badge>
                          )}
                          {activeTab === 'harvest' && (
                            <Badge>{record.grade}</Badge>
                          )}
                          {activeTab === 'expense' && (
                            <Badge>{record.category}</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {activeTab === 'irrigation' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="ml-2">{record.duration}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Area:</span>
                              <span className="ml-2">{record.area}ha</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Discharge:</span>
                              <span className="ml-2">{record.system_discharge}L/h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Moisture:</span>
                              <span className="ml-2">{record.moisture_status}</span>
                            </div>
                          </>
                        )}
                        
                        {activeTab === 'spray' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Chemical:</span>
                              <span className="ml-2">{record.chemical}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Dose:</span>
                              <span className="ml-2">{record.dose}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Area:</span>
                              <span className="ml-2">{record.area}ha</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Operator:</span>
                              <span className="ml-2">{record.operator}</span>
                            </div>
                          </>
                        )}
                        
                        {activeTab === 'harvest' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>
                              <span className="ml-2">{record.quantity}kg</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Price:</span>
                              <span className="ml-2">₹{record.price_per_kg || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Buyer:</span>
                              <span className="ml-2">{record.buyer || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Value:</span>
                              <span className="ml-2">
                                ₹{record.price_per_kg ? (record.quantity * record.price_per_kg).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {activeTab === 'expense' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Category:</span>
                              <span className="ml-2">{record.category}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="ml-2">₹{record.amount.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vendor:</span>
                              <span className="ml-2">{record.vendor || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Description:</span>
                              <span className="ml-2">{record.description}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {record.notes && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-muted-foreground text-sm">Notes: </span>
                          <span className="text-sm">{record.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} records
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start recording your farming operations to track progress
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {farms.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Add a farm first to start recording operations
            </p>
            <Button onClick={() => window.location.href = "/farms"}>
              Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </ProtectedRoute>
  );
}