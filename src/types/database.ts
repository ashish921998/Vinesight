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
      farms: {
        Row: {
          id: number
          name: string
          region: string
          area: number
          grape_variety: string
          planting_date: string
          vine_spacing: number
          row_spacing: number
          total_tank_capacity: number | null
          system_discharge: number | null
          remaining_water: number | null
          water_calculation_updated_at: string | null
          latitude: number | null
          longitude: number | null
          elevation: number | null
          location_name: string | null
          timezone: string | null
          location_source: string | null
          location_updated_at: string | null
          created_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          name: string
          region: string
          area: number
          grape_variety: string
          planting_date: string
          vine_spacing: number
          row_spacing: number
          total_tank_capacity?: number | null
          system_discharge?: number | null
          remaining_water?: number | null
          water_calculation_updated_at?: string | null
          latitude?: number | null
          longitude?: number | null
          elevation?: number | null
          location_name?: string | null
          timezone?: string | null
          location_source?: string | null
          location_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          name?: string
          region?: string
          area?: number
          grape_variety?: string
          planting_date?: string
          vine_spacing?: number
          row_spacing?: number
          total_tank_capacity?: number | null
          system_discharge?: number | null
          remaining_water?: number | null
          water_calculation_updated_at?: string | null
          latitude?: number | null
          longitude?: number | null
          elevation?: number | null
          location_name?: string | null
          timezone?: string | null
          location_source?: string | null
          location_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      irrigation_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          duration: number
          area: number
          growth_stage: string
          moisture_status: string
          system_discharge: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          duration: number
          area: number
          growth_stage: string
          moisture_status: string
          system_discharge: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          duration?: number
          area?: number
          growth_stage?: string
          moisture_status?: string
          system_discharge?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      spray_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          pest_disease: string
          chemical: string
          dose: string
          area: number
          weather: string
          operator: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          pest_disease: string
          chemical: string
          dose: string
          area: number
          weather: string
          operator: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          pest_disease?: string
          chemical?: string
          dose?: string
          area?: number
          weather?: string
          operator?: string
          notes?: string | null
          created_at?: string | null
        }
      }
      fertigation_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          fertilizer: string
          dose: string
          purpose: string
          area: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          fertilizer: string
          dose: string
          purpose: string
          area: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          fertilizer?: string
          dose?: string
          purpose?: string
          area?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      harvest_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          quantity: number
          grade: string
          price: number | null
          buyer: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          quantity: number
          grade: string
          price?: number | null
          buyer?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          quantity?: number
          grade?: string
          price?: number | null
          buyer?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      expense_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          type: string
          description: string
          cost: number
          remarks: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          type: string
          description: string
          cost: number
          remarks?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          type?: string
          description?: string
          cost?: number
          remarks?: string | null
          created_at?: string | null
        }
      }
      calculation_history: {
        Row: {
          id: number
          farm_id: number
          calculation_type: string
          inputs: any
          outputs: any
          date: string
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          calculation_type: string
          inputs: any
          outputs: any
          date: string
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          calculation_type?: string
          inputs?: any
          outputs?: any
          date?: string
          created_at?: string | null
        }
      }
      task_reminders: {
        Row: {
          id: number
          farm_id: number
          title: string
          description: string | null
          due_date: string
          type: string
          completed: boolean
          priority: string
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          title: string
          description?: string | null
          due_date: string
          type: string
          completed?: boolean
          priority: string
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          title?: string
          description?: string | null
          due_date?: string
          type?: string
          completed?: boolean
          priority?: string
          created_at?: string | null
          completed_at?: string | null
        }
      }
      soil_test_records: {
        Row: {
          id: number
          farm_id: number
          date: string
          parameters: any
          recommendations: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          farm_id: number
          date: string
          parameters: any
          recommendations?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          farm_id?: number
          date?: string
          parameters?: any
          recommendations?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
    }
  }
}