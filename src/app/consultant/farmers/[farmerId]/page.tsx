'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, User, Mail, Phone, Sprout, MapPin, ChevronRight } from 'lucide-react'

interface FarmerProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface FarmTriage {
  classification: string | null
}

interface Farm {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  soil_texture_class: string | null
  area: number | null
  triage: FarmTriage | null
}

export default function FarmerProfilePage() {
  const params = useParams()
  const farmerId = params.farmerId as string

  const [farmer, setFarmer] = useState<FarmerProfile | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFarmerProfile()
  }, [farmerId])

  const loadFarmerProfile = async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.organization_id) {
        toast.error('No organization found')
        return
      }

      // Fetch farmer profile, verify they belong to consultant's org
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', farmerId)
        .eq('consultant_organization_id', membership.organization_id)
        .maybeSingle()

      if (profileError) {
        console.error('Failed to load farmer profile:', profileError)
        toast.error('Failed to load farmer profile')
        return
      }

      if (!profile) {
        toast.error('Farmer not found')
        return
      }

      setFarmer(profile)

      // Fetch farms for this farmer
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id, name, region, crop_variety, soil_texture_class, area')
        .eq('user_id', farmerId)

      if (farmsError) {
        console.error('Failed to load farms:', farmsError)
        toast.error('Failed to load farm data')
        return
      }

      // Fetch latest triage for each farm
      const farmIds = (farmsData || []).map((f) => f.id)
      let triageMap: Record<number, FarmTriage> = {}

      if (farmIds.length > 0) {
        const { data: triageData } = await supabase
          .from('petiole_triage')
          .select('farm_id, classification')
          .in('farm_id', farmIds)
          .order('created_at', { ascending: false })

        if (triageData) {
          for (const t of triageData) {
            if (!triageMap[t.farm_id]) {
              triageMap[t.farm_id] = { classification: t.classification }
            }
          }
        }
      }

      setFarms(
        (farmsData || []).map((f) => ({
          id: f.id,
          name: f.name,
          region: f.region,
          crop_variety: f.crop_variety,
          soil_texture_class: f.soil_texture_class,
          area: f.area,
          triage: triageMap[f.id] || null
        }))
      )
    } catch (error) {
      console.error('Failed to load farmer profile:', error)
      toast.error('Failed to load farmer profile')
    } finally {
      setLoading(false)
    }
  }

  const getClassificationBadge = (classification: string | null) => {
    const variants: Record<string, { class: string; label: string; emoji: string }> = {
      red: {
        class: 'bg-destructive/10 text-destructive border-destructive/20',
        label: 'Urgent',
        emoji: '🔴'
      },
      yellow: {
        class: 'bg-accent/10 text-accent border-accent/20',
        label: 'Watch',
        emoji: '🟡'
      },
      green: {
        class: 'bg-green-500/10 text-green-600 border-green-500/20',
        label: 'Normal',
        emoji: '🟢'
      }
    }

    if (!classification || !variants[classification]) return null

    const v = variants[classification]
    return (
      <Badge variant="outline" className={cn('text-xs', v.class)}>
        {v.emoji} {v.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farmer profile...</p>
        </div>
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="space-y-6">
        <Link href="/consultant/farmers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Farmers
          </Button>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Farmer Not Found</h3>
            <p className="text-muted-foreground mt-2">
              This farmer does not exist or is not part of your organization.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/consultant/farmers">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farmers
        </Button>
      </Link>

      {/* Farmer profile header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-accent" />
          {farmer.full_name || 'Unknown Farmer'}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
          {farmer.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {farmer.email}
            </span>
          )}
          {farmer.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {farmer.phone}
            </span>
          )}
        </div>
      </div>

      {/* Farms section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Farms ({farms.length})</h2>

        {farms.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Farms</h3>
              <p className="text-muted-foreground mt-2">This farmer has not added any farms yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Link key={farm.id} href={`/consultant/farmers/${farmerId}/farms/${farm.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-accent flex-shrink-0" />
                        {farm.name}
                      </CardTitle>
                      {getClassificationBadge(farm.triage?.classification ?? null)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {farm.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {farm.region}
                        </span>
                      )}
                      {farm.crop_variety && <span>{farm.crop_variety}</span>}
                      {farm.area && <span>{farm.area} acres</span>}
                      {farm.soil_texture_class && <span>{farm.soil_texture_class}</span>}
                    </div>
                    <div className="flex justify-end mt-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
