// Generato da Supabase (mcp generate_typescript_types) sul progetto "quota".
// Rigenerare con: npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coverage_allocations: {
        Row: {
          amount_cents: number
          created_at: string
          cycle_date: string
          id: string
          member_id: string
          payment_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          cycle_date: string
          id?: string
          member_id: string
          payment_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          cycle_date?: string
          id?: string
          member_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_allocations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          active: boolean
          color: string
          created_at: string
          email: string | null
          id: string
          joined_at: string
          monthly_share_cents: number
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string
          monthly_share_cents?: number
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string
          monthly_share_cents?: number
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          cycle_date: string | null
          email_sent_at: string | null
          id: string
          idempotency_key: string
          in_app_read_at: string | null
          member_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body: string
          created_at?: string
          cycle_date?: string | null
          email_sent_at?: string | null
          id?: string
          idempotency_key: string
          in_app_read_at?: string | null
          member_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string
          created_at?: string
          cycle_date?: string | null
          email_sent_at?: string | null
          id?: string
          idempotency_key?: string
          in_app_read_at?: string | null
          member_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          adjusts_payment_id: string | null
          amount_cents: number
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          member_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          paid_at: string
          voids_payment_id: string | null
        }
        Insert: {
          adjusts_payment_id?: string | null
          amount_cents: number
          created_at?: string
          created_by: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          member_id: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          paid_at?: string
          voids_payment_id?: string | null
        }
        Update: {
          adjusts_payment_id?: string | null
          amount_cents?: number
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          member_id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          paid_at?: string
          voids_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_adjusts_payment_id_fkey"
            columns: ["adjusts_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_voids_payment_id_fkey"
            columns: ["voids_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean
          billing_day: number
          created_at: string
          id: string
          member_count: number
          member_quota_cents: number
          monthly_cost_cents: number
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_day: number
          created_at?: string
          id?: string
          member_count: number
          member_quota_cents: number
          monthly_cost_cents: number
          name?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_day?: number
          created_at?: string
          id?: string
          member_count?: number
          member_quota_cents?: number
          monthly_cost_cents?: number
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_subscription: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          billing_day: number
          created_at: string
          id: string
          member_count: number
          member_quota_cents: number
          monthly_cost_cents: number
          name: string
          start_date: string
          updated_at: string
        }
      }
      adjust_payment: {
        Args: { p_delta_cents: number; p_note: string; p_payment_id: string }
        Returns: {
          adjusts_payment_id: string | null
          amount_cents: number
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          member_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          paid_at: string
          voids_payment_id: string | null
        }
      }
      billing_cycles: {
        Args: { p_from: string; p_to: string }
        Returns: string[]
      }
      fund_state: {
        Args: { p_as_of?: string }
        Returns: {
          balance_cents: number
          collected_this_cycle_cents: number
          current_cycle_date: string
          expected_this_cycle_cents: number
          members_in_good_standing: number
          to_recover_cents: number
          total_members: number
        }[]
      }
      member_coverage: {
        Args: { p_as_of?: string; p_member_id: string }
        Returns: {
          covered_until: string
          credit_cents: number
          fully_covered_cycles: number
          is_overdue: boolean
          member_id: string
        }[]
      }
      member_coverage_all: {
        Args: { p_as_of?: string }
        Returns: {
          active: boolean
          color: string
          covered_until: string
          credit_cents: number
          fully_covered_cycles: number
          is_overdue: boolean
          member_id: string
          monthly_share_cents: number
          name: string
        }[]
      }
      members_to_follow_up: {
        Args: { p_as_of?: string }
        Returns: {
          covered_until: string
          days_until_due: number
          member_id: string
          name: string
          reason: string
        }[]
      }
      record_payment: {
        Args: {
          p_amount_cents: number
          p_member_id: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_paid_at?: string
        }
        Returns: {
          adjusts_payment_id: string | null
          amount_cents: number
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          member_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          paid_at: string
          voids_payment_id: string | null
        }
      }
      void_payment: {
        Args: { p_note: string; p_payment_id: string }
        Returns: {
          adjusts_payment_id: string | null
          amount_cents: number
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          member_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          paid_at: string
          voids_payment_id: string | null
        }
      }
    }
    Enums: {
      notification_type:
        | "charge_reminder_3d"
        | "charge_due"
        | "member_uncovered"
        | "coverage_ending_soon"
      payment_kind: "payment" | "void" | "adjustment"
      payment_method:
        | "bonifico"
        | "revolut"
        | "trade_republic"
        | "contanti"
        | "satispay"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
export type FunctionArgs<T extends keyof DefaultSchema["Functions"]> =
  DefaultSchema["Functions"][T]["Args"]
export type FunctionReturns<T extends keyof DefaultSchema["Functions"]> =
  DefaultSchema["Functions"][T]["Returns"]
