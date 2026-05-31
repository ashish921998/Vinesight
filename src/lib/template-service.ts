// ============================================================================
// TEMPLATE SERVICE
//
// Manages plan templates for auto-drafting fertilizer plans
// ============================================================================

import { getTypedSupabaseClient } from './supabase'
import type { Json } from '@/types/database'

export type SeasonStage =
  | 'dormancy'
  | 'pruning'
  | 'flowering'
  | 'fruiting'
  | 'harvest'
  | 'post_harvest'

export interface PlanTemplate {
  id: string
  organization_id: string
  name: string
  season_stage: string
  soil_type: string | null
  trigger_conditions: Json
  template_items: Json
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateTemplateInput {
  name: string
  season_stage: string
  soil_type?: string
  trigger_conditions: Json
  template_items: Json
}

export interface UpdateTemplateInput {
  name?: string
  season_stage?: string
  soil_type?: string | null
  trigger_conditions?: Json
  template_items?: Json
  is_active?: boolean
}

interface TemplateItemInput {
  fertilizer_name: string
  base_quantity: number
  unit?: string
  method?: string
  frequency?: number
}

function validateTemplateItems(templateItems: Json): TemplateItemInput[] {
  const items = templateItems as unknown as TemplateItemInput[]

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Template must have at least one fertilizer item')
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    fertilizer_name: typeof item.fertilizer_name === 'string' ? item.fertilizer_name.trim() : '',
    base_quantity: Number(item.base_quantity)
  }))

  for (const item of normalizedItems) {
    if (!item.fertilizer_name) {
      throw new Error('Each template item must have a fertilizer name')
    }

    if (!Number.isFinite(item.base_quantity) || item.base_quantity <= 0) {
      throw new Error('Each template item must have a positive numeric quantity')
    }
  }

  return normalizedItems
}

export class TemplateService {
  // Get all templates for an organization
  static async getTemplates(organizationId: string): Promise<PlanTemplate[]> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get active templates only
  static async getActiveTemplates(organizationId: string): Promise<PlanTemplate[]> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('season_stage')
      .order('soil_type')

    if (error) throw error
    return data || []
  }

  // Get a single template
  static async getTemplateById(templateId: string): Promise<PlanTemplate | null> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  // Create a new template
  static async createTemplate(
    organizationId: string,
    userId: string,
    input: CreateTemplateInput
  ): Promise<PlanTemplate> {
    const supabase = await getTypedSupabaseClient()
    const validatedItems = validateTemplateItems(input.template_items)

    const { data, error } = await supabase
      .from('plan_templates')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name: input.name,
        season_stage: input.season_stage,
        soil_type: input.soil_type || null,
        trigger_conditions: input.trigger_conditions,
        template_items: validatedItems as unknown as Json,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update a template
  static async updateTemplate(
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<PlanTemplate> {
    const supabase = await getTypedSupabaseClient()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (input.name) updates.name = input.name
    if (input.season_stage) updates.season_stage = input.season_stage
    if (input.soil_type !== undefined) updates.soil_type = input.soil_type
    if (input.trigger_conditions) updates.trigger_conditions = input.trigger_conditions
    if (input.template_items !== undefined) {
      updates.template_items = validateTemplateItems(input.template_items)
    }
    if (input.is_active !== undefined) updates.is_active = input.is_active

    const { data, error } = await supabase
      .from('plan_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete a template (soft delete via is_active = false)
  static async deactivateTemplate(templateId: string): Promise<void> {
    const supabase = await getTypedSupabaseClient()

    const { error } = await supabase
      .from('plan_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', templateId)

    if (error) throw error
  }

  // Hard delete a template
  static async deleteTemplate(templateId: string): Promise<void> {
    const supabase = await getTypedSupabaseClient()

    const { error } = await supabase.from('plan_templates').delete().eq('id', templateId)

    if (error) throw error
  }

  // Get template coverage stats
  static async getTemplateCoverageStats(organizationId: string): Promise<{
    total: number
    active: number
    by_season: Record<SeasonStage, number>
    by_soil: Record<string, number>
  }> {
    const templates = await this.getTemplates(organizationId)

    const bySeason: Record<string, number> = {
      dormancy: 0,
      pruning: 0,
      flowering: 0,
      fruiting: 0,
      harvest: 0,
      post_harvest: 0
    }

    const bySoil: Record<string, number> = {}

    templates.forEach((t) => {
      bySeason[t.season_stage] = (bySeason[t.season_stage] || 0) + 1
      const soilType = t.soil_type || 'unspecified'
      bySoil[soilType] = (bySoil[soilType] || 0) + 1
    })

    return {
      total: templates.length,
      active: templates.filter((t) => t.is_active).length,
      by_season: bySeason as Record<SeasonStage, number>,
      by_soil: bySoil
    }
  }

  // Duplicate a template
  static async duplicateTemplate(templateId: string, newName: string): Promise<PlanTemplate> {
    const supabase = await getTypedSupabaseClient()

    // Get the original template
    const original = await this.getTemplateById(templateId)
    if (!original) throw new Error('Template not found')

    const { data, error } = await supabase
      .from('plan_templates')
      .insert({
        organization_id: original.organization_id,
        created_by: original.created_by,
        name: newName,
        season_stage: original.season_stage,
        soil_type: original.soil_type,
        trigger_conditions: original.trigger_conditions,
        template_items: original.template_items,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
