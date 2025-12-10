import { getTypedSupabaseClient } from '@/lib/supabase'

export interface FertilizerPlan {
  id: string
  farm_id: number
  created_by: string
  organization_id: string
  title: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FertilizerPlanItem {
  id: string
  plan_id: string
  application_date: string | null
  fertilizer_name: string
  quantity: number
  unit: string
  application_method: string | null
  application_frequency: number
  notes: string | null
  sort_order: number
  created_at: string
}

export interface FertilizerPlanWithItems extends FertilizerPlan {
  items: FertilizerPlanItem[]
}

export interface CreatePlanInput {
  farm_id: number
  organization_id: string
  title: string
  notes?: string
  items: {
    application_date?: string
    fertilizer_name: string
    quantity: number
    unit?: string
    application_method?: string
    application_frequency?: number
    notes?: string
  }[]
}

export class FertilizerPlanService {
  // Create a new fertilizer plan with items
  static async createPlan(input: CreatePlanInput): Promise<FertilizerPlanWithItems> {
    const supabase = await getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Create the plan
    const { data: plan, error: planError } = await supabase
      .from('fertilizer_plans')
      .insert({
        farm_id: input.farm_id,
        created_by: user.id,
        organization_id: input.organization_id,
        title: input.title,
        notes: input.notes || null
      })
      .select()
      .single()

    if (planError) throw planError

    // Create the items
    const items: FertilizerPlanItem[] = []
    if (input.items.length > 0) {
      const itemsToInsert = input.items.map((item, index) => ({
        plan_id: plan.id,
        application_date: item.application_date || null,
        fertilizer_name: item.fertilizer_name,
        quantity: item.quantity,
        unit: item.unit || 'kg/acre',
        application_method: item.application_method || null,
        application_frequency: item.application_frequency || 1,
        notes: item.notes || null,
        sort_order: index
      }))

      const { data: insertedItems, error: itemsError } = await supabase
        .from('fertilizer_plan_items')
        .insert(itemsToInsert)
        .select()

      if (itemsError) {
        // P1: Rollback - delete the orphaned plan
        await supabase.from('fertilizer_plans').delete().eq('id', plan.id)
        throw itemsError
      }
      items.push(...(insertedItems as FertilizerPlanItem[]))
    }

    return { ...plan, items } as FertilizerPlanWithItems
  }

  // Get all plans for a farm
  static async getPlansByFarm(farmId: number): Promise<FertilizerPlanWithItems[]> {
    const supabase = await getTypedSupabaseClient()

    const { data: plans, error: plansError } = await supabase
      .from('fertilizer_plans')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })

    if (plansError) throw plansError
    if (!plans || plans.length === 0) return []

    // Get all items for these plans
    const planIds = plans.map((p) => p.id)
    const { data: items, error: itemsError } = await supabase
      .from('fertilizer_plan_items')
      .select('*')
      .in('plan_id', planIds)
      .order('sort_order', { ascending: true })

    if (itemsError) throw itemsError

    // Combine plans with their items
    return plans.map((plan) => ({
      ...plan,
      items: (items || []).filter((item) => item.plan_id === plan.id) as FertilizerPlanItem[]
    })) as FertilizerPlanWithItems[]
  }

  // Get a single plan by ID
  static async getPlanById(planId: string): Promise<FertilizerPlanWithItems | null> {
    const supabase = await getTypedSupabaseClient()

    const { data: plan, error: planError } = await supabase
      .from('fertilizer_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      if (planError.code === 'PGRST116') return null // Not found
      throw planError
    }

    const { data: items, error: itemsError } = await supabase
      .from('fertilizer_plan_items')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    if (itemsError) throw itemsError

    return {
      ...plan,
      items: (items || []) as FertilizerPlanItem[]
    } as FertilizerPlanWithItems
  }

  // Update plan details
  static async updatePlan(
    planId: string,
    updates: { title?: string; notes?: string }
  ): Promise<FertilizerPlan> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('fertilizer_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return data as FertilizerPlan
  }

  // Delete a plan
  static async deletePlan(planId: string): Promise<void> {
    const supabase = await getTypedSupabaseClient()
    const { error } = await supabase.from('fertilizer_plans').delete().eq('id', planId)
    if (error) throw error
  }

  // Add item to plan
  static async addPlanItem(
    planId: string,
    item: {
      application_date?: string
      fertilizer_name: string
      quantity: number
      unit?: string
      application_method?: string
      application_frequency?: number
      notes?: string
    }
  ): Promise<FertilizerPlanItem> {
    const supabase = await getTypedSupabaseClient()

    // P2: NOTE - Race condition exists with concurrent calls to this method.
    // Consider using a database sequence or COALESCE(MAX(sort_order), -1) + 1
    // in a single INSERT...SELECT for production-critical scenarios.
    // Get current max sort_order
    const { data: existingItems } = await supabase
      .from('fertilizer_plan_items')
      .select('sort_order')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder =
      existingItems && existingItems.length > 0 ? existingItems[0].sort_order + 1 : 0

    const { data, error } = await supabase
      .from('fertilizer_plan_items')
      .insert({
        plan_id: planId,
        application_date: item.application_date || null,
        fertilizer_name: item.fertilizer_name,
        quantity: item.quantity,
        unit: item.unit || 'kg/acre',
        application_method: item.application_method || null,
        application_frequency: item.application_frequency || 1,
        notes: item.notes || null,
        sort_order: nextSortOrder
      })
      .select()
      .single()

    if (error) throw error
    return data as FertilizerPlanItem
  }

  // Update an item
  static async updatePlanItem(
    itemId: string,
    updates: Partial<Omit<FertilizerPlanItem, 'id' | 'plan_id' | 'created_at'>>
  ): Promise<FertilizerPlanItem> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('fertilizer_plan_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return data as FertilizerPlanItem
  }

  // Delete an item
  static async deletePlanItem(itemId: string): Promise<void> {
    const supabase = await getTypedSupabaseClient()
    const { error } = await supabase.from('fertilizer_plan_items').delete().eq('id', itemId)
    if (error) throw error
  }
}
