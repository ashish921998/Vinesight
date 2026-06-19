'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Lock, Search, UserCog, Users } from 'lucide-react'
import { getConsultantAccess, type ConsultantAccess } from '@/lib/consultant-access'
import { getFarmerClients, type FarmerWithFarms } from '@/lib/consultant-query-service'
import { listOrgMembers, type OrgMember } from '@/lib/team-service'
import { TeamTabs } from '@/components/consultant/TeamTabs'
import posthog from 'posthog-js'

export default function FarmerAssignmentsPage() {
  const [access, setAccess] = useState<ConsultantAccess | null>(null)
  const [farmers, setFarmers] = useState<FarmerWithFarms[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [targetAgronomist, setTargetAgronomist] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const currentAccess = await getConsultantAccess()
      if (!currentAccess) {
        toast.error('Not authenticated')
        return
      }
      setAccess(currentAccess)

      // Agronomists are read-only here; skip the heavier loads.
      if (!currentAccess.canViewAllFarmers) {
        return
      }

      const [farmerData, memberData] = await Promise.all([
        getFarmerClients(currentAccess),
        listOrgMembers(currentAccess.organizationId)
      ])
      setFarmers(farmerData)
      setMembers(memberData)
      setSelected(new Set())
    } catch (error) {
      console.error('Failed to load assignments:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  // Only agronomists can be assignment targets.
  const agronomists = useMemo(() => members.filter((m) => m.role === 'agronomist'), [members])

  // Map every member id -> display name for showing current assignment.
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) {
      map.set(m.id, m.full_name || m.email || 'Unknown')
    }
    return map
  }, [members])

  const assignmentLabel = (farmer: FarmerWithFarms): string => {
    if (!farmer.assigned_to) return 'Unassigned'
    if (access && farmer.assigned_to === access.userId) return 'You'
    return memberNameById.get(farmer.assigned_to) || 'Assigned'
  }

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return farmers
    return farmers.filter((f) => f.full_name?.toLowerCase().includes(query))
  }, [farmers, search])

  const allFilteredSelected =
    filteredFarmers.length > 0 && filteredFarmers.every((f) => selected.has(f.id))

  const toggleFarmer = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const f of filteredFarmers) next.delete(f.id)
      } else {
        for (const f of filteredFarmers) next.add(f.id)
      }
      return next
    })
  }

  const targetAgronomistName = useMemo(() => {
    const m = agronomists.find((a) => a.id === targetAgronomist)
    return m ? m.full_name || m.email || 'agronomist' : 'agronomist'
  }, [agronomists, targetAgronomist])

  const submitAssignment = async (agronomistUserId: string | null) => {
    if (!access) return
    const clientUserIds = Array.from(selected)
    if (clientUserIds.length === 0) {
      toast.error('Select at least one farmer')
      return
    }
    if (agronomistUserId && !agronomists.some((a) => a.id === agronomistUserId)) {
      toast.error('Pick an agronomist first')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/organizations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: access.organizationId,
          agronomistUserId,
          clientUserIds
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result?.error || 'Failed to update assignments')
      }

      const count = result.updated ?? 0
      toast.success(
        agronomistUserId
          ? `Assigned ${count} farmer${count !== 1 ? 's' : ''} to ${targetAgronomistName}`
          : `Unassigned ${count} farmer${count !== 1 ? 's' : ''}`
      )
      posthog.capture(
        agronomistUserId ? 'consultant_farmer_assigned' : 'consultant_farmer_unassigned',
        {
          org_id: access.organizationId,
          count,
          agronomist_id: agronomistUserId ?? null
        }
      )
      await loadData()
    } catch (error) {
      console.error('Assignment failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update assignments')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    )
  }

  // Admin/owner only — agronomists get a read-only notice.
  if (access && !access.canViewAllFarmers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Farmer Assignments</h1>
          <p className="text-muted-foreground">Assign farmers to agronomists</p>
        </div>
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>Only admins can assign farmers to agronomists.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const selectedCount = selected.size

  return (
    <div className="space-y-6">
      <TeamTabs canViewAllFarmers={access?.canViewAllFarmers ?? false} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Farmer Assignments</h1>
        <p className="text-muted-foreground">Assign farmers to agronomists in bulk</p>
      </div>

      {/* Target agronomist picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4 text-accent" />
            Target Agronomist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="agronomist-select" className="text-sm text-muted-foreground">
            Choose who to assign the selected farmers to
          </Label>
          {agronomists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agronomists in your organization yet. Invite one from the team page first.
            </p>
          ) : (
            <Select value={targetAgronomist} onValueChange={setTargetAgronomist}>
              <SelectTrigger id="agronomist-select" className="w-full sm:w-[320px]">
                <SelectValue placeholder="Select an agronomist..." />
              </SelectTrigger>
              <SelectContent>
                {agronomists.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name || a.email || 'Unknown agronomist'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Farmer list */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Farmers
            </CardTitle>
            <Badge variant="secondary">{selectedCount} selected</Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by farmer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredFarmers.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allFilteredSelected}
                onCheckedChange={toggleSelectAllFiltered}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Select all {filteredFarmers.length} shown
              </Label>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {filteredFarmers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {farmers.length === 0
                  ? 'No farmers are linked to your organization yet.'
                  : 'No farmers match your search.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-1">
                {filteredFarmers.map((farmer) => {
                  const isSelected = selected.has(farmer.id)
                  return (
                    <label
                      key={farmer.id}
                      htmlFor={`farmer-${farmer.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Checkbox
                        id={`farmer-${farmer.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleFarmer(farmer.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {farmer.full_name || 'Unknown Farmer'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {farmer.farms.length} farm{farmer.farms.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <Badge
                        variant={farmer.assigned_to ? 'secondary' : 'outline'}
                        className="flex-shrink-0"
                      >
                        {assignmentLabel(farmer)}
                      </Badge>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Separator />
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => submitAssignment(targetAgronomist || null)}
          disabled={submitting || selectedCount === 0 || !targetAgronomist}
          className="flex-1"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCog className="h-4 w-4 mr-2" />
          )}
          Assign selected to {targetAgronomistName}
        </Button>
        <Button
          variant="outline"
          onClick={() => submitAssignment(null)}
          disabled={submitting || selectedCount === 0}
          className="flex-1"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Unassign selected
        </Button>
      </div>
    </div>
  )
}
