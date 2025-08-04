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
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      balance_conversions: {
        Row: {
          amount_converted: number
          conversion_fee: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount_converted: number
          conversion_fee?: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_converted?: number
          conversion_fee?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          subscribers_count: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          subscribers_count?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          subscribers_count?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          admin_id: string
          created_at: string | null
          display_name: string
          exchange_rate: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          platform: string
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          display_name: string
          exchange_rate?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          platform: string
          type: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          display_name?: string
          exchange_rate?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          platform?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          earnings: number | null
          id: string
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Insert: {
          created_at?: string | null
          earnings?: number | null
          id?: string
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Update: {
          created_at?: string | null
          earnings?: number | null
          id?: string
          referred_telegram_id?: string
          referrer_telegram_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          admin_fee: number | null
          created_at: string
          created_by_user: string | null
          current_completions: number | null
          description: string | null
          id: string
          is_active: boolean
          max_completions: number | null
          reward_amount: number
          status: string | null
          task_type: string
          task_url: string
          title: string
          total_budget: number | null
          updated_at: string
          user_created: boolean | null
        }
        Insert: {
          admin_fee?: number | null
          created_at?: string
          created_by_user?: string | null
          current_completions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          reward_amount?: number
          status?: string | null
          task_type: string
          task_url: string
          title: string
          total_budget?: number | null
          updated_at?: string
          user_created?: boolean | null
        }
        Update: {
          admin_fee?: number | null
          created_at?: string
          created_by_user?: string | null
          current_completions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          reward_amount?: number
          status?: string | null
          task_type?: string
          task_url?: string
          title?: string
          total_budget?: number | null
          updated_at?: string
          user_created?: boolean | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          amount: number | null
          created_at: string | null
          id: string
          telegram_id: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          amount?: number | null
          created_at?: string | null
          id?: string
          telegram_id: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          amount?: number | null
          created_at?: string | null
          id?: string
          telegram_id?: string
        }
        Relationships: []
      }
      user_deposits: {
        Row: {
          amount: number
          converted_from_earnings: boolean | null
          created_at: string
          deposit_method: string
          id: string
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          converted_from_earnings?: boolean | null
          created_at?: string
          deposit_method?: string
          id?: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          converted_from_earnings?: boolean | null
          created_at?: string
          deposit_method?: string
          id?: string
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_device_tracking: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          first_account_telegram_id: string | null
          id: string
          ip_address: string
          is_blocked: boolean | null
          last_seen: string | null
          telegram_id: string
          total_accounts_attempted: number | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          first_account_telegram_id?: string | null
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          last_seen?: string | null
          telegram_id: string
          total_accounts_attempted?: number | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          first_account_telegram_id?: string | null
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          last_seen?: string | null
          telegram_id?: string
          total_accounts_attempted?: number | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string
          id: string
          reward_earned: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          reward_earned?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          reward_earned?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ads_watched_today: number | null
          balance: number | null
          channel_join_date: string | null
          channels_joined: boolean | null
          created_at: string | null
          deposit_balance: number | null
          first_name: string | null
          id: string
          last_activity_date: string | null
          last_name: string | null
          referral_count: number | null
          referred_by: string | null
          spins_used_today: number | null
          telegram_id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          ads_watched_today?: number | null
          balance?: number | null
          channel_join_date?: string | null
          channels_joined?: boolean | null
          created_at?: string | null
          deposit_balance?: number | null
          first_name?: string | null
          id?: string
          last_activity_date?: string | null
          last_name?: string | null
          referral_count?: number | null
          referred_by?: string | null
          spins_used_today?: number | null
          telegram_id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          ads_watched_today?: number | null
          balance?: number | null
          channel_join_date?: string | null
          channels_joined?: boolean | null
          created_at?: string | null
          deposit_balance?: number | null
          first_name?: string | null
          id?: string
          last_activity_date?: string | null
          last_name?: string | null
          referral_count?: number | null
          referred_by?: string | null
          spins_used_today?: number | null
          telegram_id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          telegram_id: string
          updated_at: string | null
          username: string
          wallet_address: string
          withdrawal_method: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          telegram_id: string
          updated_at?: string | null
          username: string
          wallet_address: string
          withdrawal_method: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          telegram_id?: string
          updated_at?: string | null
          username?: string
          wallet_address?: string
          withdrawal_method?: string
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
