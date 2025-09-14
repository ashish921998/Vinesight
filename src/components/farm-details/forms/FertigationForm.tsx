'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Beaker, Upload, X, Loader2 } from 'lucide-react'

interface FertigationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    fertilizer: string
    dose: string
    notes: string
    photos: File[]
  }) => void
  isSubmitting: boolean
}

export function FertigationForm({ isOpen, onClose, onSubmit, isSubmitting }: FertigationFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fertilizer: '',
    dose: '',
    notes: '',
    photos: [] as File[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fertilizer || !formData.dose) return
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
      fertilizer: '',
      dose: '',
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-emerald-600" />
            Log Fertigation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fertilizer">Fertilizer Type</Label>
            <Input
              id="fertilizer"
              value={formData.fertilizer}
              onChange={(e) => setFormData((prev) => ({ ...prev, fertilizer: e.target.value }))}
              placeholder="e.g., NPK 19-19-19"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dose">Dose (kg/ha or g/L)</Label>
            <Input
              id="dose"
              value={formData.dose}
              onChange={(e) => setFormData((prev) => ({ ...prev, dose: e.target.value }))}
              placeholder="e.g., 2.5 kg/ha"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Weather conditions, growth stage, etc."
              className="h-20"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('fertigation-photos')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <input
                id="fertigation-photos"
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
            <Button type="submit" disabled={isSubmitting || !formData.fertilizer || !formData.dose}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Fertigation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
