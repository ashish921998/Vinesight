'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, AlertCircle, Edit, Trash2, PackagePlus, MoreVertical } from 'lucide-react'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AddWarehouseItemModal } from '@/components/warehouse/AddWarehouseItemModal'
import { AddStockModal } from '@/components/warehouse/AddStockModal'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function WarehousePage() {
  return (
    <ProtectedRoute>
      <WarehousePageContent />
    </ProtectedRoute>
  )
}

function WarehousePageContent() {
  const [allItems, setAllItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'fertilizer' | 'spray'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null)
  const [addingStockItem, setAddingStockItem] = useState<WarehouseItem | null>(null)

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      // Always fetch all items for accurate badge counts
      const data = await warehouseService.getWarehouseItems()
      setAllItems(data)
    } catch (error) {
      console.error('Error loading warehouse items:', error)
      toast.error('Failed to load warehouse items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await warehouseService.deleteWarehouseItem(id)
      toast.success('Item deleted successfully')
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  const handleSave = async () => {
    await loadItems()
    setShowAddModal(false)
    setEditingItem(null)
  }

  const handleStockAdded = async () => {
    await loadItems()
    setAddingStockItem(null)
  }

  const isLowStock = (item: WarehouseItem) => {
    return item.reorderQuantity && item.quantity <= item.reorderQuantity
  }

  // Compute badge counts from all items (not filtered)
  const fertilizers = allItems.filter((item) => item.type === 'fertilizer')
  const sprays = allItems.filter((item) => item.type === 'spray')
  const lowStockItems = allItems.filter(isLowStock)

  // Filter items for display based on active filter
  const displayedItems =
    filter === 'all' ? allItems : allItems.filter((item) => item.type === filter)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-4">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 lg:relative">
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                Warehouse
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {allItems.length} {allItems.length === 1 ? 'item' : 'items'} in stock
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="h-9 px-3 text-sm font-medium bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="border-0 shadow-sm bg-orange-50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 flex items-center gap-2 text-base lg:text-lg">
                <AlertCircle className="h-5 w-5" />
                Low Stock Alerts ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border-0 shadow-sm"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.quantity} {item.unit} remaining · Reorder at {item.reorderQuantity}{' '}
                        {item.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingStockItem(item)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 rounded-lg flex-shrink-0"
                    >
                      <PackagePlus className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Add Stock</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className={
              filter === 'all'
                ? 'bg-green-600 hover:bg-green-700 rounded-xl flex-shrink-0'
                : 'rounded-xl flex-shrink-0'
            }
          >
            All Items ({allItems.length})
          </Button>
          <Button
            variant={filter === 'fertilizer' ? 'default' : 'outline'}
            onClick={() => setFilter('fertilizer')}
            size="sm"
            className={
              filter === 'fertilizer'
                ? 'bg-green-600 hover:bg-green-700 rounded-xl flex-shrink-0'
                : 'rounded-xl flex-shrink-0'
            }
          >
            Fertilizers ({fertilizers.length})
          </Button>
          <Button
            variant={filter === 'spray' ? 'default' : 'outline'}
            onClick={() => setFilter('spray')}
            size="sm"
            className={
              filter === 'spray'
                ? 'bg-green-600 hover:bg-green-700 rounded-xl flex-shrink-0'
                : 'rounded-xl flex-shrink-0'
            }
          >
            Sprays ({sprays.length})
          </Button>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-sm rounded-2xl animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in warehouse</h3>
              <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
                Start by adding your fertilizers and sprays to track inventory
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {displayedItems.map((item) => (
              <Card
                key={item.id}
                className={`border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200 ${
                  isLowStock(item) ? 'bg-orange-50/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.type === 'fertilizer' ? 'bg-green-100' : 'bg-blue-100'
                        }`}
                      >
                        <Package
                          className={`h-6 w-6 ${
                            item.type === 'fertilizer' ? 'text-green-600' : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={item.type === 'fertilizer' ? 'default' : 'secondary'}
                            className="rounded-md text-xs"
                          >
                            {item.type === 'fertilizer' ? 'Fertilizer' : 'Spray'}
                          </Badge>
                          {isLowStock(item) && (
                            <Badge variant="destructive" className="rounded-md text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-white border-0 shadow-lg rounded-xl"
                      >
                        <DropdownMenuItem onClick={() => setAddingStockItem(item)}>
                          <PackagePlus className="h-4 w-4 mr-2" />
                          Add Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium text-gray-900">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unit Price:</span>
                      <span className="font-medium text-gray-900">₹{item.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Value:</span>
                      <span className="font-semibold text-green-600">
                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    {item.reorderQuantity && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reorder at:</span>
                        <span className="font-medium text-gray-900">
                          {item.reorderQuantity} {item.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 line-clamp-2">{item.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {allItems.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Inventory Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{allItems.length}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-500">Fertilizers</p>
                  <p className="text-2xl font-bold text-gray-900">{fertilizers.length}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-500">Sprays</p>
                  <p className="text-2xl font-bold text-gray-900">{sprays.length}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹
                    {allItems
                      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddWarehouseItemModal onClose={() => setShowAddModal(false)} onSave={handleSave} />
      )}

      {editingItem && (
        <AddWarehouseItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}

      {addingStockItem && (
        <AddStockModal
          item={addingStockItem}
          onClose={() => setAddingStockItem(null)}
          onSave={handleStockAdded}
        />
      )}
    </div>
  )
}
