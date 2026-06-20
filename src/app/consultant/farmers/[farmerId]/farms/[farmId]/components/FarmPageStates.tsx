'use client'

import Link from 'next/link'
import { Loader2, MapPin } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

export function FarmPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading farm workspace...</p>
      </div>
    </div>
  )
}

export function FarmPageNotFound({ farmerId }: { farmerId: string }) {
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
            <BreadcrumbLink asChild>
              <Link href={`/consultant/farmers/${farmerId}`}>Farmer</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Not found</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
        <h2 className="text-base font-semibold">Farm not found</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          This farm could not be found or does not belong to this farmer.
        </p>
      </div>
    </div>
  )
}
