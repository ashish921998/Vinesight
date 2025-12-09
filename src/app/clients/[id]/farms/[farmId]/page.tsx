'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { SupabaseService } from '@/lib/supabase-service'
import { FertilizerPlanService, type FertilizerPlanWithItems } from '@/lib/fertilizer-plan-service'
import { FertilizerPlanSection } from '@/components/fertilizer/FertilizerPlanSection'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { LabTestRecord } from '@/types/lab-tests'

interface FarmData {
  id: number
  name: string
  region: string | null
  crop_variety: string | null
  area: number | null
  date_of_pruning: string | null
  // Soil properties
  bulk_density: number | null
  cation_exchange_capacity: number | null
  soil_water_retention: number | null
  soil_texture_class: string | null
  sand_percentage: number | null
  silt_percentage: number | null
  clay_percentage: number | null
}

function ClientFarmPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const farmId = parseInt(params.farmId as string, 10)

  const [loading, setLoading] = useState(true)
  const [farm, setFarm] = useState<FarmData | null>(null)
  const [soilTests, setSoilTests] = useState<LabTestRecord[]>([])
  const [petioleTests, setPetioleTests] = useState<LabTestRecord[]>([])
  const [clientName, setClientName] = useState<string>('')
  const [organizationId, setOrganizationId] = useState<string>('')
  const [fertilizerPlans, setFertilizerPlans] = useState<FertilizerPlanWithItems[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = await getTypedSupabaseClient()

      // Get client's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', clientId)
        .single()

      setClientName(profile?.full_name || 'Farmer')

      // Get farm data
      const farmData = await SupabaseService.getFarmById(farmId)
      if (farmData) {
        setFarm({
          id: farmData.id ?? 0,
          name: farmData.name,
          region: farmData.region,
          crop_variety: farmData.cropVariety,
          area: farmData.area,
          date_of_pruning: farmData.dateOfPruning?.toISOString() ?? null,
          bulk_density: farmData.bulkDensity ?? null,
          cation_exchange_capacity: farmData.cationExchangeCapacity ?? null,
          soil_water_retention: farmData.soilWaterRetention ?? null,
          soil_texture_class: farmData.soilTextureClass ?? null,
          sand_percentage: farmData.sandPercentage ?? null,
          silt_percentage: farmData.siltPercentage ?? null,
          clay_percentage: farmData.clayPercentage ?? null
        })
      }

      // Get lab tests
      const [soilTestsData, petioleTestsData] = await Promise.all([
        SupabaseService.getSoilTestRecords(farmId),
        SupabaseService.getPetioleTestRecords(farmId)
      ])

      setSoilTests((soilTestsData || []) as LabTestRecord[])
      setPetioleTests((petioleTestsData || []) as LabTestRecord[])

      // Get organization ID for current user
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (membership) {
          setOrganizationId(membership.organization_id)

          // Get fertilizer plans for this farm
          const plans = await FertilizerPlanService.getPlansByFarm(farmId)
          setFertilizerPlans(plans)
        }
      }
    } catch (error) {
      console.error('Error loading farm data:', error)
      toast.error('Failed to load farm data')
    } finally {
      setLoading(false)
    }
  }, [clientId, farmId])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Farm Not Found</h2>
            <p className="text-muted-foreground">This farm could not be found.</p>
            <Button className="mt-4" onClick={() => router.push(`/clients/${clientId}`)}>
              Back to Client
            </Button>
          </CardContent>
        </Card>
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
          onClick={() => router.push(`/clients/${clientId}`)}
          className="flex items-center gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {clientName}
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

      {/* Farm Info Card */}
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
              <p className="font-medium">{clientName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soil Properties Card */}
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
              <p className="font-medium">
                {farm.bulk_density ? `${farm.bulk_density} g/ml` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CEC</p>
              <p className="font-medium">
                {farm.cation_exchange_capacity
                  ? `${farm.cation_exchange_capacity} meq/100g`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Water Retention</p>
              <p className="font-medium">
                {farm.soil_water_retention ? `${farm.soil_water_retention} mm/m` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Soil Composition */}
          {(farm.sand_percentage || farm.silt_percentage || farm.clay_percentage) && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Soil Composition</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {farm.sand_percentage ?? '-'}%
                  </p>
                  <p className="text-sm text-amber-600">Sand</p>
                </div>
                <div className="bg-stone-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-stone-700">
                    {farm.silt_percentage ?? '-'}%
                  </p>
                  <p className="text-sm text-stone-600">Silt</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-700">
                    {farm.clay_percentage ?? '-'}%
                  </p>
                  <p className="text-sm text-orange-600">Clay</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Tests Section */}
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
            {soilTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Soil Tests</h3>
                  <p className="text-muted-foreground">No soil test records found for this farm.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {soilTests.map((test) => (
                  <TestCard key={test.id} test={test} type="soil" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="petiole" className="space-y-4">
            {petioleTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Petiole Tests</h3>
                  <p className="text-muted-foreground">
                    No petiole test records found for this farm.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {petioleTests.map((test) => (
                  <TestCard key={test.id} test={test} type="petiole" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fertilizer Plans Section */}
      {organizationId && (
        <FertilizerPlanSection
          farmId={farmId}
          organizationId={organizationId}
          plans={fertilizerPlans}
          onPlanCreated={loadData}
          onPlanDeleted={loadData}
        />
      )}
    </div>
  )
}

// Component to display a test card with parameters and report preview
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

  // Key parameters to highlight
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

export default function ClientFarmPageWithAuth() {
  return (
    <ProtectedRoute>
      <ClientFarmPage />
    </ProtectedRoute>
  )
}
