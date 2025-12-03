'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronRight,
  Image as ImageIcon,
  Info,
  Loader2,
  Sparkles,
  Upload
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SoilProfileService } from '@/lib/soil-profile-service'
import type { SoilSectionName } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type SectionState = {
  name: SoilSectionName
  dimensionValue: string
  ec: string
  moisture: string
  photoPath?: string
  photoPreview?: string
  aiResult?: {
    predicted_texture: string
    moisture_category: string
    moisture_pct: number
    awc_range: string
    smd_range: string
    confidence: number
    rationale: string
    analyzed_at: string
  }
  analyzing: boolean
  uploading: boolean
  status: 'incomplete' | 'complete'
}

const DIMENSION_LABEL: Record<SoilSectionName, string> = {
  top: 'Depth (m)',
  bottom: 'Depth (m)',
  left: 'Width (m)',
  right: 'Width (m)'
}

const initialSectionState = (name: SoilSectionName): SectionState => ({
  name,
  dimensionValue: '',
  ec: '',
  moisture: '',
  aiResult: undefined,
  photoPath: undefined,
  photoPreview: undefined,
  analyzing: false,
  uploading: false,
  status: 'incomplete'
})

const SECTION_ORDER: SoilSectionName[] = ['top', 'bottom', 'left', 'right']

export default function SoilProfilingPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = Number.parseInt(params.id as string, 10)

  const [sections, setSections] = useState<Record<SoilSectionName, SectionState>>({
    top: initialSectionState('top'),
    bottom: initialSectionState('bottom'),
    left: initialSectionState('left'),
    right: initialSectionState('right')
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [fusarium, setFusarium] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [openAccordion, setOpenAccordion] = useState<SoilSectionName | ''>('top')

  const farmIdValid = Number.isFinite(farmId)

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const latest = await SoilProfileService.getLatestProfile(farmId)
        if (latest?.created_at) {
          setLastUpdated(new Date(latest.created_at).toLocaleDateString())
        }
      } catch (error) {
        console.error('Failed to load soil profile', error)
      }
    }

    if (farmIdValid) {
      loadExisting()
    }
  }, [farmId, farmIdValid])

  const allSectionsComplete = useMemo(
    () => SECTION_ORDER.every((section) => sections[section].status === 'complete'),
    [sections]
  )

  const handlePhotoSelect = async (fileList: FileList | null, section: SoilSectionName) => {
    if (!fileList?.length) return
    const file = fileList[0]
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], uploading: true }
    }))
    try {
      const { path, publicUrl } = await SoilProfileService.uploadSectionPhoto(file, farmId, section)
      const preview = URL.createObjectURL(file)
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          photoPath: path,
          photoPreview: publicUrl || preview,
          uploading: false
        }
      }))
      toast.success('Photo uploaded')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to upload photo')
      setSections((prev) => ({
        ...prev,
        [section]: { ...prev[section], uploading: false }
      }))
    }
  }

  const handleAnalyze = async (section: SoilSectionName) => {
    const current = sections[section]
    if (!current.photoPath) {
      toast.error('Upload a soil photo before analyzing')
      return
    }
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], analyzing: true }
    }))
    try {
      const response = await fetch('/api/soil-profiling/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoPath: current.photoPath,
          sectionName: section,
          ec_ds_m: current.ec ? Number.parseFloat(current.ec) : undefined,
          dimension: current.dimensionValue,
          farmId
        })
      })

      if (!response.ok) {
        throw new Error('AI analysis failed')
      }

      const result = await response.json()
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          aiResult: result,
          moisture: result.moisture_pct?.toString() ?? prev[section].moisture,
          analyzing: false,
          status: prev[section].status
        }
      }))
      toast.success('Moisture analyzed')
    } catch (error) {
      console.error(error)
      toast.error('Unable to analyze. Please retry or adjust manually.')
      setSections((prev) => ({
        ...prev,
        [section]: { ...prev[section], analyzing: false }
      }))
    }
  }

  const handleSaveSection = (section: SoilSectionName) => {
    const current = sections[section]
    if (!current.dimensionValue || !current.photoPath || current.moisture === '') {
      toast.error('Fill required fields and upload a photo')
      return
    }

    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], status: 'complete' }
    }))
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section saved`)
  }

  const handleSaveProfile = async () => {
    if (!allSectionsComplete) return
    setSavingProfile(true)
    try {
      const payloadSections = SECTION_ORDER.map((name) => {
        const s = sections[name]
        const depth_m =
          name === 'top' || name === 'bottom' ? Number.parseFloat(s.dimensionValue) : undefined
        const width_m =
          name === 'left' || name === 'right' ? Number.parseFloat(s.dimensionValue) : undefined
        return {
          name,
          depth_m: Number.isFinite(depth_m) ? depth_m : undefined,
          width_m: Number.isFinite(width_m) ? width_m : undefined,
          photo_path: s.photoPath,
          ec_ds_m: s.ec ? Number.parseFloat(s.ec) : undefined,
          moisture_pct_ai: s.aiResult?.moisture_pct,
          moisture_pct_user: Number.parseFloat(s.moisture),
          predicted_texture: s.aiResult?.predicted_texture,
          ai_confidence: s.aiResult?.confidence,
          awc_range: s.aiResult?.awc_range,
          smd_range: s.aiResult?.smd_range,
          analyzed_at: s.aiResult?.analyzed_at
        }
      })

      const invalidMoisture = payloadSections.some(
        (section) => !Number.isFinite(section.moisture_pct_user)
      )

      if (invalidMoisture) {
        toast.error('Moisture % must be a valid number between 0 and 100')
        setSavingProfile(false)
        return
      }

      await SoilProfileService.createProfileWithSections({
        farm_id: farmId,
        fusarium_pct: fusarium ? Number.parseFloat(fusarium) : null,
        sections: payloadSections
      })

      toast.success('Soil profile saved')
      router.push(`/farms/${farmId}`)
    } catch (error: any) {
      console.error('Save profile error', error)
      toast.error(error?.message || 'Failed to save soil profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const renderSectionCard = (section: SoilSectionName) => {
    const state = sections[section]
    const isDepth = section === 'top' || section === 'bottom'

    return (
      <AccordionItem
        key={section}
        value={section}
        className={cn(
          'rounded-2xl border border-border bg-card shadow-sm px-3',
          state.status === 'complete' ? 'border-green-500/60' : 'border-border'
        )}
      >
        <AccordionTrigger
          value={section}
          className="py-3 text-left text-sm font-semibold capitalize"
        >
          <div className="flex w-full items-center justify-between gap-2 pr-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span>{section} section</span>
                {state.status === 'complete' ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline">Incomplete</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {state.dimensionValue
                  ? `${isDepth ? 'Depth' : 'Width'}: ${state.dimensionValue} m`
                  : `Add ${isDepth ? 'depth' : 'width'}, photo, EC (optional), moisture`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </AccordionTrigger>
        <AccordionContent value={section} className="pb-3">
          {renderSectionForm(section)}
        </AccordionContent>
      </AccordionItem>
    )
  }

  const renderSectionForm = (section: SoilSectionName) => {
    const state = sections[section]
    const isDepth = section === 'top' || section === 'bottom'

    return (
      <div className="px-1 pb-1 space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {DIMENSION_LABEL[section]} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={isDepth ? '0.20' : '0.35'}
            value={state.dimensionValue}
            onChange={(e) =>
              setSections((prev) => ({
                ...prev,
                [section]: { ...prev[section], dimensionValue: e.target.value }
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Soil image <span className="text-destructive">*</span>
          </Label>
          <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">Upload photo</span>
                <span className="text-xs text-muted-foreground">Palm-impression close-up</span>
              </div>
            </div>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoSelect(e.target.files, section)}
            />
          </label>
          {state.photoPreview && (
            <div className="rounded-xl overflow-hidden border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.photoPreview} alt="Soil" className="h-32 w-full object-cover" />
            </div>
          )}
          {state.uploading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Electrical Conductivity (optional)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="1.2"
            value={state.ec}
            onChange={(e) =>
              setSections((prev) => ({
                ...prev,
                [section]: { ...prev[section], ec: e.target.value }
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Moisture (%) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="55.0"
            value={state.moisture}
            onChange={(e) =>
              setSections((prev) => ({
                ...prev,
                [section]: { ...prev[section], moisture: e.target.value }
              }))
            }
          />
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
          <Button
            type="button"
            className="w-full justify-center gap-2"
            variant="secondary"
            disabled={state.analyzing}
            onClick={() => handleAnalyze(section)}
          >
            {state.analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </>
            )}
          </Button>

          {state.aiResult && (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">AI result</span>
                <Badge variant={state.aiResult.confidence < 0.6 ? 'destructive' : 'secondary'}>
                  Confidence {state.aiResult.confidence}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{state.aiResult.rationale}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">Texture</p>
                  <p className="font-semibold">{state.aiResult.predicted_texture}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">Moisture category</p>
                  <p className="font-semibold">{state.aiResult.moisture_category}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">Suggested moisture</p>
                  <p className="font-semibold">{state.aiResult.moisture_pct}%</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">AWC</p>
                  <p className="font-semibold">{state.aiResult.awc_range}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">SMD</p>
                  <p className="font-semibold">{state.aiResult.smd_range}</p>
                </div>
              </div>
              {state.aiResult.confidence < 0.6 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-amber-900">
                  <Info className="h-4 w-4 mt-0.5" />
                  <div className="text-xs">
                    Low confidence. Retake the photo or adjust moisture manually.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur px-1 pb-1">
          <Button className="w-full" onClick={() => handleSaveSection(section)}>
            Save section
          </Button>
        </div>
      </div>
    )
  }

  if (!farmIdValid) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Card className="p-6">
            <CardTitle className="text-base">Invalid farm</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Please return and select a farm.</p>
            <Button className="mt-3" onClick={() => router.push('/farms')}>
              Back to farms
            </Button>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border/60">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => router.push(`/farms/${farmId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">Soil profiling</p>
              <p className="text-base font-semibold text-foreground">Palm-impression analysis</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Accordion
                type="single"
                collapsible
                value={openAccordion}
                onValueChange={(v) => setOpenAccordion((v as SoilSectionName) || '')}
                className="space-y-2"
              >
                {SECTION_ORDER.map(renderSectionCard)}
              </Accordion>
            </CardContent>
          </Card>

          {allSectionsComplete && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Fusarium & summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fusarium (%) (optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="12.0"
                    value={fusarium}
                    onChange={(e) => setFusarium(e.target.value)}
                  />
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {SECTION_ORDER.map((section) => {
                    const state = sections[section]
                    const isDepth = section === 'top' || section === 'bottom'
                    return (
                      <AccordionItem key={section} value={section} className="border-border/60">
                        <AccordionTrigger className="text-sm capitalize">
                          {section} section
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {isDepth ? 'Depth' : 'Width'}
                            </span>
                            <span className="font-semibold">{state.dimensionValue} m</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Moisture</span>
                            <span className="font-semibold">{state.moisture}%</span>
                          </div>
                          {state.ec && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">EC</span>
                              <span className="font-semibold">{state.ec} dS/m</span>
                            </div>
                          )}
                          {state.aiResult && (
                            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/40 p-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Texture</span>
                                <span className="font-semibold">
                                  {state.aiResult.predicted_texture}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">AWC</span>
                                <span className="font-semibold">{state.aiResult.awc_range}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">SMD</span>
                                <span className="font-semibold">{state.aiResult.smd_range}</span>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border/70 bg-card/95 backdrop-blur px-4 py-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!allSectionsComplete || savingProfile}
            onClick={handleSaveProfile}
          >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save soil profile'}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
