'use client'

import { useState } from 'react'
import { FarmCard } from './FarmCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type FarmSummary, sortFarms, filterFarms } from '@/lib/portfolio-utils'

interface FarmCardGridProps {
  farms: FarmSummary[]
  onFarmSelect: (farmId: number) => void
  loading?: boolean
  className?: string
}

export function FarmCardGrid({ farms, onFarmSelect, loading, className }: FarmCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<
    | 'priority'
    | 'health_asc'
    | 'health_desc'
    | 'water_asc'
    | 'water_desc'
    | 'tasks'
    | 'harvest'
    | 'name'
  >('priority')
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'attention' | 'critical'>(
    'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Apply filters
  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery.trim() || undefined
  }
  const filteredFarms = filterFarms(farms, filters)

  // Apply sorting
  const sortedFarms = sortFarms(filteredFarms, sortBy)

  const hasActiveFilters = searchQuery.trim() || statusFilter !== 'all'

  return (
    <div className={className}>
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Your Farms {sortedFarms.length > 0 && `(${sortedFarms.length})`}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {(searchQuery.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg border">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search farms by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Status Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="healthy">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Healthy
                      </div>
                    </SelectItem>
                    <SelectItem value="attention">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Attention
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority (Critical First)</SelectItem>
                    <SelectItem value="health_asc">Health Score (Low to High)</SelectItem>
                    <SelectItem value="health_desc">Health Score (High to Low)</SelectItem>
                    <SelectItem value="water_asc">Water Level (Low to High)</SelectItem>
                    <SelectItem value="water_desc">Water Level (High to Low)</SelectItem>
                    <SelectItem value="tasks">Tasks (Most First)</SelectItem>
                    <SelectItem value="harvest">Harvest (Nearest First)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: &quot;{searchQuery.substring(0, 20)}&quot;
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => setSearchQuery('')}
                />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => setStatusFilter('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Farm Cards Grid */}
      {sortedFarms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {sortedFarms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} onClick={() => onFarmSelect(farm.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="text-muted-foreground mb-2">
            {hasActiveFilters ? 'No farms match your filters' : 'No farms found'}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
