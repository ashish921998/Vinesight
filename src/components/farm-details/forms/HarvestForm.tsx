'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Scissors, Upload, X } from 'lucide-react'

interface HarvestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    quantity: string
    quality: string
    price?: string
    buyer?: string
    notes: string
    photos: File[]
  }) => void
  isSubmitting: boolean
}

export function HarvestForm({ isOpen, onClose, onSubmit, isSubmitting }: HarvestFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    quality: '',
    price: '',
    buyer: '',
    notes: '',
    photos: [] as File[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.quantity || !formData.quality) return
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
      quantity: '',
      quality: '',
      price: '',
      buyer: '',
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
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-green-700">
            <div className="p-2 bg-green-100 rounded-xl">
              <Scissors className="h-5 w-5" />
            </div>
            Record Harvest
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
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
              required
            />
          </div>

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
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="100"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="quality" className="text-sm font-medium text-gray-700">
                Quality *
              </Label>
              <Select
                value={formData.quality}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, quality: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Grade A">Grade A</SelectItem>
                  <SelectItem value="Grade B">Grade B</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
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
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="150"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="buyer" className="text-sm font-medium text-gray-700">
                Buyer
              </Label>
              <Input
                id="buyer"
                value={formData.buyer}
                onChange={(e) => setFormData((prev) => ({ ...prev, buyer: e.target.value }))}
                placeholder="Market/Company"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Harvest conditions, transportation details..."
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 truncate">{photo.name}</span>
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
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.quantity || !formData.quality || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Saving...' : 'Save Harvest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
