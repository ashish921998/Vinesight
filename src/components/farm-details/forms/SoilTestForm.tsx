'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TestTube, Upload, X, Loader2 } from 'lucide-react'

interface SoilTestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    ph: string
    nitrogen: string
    phosphorus: string
    potassium: string
    organicMatter: string
    laboratory: string
    notes: string
    photos: File[]
  }) => void
  isSubmitting: boolean
}

export function SoilTestForm({ isOpen, onClose, onSubmit, isSubmitting }: SoilTestFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicMatter: '',
    laboratory: '',
    notes: '',
    photos: [] as File[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ph) return
    onSubmit(formData)
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }))
  }

  const handlePhotoRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ph: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      organicMatter: '',
      laboratory: '',
      notes: '',
      photos: [],
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            Log Soil Test
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Test Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph">pH Level</Label>
            <Input
              id="ph"
              type="number"
              step="0.1"
              value={formData.ph}
              onChange={(e) => setFormData((prev) => ({ ...prev, ph: e.target.value }))}
              placeholder="e.g., 6.5"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (ppm)</Label>
              <Input
                id="nitrogen"
                type="number"
                value={formData.nitrogen}
                onChange={(e) => setFormData((prev) => ({ ...prev, nitrogen: e.target.value }))}
                placeholder="N"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (ppm)</Label>
              <Input
                id="phosphorus"
                type="number"
                value={formData.phosphorus}
                onChange={(e) => setFormData((prev) => ({ ...prev, phosphorus: e.target.value }))}
                placeholder="P"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (ppm)</Label>
              <Input
                id="potassium"
                type="number"
                value={formData.potassium}
                onChange={(e) => setFormData((prev) => ({ ...prev, potassium: e.target.value }))}
                placeholder="K"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organicMatter">Organic Matter (%)</Label>
            <Input
              id="organicMatter"
              type="number"
              step="0.1"
              value={formData.organicMatter}
              onChange={(e) => setFormData((prev) => ({ ...prev, organicMatter: e.target.value }))}
              placeholder="e.g., 3.2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="laboratory">Laboratory/Testing Method</Label>
            <Input
              id="laboratory"
              value={formData.laboratory}
              onChange={(e) => setFormData((prev) => ({ ...prev, laboratory: e.target.value }))}
              placeholder="e.g., AgriLab, Home Test Kit"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Sampling location, weather conditions, recommendations, etc."
              className="h-20"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Test Results/Photos (Optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('soil-test-photos')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <input
                id="soil-test-photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoAdd}
                className="hidden"
              />
            </div>

            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <span className="text-xs text-gray-500 text-center px-1">
                        {photo.name.length > 8 ? photo.name.substring(0, 8) + '...' : photo.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.ph}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Soil Test'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
