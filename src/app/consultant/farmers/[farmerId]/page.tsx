'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, User, Mail, Phone, Sprout, MapPin, ChevronRight } from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import {
  validateFarmerClient,
  getFarmerProfile,
  getFarmerFarms,
  type FarmerFarm
} from '@/lib/consultant-query-service'

interface FarmerProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export default function FarmerProfilePage() {
  const params = useParams()
  const farmerId = params.farmerId as string

  const [farmer, setFarmer] = useState<FarmerProfile | null>(null)
  const [farms, setFarms] = useState<FarmerFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const loadFarmerProfile = useCallback(async () => {
    try {
      setLoading(true)
      setNotFound(false)

      const access = await getConsultantAccess()
      if (!access) {
        toast.error('Not authenticated')
        return
      }

      // Validate farmer is an active client of the organization
      // Validate agronomist assignment if current user is agronomist
      const validation = await validateFarmerClient(access, farmerId)
      if (!validation.isValid) {
        setNotFound(true)
        return
      }

      const [profile, farmsData] = await Promise.all([
        getFarmerProfile(farmerId),
        getFarmerFarms(farmerId)
      ])

      if (!profile) {
        setNotFound(true)
        return
      }

      setFarmer(profile)
      setFarms(farmsData)
    } catch (error) {
      console.error('Failed to load farmer profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load farmer profile')
    } finally {
      setLoading(false)
    }
  }, [farmerId])

  useEffect(() => {
    loadFarmerProfile()
  }, [loadFarmerProfile])

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

  if (notFound || !farmer) {
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
