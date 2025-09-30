'use client'

import { MapPin, Grape, Scissors, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
      <div className="p-6">
        {/* Farm Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-2xl">
            <Grape className="h-8 w-8 text-green-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{capitalize(farm.name)}</h1>

            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{farm.region}</span>
              </div>
              {farm.dateOfPruning && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Scissors className="h-4 w-4" />
                  <span>
                    {new Date(farm.dateOfPruning).toLocaleString('default', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {farm.grapeVariety || 'Grape Vineyard'}
              </Badge>
            </div>
          </div>

          {/* Edit/Delete Actions */}
          {(onEdit || onDelete) && (
            <div className="ml-4">
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
