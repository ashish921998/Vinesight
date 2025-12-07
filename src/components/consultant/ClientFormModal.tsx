import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ConsultantClientInsert } from '@/types/consultant'
import { toast } from 'sonner'

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ConsultantClientInsert) => Promise<void>
  initialData?: Partial<ConsultantClientInsert>
}

const INITIAL_DATA: ConsultantClientInsert = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientVillage: '',
  clientDistrict: '',
  clientState: 'Maharashtra',
  notes: '',
  status: 'active'
}

export function ClientFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: ClientFormModalProps) {
  const [formData, setFormData] = useState<ConsultantClientInsert>({
    ...INITIAL_DATA,
    ...initialData
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      setFormData(INITIAL_DATA)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a farmer as your client to manage their farms and provide recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              placeholder="Enter client name"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone Number</Label>
              <Input
                id="clientPhone"
                placeholder="e.g., 9876543210"
                value={formData.clientPhone || ''}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@email.com"
                value={formData.clientEmail || ''}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientVillage">Village</Label>
              <Input
                id="clientVillage"
                placeholder="Village name"
                value={formData.clientVillage || ''}
                onChange={(e) => setFormData({ ...formData, clientVillage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDistrict">District</Label>
              <Input
                id="clientDistrict"
                placeholder="District name"
                value={formData.clientDistrict || ''}
                onChange={(e) => setFormData({ ...formData, clientDistrict: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this client..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
