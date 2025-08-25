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
import { IrrigationForm } from "@/components/journal/IrrigationForm";
import { FertigationForm } from "@/components/journal/FertigationForm";
import { ExpenseForm } from "@/components/journal/ExpenseForm";
import { SprayForm } from "@/components/journal/SprayForm";
import { HarvestForm } from "@/components/journal/HarvestForm";

type RecordType = 'irrigation' | 'spray' | 'fertigation' | 'harvest' | 'expense';

export default function JournalPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<RecordType>('irrigation');
  const [showAddForm, setShowAddForm] = useState(false);
  const [records, setRecords] = useState<any[]>([]);


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


  const tabs = [
    { id: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-blue-600' },
    { id: 'spray', label: 'Spray/Pesticide', icon: SprayCan, color: 'text-green-600' },
    { id: 'fertigation', label: 'Fertigation', icon: SprayCan, color: 'text-purple-600' },
    { id: 'harvest', label: 'Harvest', icon: Scissors, color: 'text-orange-600' },
    { id: 'expense', label: 'Expenses', icon: IndianRupee, color: 'text-red-600' }
  ];


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
                  <IrrigationForm
                    selectedFarm={selectedFarm}
                    onRecordAdded={() => {
                      setShowAddForm(false);
                      loadRecords();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}
                {activeTab === 'spray' && selectedFarm && (
                  <SprayForm
                    selectedFarm={selectedFarm}
                    onRecordAdded={() => {
                      setShowAddForm(false);
                      loadRecords();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}
                {activeTab === 'harvest' && selectedFarm && (
                  <HarvestForm
                    selectedFarm={selectedFarm}
                    onRecordAdded={() => {
                      setShowAddForm(false);
                      loadRecords();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}
                {activeTab === 'fertigation' && selectedFarm && (
                  <FertigationForm
                    selectedFarm={selectedFarm}
                    onRecordAdded={() => {
                      setShowAddForm(false);
                      loadRecords();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}
                {activeTab === 'expense' && selectedFarm && (
                  <ExpenseForm
                    selectedFarm={selectedFarm}
                    onRecordAdded={() => {
                      setShowAddForm(false);
                      loadRecords();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
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
                            <Badge>{record.type}</Badge>
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
                              <span className="ml-2">₹{record.price || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Buyer:</span>
                              <span className="ml-2">{record.buyer || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Value:</span>
                              <span className="ml-2">
                                ₹{record.price ? (record.quantity * record.price).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {activeTab === 'expense' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <span className="ml-2">{record.type}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="ml-2">₹{record.cost.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Remarks:</span>
                              <span className="ml-2">{record.remarks || 'N/A'}</span>
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