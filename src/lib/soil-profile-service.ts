import { getTypedSupabaseClient, type SoilSection, type SoilProfile } from '@/lib/supabase'
import { toApplicationSoilProfile } from '@/lib/supabase-types'

export class SoilProfileService {
  static async uploadSectionPhoto(
    file: File,
    farmId: number,
    section: SoilSection['name']
  ): Promise<{ path: string; signedUrl?: string | null }> {
    const form = new FormData()
    form.append('farmId', farmId.toString())
    form.append('section', section)
    form.append('file', file)

    const response = await fetch('/api/soil-profiling/upload', {
      method: 'POST',
      body: form
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to upload soil photo')
    }

    return response.json()
  }

  static async getLatestProfile(farmId: number): Promise<SoilProfile | null> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('soil_profiles')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) return null

    return toApplicationSoilProfile(data)
  }

  static async listProfiles(farmId: number): Promise<SoilProfile[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('soil_profiles')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((row) => toApplicationSoilProfile(row))
  }

  static async createProfileWithSections(input: {
    farm_id: number
    fusarium_pct?: number | null
    sections: Array<Omit<SoilSection, 'id' | 'profile_id' | 'created_at'>>
    profileDate: string
  }): Promise<SoilProfile> {
    if (!input.sections || input.sections.length === 0) {
      throw new Error('At least one soil section is required')
    }

    const invalidSection = input.sections.find((section) => {
      const value = section.moisture_pct_user
      return (
        value === undefined || value === null || !Number.isFinite(value) || value < 0 || value > 100
      )
    })

    if (invalidSection) {
      throw new Error('Moisture % must be between 0 and 100 for every section')
    }

    const payload = {
      farm_id: input.farm_id,
      fusarium_pct: input.fusarium_pct ?? null,
      sections: input.sections,
      profile_date: input.profileDate
    }

    const response = await fetch('/api/soil-profiling/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to save soil profile')
    }

    const data = await response.json()

    return toApplicationSoilProfile(data)
  }

  static async updateProfile(input: {
    id: number
    farm_id: number
    fusarium_pct?: number | null
    sections: SoilSection[]
    profileDate: string
  }): Promise<SoilProfile> {
    if (!input.sections || input.sections.length === 0) {
      throw new Error('At least one soil section is required')
    }

    const invalidSection = input.sections.find((section) => {
      const value = section.moisture_pct_user
      return (
        value === undefined || value === null || !Number.isFinite(value) || value < 0 || value > 100
      )
    })

    if (invalidSection) {
      throw new Error('Moisture % must be between 0 and 100 for every section')
    }

    const payload = {
      id: input.id,
      farm_id: input.farm_id,
      fusarium_pct: input.fusarium_pct ?? null,
      sections: input.sections,
      profile_date: input.profileDate
    }

    const response = await fetch('/api/soil-profiling/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to update soil profile')
    }

    const data = await response.json()
    return toApplicationSoilProfile(data)
  }

  static async deleteProfile(id: number): Promise<void> {
    const response = await fetch('/api/soil-profiling/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to delete soil profile')
    }
  }
}
