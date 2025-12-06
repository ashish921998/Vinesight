'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Sprout,
  FileText,
  Clipboard,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ConsultantService } from '@/lib/consultant-service'
import type { ClientSummary, ConsultantClientInsert } from '@/types/consultant'
import { CLIENT_STATUS_OPTIONS } from '@/types/consultant'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingClient, setDeletingClient] = useState<ClientSummary | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<ConsultantClientInsert>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientVillage: '',
    clientDistrict: '',
    clientState: 'Maharashtra',
    notes: '',
    status: 'active'
  })

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ConsultantService.getClientsSummary()
      setClients(data)
    } catch (error) {
      logger.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const filteredClients = clients.filter(
    (client) =>
      client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientPhone?.includes(searchQuery)
  )

  const handleAddClient = async () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return
    }

    try {
      setIsSubmitting(true)
      await ConsultantService.createClient(formData)
      toast.success('Client added successfully')
      setShowAddModal(false)
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientVillage: '',
        clientDistrict: '',
        clientState: 'Maharashtra',
        notes: '',
        status: 'active'
      })
      loadClients()
    } catch (error) {
      logger.error('Error adding client:', error)
      toast.error('Failed to add client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!deletingClient) return

    try {
      setIsSubmitting(true)
      await ConsultantService.deleteClient(deletingClient.id)
      toast.success('Client deleted successfully')
      setShowDeleteDialog(false)
      setDeletingClient(null)
      loadClients()
    } catch (error) {
      logger.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {clients.length} {clients.length === 1 ? 'client' : 'clients'}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clients List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {client.clientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{client.clientName}</h3>
                            {getStatusBadge(client.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {client.clientPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.clientPhone}
                              </span>
                            )}
                            {client.clientEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.clientEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Sprout className="h-4 w-4" />
                              <span className="font-medium">{client.farmCount}</span>
                            </div>
                            <span className="text-xs text-gray-400">Farms</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{client.reportCount}</span>
                            </div>
                            <span className="text-xs text-gray-400">Reports</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clipboard className="h-4 w-4" />
                              <span className="font-medium">{client.recommendationCount}</span>
                            </div>
                            <span className="text-xs text-gray-400">Plans</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/clients/${client.id}`)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingClient(client)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Add your first client to start managing their farms and recommendations'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Add Client Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
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
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deletingClient?.clientName}? This will also delete all
                their farms, reports, and recommendations. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletingClient(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
