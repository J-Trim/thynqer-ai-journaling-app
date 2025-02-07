export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      code_analysis: {
        Row: {
          analysis_result: Json
          analyzed_at: string | null
          component_name: string
          id: string
        }
        Insert: {
          analysis_result: Json
          analyzed_at?: string | null
          component_name: string
          id?: string
        }
        Update: {
          analysis_result?: Json
          analyzed_at?: string | null
          component_name?: string
          id?: string
        }
        Relationships: []
      }
      custom_prompts: {
        Row: {
          id: string
          prompt_name: string
          prompt_template: string
          user_id: string
        }
        Insert: {
          id?: string
          prompt_name: string
          prompt_template: string
          user_id: string
        }
        Update: {
          id?: string
          prompt_name?: string
          prompt_template?: string
          user_id?: string
        }
        Relationships: []
      }
      default_prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt_template: string
          transformation_type: Database["public"]["Enums"]["valid_transformation"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_template: string
          transformation_type: Database["public"]["Enums"]["valid_transformation"]
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_template?: string
          transformation_type?: Database["public"]["Enums"]["valid_transformation"]
        }
        Relationships: []
      }
      enhanced_prompts: {
        Row: {
          created_at: string | null
          enhanced_template: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enhanced_template: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          enhanced_template?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      entry_tags: {
        Row: {
          entry_id: string
          id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          tag_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_tags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          audio_url: string | null
          created_at: string | null
          has_been_edited: boolean | null
          id: string
          mood: number | null
          mood_timestamp: string | null
          tags: Json | null
          text: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          has_been_edited?: boolean | null
          id?: string
          mood?: number | null
          mood_timestamp?: string | null
          tags?: Json | null
          text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          has_been_edited?: boolean | null
          id?: string
          mood?: number | null
          mood_timestamp?: string | null
          tags?: Json | null
          text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      request_rate_limits: {
        Row: {
          endpoint: string
          first_request_at: string | null
          id: string
          request_count: number | null
          user_id: string
        }
        Insert: {
          endpoint: string
          first_request_at?: string | null
          id?: string
          request_count?: number | null
          user_id: string
        }
        Update: {
          endpoint?: string
          first_request_at?: string | null
          id?: string
          request_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_status_cache: {
        Row: {
          expires_at: string | null
          features: Json | null
          id: string
          is_subscribed: boolean
          last_checked: string
          product_id: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          features?: Json | null
          id?: string
          is_subscribed: boolean
          last_checked?: string
          product_id?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          features?: Json | null
          id?: string
          is_subscribed?: boolean
          last_checked?: string
          product_id?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          name: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          name: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          name?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      summaries: {
        Row: {
          created_at: string | null
          entry_id: string
          id: string
          transformed_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          id?: string
          transformed_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          id?: string
          transformed_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_cache: {
        Row: {
          cached_result: string
          created_at: string | null
          id: string
          input_hash: string
          input_text: string
          last_accessed: string | null
          prompt_template: string
          transformation_type: string
        }
        Insert: {
          cached_result: string
          created_at?: string | null
          id?: string
          input_hash: string
          input_text: string
          last_accessed?: string | null
          prompt_template: string
          transformation_type: string
        }
        Update: {
          cached_result?: string
          created_at?: string | null
          id?: string
          input_hash?: string
          input_text?: string
          last_accessed?: string | null
          prompt_template?: string
          transformation_type?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transcription_queue: {
        Row: {
          audio_url: string
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          result: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_summary_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      valid_transformation:
        | "Quick Summary"
        | "Emotional Check-In"
        | "Daily Affirmation"
        | "Mindfulness Reflection"
        | "Psychoanalysis"
        | "Goal Setting"
        | "Short Paraphrase"
        | "Lesson Plan"
        | "Meeting Agenda"
        | "Project Proposal"
        | "Action Plan"
        | "Performance Review"
        | "Team Update / Status Report"
        | "Training Outline"
        | "Sales Pitch"
        | "Corporate Email / Internal Memo"
        | "Project Retrospective"
        | "Implementation Plan"
        | "Executive Summary"
        | "Brainstorm Session Outline"
        | "Risk Assessment"
        | "Professional White Paper"
        | "2nd Iambic Pentameter Rap"
        | "Blog Post"
        | "Email"
        | "Instagram Post"
        | "YouTube Script"
        | "X (Twitter) Post"
        | "Instagram Reel / TikTok Clip"
        | "Podcast Show Notes"
        | "LinkedIn Article"
        | "Motivational Snippet"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
