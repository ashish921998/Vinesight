'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowLeft, Save, Send, Calculator } from 'lucide-react'
import { RecommendationItemsForm } from '@/components/consultant/RecommendationItemsForm'
import { useRecommendationForm } from '@/hooks/consultant/useRecommendationForm'

export default function CreateRecommendationPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Number.parseInt(params.id as string, 10)
  const hasValidClientId = Number.isFinite(clientId) && clientId > 0

  const {
    client,
    loading,
    isSubmitting,
    items,
    formData,
    setFormData,
    loadClient,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    handleSave,
    calculateTotalCost
  } = useRecommendationForm(clientId)

  // Load client data on mount
  useEffect(() => {
    if (hasValidClientId) {
      loadClient()
    }
  }, [hasValidClientId, loadClient])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Client not found</h2>
            <Button onClick={() => router.push('/clients')}>Back to Clients</Button>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">New Recommendation</h1>
                  <p className="text-sm text-gray-500">For {client.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleSave(false)} disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => handleSave(true)} disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* General Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recommendation Title *</Label>
                    <Input
                      placeholder="e.g., Early Stage Fertilization"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Farm (Optional)</Label>
                  <Select
                    value={formData.clientFarmId?.toString() || 'all'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        clientFarmId: value === 'all' ? undefined : parseInt(value)
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Farms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Farms</SelectItem>
                      {client.farms?.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id.toString()}>
                          {farm.farmName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description / Notes</Label>
                  <Textarea
                    placeholder="Add general instructions or context..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <RecommendationItemsForm
            items={items}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onMoveItem={moveItem}
            onAddItem={addItem}
          />

          {/* Summary */}
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calculator className="h-5 w-5" />
                  <span>Total Estimated Cost</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{calculateTotalCost().toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
