'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Sprout, MapPin, MoreVertical, ChevronRight } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SupabaseService } from '@/lib/supabase-service'
import type { Farm } from '@/types/types'
import Link from 'next/link'
import { FarmModal } from '@/components/farm-details/forms/FarmModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { capitalize } from '@/lib/utils'

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)

  useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setLoading(true)
      const farmList = await SupabaseService.getAllFarms()
      setFarms(farmList)
    } catch (error) {
      console.error('Error loading farms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (farmData: any) => {
    try {
      setSubmitLoading(true)

      if (editingFarm) {
        await SupabaseService.updateFarm(editingFarm.id!, farmData)
      } else {
        await SupabaseService.createFarm(farmData)
      }

      await loadFarms()
      closeModal()
    } catch (error) {
      console.error('Error saving farm:', error)
      throw error // Re-throw to let modal handle the error
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingFarm(null)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (
      confirm(
        'Are you sure you want to delete this farm? This will also delete all associated records.'
      )
    ) {
      try {
        await SupabaseService.deleteFarm(id)
        await loadFarms()
      } catch (error) {
        console.error('Error deleting farm:', error)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingFarm(null)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-green-600" />
                  My Farms
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {farms.length} {farms.length === 1 ? 'vineyard' : 'vineyards'}
                </p>
              </div>
              <Button
                onClick={handleAdd}
                size="sm"
                className="h-9 px-3 text-sm font-medium bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Farm
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 max-w-md mx-auto">
          <div className="space-y-3 max-w-md mx-auto">
            {loading
              ? // Modern skeleton loading
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="border-0 shadow-sm animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="h-3 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-12 mx-auto"></div>
                          </div>
                          <div className="text-center">
                            <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-8 mx-auto"></div>
                          </div>
                          <div className="text-center">
                            <div className="h-3 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-6 mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : farms.map((farm) => (
                  <Card
                    key={farm.id}
                    className="border-0 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                  >
                    <CardContent className="p-0">
                      <Link href={`/farms/${farm.id}`} className="block">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Sprout className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {capitalize(farm.name)}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {farm.locationName || farm.region}
                                    {farm.latitude && farm.longitude && (
                                      <span className="text-xs ml-1">
                                        ({farm.latitude.toFixed(3)}, {farm.longitude.toFixed(3)})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0 min-w-[60px]">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 bg-white border border-gray-200 shadow-lg"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleEdit(farm)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Farm
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleDelete(farm.id!)
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Farm
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {farm.area}
                                </div>
                                <div className="text-xs text-gray-500">acres</div>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {capitalize(farm.crop)}
                                </div>
                                <div className="text-xs text-gray-500">crop</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">
                                  {farm.cropVariety}
                                </div>
                                <div className="text-xs text-gray-500">variety</div>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {Math.floor(
                                    (Date.now() - new Date(farm.plantingDate).getTime()) /
                                      (1000 * 60 * 60 * 24 * 365)
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">years old</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}

            {!loading && farms.length === 0 && (
              <Card className="border-0 shadow-sm text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sprout className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No farms added yet</h3>
                  <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                    Start by adding your first vineyard to begin tracking your farming operations
                  </p>
                  <Button onClick={handleAdd} className="h-12 px-6 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Farm
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Farm Modal */}
        <FarmModal
          isOpen={showModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
          editingFarm={editingFarm}
          isSubmitting={submitLoading}
        />
      </div>
    </ProtectedRoute>
  )
}
