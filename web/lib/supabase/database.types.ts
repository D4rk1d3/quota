// Generato da Supabase (mcp generate_typescript_types) sul progetto "quota"
// (nsxgzemqcsetxggmujdc — prodotto SaaS multi-tenant, non il vecchio
// progetto single-admin). Rigenerare con:
// npx supabase gen types typescript --project-id nsxgzemqcsetxggmujdc > lib/supabase/database.types.ts

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
      activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          organizer_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          organizer_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cycles: {
        Row: {
          closed_at: string | null
          collected_total: number
          created_at: string
          currency: string
          expected_total: number
          id: string
          period_end: string
          period_start: string
          price_at_cycle: number
          renewal_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          subscription_id: string
        }
        Insert: {
          closed_at?: string | null
          collected_total?: number
          created_at?: string
          currency: string
          expected_total?: number
          id?: string
          period_end: string
          period_start: string
          price_at_cycle: number
          renewal_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          subscription_id: string
        }
        Update: {
          closed_at?: string | null
          collected_total?: number
          created_at?: string
          currency?: string
          expected_total?: number
          id?: string
          period_end?: string
          period_start?: string
          price_at_cycle?: number
          renewal_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          id: string
          product_id: string | null
          provider: string
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          provider?: string
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          provider?: string
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_charges: {
        Row: {
          billing_cycle_id: string
          created_at: string
          currency: string
          due_date: string
          expected_amount: number
          id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          billing_cycle_id: string
          created_at?: string
          currency: string
          due_date: string
          expected_amount: number
          id?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          billing_cycle_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          expected_amount?: number
          id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_charges_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_charges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "subscription_members"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          archived_at: string | null
          created_at: string
          details: Json
          id: string
          is_default: boolean
          label: string
          method_type: string
          organizer_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          label: string
          method_type: string
          organizer_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          label?: string
          method_type?: string
          organizer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reversals: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          reason: string
          reversed_at: string
          reversed_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          reason: string
          reversed_at?: string
          reversed_by: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          reason?: string
          reversed_at?: string
          reversed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reversals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          charge_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          member_id: string
          note: string | null
          paid_at: string
          payment_method_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          charge_id: string
          created_at?: string
          created_by: string
          currency: string
          id?: string
          member_id: string
          note?: string | null
          paid_at?: string
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          charge_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          member_id?: string
          note?: string | null
          paid_at?: string
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "member_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "v_member_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "subscription_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          display_name: string | null
          email: string
          id: string
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          email: string
          id: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string
          id?: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          charge_id: string | null
          created_at: string
          id: string
          member_id: string
          message: string
          organizer_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
        }
        Insert: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          charge_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          message: string
          organizer_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          charge_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          message?: string
          organizer_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reminders_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "member_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "v_member_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "subscription_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_members: {
        Row: {
          avatar_color: string | null
          created_at: string
          default_share: number | null
          email: string | null
          id: string
          initials: string | null
          joined_at: string
          left_at: string | null
          name: string
          pause_from: string | null
          pause_until: string | null
          phone: string | null
          status: Database["public"]["Enums"]["member_status"]
          subscription_id: string
          updated_at: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string
          default_share?: number | null
          email?: string | null
          id?: string
          initials?: string | null
          joined_at?: string
          left_at?: string | null
          name: string
          pause_from?: string | null
          pause_until?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          subscription_id: string
          updated_at?: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string
          default_share?: number | null
          email?: string | null
          id?: string
          initials?: string | null
          joined_at?: string
          left_at?: string | null
          name?: string
          pause_from?: string | null
          pause_until?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_members_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_price_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          effective_from: string
          id: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          effective_from: string
          id?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          effective_from?: string
          id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_price_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_frequency: Database["public"]["Enums"]["billing_frequency"]
          billing_interval: number
          created_at: string
          currency: string
          current_price: number
          description: string | null
          icon: string | null
          id: string
          name: string
          next_renewal_date: string
          organizer_id: string
          renewal_day: number | null
          share_type: Database["public"]["Enums"]["share_type"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          billing_frequency?: Database["public"]["Enums"]["billing_frequency"]
          billing_interval?: number
          created_at?: string
          currency?: string
          current_price: number
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          next_renewal_date: string
          organizer_id: string
          renewal_day?: number | null
          share_type?: Database["public"]["Enums"]["share_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          billing_frequency?: Database["public"]["Enums"]["billing_frequency"]
          billing_interval?: number
          created_at?: string
          currency?: string
          current_price?: number
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          next_renewal_date?: string
          organizer_id?: string
          renewal_day?: number | null
          share_type?: Database["public"]["Enums"]["share_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_member_charges: {
        Row: {
          billing_cycle_id: string | null
          charge_status: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          expected_amount: number | null
          id: string | null
          member_id: string | null
          remaining_amount: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_charges_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_charges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "subscription_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_billing_period: {
        Args: {
          p_date: string
          p_frequency: Database["public"]["Enums"]["billing_frequency"]
          p_interval: number
        }
        Returns: string
      }
      calculate_member_charges: {
        Args: { p_billing_cycle_id: string }
        Returns: undefined
      }
      compute_shares: {
        Args: { total_cents: number; weights: number[] }
        Returns: number[]
      }
      generate_billing_cycle: {
        Args: { p_period_start: string; p_subscription_id: string }
        Returns: string
      }
      generate_upcoming_cycles: {
        Args: { p_window?: number }
        Returns: undefined
      }
      get_current_entitlement: {
        Args: { p_user_id?: string }
        Returns: {
          cancel_at_period_end: boolean
          current_period_end: string
          is_pro: boolean
          status: Database["public"]["Enums"]["entitlement_status"]
        }[]
      }
      get_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          next_renewal_date: string
          next_renewal_subscription: string
          overdue_count: number
          payments_count: number
          total_collected: number
          total_expected: number
          total_outstanding: number
        }[]
      }
      record_payment: {
        Args: {
          p_amount: number
          p_charge_id: string
          p_note?: string
          p_paid_at?: string
          p_payment_method_id?: string
        }
        Returns: string
      }
      reverse_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: string
      }
      seed_demo_data: { Args: { p_organizer_id: string }; Returns: undefined }
      update_cycle_statuses: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      billing_frequency: "monthly" | "quarterly" | "yearly" | "custom"
      cycle_status: "upcoming" | "current" | "overdue" | "closed"
      entitlement_status:
        | "free"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      member_status: "active" | "paused" | "removed"
      payment_status: "active" | "reversed"
      reminder_channel: "copy" | "email" | "push"
      reminder_status: "pending" | "sent" | "failed"
      share_type: "equal" | "fixed" | "percentage"
      subscription_status: "active" | "paused" | "cancelled" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_frequency: ["monthly", "quarterly", "yearly", "custom"],
      cycle_status: ["upcoming", "current", "overdue", "closed"],
      entitlement_status: [
        "free",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      member_status: ["active", "paused", "removed"],
      payment_status: ["active", "reversed"],
      reminder_channel: ["copy", "email", "push"],
      reminder_status: ["pending", "sent", "failed"],
      share_type: ["equal", "fixed", "percentage"],
      subscription_status: ["active", "paused", "cancelled", "archived"],
    },
  },
} as const
