import { getSupabaseClient } from './supabase'

export class PhotoService {
  static async uploadPhoto(file: File, recordType: string, recordId: number): Promise<string> {
    const supabase = getSupabaseClient()

    // Create a unique filename with user ID for better organization
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${recordType}/${recordId}/${timestamp}.${fileExt}`

    try {
      // Upload to Supabase Storage with upsert to overwrite if exists
      const { data, error } = await supabase.storage.from('farm-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Failed to upload photo: ${error.message}`)
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('farm-photos').getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Photo upload failed:', error)
      throw error
    }
  }

  static async deletePhoto(photoUrl: string): Promise<void> {
    const supabase = getSupabaseClient()

    // Extract the path from the URL
    const urlParts = photoUrl.split('/')
    const path = urlParts.slice(-3).join('/') // Get the last 3 parts (recordType/recordId/filename)

    const { error } = await supabase.storage.from('farm-photos').remove([path])

    if (error) throw error
  }

  static async getPhotosForRecord(recordType: string, recordId: number): Promise<string[]> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.storage
      .from('farm-photos')
      .list(`${recordType}/${recordId}`)

    if (error) throw error

    return data.map((file) => {
      const { data: urlData } = supabase.storage
        .from('farm-photos')
        .getPublicUrl(`${recordType}/${recordId}/${file.name}`)
      return urlData.publicUrl
    })
  }
}
