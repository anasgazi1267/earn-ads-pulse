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
          created_at: string
          current_completions: number | null
          description: string | null
          id: string
          is_active: boolean
          max_completions: number | null
          reward_amount: number
          task_type: string
          task_url: string
          title: string
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_completions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          reward_amount?: number
          task_type: string
          task_url: string
          title: string
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_completions?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          reward_amount?: number
          task_type?: string
          task_url?: string
          title?: string
          total_budget?: number | null
          updated_at?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
