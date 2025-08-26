"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Sprout, 
  Calculator, 
  Settings,
  Plus,
  X,
  FileText,
  Droplets,
  SprayCan,
  Scissors,
  DollarSign,
  Beaker
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SupabaseService } from "@/lib/supabase-service";
import { type Farm } from "@/lib/supabase";

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: Home,
    color: "text-green-600"
  },
  { 
    name: "Farms", 
    href: "/farms", 
    icon: Sprout,
    color: "text-green-600" 
  },
  { 
    name: "Add", 
    action: "quickAdd",
    icon: Plus,
    color: "text-green-600"
  },
  { 
    name: "Calculator", 
    href: "/calculators", 
    icon: Calculator,
    color: "text-green-600"
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    color: "text-gray-600"
  },
];

const quickAddItems = [
  {
    name: "Add Farm",
    href: "/farms",
    icon: Sprout,
    color: "bg-green-100 text-green-700"
  },
  {
    name: "Add Farm Logs",
    action: "showFarmLogsModal",
    icon: FileText,
    color: "bg-blue-100 text-blue-700"
  }
];

const logTypes = [
  {
    id: "irrigation",
    name: "Irrigation",
    icon: Droplets,
    color: "text-blue-600",
    fields: [
      { name: "duration", label: "Duration (hours)", type: "number", step: "0.5", min: "0.5", placeholder: "2.5", required: true },
      { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "e.g., Drip irrigation, fruit development stage" }
    ]
  },
  {
    id: "spray",
    name: "Spray/Pesticide",
    icon: SprayCan,
    color: "text-orange-600",
    fields: [
      { name: "product", label: "Product/Chemical", type: "text", placeholder: "e.g., Fungicide, Insecticide name", required: true },
      { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "e.g., Concentration, weather conditions, target pest/disease" }
    ]
  },
  {
    id: "fertigation",
    name: "Fertigation",
    icon: Beaker,
    color: "text-purple-600",
    fields: [
      { name: "fertilizer", label: "Fertilizer", type: "text", placeholder: "e.g., NPK 19:19:19", required: true },
      { name: "quantity", label: "Quantity (kg)", type: "number", step: "0.1", min: "0", placeholder: "10", required: true },
      { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "e.g., Growth stage, concentration" }
    ]
  },
  {
    id: "harvest",
    name: "Harvest",
    icon: Scissors,
    color: "text-green-600",
    fields: [
      { name: "quantity", label: "Quantity (kg)", type: "number", step: "0.1", min: "0", placeholder: "100", required: true },
      { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "e.g., Quality grade, market destination, storage location" }
    ]
  },
  {
    id: "expense",
    name: "Expense",
    icon: DollarSign,
    color: "text-red-600",
    fields: [
      { name: "amount", label: "Amount (₹)", type: "number", step: "0.01", min: "0", placeholder: "1000", required: true },
      { name: "category", label: "Category", type: "text", placeholder: "e.g., Labor, Materials, Fuel", required: true },
      { name: "description", label: "Description", type: "text", placeholder: "e.g., Pruning labor", required: true },
      { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Additional details" }
    ]
  }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFarmLogsModal, setShowFarmLogsModal] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [selectedLogType, setSelectedLogType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const farmsList = await SupabaseService.getAllFarms();
      setFarms(farmsList);
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  const handleQuickAddClick = (item: typeof quickAddItems[0]) => {
    if (item.action === "showFarmLogsModal") {
      setShowQuickAdd(false);
      setShowFarmLogsModal(true);
    } else if (item.href) {
      // Handle navigation items
      setShowQuickAdd(false);
    }
  };

  const handleFormDataChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const resetModal = () => {
    setSelectedFarm("");
    setSelectedLogType("");
    setFormData({});
    setShowFarmLogsModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm || !selectedLogType) return;

    setIsSubmitting(true);
    try {
      const farmId = parseInt(selectedFarm);
      const currentDate = new Date().toISOString().split('T')[0];

      switch (selectedLogType) {
        case 'irrigation':
          await SupabaseService.addIrrigationRecord({
            farm_id: farmId,
            date: currentDate,
            duration: parseFloat(formData.duration || '0'),
            area: 0, // Default value
            growth_stage: 'Not specified',
            moisture_status: 'Not specified',
            system_discharge: 0,
            notes: formData.notes || ''
          });
          break;
        
        case 'spray':
          await SupabaseService.addSprayRecord({
            farm_id: farmId,
            date: currentDate,
            pest_disease: 'Not specified',
            chemical: formData.product || '',
            dose: 'Not specified',
            area: 0,
            weather: 'Not specified',
            operator: 'Not specified',
            notes: formData.notes || ''
          });
          break;
        
        case 'fertigation':
          await SupabaseService.addFertigationRecord({
            farm_id: farmId,
            date: currentDate,
            fertilizer: formData.fertilizer || '',
            dose: formData.quantity || '0',
            purpose: '', // Default value
            area: 0,
            notes: formData.notes || ''
          });
          break;
        
        case 'harvest':
          await SupabaseService.addHarvestRecord({
            farm_id: farmId,
            date: currentDate,
            quantity: parseFloat(formData.quantity || '0'),
            grade: 'Not specified',
            price: 0,
            buyer: 'Not specified',
            notes: formData.notes || ''
          });
          break;
        
        case 'expense':
          await SupabaseService.addExpenseRecord({
            farm_id: farmId,
            date: currentDate,
            type: (formData.category || 'other') as 'labor' | 'materials' | 'equipment' | 'other',
            description: formData.description || '',
            cost: parseFloat(formData.amount || '0'),
            remarks: formData.notes || ''
          });
          break;
      }

      resetModal();
    } catch (error) {
      console.error('Error saving farm log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLogTypeObj = logTypes.find(type => type.id === selectedLogType);
  const canShowFields = selectedFarm && selectedLogType;

  return (
    <>
      {/* Quick Add Overlay */}
      {showQuickAdd && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setShowQuickAdd(false)}
        >
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-2xl shadow-xl p-4 min-w-72">
              <h3 className="text-lg font-semibold text-center mb-4">Quick Add</h3>
              <div className="space-y-3">
                {quickAddItems.map((item) => {
                  const Icon = item.icon;
                  
                  if (item.href) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowQuickAdd(false)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                      >
                        <div className={`p-2 rounded-full ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                      </Link>
                    );
                  }
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleQuickAddClick(item)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation active:scale-95 w-full text-left"
                    >
                      <div className={`p-2 rounded-full ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farm Logs Modal */}
      <Dialog open={showFarmLogsModal} onOpenChange={setShowFarmLogsModal}>
        <DialogContent className="sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Farm Log
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Record farm activity data
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Farm Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Select Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12">
                  <SelectValue placeholder="Choose a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id?.toString() || ""}>
                      <div className="flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">{farm.name}</div>
                          <div className="text-xs text-gray-500">{farm.region}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Log Type Selection */}
            {selectedFarm && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select Log Type</Label>
                <Select value={selectedLogType} onValueChange={setSelectedLogType}>
                  <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12">
                    <SelectValue placeholder="Choose log type" />
                  </SelectTrigger>
                  <SelectContent>
                    {logTypes.map((logType) => {
                      const Icon = logType.icon;
                      return (
                        <SelectItem key={logType.id} value={logType.id}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${logType.color}`} />
                            <span>{logType.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dynamic Fields */}
            {canShowFields && selectedLogTypeObj && (
              <div className="space-y-4 pt-2">
                {selectedLogTypeObj.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-20 resize-none"
                        required={field.required}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        step={field.step}
                        min={field.min}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-12"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Buttons */}
            {canShowFields && (
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetModal}
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
                  {isSubmitting ? "Saving..." : `Log ${selectedLogTypeObj?.name}`}
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex justify-around items-center px-2 py-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAddButton = item.action === 'quickAdd';
            
            if (isAddButton) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className={`
                    flex flex-col items-center justify-center
                    px-2 py-2 min-w-0 flex-1
                    transition-all duration-200
                    touch-manipulation
                    active:scale-95
                    ${showQuickAdd 
                      ? 'text-green-600' 
                      : 'text-white hover:text-white'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-full transition-all duration-200
                    ${showQuickAdd 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-green-500 text-white shadow-md'
                    }
                  `}>
                    {showQuickAdd ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`
                    text-xs font-medium mt-1 truncate
                    ${showQuickAdd ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {showQuickAdd ? 'Close' : item.name}
                  </span>
                </button>
              );
            }
            
            return item.href ? (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  px-2 py-2 min-w-0 flex-1
                  transition-all duration-200
                  touch-manipulation
                  active:scale-95
                  ${isActive 
                    ? 'text-primary' 
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`
                  text-xs font-medium mt-1 truncate
                  ${isActive ? 'text-green-600' : 'text-gray-400'}
                `}>
                  {item.name}
                </span>
              </Link>
            ) : null;
          })}
        </div>
      </div>
    </>
  );
}