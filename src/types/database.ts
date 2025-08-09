// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      visit_invitations: {
        Row: {
          id: string;
          resident_id: string;
          visitor_full_name: string;
          visitor_email: string;
          visitor_phone: string;
          visit_date: string;
          visit_purpose: string;
          status: string;
          invitation_token: string;
          token_expires_at: string;
          visit_duration_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          visitor_full_name: string;
          visitor_email: string;
          visitor_phone: string;
          visit_date: string;
          visit_purpose: string;
          status?: string;
          invitation_token?: string;
          token_expires_at?: string;
          visit_duration_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          visitor_full_name?: string;
          visitor_email?: string;
          visitor_phone?: string;
          visit_date?: string;
          visit_purpose?: string;
          status?: string;
          invitation_token?: string;
          token_expires_at?: string;
          visit_duration_hours?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type VisitInvitation = Database['public']['Tables']['visit_invitations']['Row'];
