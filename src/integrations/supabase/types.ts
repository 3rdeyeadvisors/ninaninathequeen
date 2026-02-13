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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          join_date: string
          name: string
          order_count: number | null
          total_spent: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          join_date: string
          name: string
          order_count?: number | null
          total_spent?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          join_date?: string
          name?: string
          order_count?: number | null
          total_spent?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          date: string
          id: string
          item_cost: string | null
          items: Json
          shipping_address: Json | null
          shipping_cost: string | null
          square_order_id: string | null
          status: string | null
          total: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          date: string
          id: string
          item_cost?: string | null
          items?: Json
          shipping_address?: Json | null
          shipping_cost?: string | null
          square_order_id?: string | null
          status?: string | null
          total: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          date?: string
          id?: string
          item_cost?: string | null
          items?: Json
          shipping_address?: Json | null
          shipping_cost?: string | null
          square_order_id?: string | null
          status?: string | null
          total?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          collection: string | null
          color_codes: string[] | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          inventory: number
          is_deleted: boolean | null
          item_number: string | null
          price: string
          product_type: string | null
          size_inventory: Json | null
          sizes: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          collection?: string | null
          color_codes?: string[] | null
          created_at?: string
          description?: string | null
          id: string
          image?: string | null
          inventory?: number
          is_deleted?: boolean | null
          item_number?: string | null
          price?: string
          product_type?: string | null
          size_inventory?: Json | null
          sizes?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          collection?: string | null
          color_codes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          inventory?: number
          is_deleted?: boolean | null
          item_number?: string | null
          price?: string
          product_type?: string | null
          size_inventory?: Json | null
          sizes?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          points: number | null
          points_reset_at: string | null
          preferred_size: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          points?: number | null
          points_reset_at?: string | null
          preferred_size?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          points?: number | null
          points_reset_at?: string | null
          preferred_size?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          auto_sync: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_maintenance_mode: boolean | null
          low_stock_threshold: number | null
          pos_provider: string | null
          seo_description: string | null
          seo_title: string | null
          shipping_rate: number | null
          square_api_key: string | null
          square_application_id: string | null
          square_location_id: string | null
          store_name: string | null
          tax_rate: number | null
          tiktok_url: string | null
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_maintenance_mode?: boolean | null
          low_stock_threshold?: number | null
          pos_provider?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_rate?: number | null
          square_api_key?: string | null
          square_application_id?: string | null
          square_location_id?: string | null
          store_name?: string | null
          tax_rate?: number | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_maintenance_mode?: boolean | null
          low_stock_threshold?: number | null
          pos_provider?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_rate?: number | null
          square_api_key?: string | null
          square_application_id?: string | null
          square_location_id?: string | null
          store_name?: string | null
          tax_rate?: number | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_reset_points: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
