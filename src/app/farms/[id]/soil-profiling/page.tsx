'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Image as ImageIcon,
  Loader2,
  Minus,
  Pencil,
  Trash2,
  Upload
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SoilProfileService } from '@/lib/soil-profile-service'
import type { SoilProfile, SoilSectionName } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type SectionState = {
  name: SoilSectionName
  dimensionValue: string
  ec: string
  moisture: string
  photoPath?: string
  photoPreview?: string
  showPreview: boolean
  uploading: boolean
}

type SectionPhotoTimelineItem = {
  src: string
  dateLabel: string
}

type SectionTrend = {
  name: SoilSectionName
  latest: number | null
  change: number | null
  sparkline: string
  hasData: boolean
}

type OverviewMetricKey = 'moisture' | 'ec' | 'fusarium'

type TrendStat = {
  value: number | null
  change: number | null
}

type SectionHistoryEntry = {
  date: string
  moisture: number | null
  ec: number | null
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
  photoPath: undefined,
  photoPreview: undefined,
  showPreview: false,
  uploading: false
})

const SECTION_ORDER: SoilSectionName[] = ['top', 'bottom', 'left', 'right']

const getAverageMoisture = (profile: SoilProfile): number | null => {
  const values =
    profile.sections
      ?.map((section) => section.moisture_pct_user)
      .filter((value): value is number => typeof value === 'number') || []
  if (values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return Number((sum / values.length).toFixed(1))
}

const buildTrendPath = (values: number[], width = 180, height = 40) => {
  if (!values.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const normalized = (value - min) / range
      const y = height - normalized * height
      return `${x},${y}`
    })
    .join(' ')
}

const getAverageEc = (profile: SoilProfile): number | null => {
  const values =
    profile.sections
      ?.map((section) => section.ec_ds_m)
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value)) || []
  if (values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return Number((sum / values.length).toFixed(2))
}

const averageNumbers = (values: Array<number | null | undefined>, digits = 1): number | null => {
  const filtered = values.filter(
    (value): value is number => typeof value === 'number' && !Number.isNaN(value)
  )
  if (!filtered.length) return null
  const result = filtered.reduce((total, value) => total + value, 0) / filtered.length
  return Number(result.toFixed(digits))
}

const computeDelta = (
  current: number | null,
  previous: number | null,
  digits = 1
): number | null => {
  if (current === null || previous === null) return null
  const delta = current - previous
  return Number(delta.toFixed(digits))
}

const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getTodayInputDate = () => new Date().toISOString().split('T')[0]

const formatDateInputValue = (value?: string | null) => {
  if (!value) return getTodayInputDate()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return getTodayInputDate()
  return parsed.toISOString().split('T')[0]
}

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
  const [soilProfiles, setSoilProfiles] = useState<SoilProfile[]>([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [fusarium, setFusarium] = useState('')
  const [profileDate, setProfileDate] = useState<string>(() => getTodayInputDate())
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history')
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null)
  const [focusedSection, setFocusedSection] = useState<SoilSectionName | null>(null)
  const previewUrlsRef = useRef<Record<SoilSectionName, string | null>>({
    top: null,
    bottom: null,
    left: null,
    right: null
  })

  const farmIdValid = Number.isFinite(farmId)

  const loadSoilProfiles = useCallback(async () => {
    if (!farmIdValid) return
    try {
      const profiles = await SoilProfileService.listProfiles(farmId)
      setSoilProfiles(profiles)
      if (profiles[0]?.created_at) {
        setLastUpdated(new Date(profiles[0].created_at).toLocaleDateString())
      }
    } catch (error) {
      console.error('Failed to load soil profiles', error)
    }
  }, [farmId, farmIdValid])

  useEffect(() => {
    void loadSoilProfiles()
  }, [loadSoilProfiles])

  const revokeObjectUrl = useCallback((url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, [])

  const resetPreviewUrls = useCallback(() => {
    Object.values(previewUrlsRef.current).forEach((url) => revokeObjectUrl(url))
    previewUrlsRef.current = {
      top: null,
      bottom: null,
      left: null,
      right: null
    }
  }, [revokeObjectUrl])

  useEffect(() => {
    return () => {
      resetPreviewUrls()
    }
  }, [resetPreviewUrls])

  const isSectionComplete = useCallback(
    (section: SoilSectionName) =>
      sections[section].dimensionValue !== '' && sections[section].moisture !== '',
    [sections]
  )

  const allSectionsComplete = useMemo(
    () => SECTION_ORDER.every((section) => isSectionComplete(section)),
    [isSectionComplete]
  )

  const getSignedUrlForExistingPhoto = useCallback(
    async (photoPath: string): Promise<string | null> => {
      try {
        const response = await fetch('/api/soil-profiling/get-signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoPath, farmId })
        })

        if (!response.ok) {
          console.error('Failed to get signed URL')
          return null
        }

        const data = await response.json()
        return data.signedUrl || null
      } catch (error) {
        console.error('Error fetching signed URL:', error)
        return null
      }
    },
    [farmId]
  )

  const handlePhotoSelect = async (fileList: FileList | null, section: SoilSectionName) => {
    if (!fileList?.length) return
    const file = fileList[0]
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], uploading: true }
    }))
    try {
      const { path, signedUrl } = await SoilProfileService.uploadSectionPhoto(file, farmId, section)
      const previousPreview = previewUrlsRef.current[section]
      if (previousPreview) {
        revokeObjectUrl(previousPreview)
      }
      const previewSource = signedUrl ?? URL.createObjectURL(file)
      previewUrlsRef.current[section] = signedUrl ? null : previewSource

      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          photoPath: path,
          photoPreview: previewSource,
          uploading: false,
          showPreview: true
        }
      }))

      toast.success('Photo uploaded')
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
      setSections((prev) => ({
        ...prev,
        [section]: { ...prev[section], uploading: false }
      }))
    }
  }

  const handleSaveProfile = async () => {
    if (!allSectionsComplete) {
      toast.error('Fill depth/width and moisture for all sections before saving')
      return
    }
    if (!profileDate) {
      toast.error('Select a soil profile date')
      return
    }
    const parsedProfileDate = new Date(profileDate)
    if (Number.isNaN(parsedProfileDate.getTime())) {
      toast.error('Invalid soil profile date')
      return
    }
    const profileDateISO = parsedProfileDate.toISOString()
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
          moisture_pct_user: Number.parseFloat(s.moisture)
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

      if (editingProfileId) {
        await SoilProfileService.updateProfile({
          id: editingProfileId,
          farm_id: farmId,
          fusarium_pct: fusarium ? Number.parseFloat(fusarium) : null,
          sections: payloadSections,
          profileDate: profileDateISO
        })
        toast.success('Soil profile updated')
      } else {
        await SoilProfileService.createProfileWithSections({
          farm_id: farmId,
          fusarium_pct: fusarium ? Number.parseFloat(fusarium) : null,
          sections: payloadSections,
          profileDate: profileDateISO
        })
        toast.success('Soil profile saved')
      }
      setShowProfileDialog(false)
      setEditingProfileId(null)
      resetPreviewUrls()
      setSections({
        top: initialSectionState('top'),
        bottom: initialSectionState('bottom'),
        left: initialSectionState('left'),
        right: initialSectionState('right')
      })
      setProfileDate(getTodayInputDate())
      await loadSoilProfiles()
    } catch (error: unknown) {
      console.error('Save profile error', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save soil profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const sortedProfiles = useMemo(() => {
    if (!soilProfiles.length) return []
    return [...soilProfiles].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
      return aDate - bDate
    })
  }, [soilProfiles])

  const profileAverages = useMemo(
    () =>
      sortedProfiles
        .map((profile) => getAverageMoisture(profile))
        .filter((value): value is number => value !== null),
    [sortedProfiles]
  )

  const trendValues = useMemo(() => profileAverages.slice(-6), [profileAverages])

  const profileTrendPath = useMemo(() => buildTrendPath(trendValues, 220, 60), [trendValues])

  const latestMoistureDelta = useMemo(() => {
    if (trendValues.length < 2) return null
    const latest = trendValues[trendValues.length - 1]
    const previous = trendValues[trendValues.length - 2]
    if (typeof latest !== 'number' || typeof previous !== 'number') return null
    return Number((latest - previous).toFixed(1))
  }, [trendValues])

  const overviewStats = useMemo<Record<OverviewMetricKey, TrendStat>>(() => {
    const empty: TrendStat = { value: null, change: null }
    if (!sortedProfiles.length) {
      return {
        moisture: { ...empty },
        ec: { ...empty },
        fusarium: { ...empty }
      }
    }

    const now = new Date()
    const last30Start = new Date(now)
    last30Start.setDate(now.getDate() - 30)
    const previousStart = new Date(last30Start)
    previousStart.setDate(previousStart.getDate() - 30)

    const getProfilesBetween = (start: Date, end?: Date) =>
      sortedProfiles.filter((profile) => {
        if (!profile.created_at) return false
        const createdAt = new Date(profile.created_at)
        if (Number.isNaN(createdAt.getTime())) return false
        if (end) {
          return createdAt >= start && createdAt < end
        }
        return createdAt >= start
      })

    const recentProfiles = getProfilesBetween(last30Start)
    const previousProfiles = getProfilesBetween(previousStart, last30Start)
    const currentScope = recentProfiles.length ? recentProfiles : sortedProfiles

    const moistureCurrent = averageNumbers(
      currentScope.map((profile) => getAverageMoisture(profile))
    )
    const moisturePrevious = averageNumbers(
      previousProfiles.map((profile) => getAverageMoisture(profile))
    )

    const ecCurrent = averageNumbers(
      currentScope.map((profile) => getAverageEc(profile)),
      2
    )
    const ecPrevious = averageNumbers(
      previousProfiles.map((profile) => getAverageEc(profile)),
      2
    )

    const fusariumCurrent = averageNumbers(
      currentScope.map((profile) =>
        typeof profile.fusarium_pct === 'number' ? Number(profile.fusarium_pct.toFixed(1)) : null
      )
    )
    const fusariumPrevious = averageNumbers(
      previousProfiles.map((profile) =>
        typeof profile.fusarium_pct === 'number' ? Number(profile.fusarium_pct.toFixed(1)) : null
      )
    )

    return {
      moisture: { value: moistureCurrent, change: computeDelta(moistureCurrent, moisturePrevious) },
      ec: { value: ecCurrent, change: computeDelta(ecCurrent, ecPrevious, 2) },
      fusarium: {
        value: fusariumCurrent,
        change: computeDelta(fusariumCurrent, fusariumPrevious)
      }
    }
  }, [sortedProfiles])

  const sectionTrends = useMemo<SectionTrend[]>(() => {
    return SECTION_ORDER.map((section) => {
      const values = sortedProfiles
        .map((profile) => {
          const entry = profile.sections?.find((s) => s.name === section)
          if (typeof entry?.moisture_pct_user !== 'number') return null
          return Number(entry.moisture_pct_user.toFixed(1))
        })
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
      const latest = values.length ? values[values.length - 1] : null
      const previous = values.length > 1 ? values[values.length - 2] : null
      return {
        name: section,
        latest,
        change: computeDelta(latest, previous),
        sparkline: values.length ? buildTrendPath(values, 200, 60) : '',
        hasData: values.length > 0
      }
    })
  }, [sortedProfiles])

  const ecTrendValues = useMemo(
    () =>
      sortedProfiles
        .map((profile) => getAverageEc(profile))
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value)),
    [sortedProfiles]
  )

  const ecTrendPath = useMemo(() => buildTrendPath(ecTrendValues, 280, 80), [ecTrendValues])

  const ecStats = useMemo(() => {
    if (!ecTrendValues.length) {
      return { average: null, max: null }
    }
    return {
      average: averageNumbers(ecTrendValues, 2),
      max: Number(Math.max(...ecTrendValues).toFixed(2))
    }
  }, [ecTrendValues])

  const fusariumTrendValues = useMemo(
    () =>
      sortedProfiles
        .map((profile) =>
          typeof profile.fusarium_pct === 'number' ? Number(profile.fusarium_pct.toFixed(1)) : null
        )
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value)),
    [sortedProfiles]
  )

  const fusariumStats = useMemo(() => {
    if (!fusariumTrendValues.length) {
      return { average: null, max: null }
    }
    return {
      average: averageNumbers(fusariumTrendValues),
      max: Number(Math.max(...fusariumTrendValues).toFixed(1))
    }
  }, [fusariumTrendValues])

  const photoTimelines = useMemo<Record<SoilSectionName, SectionPhotoTimelineItem[]>>(() => {
    const base: Record<SoilSectionName, SectionPhotoTimelineItem[]> = {
      top: [],
      bottom: [],
      left: [],
      right: []
    }
    sortedProfiles.forEach((profile) => {
      profile.sections?.forEach((section) => {
        const src = section.photo_preview || section.photo_path
        if (!src) return
        const sectionName = section.name as SoilSectionName
        if (!SECTION_ORDER.includes(sectionName)) return
        base[sectionName].push({
          src,
          dateLabel: profile.created_at
            ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
              })
            : 'Unknown'
        })
      })
    })
    return base
  }, [sortedProfiles])

  const historySummaries = useMemo(() => {
    if (!sortedProfiles.length) return []
    const clone = [...sortedProfiles].reverse()
    return clone.slice(0, 3)
  }, [sortedProfiles])

  const sectionHistory = useMemo<Record<SoilSectionName, SectionHistoryEntry[]>>(() => {
    const base: Record<SoilSectionName, SectionHistoryEntry[]> = {
      top: [],
      bottom: [],
      left: [],
      right: []
    }
    sortedProfiles.forEach((profile) => {
      profile.sections?.forEach((section) => {
        const name = section.name as SoilSectionName
        if (!SECTION_ORDER.includes(name)) return
        base[name].push({
          date: formatDateLabel(profile.created_at),
          moisture:
            typeof section.moisture_pct_user === 'number'
              ? Number(section.moisture_pct_user.toFixed(1))
              : null,
          ec: typeof section.ec_ds_m === 'number' ? Number(section.ec_ds_m.toFixed(2)) : null
        })
      })
    })
    return base
  }, [sortedProfiles])

  const formatDisplayValue = (value: number | null, suffix = '') =>
    value === null ? '—' : `${value}${suffix}`

  const renderDelta = (change: number | null, suffix = '%', size: 'xs' | 'sm' = 'xs') => {
    const Icon =
      change === null ? Minus : change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus
    const tone =
      change === null
        ? 'text-muted-foreground'
        : change > 0
          ? 'text-green-600'
          : change < 0
            ? 'text-red-600'
            : 'text-muted-foreground'
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-xs'
    let label = 'No data'
    if (change !== null) {
      label = change === 0 ? 'Stable' : `${change > 0 ? '+' : ''}${change}${suffix}`
    }
    return (
      <span className={cn('flex items-center gap-1 font-medium', tone, sizeClass)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    )
  }

  const overviewConfig: Array<{
    key: OverviewMetricKey
    title: string
    suffix: string
    description: string
  }> = [
    { key: 'moisture', title: 'Avg Moisture', suffix: '%', description: 'Field average' },
    { key: 'ec', title: 'Avg EC', suffix: ' dS/m', description: 'Salinity check' },
    { key: 'fusarium', title: 'Fusarium', suffix: '%', description: 'Detected in scans' }
  ]

  const renderSectionCard = (section: SoilSectionName) => {
    const state = sections[section]
    const isDepth = section === 'top' || section === 'bottom'

    return (
      <AccordionItem
        key={section}
        value={section}
        className={cn(
          'rounded-2xl border border-border bg-card shadow-sm px-3',
          isSectionComplete(section) ? 'border-green-500/60' : 'border-border'
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
                {isSectionComplete(section) ? (
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
                  : `Add ${isDepth ? 'depth' : 'width'} and moisture`}
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3">{renderSectionForm(section)}</AccordionContent>
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
          <Label className="text-sm font-medium">Soil image (optional)</Label>
          <p className="text-[11px] text-muted-foreground">
            Uploading a photo helps document the palm impression, but you can save without it.
          </p>
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
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setSections((prev) => ({
                    ...prev,
                    [section]: {
                      ...prev[section],
                      showPreview: !prev[section].showPreview
                    }
                  }))
                }
                className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {state.showPreview ? 'Hide preview' : 'Show preview'}
              </button>
              {state.showPreview && (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.photoPreview}
                    alt="Soil preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
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
          <p className="text-xs text-muted-foreground">
            AI-based analysis is paused for now. Manually enter moisture values and save the
            section.
          </p>
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-white pb-28">
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border/60">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => router.push(`/farms/${farmId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Soil Profiling</h2>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
              )}
            </div>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                setEditingProfileId(null)
                setFusarium('')
                setProfileDate(getTodayInputDate())
                setSections({
                  top: initialSectionState('top'),
                  bottom: initialSectionState('bottom'),
                  left: initialSectionState('left'),
                  right: initialSectionState('right')
                })
                setShowProfileDialog(true)
              }}
            >
              Add profile
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          <Card className="border-0 shadow-lg bg-white/90">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'trends')}>
              <CardHeader className="flex flex-col gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl">Soil profile workspace</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Review history or view moisture trends. Use the top-right button to add or edit
                    profiles.
                  </CardDescription>
                </div>
                <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/50 p-1">
                  <TabsTrigger value="history" className="rounded-full">
                    History
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="rounded-full">
                    Trends
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="space-y-4">
                <TabsContent value="history" className="space-y-3">
                  {soilProfiles.length === 0 ? (
                    <div className="space-y-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">No soil profiles yet</p>
                      <p>Click “Add profile” above to record your first set.</p>
                    </div>
                  ) : (
                    soilProfiles.map((profile) => {
                      const average = getAverageMoisture(profile)
                      return (
                        <div
                          key={profile.id}
                          className="rounded-2xl border border-border bg-gradient-to-br from-white to-amber-50/50 p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">
                                {profile.created_at
                                  ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'Unknown date'}
                              </p>
                              {typeof profile.fusarium_pct === 'number' && (
                                <p className="text-xs text-muted-foreground">
                                  Fusarium {profile.fusarium_pct.toFixed(1)}%
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={async () => {
                                  setEditingProfileId(profile.id || null)
                                  setFusarium(
                                    profile.fusarium_pct !== null &&
                                      profile.fusarium_pct !== undefined
                                      ? String(profile.fusarium_pct)
                                      : ''
                                  )
                                  setProfileDate(formatDateInputValue(profile.created_at))
                                  resetPreviewUrls()
                                  const nextSections: Record<SoilSectionName, SectionState> = {
                                    top: initialSectionState('top'),
                                    bottom: initialSectionState('bottom'),
                                    left: initialSectionState('left'),
                                    right: initialSectionState('right')
                                  }

                                  // Process sections and fetch signed URLs for existing photos
                                  for (const section of profile.sections || []) {
                                    const sectionName = section.name as SoilSectionName
                                    let photoPreview: string | undefined = section.photo_preview
                                      ? section.photo_preview
                                      : undefined

                                    // If there's a photo path but no preview, fetch a signed URL
                                    if (section.photo_path && !photoPreview) {
                                      const signedUrl = await getSignedUrlForExistingPhoto(
                                        section.photo_path
                                      )
                                      if (signedUrl) {
                                        photoPreview = signedUrl
                                      }
                                    }

                                    nextSections[sectionName] = {
                                      ...initialSectionState(sectionName),
                                      dimensionValue:
                                        section.depth_m?.toString() ||
                                        section.width_m?.toString() ||
                                        '',
                                      ec: section.ec_ds_m?.toString() || '',
                                      moisture: section.moisture_pct_user?.toString() || '',
                                      photoPath: section.photo_path || undefined,
                                      photoPreview,
                                      showPreview: false,
                                      uploading: false
                                    }
                                  }
                                  setSections(nextSections)
                                  setShowProfileDialog(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={async () => {
                                  try {
                                    if (!profile.id) return
                                    if (!window.confirm('Delete this soil profile?')) return
                                    await SoilProfileService.deleteProfile(profile.id)
                                    await loadSoilProfiles()
                                    toast.success('Profile deleted')
                                  } catch (error: unknown) {
                                    toast.error(
                                      error instanceof Error
                                        ? error.message
                                        : 'Failed to delete profile'
                                    )
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Avg {average ?? '—'}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            {profile.sections?.map((section) => (
                              <span
                                key={`${section.name}-${section.photo_path ?? ''}-${section.depth_m ?? ''}`}
                                className="rounded-full bg-white px-3 py-1 shadow-sm"
                              >
                                <span className="font-semibold text-foreground">
                                  {section.name}
                                </span>{' '}
                                {(section.moisture_pct_user ?? 0).toFixed(1)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  )}
                </TabsContent>
                <TabsContent value="trends" className="space-y-6">
                  <div className="rounded-3xl border border-border bg-gradient-to-br from-white via-amber-50/50 to-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Trends
                        </p>
                        <p className="text-base font-semibold text-foreground sm:text-lg">
                          Soil Profiling – Farm #{farmId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sortedProfiles.length
                            ? `${sortedProfiles.length} profile${sortedProfiles.length === 1 ? '' : 's'} analyzed`
                            : 'Log a profile to unlock insights'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700"
                      >
                        Last 30 days
                      </Badge>
                    </div>
                  </div>

                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Overview (Last 30 days)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Moisture, EC, and fusarium snapshots
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Avg from recent submissions
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {overviewConfig.map((item) => {
                        const stat = overviewStats[item.key]
                        const deltaSuffix = item.key === 'ec' ? ' dS/m' : '%'
                        return (
                          <div
                            key={item.key}
                            className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {item.title}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                              {formatDisplayValue(stat.value, item.suffix)}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                              {renderDelta(stat.change, deltaSuffix)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Overall moisture trend
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Latest {Math.min(trendValues.length, 6)} entries
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold text-foreground">
                            {trendValues.length ? `${trendValues.at(-1)}%` : '—'}
                          </p>
                          {renderDelta(latestMoistureDelta)}
                        </div>
                      </div>
                      {trendValues.length ? (
                        <svg viewBox="0 0 220 60" className="mt-4 h-16 w-full text-emerald-500">
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            points={profileTrendPath}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <p className="mt-4 text-xs text-muted-foreground">
                          Add at least two profiles to draw a trend line.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Moisture by section</p>
                        <p className="text-xs text-muted-foreground">
                          Quick sparklines for each palm direction
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Tap to dive deeper</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {sectionTrends.map((trend) => (
                        <div
                          key={trend.name}
                          className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold capitalize text-foreground">
                                {trend.name} section
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Latest: {formatDisplayValue(trend.latest, '%')}
                              </p>
                            </div>
                            {renderDelta(trend.change, '%', 'sm')}
                          </div>
                          {trend.hasData ? (
                            <svg viewBox="0 0 200 60" className="mt-4 h-16 w-full text-sky-500">
                              <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                points={trend.sparkline}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <p className="mt-4 text-xs text-muted-foreground">
                              Record this section to start a trend.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFocusedSection((prev) => (prev === trend.name ? null : trend.name))
                            }
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            {focusedSection === trend.name ? 'Hide details' : 'View details'}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          {focusedSection === trend.name && (
                            <div className="mt-3 space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs">
                              {sectionHistory[trend.name].length ? (
                                sectionHistory[trend.name]
                                  .slice(-4)
                                  .reverse()
                                  .map((entry) => (
                                    <div
                                      key={`${trend.name}-detail-${entry.date}-${entry.moisture ?? 'na'}-${
                                        entry.ec ?? 'na'
                                      }`}
                                      className="flex items-center justify-between text-muted-foreground"
                                    >
                                      <span className="font-medium text-foreground">
                                        {entry.date}
                                      </span>
                                      <div className="flex flex-col text-right">
                                        <span>
                                          Moisture {formatDisplayValue(entry.moisture, '%')}
                                        </span>
                                        <span>EC {formatDisplayValue(entry.ec, ' dS/m')}</span>
                                      </div>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-muted-foreground">
                                  No history for this section yet.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            EC (salinity) trend
                          </p>
                          <p className="text-xs text-muted-foreground">Average vs. peak</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">
                            Avg {formatDisplayValue(ecStats.average, ' dS/m')}
                          </p>
                          <p>Max {formatDisplayValue(ecStats.max, ' dS/m')}</p>
                        </div>
                      </div>
                      {ecTrendValues.length ? (
                        <svg viewBox="0 0 280 80" className="mt-4 h-24 w-full text-amber-500">
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            points={ecTrendPath}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <p className="mt-6 text-xs text-muted-foreground">
                          Add EC readings to any section to chart salinity over time.
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Fusarium trend</p>
                          <p className="text-xs text-muted-foreground">Avg vs. peak infection</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">
                            Avg {formatDisplayValue(fusariumStats.average, '%')}
                          </p>
                          <p>Peak {formatDisplayValue(fusariumStats.max, '%')}</p>
                        </div>
                      </div>
                      {fusariumTrendValues.length ? (
                        <div className="mt-4 flex h-24 items-end gap-1">
                          {fusariumTrendValues.map((value, index) => {
                            const peak = fusariumStats.max || 1
                            const height = Math.max(8, Math.round((value / peak) * 100))
                            return (
                              <span
                                key={`fusarium-${value}-${index}`}
                                className="flex-1 rounded-t-full bg-rose-200"
                                style={{ height: `${height}%` }}
                                title={`Entry ${index + 1}: ${value}%`}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <p className="mt-6 text-xs text-muted-foreground">
                          Log fusarium % when saving profiles to unlock this view.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Photo timeline</p>
                      <p className="text-xs text-muted-foreground">
                        Scroll sideways to track palm impressions visually
                      </p>
                    </div>
                    {SECTION_ORDER.map((section) => (
                      <div key={`photos-${section}`} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold capitalize text-foreground">
                            {section} section photos
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {photoTimelines[section].length} photos
                          </span>
                        </div>
                        {photoTimelines[section].length ? (
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {photoTimelines[section].map((photo, index) => (
                              <div
                                key={`${section}-photo-${photo.src ?? 'placeholder'}-${photo.dateLabel}-${index}`}
                                className="flex min-w-[64px] flex-col items-center gap-1 text-[11px] text-muted-foreground"
                              >
                                <div
                                  className="h-16 w-16 rounded-2xl border border-border/60 bg-muted/40 bg-cover bg-center shadow-inner"
                                  style={
                                    photo.src ? { backgroundImage: `url(${photo.src})` } : undefined
                                  }
                                />
                                <span>{photo.dateLabel}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No photos yet for this section.
                          </p>
                        )}
                      </div>
                    ))}
                  </section>

                  <section className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Section comparison</p>
                      <p className="text-xs text-muted-foreground">
                        Last recorded moisture and change per layout
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                      <div className="grid grid-cols-3 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Section</span>
                        <span>Last</span>
                        <span className="text-right">Change</span>
                      </div>
                      {sectionTrends.map((trend) => (
                        <div
                          key={`comparison-${trend.name}`}
                          className="grid grid-cols-3 items-center px-4 py-3 text-sm"
                        >
                          <span className="font-semibold capitalize text-foreground">
                            {trend.name}
                          </span>
                          <span>{formatDisplayValue(trend.latest, '%')}</span>
                          <div className="justify-self-end">
                            {renderDelta(trend.change, '%', 'sm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Profile history</p>
                        <p className="text-xs text-muted-foreground">
                          Most recent submissions at a glance
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setActiveTab('history')}
                      >
                        View all
                      </Button>
                    </div>
                    {historySummaries.length ? (
                      historySummaries.map((profile, index) => {
                        const averageMoisture = getAverageMoisture(profile)
                        const averageEc = getAverageEc(profile)
                        const fusariumValue =
                          typeof profile.fusarium_pct === 'number'
                            ? `${profile.fusarium_pct.toFixed(1)}%`
                            : '—'
                        return (
                          <div
                            key={`summary-${profile.id ?? profile.created_at ?? index}`}
                            className="rounded-2xl border border-border bg-gradient-to-br from-white to-amber-50/40 p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Profile – {formatDateLabel(profile.created_at)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Avg moisture {formatDisplayValue(averageMoisture, '%')} • Avg EC{' '}
                                  {formatDisplayValue(averageEc, ' dS/m')}
                                </p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Fusarium {fusariumValue}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('history')}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                            >
                              View profile
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Log your first soil profile to populate history.
                      </p>
                    )}
                  </section>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingProfileId ? 'Edit soil profile' : 'Add soil profile'}
                </DialogTitle>
                <DialogDescription>
                  Enter measurements and moisture for all four sections.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Profile date</Label>
                  <Input
                    type="date"
                    value={profileDate}
                    max={getTodayInputDate()}
                    onChange={(e) => setProfileDate(e.target.value)}
                  />
                </div>
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
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="top"
                  className="w-full space-y-2"
                >
                  {SECTION_ORDER.map(renderSectionCard)}
                </Accordion>
                <div className="pt-2">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!allSectionsComplete || savingProfile}
                    onClick={handleSaveProfile}
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save soil profile'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
