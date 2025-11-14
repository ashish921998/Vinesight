'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, AlertCircle, Edit, Trash2, PackagePlus } from 'lucide-react'
import { warehouseService } from '@/lib/warehouse-service'
import { WarehouseItem } from '@/types/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AddWarehouseItemModal } from '@/components/warehouse/AddWarehouseItemModal'
import { AddStockModal } from '@/components/warehouse/AddStockModal'
import { toast } from 'sonner'

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
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Warehouse
          </h1>
          <p className="text-muted-foreground mt-1">Manage your fertilizers and sprays inventory</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alerts ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} remaining (Reorder at: {item.reorderQuantity}{' '}
                      {item.unit})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingStockItem(item)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Items ({allItems.length})
        </Button>
        <Button
          variant={filter === 'fertilizer' ? 'default' : 'outline'}
          onClick={() => setFilter('fertilizer')}
          size="sm"
        >
          Fertilizers ({fertilizers.length})
        </Button>
        <Button
          variant={filter === 'spray' ? 'default' : 'outline'}
          onClick={() => setFilter('spray')}
          size="sm"
        >
          Sprays ({sprays.length})
        </Button>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading warehouse items...</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items in warehouse</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Start by adding your fertilizers and sprays to track inventory
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item) => (
            <Card
              key={item.id}
              className={isLowStock(item) ? 'border-orange-300 bg-orange-50/50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant={item.type === 'fertilizer' ? 'default' : 'secondary'}>
                        {item.type === 'fertilizer' ? 'Fertilizer' : 'Spray'}
                      </Badge>
                    </CardDescription>
                  </div>
                  {isLowStock(item) && (
                    <Badge variant="destructive" className="ml-2">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">₹{item.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-medium">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                  {item.reorderQuantity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder at:</span>
                      <span className="font-medium">
                        {item.reorderQuantity} {item.unit}
                      </span>
                    </div>
                  )}
                </div>

                {item.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAddingStockItem(item)}
                  >
                    <PackagePlus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {allItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{allItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fertilizers</p>
                <p className="text-2xl font-bold">{fertilizers.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sprays</p>
                <p className="text-2xl font-bold">{sprays.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
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
