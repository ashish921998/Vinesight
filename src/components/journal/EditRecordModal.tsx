"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, SprayCan, Scissors, Loader2, DollarSign, Beaker, TestTube } from "lucide-react";
import { SupabaseService } from "@/lib/supabase-service";
import type { IrrigationRecord, SprayRecord, HarvestRecord, FertigationRecord, ExpenseRecord, SoilTestRecord } from "@/lib/supabase";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  record: IrrigationRecord | SprayRecord | HarvestRecord | FertigationRecord | ExpenseRecord | SoilTestRecord | null;
  recordType: 'irrigation' | 'spray' | 'harvest' | 'fertigation' | 'expense' | 'soil_test';
}

export function EditRecordModal({ isOpen, onClose, onSave, record, recordType }: EditRecordModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      // Initialize form data based on record type
      if (recordType === 'irrigation') {
        const irrigationRecord = record as IrrigationRecord;
        setFormData({
          date: irrigationRecord.date,
          duration: irrigationRecord.duration?.toString() || "",
          moisture_status: irrigationRecord.moisture_status || "",
          notes: irrigationRecord.notes || ""
        });
      } else if (recordType === 'spray') {
        const sprayRecord = record as SprayRecord;
        setFormData({
          date: sprayRecord.date,
          pest_disease: sprayRecord.pest_disease || "",
          chemical: sprayRecord.chemical || "",
          dose: sprayRecord.dose || "",
          area: sprayRecord.area?.toString() || "",
          weather: sprayRecord.weather || "",
          operator: sprayRecord.operator || "",
          notes: sprayRecord.notes || ""
        });
      } else if (recordType === 'harvest') {
        const harvestRecord = record as HarvestRecord;
        setFormData({
          date: harvestRecord.date,
          quantity: harvestRecord.quantity?.toString() || "",
          grade: harvestRecord.grade || "",
          price: harvestRecord.price?.toString() || "",
          buyer: harvestRecord.buyer || "",
          notes: harvestRecord.notes || ""
        });
      } else if (recordType === 'fertigation') {
        const fertigationRecord = record as FertigationRecord;
        setFormData({
          date: fertigationRecord.date,
          fertilizer: fertigationRecord.fertilizer || "",
          dose: fertigationRecord.dose || "",
          purpose: fertigationRecord.purpose || "",
          area: fertigationRecord.area?.toString() || "",
          notes: fertigationRecord.notes || ""
        });
      } else if (recordType === 'expense') {
        const expenseRecord = record as ExpenseRecord;
        setFormData({
          date: expenseRecord.date,
          type: expenseRecord.type || "",
          description: expenseRecord.description || "",
          cost: expenseRecord.cost?.toString() || "",
          remarks: expenseRecord.remarks || ""
        });
      } else if (recordType === 'soil_test') {
        const soilTestRecord = record as SoilTestRecord;
        setFormData({
          date: soilTestRecord.date,
          parameters: soilTestRecord.parameters || {},
          recommendations: soilTestRecord.recommendations || "",
          notes: soilTestRecord.notes || ""
        });
      }
    }
  }, [record, recordType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setIsSubmitting(true);
    try {
      if (recordType === 'irrigation') {
        await SupabaseService.updateIrrigationRecord(record.id!, {
          date: formData.date,
          duration: parseFloat(formData.duration),
          moisture_status: formData.moisture_status,
          notes: formData.notes
        });
      } else if (recordType === 'spray') {
        await SupabaseService.updateSprayRecord(record.id!, {
          date: formData.date,
          pest_disease: formData.pest_disease,
          chemical: formData.chemical,
          dose: formData.dose,
          area: parseFloat(formData.area),
          weather: formData.weather,
          operator: formData.operator,
          notes: formData.notes
        });
      } else if (recordType === 'harvest') {
        await SupabaseService.updateHarvestRecord(record.id!, {
          date: formData.date,
          quantity: parseFloat(formData.quantity),
          grade: formData.grade,
          price: formData.price ? parseFloat(formData.price) : undefined,
          buyer: formData.buyer || undefined,
          notes: formData.notes
        });
      } else if (recordType === 'fertigation') {
        await SupabaseService.updateFertigationRecord(record.id!, {
          date: formData.date,
          fertilizer: formData.fertilizer,
          dose: formData.dose,
          purpose: formData.purpose,
          area: parseFloat(formData.area),
          notes: formData.notes
        });
      } else if (recordType === 'expense') {
        await SupabaseService.updateExpenseRecord(record.id!, {
          date: formData.date,
          type: formData.type,
          description: formData.description,
          cost: parseFloat(formData.cost),
          remarks: formData.remarks
        });
      } else if (recordType === 'soil_test') {
        await SupabaseService.updateSoilTestRecord(record.id!, {
          date: formData.date,
          parameters: formData.parameters,
          recommendations: formData.recommendations,
          notes: formData.notes
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (recordType) {
      case 'irrigation': return <Droplets className="h-5 w-5" />;
      case 'spray': return <SprayCan className="h-5 w-5" />;
      case 'harvest': return <Scissors className="h-5 w-5" />;
      case 'fertigation': return <Beaker className="h-5 w-5" />;
      case 'expense': return <DollarSign className="h-5 w-5" />;
      case 'soil_test': return <TestTube className="h-5 w-5" />;
      default: return <Droplets className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (recordType) {
      case 'irrigation': return 'Edit Irrigation Record';
      case 'spray': return 'Edit Spray Record';
      case 'harvest': return 'Edit Harvest Record';
      case 'fertigation': return 'Edit Fertigation Record';
      case 'expense': return 'Edit Expense Record';
      case 'soil_test': return 'Edit Soil Test Record';
      default: return 'Edit Record';
    }
  };

  const getColor = () => {
    switch (recordType) {
      case 'irrigation': return 'text-blue-700 bg-blue-100';
      case 'spray': return 'text-green-700 bg-green-100';
      case 'harvest': return 'text-purple-700 bg-purple-100';
      case 'fertigation': return 'text-emerald-700 bg-emerald-100';
      case 'expense': return 'text-orange-700 bg-orange-100';
      case 'soil_test': return 'text-teal-700 bg-teal-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 ${getColor().split(' ')[0]}`}>
            <div className={`p-2 rounded-xl ${getColor()}`}>
              {getIcon()}
            </div>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Input */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
              required
            />
          </div>

          {/* Record type specific fields */}
          {recordType === 'irrigation' && (
            <>
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                  Duration (hours) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.duration || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, duration: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}

          {recordType === 'spray' && (
            <>
              <div>
                <Label htmlFor="chemical" className="text-sm font-medium text-gray-700">
                  Chemical/Product *
                </Label>
                <Input
                  id="chemical"
                  value={formData.chemical || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, chemical: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pest_disease" className="text-sm font-medium text-gray-700">
                    Target Pest/Disease
                  </Label>
                  <Input
                    id="pest_disease"
                    value={formData.pest_disease || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, pest_disease: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dose" className="text-sm font-medium text-gray-700">
                    Dose
                  </Label>
                  <Input
                    id="dose"
                    value={formData.dose || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, dose: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {recordType === 'harvest' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity (kg) *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, quantity: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                    Grade *
                  </Label>
                  <Select
                    value={formData.grade || ""}
                    onValueChange={(value) => setFormData((prev: any) => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Grade A">Grade A</SelectItem>
                      <SelectItem value="Grade B">Grade B</SelectItem>
                      <SelectItem value="Grade C">Grade C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Price per kg (₹)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, price: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer" className="text-sm font-medium text-gray-700">
                    Buyer
                  </Label>
                  <Input
                    id="buyer"
                    value={formData.buyer || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, buyer: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {recordType === 'fertigation' && (
            <>
              <div>
                <Label htmlFor="fertilizer" className="text-sm font-medium text-gray-700">
                  Fertilizer *
                </Label>
                <Input
                  id="fertilizer"
                  value={formData.fertilizer || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, fertilizer: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dose" className="text-sm font-medium text-gray-700">
                    Dose *
                  </Label>
                  <Input
                    id="dose"
                    value={formData.dose || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, dose: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                    Area (acres)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.area || ""}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, area: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">
                  Purpose
                </Label>
                <Input
                  id="purpose"
                  value={formData.purpose || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, purpose: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {recordType === 'expense' && (
            <>
              <div>
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Category *
                </Label>
                <Select
                  value={formData.type || ""}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost" className="text-sm font-medium text-gray-700">
                  Cost (₹) *
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, cost: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}

          {recordType === 'soil_test' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ph" className="text-sm font-medium text-gray-700">
                    pH Level
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.parameters?.pH || ""}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, pH: parseFloat(e.target.value) || 0 }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nitrogen" className="text-sm font-medium text-gray-700">
                    Nitrogen (ppm)
                  </Label>
                  <Input
                    id="nitrogen"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.parameters?.nitrogen || ""}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, nitrogen: parseFloat(e.target.value) || 0 }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phosphorus" className="text-sm font-medium text-gray-700">
                    Phosphorus (ppm)
                  </Label>
                  <Input
                    id="phosphorus"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.parameters?.phosphorus || ""}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, phosphorus: parseFloat(e.target.value) || 0 }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="potassium" className="text-sm font-medium text-gray-700">
                    Potassium (ppm)
                  </Label>
                  <Input
                    id="potassium"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.parameters?.potassium || ""}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, potassium: parseFloat(e.target.value) || 0 }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="recommendations" className="text-sm font-medium text-gray-700">
                  Recommendations
                </Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations || ""}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, recommendations: e.target.value }))}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Notes/Remarks */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              {recordType === 'expense' ? 'Remarks' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={recordType === 'expense' ? (formData.remarks || "") : (formData.notes || "")}
              onChange={(e) => setFormData((prev: any) => ({ 
                ...prev, 
                [recordType === 'expense' ? 'remarks' : 'notes']: e.target.value 
              }))}
              placeholder="Any additional notes..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}