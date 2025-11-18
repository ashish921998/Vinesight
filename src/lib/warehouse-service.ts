import { supabase } from './supabase'
import { WarehouseItem, warehouseItemFromDB } from '@/types/types'

export interface CreateWarehouseItemInput {
  name: string
  type: 'fertilizer' | 'spray'
  quantity: number
  unit: 'kg' | 'liter' | 'gram' | 'ml'
  unitPrice: number
  reorderQuantity?: number
  notes?: string
}

export interface UpdateWarehouseItemInput {
  name?: string
  quantity?: number
  unitPrice?: number
  reorderQuantity?: number
  notes?: string
}

export interface DeductInventoryInput {
  itemId: number
  quantityToDeduct: number
  recordType: 'fertigation' | 'spray'
  recordId: number
}

class WarehouseService {
  /**
   * Get all warehouse items for the current user
   */
  async getWarehouseItems(type?: 'fertilizer' | 'spray'): Promise<WarehouseItem[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = (supabase as any)
      .from('warehouse_items')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching warehouse items:', error)
      throw error
    }

    return (data || []).map(warehouseItemFromDB)
  }

  /**
   * Get a single warehouse item by ID
   */
  async getWarehouseItem(id: number): Promise<WarehouseItem | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await (supabase as any)
      .from('warehouse_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching warehouse item:', error)
      throw error
    }

    return data ? warehouseItemFromDB(data) : null
  }

  /**
   * Get warehouse items with low stock
   */
  async getLowStockItems(): Promise<WarehouseItem[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await (supabase as any)
      .from('warehouse_items')
      .select('*')
      .eq('user_id', user.id)
      .not('reorder_quantity', 'is', null)
      .order('quantity', { ascending: true })

    if (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }

    // Filter items where quantity <= reorder_quantity
    const lowStockItems = (data || [])
      .map(warehouseItemFromDB)
      .filter((item: WarehouseItem) => item.reorderQuantity && item.quantity <= item.reorderQuantity)

    return lowStockItems
  }

  /**
   * Create a new warehouse item
   */
  async createWarehouseItem(input: CreateWarehouseItemInput): Promise<WarehouseItem> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Input validation
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Item name is required')
    }

    if (input.quantity < 0) {
      throw new Error('Quantity must be a positive number')
    }

    if (input.unitPrice < 0) {
      throw new Error('Unit price must be a positive number')
    }

    if (input.reorderQuantity !== undefined && input.reorderQuantity < 0) {
      throw new Error('Reorder quantity must be a positive number')
    }

    const { data, error } = await (supabase as any)
      .from('warehouse_items')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        type: input.type,
        quantity: input.quantity,
        unit: input.unit,
        unit_price: input.unitPrice,
        reorder_quantity: input.reorderQuantity,
        notes: input.notes?.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating warehouse item:', error)
      throw error
    }

    return warehouseItemFromDB(data)
  }

  /**
   * Update an existing warehouse item
   */
  async updateWarehouseItem(id: number, input: UpdateWarehouseItemInput): Promise<WarehouseItem> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Input validation
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Item name cannot be empty')
    }

    if (input.quantity !== undefined && input.quantity < 0) {
      throw new Error('Quantity must be a positive number')
    }

    if (input.unitPrice !== undefined && input.unitPrice < 0) {
      throw new Error('Unit price must be a positive number')
    }

    if (input.reorderQuantity !== undefined && input.reorderQuantity < 0) {
      throw new Error('Reorder quantity must be a positive number')
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.quantity !== undefined) updateData.quantity = input.quantity
    if (input.unitPrice !== undefined) updateData.unit_price = input.unitPrice
    if (input.reorderQuantity !== undefined) updateData.reorder_quantity = input.reorderQuantity
    if (input.notes !== undefined) updateData.notes = input.notes.trim()

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields provided to update')
    }

    const { data, error } = await (supabase as any)
      .from('warehouse_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating warehouse item:', error)
      throw error
    }

    return warehouseItemFromDB(data)
  }

  /**
   * Delete a warehouse item
   */
  async deleteWarehouseItem(id: number): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await (supabase as any)
      .from('warehouse_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting warehouse item:', error)
      throw error
    }
  }

  /**
   * Add stock to an existing item (quick restock)
   */
  async addStock(id: number, quantityToAdd: number): Promise<WarehouseItem> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Validate positive quantity
    if (quantityToAdd <= 0) {
      throw new Error('Quantity to add must be greater than zero')
    }

    // Get current item
    const item = await this.getWarehouseItem(id)
    if (!item) throw new Error('Warehouse item not found')

    // Update with new quantity
    const newQuantity = item.quantity + quantityToAdd

    return this.updateWarehouseItem(id, { quantity: newQuantity })
  }

  /**
   * Deduct inventory when used in fertigation or spray logs
   * Returns the updated item and whether the deduction was successful
   */
  async deductInventory(
    input: DeductInventoryInput
  ): Promise<{ success: boolean; item: WarehouseItem | null; message: string }> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
      // Validate positive quantity
      if (input.quantityToDeduct <= 0) {
        return {
          success: false,
          item: null,
          message: 'Quantity to deduct must be greater than zero'
        }
      }

      // Get current item
      const item = await this.getWarehouseItem(input.itemId)
      if (!item) {
        return {
          success: false,
          item: null,
          message: 'Warehouse item not found'
        }
      }

      // Check if sufficient quantity available
      if (item.quantity < input.quantityToDeduct) {
        return {
          success: false,
          item,
          message: `Insufficient stock. Available: ${item.quantity} ${item.unit}, Required: ${input.quantityToDeduct} ${item.unit}`
        }
      }

      // Deduct the quantity
      const newQuantity = item.quantity - input.quantityToDeduct
      const updatedItem = await this.updateWarehouseItem(input.itemId, { quantity: newQuantity })

      return {
        success: true,
        item: updatedItem,
        message: `Deducted ${input.quantityToDeduct} ${item.unit} of ${item.name} from warehouse`
      }
    } catch (error) {
      console.error('Error deducting inventory:', error)
      return {
        success: false,
        item: null,
        message: error instanceof Error ? error.message : 'Failed to deduct inventory'
      }
    }
  }

  /**
   * Search warehouse items by name
   */
  async searchWarehouseItems(
    query: string,
    type?: 'fertilizer' | 'spray'
  ): Promise<WarehouseItem[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let supabaseQuery = (supabase as any)
      .from('warehouse_items')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })

    if (type) {
      supabaseQuery = supabaseQuery.eq('type', type)
    }

    const { data, error } = await supabaseQuery

    if (error) {
      console.error('Error searching warehouse items:', error)
      throw error
    }

    return (data || []).map(warehouseItemFromDB)
  }

  /**
   * Get warehouse items formatted for dropdown selection
   */
  async getWarehouseItemsForSelect(
    type: 'fertilizer' | 'spray'
  ): Promise<Array<{ value: number; label: string; quantity: number; unit: string }>> {
    const items = await this.getWarehouseItems(type)

    return items.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.quantity} ${item.unit} available)`,
      quantity: item.quantity,
      unit: item.unit
    }))
  }
}

// Export singleton instance
export const warehouseService = new WarehouseService()
