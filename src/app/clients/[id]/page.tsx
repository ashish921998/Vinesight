'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Sprout,
  FileText,
  Clipboard,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TestTube,
  Leaf,
  MoreVertical,
  Send,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ConsultantService } from '@/lib/consultant-service'
import type {
  ConsultantClient,
  ClientFarm,
  ClientLabReport,
  FertilizerRecommendation,
  ClientFarmInsert,
  ClientLabReportInsert
} from '@/types/consultant'
import { GROWTH_STAGES } from '@/types/consultant'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = parseInt(params.id as string)

  const [client, setClient] = useState<ConsultantClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('farms')

  // Modal states
  const [showFarmModal, setShowFarmModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState<ClientFarm | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Farm form
  const [farmForm, setFarmForm] = useState<ClientFarmInsert>({
    clientId: clientId,
    farmName: '',
    area: undefined,
    areaUnit: 'acres',
    grapeVariety: '',
    village: '',
    district: '',
    soilType: '',
    irrigationType: ''
  })

  // Report form
  const [reportForm, setReportForm] = useState<ClientLabReportInsert>({
    clientId: clientId,
    reportType: 'soil',
    testDate: new Date().toISOString().split('T')[0],
    labName: '',
    parameters: {},
    notes: ''
  })

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ConsultantService.getClientWithDetails(clientId)
      setClient(data)
    } catch (error) {
      logger.error('Error loading client:', error)
      toast.error('Failed to load client details')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId, loadClient])

  const handleAddFarm = async () => {
    if (!farmForm.farmName.trim()) {
      toast.error('Farm name is required')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingFarm) {
        await ConsultantService.updateClientFarm(editingFarm.id, farmForm)
        toast.success('Farm updated successfully')
      } else {
        await ConsultantService.createClientFarm({ ...farmForm, clientId })
        toast.success('Farm added successfully')
      }
      setShowFarmModal(false)
      setEditingFarm(null)
      resetFarmForm()
      loadClient()
    } catch (error) {
      logger.error('Error saving farm:', error)
      toast.error('Failed to save farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFarm = async (farmId: number) => {
    if (!confirm('Are you sure you want to delete this farm?')) return

    try {
      await ConsultantService.deleteClientFarm(farmId)
      toast.success('Farm deleted successfully')
      loadClient()
    } catch (error) {
      logger.error('Error deleting farm:', error)
      toast.error('Failed to delete farm')
    }
  }

  const handleAddReport = async () => {
    try {
      setIsSubmitting(true)
      await ConsultantService.createLabReport({ ...reportForm, clientId })
      toast.success('Report added successfully')
      setShowReportModal(false)
      resetReportForm()
      loadClient()
    } catch (error) {
      logger.error('Error saving report:', error)
      toast.error('Failed to save report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      await ConsultantService.deleteLabReport(reportId)
      toast.success('Report deleted successfully')
      loadClient()
    } catch (error) {
      logger.error('Error deleting report:', error)
      toast.error('Failed to delete report')
    }
  }

  const resetFarmForm = () => {
    setFarmForm({
      clientId: clientId,
      farmName: '',
      area: undefined,
      areaUnit: 'acres',
      grapeVariety: '',
      village: '',
      district: '',
      soilType: '',
      irrigationType: ''
    })
  }

  const resetReportForm = () => {
    setReportForm({
      clientId: clientId,
      reportType: 'soil',
      testDate: new Date().toISOString().split('T')[0],
      labName: '',
      parameters: {},
      notes: ''
    })
  }

  const openEditFarm = (farm: ClientFarm) => {
    setEditingFarm(farm)
    setFarmForm({
      clientId: farm.clientId,
      farmName: farm.farmName,
      area: farm.area || undefined,
      areaUnit: farm.areaUnit || 'acres',
      grapeVariety: farm.grapeVariety || '',
      village: farm.village || '',
      district: farm.district || '',
      soilType: farm.soilType || '',
      irrigationType: farm.irrigationType || ''
    })
    setShowFarmModal(true)
  }

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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/clients')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {client.clientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{client.clientName}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    {client.clientPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {client.clientPhone}
                      </span>
                    )}
                    {client.clientEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {client.clientEmail}
                      </span>
                    )}
                    {(client.clientVillage || client.clientDistrict) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {[client.clientVillage, client.clientDistrict].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/clients/${clientId}/recommend`)}
                className="bg-primary hover:bg-primary/90"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Create Recommendation
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <Sprout className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{client.farms?.length || 0}</span>
                <span className="text-gray-500">Farms</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">{client.labReports?.length || 0}</span>
                <span className="text-gray-500">Reports</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clipboard className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">{client.recommendations?.length || 0}</span>
                <span className="text-gray-500">Recommendations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="farms" className="flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Farms
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lab Reports
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            {/* Farms Tab */}
            <TabsContent value="farms">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Client Farms</h2>
                <Button
                  size="sm"
                  onClick={() => {
                    resetFarmForm()
                    setEditingFarm(null)
                    setShowFarmModal(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Farm
                </Button>
              </div>

              {client.farms && client.farms.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {client.farms.map((farm) => (
                    <Card key={farm.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{farm.farmName}</h3>
                            <div className="text-sm text-gray-500 mt-1 space-y-1">
                              {farm.area && (
                                <p>
                                  {farm.area} {farm.areaUnit || 'acres'}
                                </p>
                              )}
                              {farm.grapeVariety && <p>Variety: {farm.grapeVariety}</p>}
                              {(farm.village || farm.district) && (
                                <p className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {[farm.village, farm.district].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditFarm(farm)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteFarm(farm.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No farms added yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowFarmModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Farm
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Lab Reports Tab */}
            <TabsContent value="reports">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Lab Reports</h2>
                <Button size="sm" onClick={() => setShowReportModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              </div>

              {client.labReports && client.labReports.length > 0 ? (
                <div className="space-y-3">
                  {client.labReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                report.reportType === 'soil'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {report.reportType === 'soil' ? (
                                <TestTube className="h-5 w-5" />
                              ) : (
                                <Leaf className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold capitalize">
                                  {report.reportType} Test
                                </h3>
                                <Badge variant="outline">
                                  {new Date(report.testDate).toLocaleDateString()}
                                </Badge>
                              </div>
                              {report.labName && (
                                <p className="text-sm text-gray-500 mt-1">Lab: {report.labName}</p>
                              )}
                              {report.notes && (
                                <p className="text-sm text-gray-500 mt-1">{report.notes}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No lab reports added yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowReportModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Fertilizer Recommendations</h2>
                <Button
                  size="sm"
                  onClick={() => router.push(`/clients/${clientId}/recommend`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recommendation
                </Button>
              </div>

              {client.recommendations && client.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {client.recommendations.map((rec) => (
                    <Card key={rec.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{rec.title}</h3>
                              <Badge
                                className={
                                  rec.status === 'draft'
                                    ? 'bg-gray-100 text-gray-800'
                                    : rec.status === 'sent'
                                      ? 'bg-blue-100 text-blue-800'
                                      : rec.status === 'acknowledged'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-purple-100 text-purple-800'
                                }
                              >
                                {rec.status}
                              </Badge>
                            </div>
                            {rec.description && (
                              <p className="text-sm text-gray-500 mt-1">{rec.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              Created {new Date(rec.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/clients/${clientId}/recommend/${rec.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recommendations created yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push(`/clients/${clientId}/recommend`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Recommendation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Add/Edit Farm Modal */}
        <Dialog open={showFarmModal} onOpenChange={setShowFarmModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingFarm ? 'Edit Farm' : 'Add Farm'}</DialogTitle>
              <DialogDescription>
                {editingFarm ? 'Update farm details' : "Add a farm for this client"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Farm Name *</Label>
                <Input
                  placeholder="e.g., Main Vineyard"
                  value={farmForm.farmName}
                  onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={farmForm.area || ''}
                    onChange={(e) =>
                      setFarmForm({ ...farmForm, area: parseFloat(e.target.value) || undefined })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grape Variety</Label>
                  <Input
                    placeholder="e.g., Thompson Seedless"
                    value={farmForm.grapeVariety || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, grapeVariety: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Village</Label>
                  <Input
                    placeholder="Village name"
                    value={farmForm.village || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, village: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input
                    placeholder="District name"
                    value={farmForm.district || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Soil Type</Label>
                  <Input
                    placeholder="e.g., Black soil"
                    value={farmForm.soilType || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Irrigation Type</Label>
                  <Input
                    placeholder="e.g., Drip"
                    value={farmForm.irrigationType || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, irrigationType: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFarmModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFarm} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingFarm ? 'Update Farm' : 'Add Farm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Report Modal */}
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Lab Report</DialogTitle>
              <DialogDescription>Add a soil or petiole test report for this client</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Type *</Label>
                  <Select
                    value={reportForm.reportType}
                    onValueChange={(value) =>
                      setReportForm({ ...reportForm, reportType: value as 'soil' | 'petiole' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soil">Soil Test</SelectItem>
                      <SelectItem value="petiole">Petiole Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Date *</Label>
                  <Input
                    type="date"
                    value={reportForm.testDate as string}
                    onChange={(e) => setReportForm({ ...reportForm, testDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lab Name</Label>
                <Input
                  placeholder="e.g., Agricultural Lab, Pune"
                  value={reportForm.labName || ''}
                  onChange={(e) => setReportForm({ ...reportForm, labName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes about this report..."
                  value={reportForm.notes || ''}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReport} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
