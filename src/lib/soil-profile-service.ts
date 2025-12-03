import {
  getSupabaseClient,
  getTypedSupabaseClient,
  type SoilSection,
  type SoilProfile
} from './supabase'
import {
  toApplicationSoilProfile,
  toDatabaseSoilProfileInsert,
  toDatabaseSoilSectionInsert
} from './supabase-types'

const SOIL_BUCKET = 'farm-photos'

export class SoilProfileService {
  static async uploadSectionPhoto(
    file: File,
    farmId: number,
    section: SoilSection['name']
  ): Promise<{ path: string; publicUrl: string }> {
    const supabase = getSupabaseClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const path = `soil-profiles/${farmId}/${section}-${timestamp}.${ext}`

    const { data, error } = await supabase.storage
      .from(SOIL_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (error) {
      throw new Error(`Failed to upload soil photo: ${error.message}`)
    }

    const { data: urlData } = supabase.storage.from(SOIL_BUCKET).getPublicUrl(data.path)

    return { path: data.path, publicUrl: urlData.publicUrl }
  }

  static async getLatestProfile(farmId: number): Promise<SoilProfile | null> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('soil_profiles')
      .select('*, soil_sections(*)')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) return null

    return toApplicationSoilProfile(data, data.soil_sections || undefined)
  }

  static async listProfiles(farmId: number): Promise<SoilProfile[]> {
    const supabase = getTypedSupabaseClient()
    const { data, error } = await supabase
      .from('soil_profiles')
      .select('*, soil_sections(*)')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((row) => toApplicationSoilProfile(row, row.soil_sections || undefined))
  }

  static async createProfileWithSections(input: {
    farm_id: number
    fusarium_pct?: number | null
    sections: Array<Omit<SoilSection, 'id' | 'profile_id' | 'created_at'>>
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

    const supabase = getTypedSupabaseClient()
    const { sections, ...profileInput } = input

    const { data: profileRow, error: profileError } = await supabase
      .from('soil_profiles')
      .insert(toDatabaseSoilProfileInsert(profileInput) as any)
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    const sectionRows = sections.map((section) =>
      toDatabaseSoilSectionInsert({
        ...section,
        profile_id: profileRow.id
      })
    )

    const { data: insertedSections, error: sectionError } = await supabase
      .from('soil_sections')
      .insert(sectionRows as any)
      .select()

    if (sectionError) {
      throw sectionError
    }

    return toApplicationSoilProfile(profileRow, insertedSections || undefined)
  }
}
