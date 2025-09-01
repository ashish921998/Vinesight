export type Database = {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          id: number
          user_id: string | null
          farm_id: number | null
          title: string
          topic_category: string | null
          summary: string | null
          last_message_at: string | null
          message_count: number | null
          context_tags: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          farm_id?: number | null
          title: string
          topic_category?: string | null
          summary?: string | null
          last_message_at?: string | null
          message_count?: number | null
          context_tags?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          farm_id?: number | null
          title?: string
          topic_category?: string | null
          summary?: string | null
          last_message_at?: string | null
          message_count?: number | null
          context_tags?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_messages: {
        Row: {
          id: number
          conversation_id: number | null
          role: string
          content: string
          context_data: any | null
          farm_references: any | null
          confidence_score: number | null
          token_count: number | null
          processing_time: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          conversation_id?: number | null
          role: string
          content: string
          context_data?: any | null
          farm_references?: any | null
          confidence_score?: number | null
          token_count?: number | null
          processing_time?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          conversation_id?: number | null
          role?: string
          content?: string
          context_data?: any | null
          farm_references?: any | null
          confidence_score?: number | null
          token_count?: number | null
          processing_time?: number | null
          created_at?: string | null
        }
      }
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
    }
  }
}