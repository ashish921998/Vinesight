'use client'

import Link from 'next/link'
import { Check, Grape, MapPin } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { RecordVisitDialog } from '@/components/consultant/RecordVisitDialog'
import type { ConsultantAccess } from '@/lib/consultant-access'
import type { FarmDetail } from '@/lib/consultant-query-service'
import type { Visit } from '@/lib/consultant-visit-service'
import type { LabTestRecord } from '@/types/lab-tests'

export function FarmPageHeader({
  farmerId,
  farmerName,
  farm,
  farmId,
  access,
  reviewTest,
  hasPendingReview,
  onVisitRecorded
}: {
  farmerId: string
  farmerName: string
  farm: FarmDetail
  farmId: number | null
  access: ConsultantAccess | null
  reviewTest?: LabTestRecord | undefined
  hasPendingReview: boolean
  onVisitRecorded?: (visit: Visit) => void
}) {
  return (
    <header className="pb-5 border-b border-border">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/consultant/farmers">Farmers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/consultant/farmers/${farmerId}`}>{farmerName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{farm.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-xl font-semibold tracking-tight">{farm.name}</h1>
            {hasPendingReview ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--nutrient-deficient-bg)',
                  color: 'var(--nutrient-deficient)'
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--nutrient-deficient)' }}
                />
                New report to review
              </span>
            ) : reviewTest ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--nutrient-optimal-bg)',
                  color: 'var(--nutrient-optimal)'
                }}
              >
                <Check className="h-3 w-3" />
                Reviewed
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {farm.region || 'No region'}
            </span>
            {farm.area && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono tabular-nums">{farm.area} acres</span>
              </>
            )}
            {farm.crop_variety && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <Grape className="h-3 w-3 text-muted-foreground" />
                  {farm.crop_variety}
                </span>
              </>
            )}
            {farm.date_of_pruning && (
              <>
                <span className="text-border">·</span>
                <span className="tabular-nums">
                  Pruned{' '}
                  {new Date(farm.date_of_pruning).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </>
            )}
            {reviewTest?.date && (
              <>
                <span className="text-border">·</span>
                <span className="tabular-nums">
                  Sample{' '}
                  {new Date(reviewTest.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {access && farmId !== null && (
          <RecordVisitDialog
            access={access}
            farmerId={farmerId}
            farms={[{ id: farmId, name: farm.name }]}
            defaultFarmId={farmId}
            onRecorded={onVisitRecorded}
          />
        )}
      </div>
    </header>
  )
}
