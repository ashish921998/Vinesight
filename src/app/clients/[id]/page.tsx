'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, MapPin, Grape, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Farm {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  area: number | null
  date_of_pruning: string | null
}

function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [farms, setFarms] = useState<Farm[]>([])
  const [clientProfile, setClientProfile] = useState<{
    full_name: string | null
    email: string | null
  } | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()

      // Get client's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', clientId)
        .single()

      setClientProfile(profile)

      // Get farms owned by this client (farmer)
      // For now, we'll get farms owned by this user
      const { data: farmsData } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })

      setFarms((farmsData || []) as Farm[])
    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/clients')}
          className="flex items-center gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">{clientProfile?.full_name || 'Farmer'}</h1>
        {clientProfile?.email && <p className="text-muted-foreground">{clientProfile.email}</p>}
      </div>

      {/* Farms */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Farms ({farms.length})</h2>

        {farms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Farms Yet</h3>
              <p className="text-muted-foreground text-center">
                This farmer hasn&apos;t added any farms yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {farms.map((farm) => (
              <Card
                key={farm.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/clients/${clientId}/farms/${farm.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Grape className="h-5 w-5 text-purple-600" />
                    {farm.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {farm.region}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{farm.crop_variety}</span>
                    <span>{farm.area} acres</span>
                    {farm.date_of_pruning && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Pruned: {new Date(farm.date_of_pruning).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientDetailPageWithAuth() {
  return (
    <ProtectedRoute>
      <ClientDetailPage />
    </ProtectedRoute>
  )
}
