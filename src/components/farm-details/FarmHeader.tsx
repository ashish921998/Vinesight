'use client'

import { Grape, Scissors, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { type Farm } from '@/types/types'
import { capitalize } from '@/lib/utils'

interface FarmHeaderProps {
  farm: Farm
  loading: boolean
  onEdit?: (farm: Farm) => void
  onDelete?: (farmId: number) => void
}

export function FarmHeader({ farm, loading, onEdit, onDelete }: FarmHeaderProps) {
  const calculateDaysAfterPruning = (pruningDate?: Date) => {
    if (!pruningDate) return null

    const pruning = pruningDate
    const today = new Date()

    const pruningMidnight = new Date(pruning.getFullYear(), pruning.getMonth(), pruning.getDate())
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const diffTime = todayMidnight.getTime() - pruningMidnight.getTime()

    const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const diffDays = rawDays + 1

    return diffDays > 0 ? diffDays : null
  }

  const daysAfterPruning = calculateDaysAfterPruning(farm.dateOfPruning)

  if (loading) {
    return (
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!farm) return null

  return (
    <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-10 shadow-sm">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <Grape className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center mb-1">
              <h1 className="text-lg font-bold text-gray-900 truncate" style={{ maxWidth: '75%' }}>
                {capitalize(farm.name)}
              </h1>
              {daysAfterPruning !== null && (
                <div className="flex-shrink-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 flex items-center gap-1">
                  <Scissors className="h-3 w-3" />
                  {daysAfterPruning}d
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                {farm.crop || 'Grapes'}
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                {farm.cropVariety || 'Variety'}
              </Badge>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(farm)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Farm
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(farm.id!)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Farm
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
