'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { User, Mail, Phone, IndianRupee, CircleAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PaidToggleButton } from '@/components/consultant/PaidToggleButton'
import { RecordVisitDialog } from '@/components/consultant/RecordVisitDialog'
import { useFarmerProfileData } from './components/useFarmerProfileData'
import { FarmerSummaryStrip } from './components/FarmerSummaryStrip'
import { FarmerFarmsTable } from './components/FarmerFarmsTable'

export default function FarmerProfilePage() {
  const params = useParams()
  const farmerId = params.farmerId as string
  const { farmer, farms, loading, notFound, access, clientRecordId, isPaid, setIsPaid } =
    useFarmerProfileData(farmerId)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Card>
            <CardContent className="p-8">
              <Skeleton className="mx-auto h-10 w-10 rounded-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-end">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

      <FarmerSummaryStrip farms={farms} isPaid={isPaid} />

      <FarmerFarmsTable farms={farms} farmerId={farmerId} />
    </div>
  )
}
