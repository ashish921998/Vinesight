'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Sprout,
  FileText,
  Clipboard,
  Plus,
  Eye
} from 'lucide-react'
import { ConsultantService } from '@/lib/consultant-service'
import type { ConsultantClient } from '@/types/consultant'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { FarmDetailsTab } from '@/components/consultant/FarmDetailsTab'
import { LabReportsTab } from '@/components/consultant/LabReportsTab'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = parseInt(params.id as string)

  const [client, setClient] = useState<ConsultantClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('farms')

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

            <TabsContent value="farms">
              <FarmDetailsTab
                clientId={clientId}
                farms={client.farms || []}
                onRefresh={loadClient}
              />
            </TabsContent>

            <TabsContent value="reports">
              <LabReportsTab
                clientId={clientId}
                reports={client.labReports || []}
                onRefresh={loadClient}
              />
            </TabsContent>

            <TabsContent value="recommendations">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Fertilizer Recommendations</h2>
                <Button size="sm" onClick={() => router.push(`/clients/${clientId}/recommend`)}>
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
      </div>
    </ProtectedRoute>
  )
}
