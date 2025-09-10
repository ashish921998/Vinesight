"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  SprayCan, 
  Scissors, 
  DollarSign,
  TestTube,
  Beaker,
  Upload,
  X,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle
} from "lucide-react";

export type LogType = 'irrigation' | 'spray' | 'harvest' | 'expense' | 'fertigation' | 'soil_test';

interface LogEntry {
  id: string; // temporary ID for session
  type: LogType;
  data: Record<string, any>;
  isValid: boolean;
}

interface FormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
}

interface LogTypeConfig {
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: FormField[];
}

interface UnifiedDataLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logs: LogEntry[], date: string, dayNotes: string, dayPhotos: File[]) => void;
  isSubmitting: boolean;
}

const logTypeConfigs: Record<LogType, LogTypeConfig> = {
  irrigation: {
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    fields: [
      { name: 'duration', type: 'number', label: 'Duration (hours)', required: true, min: 0, step: 0.1 }
    ]
  },
  spray: {
    icon: SprayCan,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    fields: [
      { name: 'chemical', type: 'text', label: 'Chemical Used', required: true, placeholder: 'e.g., Sulfur fungicide', maxLength: 10 },
      { name: 'quantity_amount', type: 'number', label: 'Quantity Amount', required: false, min: 0, step: 0.1, placeholder: 'e.g., 500' },
      { name: 'quantity_unit', type: 'select', label: 'Unit', required: false, options: ['gm/L', 'ml/L'] },
      { name: 'water_volume', type: 'number', label: 'Water Volume (L)', required: false, min: 0, step: 0.1, placeholder: 'Total water used' }
    ]
  },
  harvest: {
    icon: Scissors,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    fields: [
      { name: 'quantity', type: 'number', label: 'Quantity (kg)', required: true, min: 0, step: 0.1 },
      { name: 'grade', type: 'select', label: 'Grade', required: true, 
        options: ['Premium', 'Standard', 'Below Standard'] }
    ]
  },
  expense: {
    icon: DollarSign,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    fields: [
      { name: 'type', type: 'select', label: 'Category', required: true,
        options: ['labor', 'materials', 'equipment', 'other'] },
      { name: 'description', type: 'text', label: 'Description', required: true, placeholder: 'Brief description' },
      { name: 'cost', type: 'number', label: 'Amount (₹)', required: true, min: 0, step: 0.01 },
      { name: 'vendor', type: 'text', label: 'Vendor', required: false, placeholder: 'Vendor name (optional)' }
    ]
  },
  fertigation: {
    icon: Beaker,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    fields: [
      { name: 'fertilizer', type: 'text', label: 'Fertilizer Type', required: true, placeholder: 'e.g., NPK 19:19:19' },
      { name: 'quantity', type: 'number', label: 'Quantity (kg/L)', required: false, min: 0, step: 0.1 }
    ]
  },
  soil_test: {
    icon: TestTube,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    fields: [
      { name: 'ph', type: 'number', label: 'pH Level', required: true, min: 0, max: 14, step: 0.1 },
      { name: 'nitrogen', type: 'number', label: 'Nitrogen (ppm)', required: false, min: 0 },
      { name: 'phosphorus', type: 'number', label: 'Phosphorus (ppm)', required: false, min: 0 },
      { name: 'potassium', type: 'number', label: 'Potassium (ppm)', required: false, min: 0 }
    ]
  }
};

const logTypeLabels: Record<LogType, string> = {
  irrigation: 'Irrigation',
  spray: 'Spray Record',
  fertigation: 'Fertigation',
  soil_test: 'Soil Test',
  harvest: 'Harvest',
  expense: 'Expense',
};

export function UnifiedDataLogsModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: UnifiedDataLogsModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentLogType, setCurrentLogType] = useState<LogType | null>(null);
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Shared day-level data
  const [dayNotes, setDayNotes] = useState('');
  const [dayPhotos, setDayPhotos] = useState<File[]>([]);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentLogType(null);
      setCurrentFormData({});
      setSessionLogs([]);
      setEditingLogId(null);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setDayNotes('');
      setDayPhotos([]);
    }
  }, [isOpen]);

  // Reset current form when log type changes
  useEffect(() => {
    if (currentLogType && !editingLogId) {
      setCurrentFormData({});
    }
  }, [currentLogType, editingLogId]);

  const validateCurrentForm = (): boolean => {
    if (!currentLogType) return false;

    const config = logTypeConfigs[currentLogType];
    for (const field of config.fields) {
      if (field.required && !currentFormData[field.name]) {
        return false;
      }
    }
    return true;
  };

  const handleAddLogEntry = () => {
    if (!currentLogType || !validateCurrentForm()) return;

    const logEntry: LogEntry = {
      id: editingLogId || Date.now().toString(),
      type: currentLogType,
      data: {
        ...currentFormData
      },
      isValid: true
    };

    if (editingLogId) {
      // Update existing log
      setSessionLogs(prev => 
        prev.map(log => log.id === editingLogId ? logEntry : log)
      );
      setEditingLogId(null);
    } else {
      // Add new log
      setSessionLogs(prev => [...prev, logEntry]);
    }

    // Reset form
    setCurrentLogType(null);
    setCurrentFormData({});
  };

  const handleEditLog = (logId: string) => {
    const log = sessionLogs.find(l => l.id === logId);
    if (!log) return;

    setEditingLogId(logId);
    setCurrentLogType(log.type);
    setCurrentFormData({ ...log.data });
  };

  const handleRemoveLog = (logId: string) => {
    setSessionLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDayPhotos(prev => [...prev, ...files]);
  };

  const handlePhotoRemove = (index: number) => {
    setDayPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAllLogs = () => {
    if (sessionLogs.length === 0) return;
    onSubmit(sessionLogs, selectedDate, dayNotes, dayPhotos);
  };

  const renderFormField = (field: FormField) => {
    const value = currentFormData[field.name] || '';

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                setCurrentFormData(prev => ({ ...prev, [field.name]: newValue }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) =>
                setCurrentFormData(prev => ({ ...prev, [field.name]: e.target.value }))
              }
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className="h-9"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) =>
                setCurrentFormData(prev => ({ ...prev, [field.name]: e.target.value }))
              }
              placeholder={field.placeholder}
              className="min-h-[80px]"
            />
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={value}
              onChange={(e) =>
                setCurrentFormData(prev => ({ ...prev, [field.name]: e.target.value }))
              }
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="h-9"
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Add Data Logs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="h-9"
            />
          </div>

          {/* Current Session Logs */}
          {sessionLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Added Logs ({sessionLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessionLogs.map((log) => {
                  const config = logTypeConfigs[log.type];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={log.id} 
                      className={`flex items-center justify-between p-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <div>
                          <p className="font-medium text-sm">{logTypeLabels[log.type]}</p>
                          <p className="text-xs text-gray-600">
                            {Object.entries(log.data)
                              .filter(([key, value]) => value)
                              .map(([key, value]) => `${key}: ${value}`)
                              .slice(0, 2)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLog(log.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLog(log.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Log Type Selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {editingLogId ? 'Editing Log Type' : 'Select Log Type'}
            </Label>
            <Select
              value={currentLogType || ''}
              onValueChange={(value) => setCurrentLogType(value as LogType)}
              disabled={!!editingLogId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose a log type to add..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(logTypeLabels).map(([type, label]) => {
                  const config = logTypeConfigs[type as LogType];
                  const Icon = config.icon;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Form Fields */}
          {currentLogType && (
            <Card className={`${logTypeConfigs[currentLogType].bgColor} ${logTypeConfigs[currentLogType].borderColor} border`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {(() => {
                    const Icon = logTypeConfigs[currentLogType].icon;
                    return <Icon className={`h-4 w-4 ${logTypeConfigs[currentLogType].color}`} />;
                  })()}
                  {logTypeLabels[currentLogType]} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dynamic fields */}
                {logTypeConfigs[currentLogType].fields.map(renderFormField)}

                {/* Add Entry Button */}
                <Button
                  onClick={handleAddLogEntry}
                  disabled={!validateCurrentForm()}
                  className="w-full"
                >
                  {editingLogId ? 'Update Log Entry' : 'Add Log Entry'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add More Button */}
          {!currentLogType && sessionLogs.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentLogType(null)}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Log Entry
            </Button>
          )}

          {/* Day-level Notes and Photos */}
          {sessionLogs.length > 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  📝 Day Notes & Photos
                  <Badge variant="outline" className="ml-2">
                    Shared for all logs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Day Notes */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Notes for the Day</Label>
                  <Textarea
                    value={dayNotes}
                    onChange={(e) => setDayNotes(e.target.value)}
                    placeholder="Add general notes for all activities on this date..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Day Photos */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Photos for the Day</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoAdd}
                        className="h-9"
                      />
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                    {dayPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dayPhotos.map((photo, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {photo.name.slice(0, 10)}...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePhotoRemove(index)}
                              className="h-3 w-3 p-0 ml-1"
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {sessionLogs.length} log{sessionLogs.length !== 1 ? 's' : ''} ready to save
            {dayNotes && <span className="ml-2">• Notes included</span>}
            {dayPhotos.length > 0 && <span className="ml-2">• {dayPhotos.length} photo{dayPhotos.length !== 1 ? 's' : ''} included</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAllLogs}
              disabled={sessionLogs.length === 0 || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save All Logs ({sessionLogs.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}