"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SprayCan, Upload, X } from "lucide-react";

interface SprayFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    product: string;
    notes: string;
    photos: File[];
  }) => void;
  isSubmitting: boolean;
}

export function SprayForm({ isOpen, onClose, onSubmit, isSubmitting }: SprayFormProps) {
  const [formData, setFormData] = useState({
    product: "",
    notes: "",
    photos: [] as File[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product) return;
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
    setFormData({ product: "", notes: "", photos: [] });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-green-700">
            <div className="p-2 bg-green-100 rounded-xl">
              <SprayCan className="h-5 w-5" />
            </div>
            Log Spray Treatment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product" className="text-sm font-medium text-gray-700">
              Product/Chemical *
            </Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
              placeholder="e.g., Mancozeb, Copper Sulfate"
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
              placeholder="Target pest/disease, weather conditions, dosage..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Photos</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
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
              disabled={!formData.product || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Saving..." : "Save Treatment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}