export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)'
  }
  public: {
    Tables: {
      ai_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          action_required: string | null
          alert_type: string
          created_at: string | null
          deadline: string | null
          farm_id: number | null
          id: number
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_required?: string | null
          alert_type: string
          created_at?: string | null
          deadline?: string | null
          farm_id?: number | null
          id?: number
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_required?: string | null
          alert_type?: string
          created_at?: string | null
          deadline?: string | null
          farm_id?: number | null
          id?: number
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_alerts_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      ai_context_cache: {
        Row: {
          context_data: Json
          context_type: string | null
          created_at: string | null
          expires_at: string | null
          farm_id: number | null
          id: number
          user_id: string | null
        }
        Insert: {
          context_data: Json
          context_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          farm_id?: number | null
          id?: number
          user_id?: string | null
        }
        Update: {
          context_data?: Json
          context_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          farm_id?: number | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_context_cache_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      ai_conversation_context: {
        Row: {
          context_data: Json
          context_type: string
          conversation_id: number | null
          created_at: string | null
          decay_factor: number | null
          id: number
          last_referenced: string | null
          relevance_score: number | null
        }
        Insert: {
          context_data: Json
          context_type: string
          conversation_id?: number | null
          created_at?: string | null
          decay_factor?: number | null
          id?: number
          last_referenced?: string | null
          relevance_score?: number | null
        }
        Update: {
          context_data?: Json
          context_type?: string
          conversation_id?: number | null
          created_at?: string | null
          decay_factor?: number | null
          id?: number
          last_referenced?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_conversation_context_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'ai_conversations'
            referencedColumns: ['id']
          }
        ]
      }
      ai_conversations: {
        Row: {
          context_tags: Json | null
          created_at: string | null
          farm_id: number | null
          id: number
          last_message_at: string | null
          message_count: number | null
          summary: string | null
          title: string
          topic_category: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_tags?: Json | null
          created_at?: string | null
          farm_id?: number | null
          id?: number
          last_message_at?: string | null
          message_count?: number | null
          summary?: string | null
          title: string
          topic_category?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_tags?: Json | null
          created_at?: string | null
          farm_id?: number | null
          id?: number
          last_message_at?: string | null
          message_count?: number | null
          summary?: string | null
          title?: string
          topic_category?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_conversations_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      ai_messages: {
        Row: {
          confidence_score: number | null
          content: string
          context_data: Json | null
          conversation_id: number | null
          created_at: string | null
          farm_references: Json | null
          id: number
          processing_time: number | null
          role: string
          token_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          context_data?: Json | null
          conversation_id?: number | null
          created_at?: string | null
          farm_references?: Json | null
          id?: number
          processing_time?: number | null
          role: string
          token_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          context_data?: Json | null
          conversation_id?: number | null
          created_at?: string | null
          farm_references?: Json | null
          id?: number
          processing_time?: number | null
          role?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'ai_conversations'
            referencedColumns: ['id']
          }
        ]
      }
      ai_task_recommendations: {
        Row: {
          confidence_score: number
          created_at: string | null
          expires_at: string | null
          farm_id: number | null
          farmer_feedback: string | null
          id: number
          outcome_tracked: boolean | null
          priority_score: number
          reasoning: string
          recommended_date: string
          status: string | null
          task_details: Json | null
          task_type: string
          user_id: string | null
          weather_dependent: boolean | null
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          expires_at?: string | null
          farm_id?: number | null
          farmer_feedback?: string | null
          id?: number
          outcome_tracked?: boolean | null
          priority_score: number
          reasoning: string
          recommended_date: string
          status?: string | null
          task_details?: Json | null
          task_type: string
          user_id?: string | null
          weather_dependent?: boolean | null
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          expires_at?: string | null
          farm_id?: number | null
          farmer_feedback?: string | null
          id?: number
          outcome_tracked?: boolean | null
          priority_score?: number
          reasoning?: string
          recommended_date?: string
          status?: string | null
          task_details?: Json | null
          task_type?: string
          user_id?: string | null
          weather_dependent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_task_recommendations_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      calculation_history: {
        Row: {
          calculation_type: string
          created_at: string | null
          date: string
          farm_id: number | null
          id: number
          inputs: Json
          outputs: Json
        }
        Insert: {
          calculation_type: string
          created_at?: string | null
          date: string
          farm_id?: number | null
          id?: number
          inputs: Json
          outputs: Json
        }
        Update: {
          calculation_type?: string
          created_at?: string | null
          date?: string
          farm_id?: number | null
          id?: number
          inputs?: Json
          outputs?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'calculation_history_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      canopy_analyses: {
        Row: {
          airflow_rating: number | null
          analysis_id: number | null
          created_at: string | null
          density_score: number | null
          disease_risk_score: number | null
          farm_id: number | null
          fruit_exposure: number | null
          id: number
          leaf_area: number | null
          priority_level: string | null
          pruning_recommendations: Json | null
          training_suggestions: Json | null
        }
        Insert: {
          airflow_rating?: number | null
          analysis_id?: number | null
          created_at?: string | null
          density_score?: number | null
          disease_risk_score?: number | null
          farm_id?: number | null
          fruit_exposure?: number | null
          id?: number
          leaf_area?: number | null
          priority_level?: string | null
          pruning_recommendations?: Json | null
          training_suggestions?: Json | null
        }
        Update: {
          airflow_rating?: number | null
          analysis_id?: number | null
          created_at?: string | null
          density_score?: number | null
          disease_risk_score?: number | null
          farm_id?: number | null
          fruit_exposure?: number | null
          id?: number
          leaf_area?: number | null
          priority_level?: string | null
          pruning_recommendations?: Json | null
          training_suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'canopy_analyses_analysis_id_fkey'
            columns: ['analysis_id']
            isOneToOne: false
            referencedRelation: 'image_analyses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'canopy_analyses_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_prompts: {
        Row: {
          added_at: string | null
          collection_id: string | null
          id: string
          prompt_id: string | null
        }
        Insert: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          prompt_id?: string | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          prompt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'collection_prompts_collection_id_fkey'
            columns: ['collection_id']
            isOneToOne: false
            referencedRelation: 'collections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'collection_prompts_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'prompts'
            referencedColumns: ['id']
          }
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'collections_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          parent_comment_id: string | null
          prompt_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          prompt_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          prompt_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_parent_comment_id_fkey'
            columns: ['parent_comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'prompts'
            referencedColumns: ['id']
          }
        ]
      }
      community_insights: {
        Row: {
          adoption_count: number | null
          anonymized_details: Json | null
          created_at: string | null
          farm_characteristics: Json
          id: number
          insight_type: string
          outcome_metrics: Json | null
          practice_description: string
          regional_relevance: string[] | null
          seasonal_timing: string | null
          success_score: number | null
          validated_at: string | null
          validation_status: string | null
        }
        Insert: {
          adoption_count?: number | null
          anonymized_details?: Json | null
          created_at?: string | null
          farm_characteristics?: Json
          id?: number
          insight_type: string
          outcome_metrics?: Json | null
          practice_description: string
          regional_relevance?: string[] | null
          seasonal_timing?: string | null
          success_score?: number | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          adoption_count?: number | null
          anonymized_details?: Json | null
          created_at?: string | null
          farm_characteristics?: Json
          id?: number
          insight_type?: string
          outcome_metrics?: Json | null
          practice_description?: string
          regional_relevance?: string[] | null
          seasonal_timing?: string | null
          success_score?: number | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Relationships: []
      }
      detected_conditions: {
        Row: {
          affected_area: Json | null
          analysis_id: number | null
          condition_name: string
          condition_type: string
          confidence: number
          created_at: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: number
          severity: string | null
          symptoms: Json | null
          treatment_recommended: string | null
        }
        Insert: {
          affected_area?: Json | null
          analysis_id?: number | null
          condition_name: string
          condition_type: string
          confidence: number
          created_at?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: number
          severity?: string | null
          symptoms?: Json | null
          treatment_recommended?: string | null
        }
        Update: {
          affected_area?: Json | null
          analysis_id?: number | null
          condition_name?: string
          condition_type?: string
          confidence?: number
          created_at?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: number
          severity?: string | null
          symptoms?: Json | null
          treatment_recommended?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'detected_conditions_analysis_id_fkey'
            columns: ['analysis_id']
            isOneToOne: false
            referencedRelation: 'image_analyses'
            referencedColumns: ['id']
          }
        ]
      }
      disease_risk_assessments: {
        Row: {
          assessment_date: string
          confidence_score: number
          created_at: string | null
          disease_type: string
          farm_id: number | null
          id: number
          peak_risk_date: string | null
          preventive_measures: Json | null
          recommendations: string | null
          risk_level: string | null
          weather_factors: Json | null
        }
        Insert: {
          assessment_date: string
          confidence_score: number
          created_at?: string | null
          disease_type: string
          farm_id?: number | null
          id?: number
          peak_risk_date?: string | null
          preventive_measures?: Json | null
          recommendations?: string | null
          risk_level?: string | null
          weather_factors?: Json | null
        }
        Update: {
          assessment_date?: string
          confidence_score?: number
          created_at?: string | null
          disease_type?: string
          farm_id?: number | null
          id?: number
          peak_risk_date?: string | null
          preventive_measures?: Json | null
          recommendations?: string | null
          risk_level?: string | null
          weather_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'disease_risk_assessments_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      expense_records: {
        Row: {
          cost: number
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          description: string
          farm_id: number | null
          id: number
          remarks: string | null
          type: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          description: string
          farm_id?: number | null
          id?: number
          remarks?: string | null
          type: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          description?: string
          farm_id?: number | null
          id?: number
          remarks?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expense_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      farmer_ai_profiles: {
        Row: {
          created_at: string | null
          decision_patterns: Json | null
          farm_id: number | null
          id: number
          learning_preferences: Json | null
          risk_tolerance: number | null
          seasonal_patterns: Json | null
          success_metrics: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_patterns?: Json | null
          farm_id?: number | null
          id?: number
          learning_preferences?: Json | null
          risk_tolerance?: number | null
          seasonal_patterns?: Json | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_patterns?: Json | null
          farm_id?: number | null
          id?: number
          learning_preferences?: Json | null
          risk_tolerance?: number | null
          seasonal_patterns?: Json | null
          success_metrics?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'farmer_ai_profiles_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      farms: {
        Row: {
          area: number
          created_at: string | null
          date_of_pruning: Date | null
          elevation: number | null
          grape_variety: string
          id: number
          latitude: number | null
          location_name: string | null
          location_source: string | null
          location_updated_at: string | null
          longitude: number | null
          name: string
          planting_date: string
          region: string
          remaining_water: number | null
          row_spacing: number
          system_discharge: number | null
          timezone: string | null
          total_tank_capacity: number | null
          updated_at: string | null
          user_id: string | null
          vine_spacing: number
          water_calculation_updated_at: string | null
        }
        Insert: {
          area: number
          created_at?: string | null
          elevation?: number | null
          grape_variety: string
          id?: number
          latitude?: number | null
          location_name?: string | null
          location_source?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          name: string
          planting_date: string
          region: string
          remaining_water?: number | null
          row_spacing: number
          system_discharge?: number | null
          timezone?: string | null
          total_tank_capacity?: number | null
          updated_at?: string | null
          user_id?: string | null
          vine_spacing: number
          water_calculation_updated_at?: string | null
          date_of_pruning: Date | null
        }
        Update: {
          area?: number
          created_at?: string | null
          elevation?: number | null
          grape_variety?: string
          id?: number
          latitude?: number | null
          location_name?: string | null
          location_source?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          name?: string
          planting_date?: string
          region?: string
          remaining_water?: number | null
          row_spacing?: number
          system_discharge?: number | null
          timezone?: string | null
          total_tank_capacity?: number | null
          updated_at?: string | null
          user_id?: string | null
          vine_spacing?: number
          water_calculation_updated_at?: string | null
          date_of_pruning?: Date | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          prompt_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'prompts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      fertigation_records: {
        Row: {
          area: number
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          dose: string
          farm_id: number | null
          fertilizer: string
          id: number
          notes: string | null
          purpose: string
        }
        Insert: {
          area: number
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          dose: string
          farm_id?: number | null
          fertilizer: string
          id?: number
          notes?: string | null
          purpose: string
        }
        Update: {
          area?: number
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          dose?: string
          farm_id?: number | null
          fertilizer?: string
          id?: number
          notes?: string | null
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fertigation_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      harvest_records: {
        Row: {
          buyer: string | null
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          farm_id: number | null
          grade: string
          id: number
          notes: string | null
          price: number | null
          quantity: number
        }
        Insert: {
          buyer?: string | null
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          grade: string
          id?: number
          notes?: string | null
          price?: number | null
          quantity: number
        }
        Update: {
          buyer?: string | null
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          grade?: string
          id?: number
          notes?: string | null
          price?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'harvest_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      image_analyses: {
        Row: {
          analysis_results: Json
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          expert_feedback: string | null
          farm_id: number | null
          id: number
          image_metadata: Json | null
          image_url: string
          model_version: string | null
          processing_time: number | null
          user_id: string | null
          verified_by_expert: boolean | null
        }
        Insert: {
          analysis_results: Json
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          expert_feedback?: string | null
          farm_id?: number | null
          id?: number
          image_metadata?: Json | null
          image_url: string
          model_version?: string | null
          processing_time?: number | null
          user_id?: string | null
          verified_by_expert?: boolean | null
        }
        Update: {
          analysis_results?: Json
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          expert_feedback?: string | null
          farm_id?: number | null
          id?: number
          image_metadata?: Json | null
          image_url?: string
          model_version?: string | null
          processing_time?: number | null
          user_id?: string | null
          verified_by_expert?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'image_analyses_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      irrigation_records: {
        Row: {
          area: number
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          duration: number
          farm_id: number | null
          growth_stage: string
          id: number
          moisture_status: string
          notes: string | null
          system_discharge: number
        }
        Insert: {
          area: number
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          duration: number
          farm_id?: number | null
          growth_stage: string
          id?: number
          moisture_status: string
          notes?: string | null
          system_discharge: number
        }
        Update: {
          area?: number
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          duration?: number
          farm_id?: number | null
          growth_stage?: string
          id?: number
          moisture_status?: string
          notes?: string | null
          system_discharge?: number
        }
        Relationships: [
          {
            foreignKeyName: 'irrigation_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      market_intelligence: {
        Row: {
          confidence_interval: Json | null
          created_at: string | null
          data_sources: Json | null
          demand_forecast: Json | null
          expires_at: string | null
          grape_variety: string | null
          id: number
          prediction_date: string
          price_data: Json
          quality_premiums: Json | null
          region: string
          seasonal_trends: Json | null
          supply_chain_insights: Json | null
        }
        Insert: {
          confidence_interval?: Json | null
          created_at?: string | null
          data_sources?: Json | null
          demand_forecast?: Json | null
          expires_at?: string | null
          grape_variety?: string | null
          id?: number
          prediction_date: string
          price_data?: Json
          quality_premiums?: Json | null
          region: string
          seasonal_trends?: Json | null
          supply_chain_insights?: Json | null
        }
        Update: {
          confidence_interval?: Json | null
          created_at?: string | null
          data_sources?: Json | null
          demand_forecast?: Json | null
          expires_at?: string | null
          grape_variety?: string | null
          id?: number
          prediction_date?: string
          price_data?: Json
          quality_premiums?: Json | null
          region?: string
          seasonal_trends?: Json | null
          supply_chain_insights?: Json | null
        }
        Relationships: []
      }
      maturity_assessments: {
        Row: {
          analysis_id: number | null
          color_profile: Json | null
          confidence_score: number | null
          created_at: string | null
          days_to_optimal: number | null
          estimated_brix: number | null
          farm_id: number | null
          harvest_recommendation: string | null
          id: number
          quality_prediction: Json | null
          ripeness_stage: string | null
          size_distribution: Json | null
        }
        Insert: {
          analysis_id?: number | null
          color_profile?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          days_to_optimal?: number | null
          estimated_brix?: number | null
          farm_id?: number | null
          harvest_recommendation?: string | null
          id?: number
          quality_prediction?: Json | null
          ripeness_stage?: string | null
          size_distribution?: Json | null
        }
        Update: {
          analysis_id?: number | null
          color_profile?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          days_to_optimal?: number | null
          estimated_brix?: number | null
          farm_id?: number | null
          harvest_recommendation?: string | null
          id?: number
          quality_prediction?: Json | null
          ripeness_stage?: string | null
          size_distribution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'maturity_assessments_analysis_id_fkey'
            columns: ['analysis_id']
            isOneToOne: false
            referencedRelation: 'image_analyses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'maturity_assessments_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      pest_disease_predictions: {
        Row: {
          alert_priority: string | null
          community_reports: number | null
          created_at: string | null
          farm_id: number | null
          farmer_action_taken: string | null
          id: number
          outcome: string | null
          pest_disease_type: string
          predicted_onset_date: string
          prevention_window: Json
          probability_score: number
          recommended_treatments: Json
          region: string
          resolved_at: string | null
          risk_level: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          weather_triggers: Json
        }
        Insert: {
          alert_priority?: string | null
          community_reports?: number | null
          created_at?: string | null
          farm_id?: number | null
          farmer_action_taken?: string | null
          id?: number
          outcome?: string | null
          pest_disease_type: string
          predicted_onset_date: string
          prevention_window?: Json
          probability_score: number
          recommended_treatments?: Json
          region: string
          resolved_at?: string | null
          risk_level: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          weather_triggers?: Json
        }
        Update: {
          alert_priority?: string | null
          community_reports?: number | null
          created_at?: string | null
          farm_id?: number | null
          farmer_action_taken?: string | null
          id?: number
          outcome?: string | null
          pest_disease_type?: string
          predicted_onset_date?: string
          prevention_window?: Json
          probability_score?: number
          recommended_treatments?: Json
          region?: string
          resolved_at?: string | null
          risk_level?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          weather_triggers?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'pest_disease_predictions_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      profitability_analyses: {
        Row: {
          actual_outcomes: Json | null
          analysis_period_end: string
          analysis_period_start: string
          benchmark_comparison: Json | null
          created_at: string | null
          efficiency_scores: Json | null
          expense_breakdown: Json | null
          farm_id: number | null
          farmer_implemented: Json | null
          id: number
          improvement_opportunities: Json | null
          predicted_impact: Json | null
          roi_calculation: number | null
          total_expenses: number | null
          user_id: string | null
        }
        Insert: {
          actual_outcomes?: Json | null
          analysis_period_end: string
          analysis_period_start: string
          benchmark_comparison?: Json | null
          created_at?: string | null
          efficiency_scores?: Json | null
          expense_breakdown?: Json | null
          farm_id?: number | null
          farmer_implemented?: Json | null
          id?: number
          improvement_opportunities?: Json | null
          predicted_impact?: Json | null
          roi_calculation?: number | null
          total_expenses?: number | null
          user_id?: string | null
        }
        Update: {
          actual_outcomes?: Json | null
          analysis_period_end?: string
          analysis_period_start?: string
          benchmark_comparison?: Json | null
          created_at?: string | null
          efficiency_scores?: Json | null
          expense_breakdown?: Json | null
          farm_id?: number | null
          farmer_implemented?: Json | null
          id?: number
          improvement_opportunities?: Json | null
          predicted_impact?: Json | null
          roi_calculation?: number | null
          total_expenses?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profitability_analyses_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      soil_test_records: {
        Row: {
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          farm_id: number | null
          id: number
          extraction_error: string | null
          extraction_status: string | null
          notes: string | null
          parsed_parameters: Json | null
          raw_notes: string | null
          report_filename: string | null
          report_storage_path: string | null
          report_type: string | null
          report_url: string | null
          parameters: Json
          recommendations: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          id?: number
          extraction_error?: string | null
          extraction_status?: string | null
          notes?: string | null
          parsed_parameters?: Json | null
          raw_notes?: string | null
          report_filename?: string | null
          report_storage_path?: string | null
          report_type?: string | null
          report_url?: string | null
          parameters: Json
          recommendations?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          id?: number
          extraction_error?: string | null
          extraction_status?: string | null
          notes?: string | null
          parsed_parameters?: Json | null
          raw_notes?: string | null
          report_filename?: string | null
          report_storage_path?: string | null
          report_type?: string | null
          report_url?: string | null
          parameters?: Json
          recommendations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'soil_test_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      petiole_test_records: {
        Row: {
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          farm_id: number | null
          id: number
          extraction_error: string | null
          extraction_status: string | null
          notes: string | null
          parsed_parameters: Json | null
          raw_notes: string | null
          report_filename: string | null
          report_storage_path: string | null
          report_type: string | null
          report_url: string | null
          parameters: Json
          recommendations: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          id?: number
          extraction_error?: string | null
          extraction_status?: string | null
          notes?: string | null
          parsed_parameters?: Json | null
          raw_notes?: string | null
          report_filename?: string | null
          report_storage_path?: string | null
          report_type?: string | null
          report_url?: string | null
          parameters: Json
          recommendations?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          farm_id?: number | null
          id?: number
          extraction_error?: string | null
          extraction_status?: string | null
          notes?: string | null
          parsed_parameters?: Json | null
          raw_notes?: string | null
          report_filename?: string | null
          report_storage_path?: string | null
          report_type?: string | null
          report_url?: string | null
          parameters?: Json
          recommendations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'petiole_test_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      spray_records: {
        Row: {
          area: number
          chemical: string
          chemicals: Json
          created_at: string | null
          date: string
          date_of_pruning: Date | null
          dose: string
          farm_id: number | null
          id: number
          notes: string | null
          operator: string
          weather: string
          water_volume: number | null
          quantity_amount: number
          quantity_unit: string
        }
        Insert: {
          area: number
          chemical: string
          chemicals?: Json
          created_at?: string | null
          date: string
          date_of_pruning?: Date | null
          dose: string
          farm_id?: number | null
          id?: number
          notes?: string | null
          operator: string
          weather: string
          water_volume?: number
          quantity_amount?: number
          quantity_unit?: string
        }
        Update: {
          area?: number
          chemical?: string
          chemicals?: Json
          created_at?: string | null
          date?: string
          date_of_pruning?: Date | null
          dose?: string
          farm_id?: number | null
          id?: number
          notes?: string | null
          operator?: string
          weather?: string
          water_volume?: number
          quantity_amount?: number
          quantity_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: 'spray_records_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      spray_windows: {
        Row: {
          chemical_efficiency: number | null
          constraints_met: Json | null
          created_at: string | null
          farm_id: number | null
          id: number
          recommendations: string | null
          spray_type: string
          suitability_score: number | null
          user_id: string | null
          weather_conditions: Json | null
          window_end: string
          window_start: string
        }
        Insert: {
          chemical_efficiency?: number | null
          constraints_met?: Json | null
          created_at?: string | null
          farm_id?: number | null
          id?: number
          recommendations?: string | null
          spray_type: string
          suitability_score?: number | null
          user_id?: string | null
          weather_conditions?: Json | null
          window_end: string
          window_start: string
        }
        Update: {
          chemical_efficiency?: number | null
          constraints_met?: Json | null
          created_at?: string | null
          farm_id?: number | null
          id?: number
          recommendations?: string | null
          spray_type?: string
          suitability_score?: number | null
          user_id?: string | null
          weather_conditions?: Json | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: 'spray_windows_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      task_reminders: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          farm_id: number | null
          id: number
          priority: string | null
          title: string
          type: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          farm_id?: number | null
          id?: number
          priority?: string | null
          title: string
          type: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          farm_id?: number | null
          id?: number
          priority?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_reminders_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      weather_data: {
        Row: {
          created_at: string | null
          farm_id: number | null
          humidity: number | null
          id: number
          leaf_wetness_duration: number | null
          pressure: number | null
          rainfall: number | null
          recorded_at: string
          soil_temperature: number | null
          station_id: number | null
          temperature: number | null
          vpd: number | null
          wind_direction: number | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string | null
          farm_id?: number | null
          humidity?: number | null
          id?: number
          leaf_wetness_duration?: number | null
          pressure?: number | null
          rainfall?: number | null
          recorded_at: string
          soil_temperature?: number | null
          station_id?: number | null
          temperature?: number | null
          vpd?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string | null
          farm_id?: number | null
          humidity?: number | null
          id?: number
          leaf_wetness_duration?: number | null
          pressure?: number | null
          rainfall?: number | null
          recorded_at?: string
          soil_temperature?: number | null
          station_id?: number | null
          temperature?: number | null
          vpd?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'weather_data_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weather_data_station_id_fkey'
            columns: ['station_id']
            isOneToOne: false
            referencedRelation: 'weather_stations'
            referencedColumns: ['id']
          }
        ]
      }
      weather_forecasts: {
        Row: {
          conditions: string | null
          created_at: string | null
          farm_id: number | null
          forecast_date: string
          forecast_hour: number | null
          humidity: number | null
          id: number
          provider: string
          rainfall_amount: number | null
          rainfall_probability: number | null
          temperature_max: number | null
          temperature_min: number | null
          wind_speed: number | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string | null
          farm_id?: number | null
          forecast_date: string
          forecast_hour?: number | null
          humidity?: number | null
          id?: number
          provider: string
          rainfall_amount?: number | null
          rainfall_probability?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          wind_speed?: number | null
        }
        Update: {
          conditions?: string | null
          created_at?: string | null
          farm_id?: number | null
          forecast_date?: string
          forecast_hour?: number | null
          humidity?: number | null
          id?: number
          provider?: string
          rainfall_amount?: number | null
          rainfall_probability?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'weather_forecasts_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      weather_stations: {
        Row: {
          created_at: string | null
          data_source: string
          elevation: number | null
          id: number
          latitude: number
          longitude: number
          name: string
          station_type: string | null
        }
        Insert: {
          created_at?: string | null
          data_source: string
          elevation?: number | null
          id?: number
          latitude: number
          longitude: number
          name: string
          station_type?: string | null
        }
        Update: {
          created_at?: string | null
          data_source?: string
          elevation?: number | null
          id?: number
          latitude?: number
          longitude?: number
          name?: string
          station_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decay_context_relevance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_old_task_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {}
  }
} as const
