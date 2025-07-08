export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          invitation_id: string
          ip_address: unknown | null
          pin_hash: string
          qr_token: string
          resident_id: string
          used_at: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          invitation_id: string
          ip_address?: unknown | null
          pin_hash: string
          qr_token: string
          resident_id: string
          used_at?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_id?: string
          ip_address?: unknown | null
          pin_hash?: string
          qr_token?: string
          resident_id?: string
          used_at?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invitation"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "visit_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_resident"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_visitor"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      communities: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      residents: {
        Row: {
          account_locked_until: string | null
          community_id: string
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          id: string
          last_login: string | null
          phone_encrypted: string
          unit_number: string
        }
        Insert: {
          account_locked_until?: string | null
          community_id: string
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          id?: string
          last_login?: string | null
          phone_encrypted: string
          unit_number: string
        }
        Update: {
          account_locked_until?: string | null
          community_id?: string
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          id?: string
          last_login?: string | null
          phone_encrypted?: string
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_community"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_invitations: {
        Row: {
          created_at: string | null
          id: string
          invitation_token: string
          resident_id: string
          status: string | null
          token_expires_at: string
          visit_date: string
          visit_duration_hours: number | null
          visit_purpose: string
          visitor_email: string | null
          visitor_full_name: string
          visitor_phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_token: string
          resident_id: string
          status?: string | null
          token_expires_at: string
          visit_date: string
          visit_duration_hours?: number | null
          visit_purpose: string
          visitor_email?: string | null
          visitor_full_name: string
          visitor_phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_token?: string
          resident_id?: string
          status?: string | null
          token_expires_at?: string
          visit_date?: string
          visit_duration_hours?: number | null
          visit_purpose?: string
          visitor_email?: string | null
          visitor_full_name?: string
          visitor_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resident"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          created_at: string | null
          data_retention_until: string | null
          email_encrypted: string | null
          full_name_encrypted: string
          gdpr_consent: boolean | null
          id: string
          id_number_encrypted: string
          id_number_hash: string
          phone_encrypted: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string | null
          data_retention_until?: string | null
          email_encrypted?: string | null
          full_name_encrypted: string
          gdpr_consent?: boolean | null
          id?: string
          id_number_encrypted: string
          id_number_hash: string
          phone_encrypted: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string | null
          data_retention_until?: string | null
          email_encrypted?: string | null
          full_name_encrypted?: string
          gdpr_consent?: boolean | null
          id?: string
          id_number_encrypted?: string
          id_number_hash?: string
          phone_encrypted?: string
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
