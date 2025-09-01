"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Droplets, Upload, X, Loader2 } from "lucide-react";

interface IrrigationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    duration: string;
    notes: string;
    photos: File[];
  }) => void;
  isSubmitting: boolean;
}

export function IrrigationForm({ isOpen, onClose, onSubmit, isSubmitting }: IrrigationFormProps) {
  const [formData, setFormData] = useState({
    duration: "",
    notes: "",
    photos: [] as File[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.duration) return;
    onSubmit(formData);
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({ duration: "", notes: "", photos: [] });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-blue-700">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Droplets className="h-5 w-5" />
            </div>
            Log Irrigation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Duration (hours) *
            </Label>
            <Input
              id="duration"
              type="number"
              step="0.1"
              min="0"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="2.5"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any observations about the irrigation..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Photos</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Add photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoAdd}
                  className="hidden"
                />
              </label>
            </div>

            {formData.photos.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 truncate">
                      {photo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.duration || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
{isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Irrigation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}