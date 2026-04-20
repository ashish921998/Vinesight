// ============================================================================
// TRIAGE SERVICE
//
// Manages petiole test triage operations for the consultant dashboard
// ============================================================================

import { getTypedSupabaseClient } from './supabase'
import type { Database } from '@/types/database'

export type Classification = 'green' | 'yellow' | 'red'
export type PlanStatus = 'draft' | 'auto_drafted' | 'pending_approval' | 'approved' | 'rejected'
export type AcknowledgmentType = 'understood' | 'questions' | 'thanks'

export interface PetioleTriage {
  id: string
  petiole_test_id: number
  farm_id: number
  organization_id: string
  classification: Classification
  classification_reason: string | null
  confidence_score: number | null
  ai_draft_plan_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  farmer_acknowledgment: string | null
  farmer_acknowledged_at: string | null
  created_at: string
  updated_at: string

  // Joined data
  farm_name?: string
  farm_region?: string
  farmer_id?: string | null
  farmer_name?: string
  latest_petiole_date?: string
  nutrient_n?: number
  nutrient_p?: number
  nutrient_k?: number
}

export interface TriageQueueItem extends PetioleTriage {
  petiole_parameters?: Record<string, number>
}

export interface ReviewTriageInput {
  classification?: Classification
  reason?: string
  approve?: boolean
  reject?: boolean
  planEdits?: {
    title?: string
    notes?: string
    items?: Array<{
      id?: string
      fertilizer_name: string
      quantity: number
      unit: string
      application_method?: string
      application_frequency?: number
      notes?: string
    }>
  }
}

export class TriageService {
  // Get the triage queue with farm details
  static async getTriageQueue(
    organizationId: string,
    options?: {
      classification?: Classification
      includeReviewed?: boolean
    }
  ): Promise<PetioleTriage[]> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase.rpc('get_triage_queue', {
      p_org_id: organizationId,
      p_classification: options?.classification || undefined,
      p_limit: 50,
      p_offset: 0
    })

    if (error) throw error
    // Map RPC response to PetioleTriage shape
    return (data || []).map((item) => ({
      id: item.triage_id,
      petiole_test_id: item.petiole_test_id,
      farm_id: item.farm_id,
      organization_id: '',
      classification: item.classification as Classification,
      classification_reason: item.classification_reason,
      confidence_score: item.confidence_score,
      ai_draft_plan_id: item.ai_draft_plan_id,
      reviewed_by: item.reviewed_by,
      reviewed_at: item.reviewed_at,
      farmer_acknowledgment: null,
      farmer_acknowledged_at: null,
      created_at: item.created_at,
      updated_at: item.created_at,
      farm_name: item.farm_name,
      farm_region: item.farm_region,
      farmer_id: item.farmer_id,
      farmer_name: item.farmer_name,
      latest_petiole_date: item.latest_petiole_date,
      nutrient_n: item.nutrient_n,
      nutrient_p: item.nutrient_p,
      nutrient_k: item.nutrient_k
    }))
  }

  // Get triage statistics for Mission Control
  static async getTriageStats(organizationId: string): Promise<{
    total: number
    green: number
    yellow: number
    red: number
    reviewed: number
    pending: number
  }> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('petiole_triage')
      .select('classification, reviewed_by')
      .eq('organization_id', organizationId)
      .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      green: 0,
      yellow: 0,
      red: 0,
      reviewed: 0,
      pending: 0
    }

    data?.forEach((item) => {
      const cls = item.classification as Classification
      if (cls in stats) {
        stats[cls]++
      }
      if (item.reviewed_by) {
        stats.reviewed++
      } else {
        stats.pending++
      }
    })

    return stats
  }

  // Get a single triage item with full details
  static async getTriageById(triageId: string): Promise<PetioleTriage | null> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('petiole_triage')
      .select('*')
      .eq('id', triageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!data) return null

    // Fetch farm details separately to avoid complex join type issues
    const { data: farm } = await supabase
      .from('farms')
      .select('name, region')
      .eq('id', data.farm_id)
      .single()

    return {
      ...data,
      farm_name: farm?.name,
      farm_region: farm?.region
    } as PetioleTriage
  }

  // Review and approve/reject a triage item
  static async reviewTriage(
    triageId: string,
    userId: string,
    input: ReviewTriageInput
  ): Promise<PetioleTriage> {
    const supabase = await getTypedSupabaseClient()

    // Get the triage item
    const { data: triage, error: triageError } = await supabase
      .from('petiole_triage')
      .select('*')
      .eq('id', triageId)
      .single()

    if (triageError) throw triageError
    if (!triage) throw new Error('Triage item not found')

    // If approving with a plan
    if (input.approve && triage.ai_draft_plan_id) {
      // Apply edits first so we do not publish stale plan data as approved.
      if (input.planEdits) {
        await this.applyPlanEdits(supabase, triage.ai_draft_plan_id, input.planEdits)
      }
      // Update the plan status to approved
      const { error: planError } = await supabase
        .from('fertilizer_plans')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', triage.ai_draft_plan_id)

      if (planError) throw planError
    }

    // If rejecting, mark plan as rejected
    if (input.reject && triage.ai_draft_plan_id) {
      const { error: rejectPlanError } = await supabase
        .from('fertilizer_plans')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', triage.ai_draft_plan_id)

      if (rejectPlanError) throw rejectPlanError
    }

    // Update triage
    const { data, error } = await supabase
      .from('petiole_triage')
      .update({
        classification: input.classification || triage.classification,
        classification_reason: input.reason || triage.classification_reason,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', triageId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as PetioleTriage
  }

  // Bulk approve green triage items
  static async bulkApproveGreen(
    organizationId: string,
    userId: string,
    limit: number = 50
  ): Promise<{ approved: number; failed: number }> {
    const supabase = await getTypedSupabaseClient()

    // Get pending green items
    const { data: greenItems, error } = await supabase
      .from('petiole_triage')
      .select('id, ai_draft_plan_id')
      .eq('organization_id', organizationId)
      .eq('classification', 'green')
      .is('reviewed_by', null)
      .limit(limit)

    if (error) throw error
    if (!greenItems || greenItems.length === 0) {
      return { approved: 0, failed: 0 }
    }

    let approved = 0
    let failed = 0

    for (const item of greenItems) {
      try {
        // Update plan status
        if (item.ai_draft_plan_id) {
          const { error: planUpdateError } = await supabase
            .from('fertilizer_plans')
            .update({ status: 'approved' })
            .eq('id', item.ai_draft_plan_id)

          if (planUpdateError) throw planUpdateError
        }

        // Update triage
        const { error: triageUpdateError } = await supabase
          .from('petiole_triage')
          .update({
            reviewed_by: userId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', item.id)

        if (triageUpdateError) throw triageUpdateError

        approved++
      } catch (err) {
        console.error(`Failed to approve triage ${item.id}:`, err)
        failed++
      }
    }

    return { approved, failed }
  }

  // Submit farmer acknowledgment for a triage/plan
  static async submitAcknowledgment(input: {
    triageId: string
    acknowledgment: AcknowledgmentType
    notes?: string
  }): Promise<void> {
    const supabase = await getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Update triage record with farmer acknowledgment
    // Farmers can only update their own farm's triage (enforced by RLS)
    const { data: triageUpdate, error: triageError } = await supabase
      .from('petiole_triage')
      .update({
        farmer_acknowledgment: input.acknowledgment,
        farmer_acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', input.triageId)
      .select()
      .maybeSingle()

    if (triageError) throw triageError
    if (!triageUpdate) {
      throw new Error('Failed to update triage: not found or permission denied')
    }

    // Get the plan_id from the triage record to insert acknowledgment
    const { data: triageData } = await supabase
      .from('petiole_triage')
      .select('ai_draft_plan_id')
      .eq('id', input.triageId)
      .single()

    if (triageData?.ai_draft_plan_id) {
      const { error: ackError } = await supabase.from('plan_acknowledgments').upsert(
        {
          plan_id: triageData.ai_draft_plan_id,
          farmer_user_id: user.id,
          reaction: input.acknowledgment
        },
        {
          onConflict: 'plan_id,farmer_user_id'
        }
      )

      if (ackError) throw ackError
    }
  }

  // Get acknowledgment statistics
  static async getAcknowledgmentStats(
    organizationId: string,
    days: number = 30
  ): Promise<{
    total: number
    understood: number
    questions: number
    thanks: number
    pending: number
  }> {
    const supabase = await getTypedSupabaseClient()

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('fertilizer_plans')
      .select('id, plan_acknowledgments(reaction)')
      .eq('organization_id', organizationId)
      .eq('status', 'approved')
      .gt('created_at', cutoff)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      understood: 0,
      questions: 0,
      thanks: 0,
      pending: 0
    }

    data?.forEach((plan) => {
      const ack = plan.plan_acknowledgments?.[0]?.reaction as AcknowledgmentType | undefined
      if (ack === 'understood') stats.understood++
      else if (ack === 'questions') stats.questions++
      else if (ack === 'thanks') stats.thanks++
      else stats.pending++
    })

    return stats
  }

  static async getTriageByPlanId(
    planId: string
  ): Promise<{ triageId: string; acknowledgment: AcknowledgmentType | null } | null> {
    const supabase = await getTypedSupabaseClient()

    const { data, error } = await supabase
      .from('petiole_triage')
      .select('id, farmer_acknowledgment')
      .eq('ai_draft_plan_id', planId)
      .single()

    if (error || !data) return null

    return {
      triageId: data.id,
      acknowledgment: (data.farmer_acknowledgment as AcknowledgmentType) || null
    }
  }

  // Private helper to apply plan edits
  private static async applyPlanEdits(
    supabase: any,
    planId: string,
    edits: NonNullable<ReviewTriageInput['planEdits']>
  ): Promise<void> {
    // Update plan details
    if (edits.title || edits.notes) {
      const { error } = await supabase
        .from('fertilizer_plans')
        .update({
          title: edits.title,
          notes: edits.notes
        })
        .eq('id', planId)

      if (error) throw error
    }

    // Update or replace items
    if (edits.items) {
      // Delete existing items
      await supabase.from('fertilizer_plan_items').delete().eq('plan_id', planId)

      // Insert new items
      const itemsToInsert = edits.items.map((item, index) => ({
        plan_id: planId,
        fertilizer_name: item.fertilizer_name,
        quantity: item.quantity,
        unit: item.unit,
        application_method: item.application_method || null,
        application_frequency: item.application_frequency || 1,
        notes: item.notes || null,
        sort_order: index
      }))

      const { error } = await supabase.from('fertilizer_plan_items').insert(itemsToInsert)

      if (error) throw error
    }
  }
}
