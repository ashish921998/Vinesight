'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Grape,
  Calendar,
  TestTube,
  Leaf,
  FileImage,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import type { LabTestRecord } from '@/types/lab-tests'
import type { FarmDetail } from '@/lib/consultant-query-service'
import {
  useConsultantAccess,
  useFarmDetail,
  useFarmerProfile,
  useValidatedFarmerClient
} from '@/hooks/consultant/useConsultantQueries'
import { SupabaseService } from '@/lib/supabase-service'

export default function ConsultantFarmPage() {
  const params = useParams()
  const farmerId = params.farmerId as string
  const rawFarmId = parseInt(params.farmId as string, 10)
  const farmId = isNaN(rawFarmId) ? null : rawFarmId

  const [soilTests, setSoilTests] = useState<LabTestRecord[]>([])
  const [petioleTests, setPetioleTests] = useState<LabTestRecord[]>([])
  const [labTestsFarmId, setLabTestsFarmId] = useState<number | null>(null)
  const [labTestsLoading, setLabTestsLoading] = useState(false)

  const accessQuery = useConsultantAccess()
  const access = accessQuery.data ?? null
  const validationQuery = useValidatedFarmerClient(access, farmerId)
  const isValidClient = validationQuery.data?.isValid ?? false
  const farmQuery = useFarmDetail(farmId, isValidClient, access)
  const profileQuery = useFarmerProfile(farmerId, isValidClient)
  const farm = isValidClient && farmQuery.data?.user_id === farmerId ? farmQuery.data : null
  const farmerName = profileQuery.data?.full_name || 'Farmer'

  useEffect(() => {
    const error =
      accessQuery.error ?? validationQuery.error ?? farmQuery.error ?? profileQuery.error
    if (!error) return

    console.error('Error loading farm data:', error)
    Sentry.captureException(error, {
      tags: { context: 'loadFarmDetail' },
      extra: { farmerId, farmId }
    })
    toast.error(error instanceof Error ? error.message : 'Failed to load farm data')
  }, [
    accessQuery.error,
    validationQuery.error,
    farmQuery.error,
    profileQuery.error,
    farmerId,
    farmId
  ])

  useEffect(() => {
    if (!farmId || !isValidClient || !farm) {
      setSoilTests([])
      setPetioleTests([])
      setLabTestsFarmId(null)
      setLabTestsLoading(false)
      return
    }

    let cancelled = false

    async function loadLabTests() {
      try {
        setLabTestsLoading(true)
        setLabTestsFarmId(null)
        const [soilTestsData, petioleTestsData] = await Promise.all([
          SupabaseService.getSoilTestRecords(farmId as number),
          SupabaseService.getPetioleTestRecords(farmId as number)
        ])

        if (cancelled) return
        setSoilTests((soilTestsData || []) as LabTestRecord[])
        setPetioleTests((petioleTestsData || []) as LabTestRecord[])
        setLabTestsFarmId(farm!.id)
      } catch (error) {
        if (cancelled) return
        setSoilTests([])
        setPetioleTests([])
        setLabTestsFarmId(null)
        console.error('Error loading lab tests:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load lab tests')
      } finally {
        if (!cancelled) setLabTestsLoading(false)
      }
    }

    loadLabTests()

    return () => {
      cancelled = true
    }
  }, [farmId, farm, isValidClient])

  const loading =
    accessQuery.isPending ||
    validationQuery.isPending ||
    (isValidClient &&
      farmId != null &&
      (farmQuery.isPending || profileQuery.isPending || labTestsLoading))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading farm data...</p>
        </div>
      </div>
    )
  }

  if (!farm) {
    return <FarmNotFound farmerId={farmerId} />
  }

  const visibleSoilTests = labTestsFarmId === farm.id ? soilTests : []
  const visiblePetioleTests = labTestsFarmId === farm.id ? petioleTests : []

  return (
    <div className="space-y-6">
      <FarmHeader farm={farm} farmerId={farmerId} farmerName={farmerName} />
      <FarmInfoCard farm={farm} farmerName={farmerName} />
      <SoilPropertiesCard farm={farm} />
      <LabTestsSection petioleTests={visiblePetioleTests} soilTests={visibleSoilTests} />
    </div>
  )
}

function FarmNotFound({ farmerId }: { farmerId: string }) {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 -ml-2">
        <Link href={`/consultant/farmers/${farmerId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Farmer
        </Link>
      </Button>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Farm Not Found</h2>
          <p className="text-muted-foreground">
            This farm could not be found or does not belong to this farmer.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function FarmHeader({
  farm,
  farmerId,
  farmerName
}: {
  farm: FarmDetail
  farmerId: string
  farmerName: string
}) {
  return (
    <div className="space-y-2">
      <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 -ml-2">
        <Link href={`/consultant/farmers/${farmerId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to {farmerName}
        </Link>
      </Button>
      <div className="flex items-center gap-3">
        <Grape className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{farm.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {farm.region}
          </p>
        </div>
      </div>
    </div>
  )
}

function FarmInfoCard({ farm, farmerName }: { farm: FarmDetail; farmerName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Farm Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Variety</p>
            <p className="font-medium">{farm.crop_variety || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Area</p>
            <p className="font-medium">{farm.area ? `${farm.area} acres` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Pruning</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {farm.date_of_pruning ? new Date(farm.date_of_pruning).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Owner</p>
            <p className="font-medium">{farmerName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SoilPropertiesCard({ farm }: { farm: FarmDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-amber-600" />
          Soil Properties
        </CardTitle>
        <CardDescription>Physical and chemical soil characteristics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Texture Class</p>
            <p className="font-medium">{farm.soil_texture_class || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bulk Density</p>
            <p className="font-medium">{farm.bulk_density ? `${farm.bulk_density} g/ml` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CEC</p>
            <p className="font-medium">
              {farm.cation_exchange_capacity ? `${farm.cation_exchange_capacity} meq/100g` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Water Retention</p>
            <p className="font-medium">
              {farm.soil_water_retention ? `${farm.soil_water_retention} mm/m` : 'N/A'}
            </p>
          </div>
        </div>

        {(farm.sand_percentage || farm.silt_percentage || farm.clay_percentage) && (
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Soil Composition</p>
            <div className="grid grid-cols-3 gap-4">
              <SoilCompositionValue
                label="Sand"
                value={farm.sand_percentage}
                className="bg-amber-50 text-amber-700"
                labelClassName="text-amber-600"
              />
              <SoilCompositionValue
                label="Silt"
                value={farm.silt_percentage}
                className="bg-stone-100 text-stone-700"
                labelClassName="text-stone-600"
              />
              <SoilCompositionValue
                label="Clay"
                value={farm.clay_percentage}
                className="bg-orange-50 text-orange-700"
                labelClassName="text-orange-600"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SoilCompositionValue({
  className,
  label,
  labelClassName,
  value
}: {
  className: string
  label: string
  labelClassName: string
  value: number | null
}) {
  return (
    <div className={`rounded-lg p-3 text-center ${className}`}>
      <p className="text-2xl font-bold">{value ?? '-'}%</p>
      <p className={`text-sm ${labelClassName}`}>{label}</p>
    </div>
  )
}

function LabTestsSection({
  petioleTests,
  soilTests
}: {
  petioleTests: LabTestRecord[]
  soilTests: LabTestRecord[]
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Lab Test Analysis</h2>

      <Tabs defaultValue="soil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="soil" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Soil Tests ({soilTests.length})
          </TabsTrigger>
          <TabsTrigger value="petiole" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Petiole Tests ({petioleTests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soil" className="space-y-4">
          <TestList
            emptyIcon="soil"
            emptyText="No soil test records found for this farm."
            emptyTitle="No Soil Tests"
            tests={soilTests}
            type="soil"
          />
        </TabsContent>

        <TabsContent value="petiole" className="space-y-4">
          <TestList
            emptyIcon="petiole"
            emptyText="No petiole test records found for this farm."
            emptyTitle="No Petiole Tests"
            tests={petioleTests}
            type="petiole"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TestList({
  emptyIcon,
  emptyText,
  emptyTitle,
  tests,
  type
}: {
  emptyIcon: 'soil' | 'petiole'
  emptyText: string
  emptyTitle: string
  tests: LabTestRecord[]
  type: 'soil' | 'petiole'
}) {
  const EmptyIcon = emptyIcon === 'soil' ? TestTube : Leaf

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
          <p className="text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {tests.map((test) => (
        <TestCard key={test.id} test={test} type={type} />
      ))}
    </div>
  )
}

function TestCard({ test, type }: { test: LabTestRecord; type: 'soil' | 'petiole' }) {
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const loadReportUrl = useCallback(async () => {
    if (!test.report_storage_path || reportUrl) return

    setLoadingReport(true)
    try {
      const response = await fetch('/api/test-reports/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: test.report_storage_path })
      })

      if (response.ok) {
        const { signedUrl } = await response.json()
        setReportUrl(signedUrl)
      } else {
        const body = await response.text().catch(() => null)
        console.warn(`Failed to load report signed URL (${response.status}):`, body)
      }
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoadingReport(false)
    }
  }, [test.report_storage_path, reportUrl])

  useEffect(() => {
    if (test.report_storage_path) {
      loadReportUrl()
    }
  }, [test.report_storage_path, loadReportUrl])

  const parameters = test.parameters || {}
  const paramKeys = Object.keys(parameters)

  const keyParams =
    type === 'soil'
      ? ['ph', 'ec', 'nitrogen', 'phosphorus', 'potassium']
      : ['total_nitrogen', 'nitrate_nitrogen', 'phosphorus', 'potassium', 'calcium']

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {type === 'soil' ? (
                <TestTube className="h-5 w-5 text-amber-600" />
              ) : (
                <Leaf className="h-5 w-5 text-green-600" />
              )}
              {type === 'soil' ? 'Soil Test' : 'Petiole Test'}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(test.date).toLocaleDateString()}
            </CardDescription>
          </div>
          {test.report_storage_path && reportUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                <FileImage className="h-4 w-4 mr-1" />
                View Report
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Parameters */}
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Key Parameters</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {keyParams.map((key) => {
              const value = parameters[key]
              if (value === undefined) return null
              return (
                <div key={key} className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="font-semibold">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Parameters */}
        {paramKeys.length > 0 && (
          <details className="group">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              View all {paramKeys.length} parameters
            </summary>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {paramKeys.map((key) => (
                <div key={key} className="flex justify-between bg-muted/30 rounded px-2 py-1">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">
                    {typeof parameters[key] === 'number'
                      ? parameters[key].toFixed(2)
                      : parameters[key]}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Report Preview */}
        {test.report_storage_path && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Report Preview</p>
            {loadingReport ? (
              <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reportUrl ? (
              <div className="relative aspect-[3/2] max-h-48 overflow-hidden rounded-lg border bg-muted/30">
                {test.report_storage_path.endsWith('.pdf') ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileImage className="h-8 w-8 text-muted-foreground mb-2" />
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open PDF Report
                    </a>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={reportUrl}
                      alt="Test Report"
                      fill
                      className="object-contain cursor-pointer"
                      onClick={() => window.open(reportUrl, '_blank')}
                      unoptimized
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Report preview unavailable</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {test.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{test.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
