'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, Sprout, MapPin, IndianRupee, CircleAlert } from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import {
  validateFarmerClient,
  getFarmerProfile,
  getFarmerFarms,
  type FarmerFarm
} from '@/lib/consultant-query-service'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import { RecordVisitDialog } from '@/components/consultant/RecordVisitDialog'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

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
  const [access, setAccess] = useState<ConsultantAccess | null>(null)
  const [clientRecordId, setClientRecordId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    // Guard against stale loads when [farmerId] changes without remounting
    // (App Router preserves the [farmerId] segment component). If a newer
    // navigation fires before this load resolves, bail before any setState so
    // farmer A's data can never overwrite farmer B's.
    let stale = false

    const load = async () => {
      try {
        setLoading(true)
        setNotFound(false)

        const currentAccess = await getConsultantAccess()
        if (stale) return
        if (!currentAccess) {
          toast.error('Not authenticated')
          return
        }
        setAccess(currentAccess)

        // Validate farmer is an active client of the organization
        // Validate agronomist assignment if current user is agronomist
        const validation = await validateFarmerClient(currentAccess, farmerId)
        if (stale) return
        if (!validation.isValid) {
          setNotFound(true)
          return
        }
        setClientRecordId(validation.clientRecordId)
        setIsPaid(validation.isPaid)

        const [profile, farmsData] = await Promise.all([
          getFarmerProfile(farmerId),
          getFarmerFarms(farmerId)
        ])

        if (stale) return
        if (!profile) {
          setNotFound(true)
          return
        }

        setFarmer(profile)
        setFarms(farmsData)
        posthog.capture('consultant_farmer_profile_viewed', {
          farmer_id: farmerId,
          org_id: currentAccess.organizationId,
          role: currentAccess.role,
          farm_count: farmsData.length
        })
      } catch (error) {
        if (stale) return
        Sentry.captureException(error, {
          tags: { context: 'loadFarmerProfile' },
          extra: { farmerId }
        })
        toast.error(error instanceof Error ? error.message : 'Failed to load farmer profile')
      } finally {
        if (!stale) setLoading(false)
      }
    }

    load()
    return () => {
      stale = true
    }
  }, [farmerId])

  // Aggregate unique regions for the summary metric strip. Computed unconditionally
  // to satisfy the rules-of-hooks (early returns happen below).
  const regions = useMemo(() => {
    const set = new Set<string>()
    farms.forEach((f) => {
      if (f.region) set.add(f.region)
    })
    return Array.from(set)
  }, [farms])

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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/consultant/farmers">Farmers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/consultant/farmers">Farmers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{farmer.full_name || 'Unknown Farmer'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Farmer profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {farmer.full_name || 'Unknown Farmer'}
            </h1>
            {clientRecordId && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                  isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}
                title={isPaid ? 'Payment status: paid' : 'Payment status: unpaid'}
              >
                {isPaid ? <IndianRupee className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
                {isPaid ? 'Paid' : 'Unpaid'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {farmer.email && (
              <a
                href={`mailto:${farmer.email}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" />
                {farmer.email}
              </a>
            )}
            {farmer.phone && (
              <a
                href={`tel:${farmer.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" />
                {farmer.phone}
              </a>
            )}
            {!farmer.email && !farmer.phone && (
              <span className="italic">No contact details on file</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {access && clientRecordId && (
            <RecordVisitDialog
              access={access}
              farmerId={farmerId}
              farms={farms.map((f) => ({ id: f.id, name: f.name }))}
            />
          )}
          {clientRecordId && (
            <PaidToggleButton
              clientRecordId={clientRecordId}
              isPaid={isPaid}
              size="default"
              onChange={setIsPaid}
            />
          )}
        </div>
      </div>

      {/* Summary metric strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sprout className="h-3.5 w-3.5 text-accent" />
            Farms
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{farms.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5 text-accent" />
            Payment
          </div>
          <p
            className={`mt-1 text-sm font-semibold ${isPaid ? 'text-green-700' : 'text-amber-700'}`}
          >
            {isPaid ? 'Paid' : 'Unpaid'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            Region
          </div>
          <p className="mt-1 text-sm font-semibold">
            {regions.length === 0 ? (
              <span className="text-muted-foreground italic font-normal">Not set</span>
            ) : regions.length === 1 ? (
              regions[0]
            ) : (
              `${regions.length} regions`
            )}
          </p>
        </div>
      </div>

      {/* Farms section */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          Farms <span className="text-muted-foreground font-normal">({farms.length})</span>
        </h2>

        {farms.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Farms</h3>
              <p className="text-muted-foreground mt-2">This farmer has not added any farms yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Desktop header row - hidden on mobile */}
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.75fr_1fr] gap-4 border-b border-border bg-secondary/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <div className="flex items-center gap-2">
                <Sprout className="h-3.5 w-3.5 text-accent" />
                Farm
              </div>
              <div>Region</div>
              <div>Variety</div>
              <div className="text-right">Area</div>
              <div className="text-right">Soil</div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-border">
              {farms.map((farm) => (
                <Link
                  key={farm.id}
                  href={`/consultant/farmers/${farmerId}/farms/${farm.id}`}
                  className="group block transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:bg-accent/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {/* Desktop: aligned columns */}
                  <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.75fr_1fr] gap-4 px-4 py-3.5 sm:grid">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sprout className="h-4 w-4 shrink-0 text-accent" />
                      <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-accent transition-colors">
                        {farm.name}
                      </h3>
                    </div>
                    <div className="text-sm text-foreground self-center truncate">
                      {farm.region || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                    <div className="text-sm text-foreground self-center truncate">
                      {farm.crop_variety || (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground self-center text-right tabular-nums">
                      {farm.area != null ? (
                        `${farm.area} ac`
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground self-center text-right truncate">
                      {farm.soil_texture_class || (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </div>
                  </div>
                  {/* Mobile: stacked block */}
                  <div className="px-4 py-3.5 sm:hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <Sprout className="h-4 w-4 shrink-0 text-accent" />
                      <h3 className="truncate text-base font-semibold leading-tight group-hover:text-accent transition-colors">
                        {farm.name}
                      </h3>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <dt className="text-muted-foreground shrink-0">Region</dt>
                        <dd className="font-medium truncate">
                          {farm.region || (
                            <span className="text-muted-foreground italic font-normal">
                              Not set
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="text-muted-foreground shrink-0">Variety</dt>
                        <dd className="font-medium truncate">
                          {farm.crop_variety || (
                            <span className="text-muted-foreground italic font-normal">
                              Not set
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="text-muted-foreground shrink-0">Area</dt>
                        <dd className="font-medium tabular-nums">
                          {farm.area != null ? (
                            `${farm.area} acres`
                          ) : (
                            <span className="text-muted-foreground italic font-normal">-</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="text-muted-foreground shrink-0">Soil</dt>
                        <dd className="font-medium truncate">
                          {farm.soil_texture_class || (
                            <span className="text-muted-foreground italic font-normal">
                              Not set
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
