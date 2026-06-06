export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_events: {
        Row: {
          alert_id: string
          id: string
          sale_url: string | null
          triggered_at: string
          triggered_price_cents: number
          user_id: string
        }
        Insert: {
          alert_id: string
          id?: string
          sale_url?: string | null
          triggered_at?: string
          triggered_price_cents: number
          user_id: string
        }
        Update: {
          alert_id?: string
          id?: string
          sale_url?: string | null
          triggered_at?: string
          triggered_price_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "price_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      card_sales: {
        Row: {
          currency: string | null
          fetched_at: string
          fingerprint: string
          grade: string | null
          id: string
          image_url: string | null
          price_cents: number | null
          raw: Json | null
          sold_at: string | null
          source: string
          title: string | null
          url: string | null
        }
        Insert: {
          currency?: string | null
          fetched_at?: string
          fingerprint: string
          grade?: string | null
          id?: string
          image_url?: string | null
          price_cents?: number | null
          raw?: Json | null
          sold_at?: string | null
          source: string
          title?: string | null
          url?: string | null
        }
        Update: {
          currency?: string | null
          fetched_at?: string
          fingerprint?: string
          grade?: string | null
          id?: string
          image_url?: string | null
          price_cents?: number | null
          raw?: Json | null
          sold_at?: string | null
          source?: string
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      cash_deal_events: {
        Row: {
          actor_id: string | null
          created_at: string
          deal_id: string
          detail: Json | null
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          deal_id: string
          detail?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          deal_id?: string
          detail?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_deal_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "cash_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_deals: {
        Row: {
          approved_at: string | null
          card_fingerprint: string
          claim_token: string | null
          counterparty_email: string | null
          counterparty_id: string | null
          created_at: string
          display_title: string
          expires_at: string
          id: string
          initiator_id: string
          initiator_role: string
          normalized_query: Json
          notes: string | null
          owned_card_id: string | null
          price_cents: number
          sale_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          card_fingerprint: string
          claim_token?: string | null
          counterparty_email?: string | null
          counterparty_id?: string | null
          created_at?: string
          display_title: string
          expires_at?: string
          id?: string
          initiator_id: string
          initiator_role: string
          normalized_query?: Json
          notes?: string | null
          owned_card_id?: string | null
          price_cents: number
          sale_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          card_fingerprint?: string
          claim_token?: string | null
          counterparty_email?: string | null
          counterparty_id?: string | null
          created_at?: string
          display_title?: string
          expires_at?: string
          id?: string
          initiator_id?: string
          initiator_role?: string
          normalized_query?: Json
          notes?: string | null
          owned_card_id?: string | null
          price_cents?: number
          sale_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          share_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          share_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          share_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owned_cards: {
        Row: {
          acquired_on: string | null
          back_image_path: string | null
          card_number: string | null
          collection_id: string
          condition: string | null
          created_at: string
          display_title: string
          fingerprint: string
          front_image_path: string | null
          grade: string | null
          id: string
          normalized_query: Json
          notes: string | null
          parallel: string | null
          player: string | null
          purchase_price_cents: number | null
          set_name: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          acquired_on?: string | null
          back_image_path?: string | null
          card_number?: string | null
          collection_id: string
          condition?: string | null
          created_at?: string
          display_title: string
          fingerprint: string
          front_image_path?: string | null
          grade?: string | null
          id?: string
          normalized_query?: Json
          notes?: string | null
          parallel?: string | null
          player?: string | null
          purchase_price_cents?: number | null
          set_name?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          acquired_on?: string | null
          back_image_path?: string | null
          card_number?: string | null
          collection_id?: string
          condition?: string | null
          created_at?: string
          display_title?: string
          fingerprint?: string
          front_image_path?: string | null
          grade?: string | null
          id?: string
          normalized_query?: Json
          notes?: string | null
          parallel?: string | null
          player?: string | null
          purchase_price_cents?: number | null
          set_name?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owned_cards_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          active: boolean
          created_at: string
          direction: string
          fingerprint: string
          id: string
          threshold_cents: number
          tracked_card_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          direction: string
          fingerprint: string
          id?: string
          threshold_cents: number
          tracked_card_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          direction?: string
          fingerprint?: string
          id?: string
          threshold_cents?: number
          tracked_card_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_tracked_card_id_fkey"
            columns: ["tracked_card_id"]
            isOneToOne: false
            referencedRelation: "tracked_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          completed_deals_count: number
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          verified_deals_count: number
        }
        Insert: {
          avatar_url?: string | null
          completed_deals_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
          verified_deals_count?: number
        }
        Update: {
          avatar_url?: string | null
          completed_deals_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          verified_deals_count?: number
        }
        Relationships: []
      }
      tracked_cards: {
        Row: {
          created_at: string
          display_title: string | null
          fingerprint: string
          id: string
          normalized_query: Json
          raw_query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_title?: string | null
          fingerprint: string
          id?: string
          normalized_query?: Json
          raw_query: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_title?: string | null
          fingerprint?: string
          id?: string
          normalized_query?: Json
          raw_query?: string
          user_id?: string
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
