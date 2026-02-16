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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
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
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
      product_views: {
        Row: {
          first_viewed_at: string
          id: string
          last_viewed_at: string
          product_id: string
          product_title: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          product_id: string
          product_title?: string | null
          user_id: string
          view_count?: number
        }
        Update: {
          first_viewed_at?: string
          id?: string
          last_viewed_at?: string
          product_id?: string
          product_title?: string | null
          user_id?: string
          view_count?: number
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
          images: string[] | null
          inventory: number
          is_deleted: boolean | null
          item_number: string | null
          price: string
          product_type: string | null
          size_inventory: Json | null
          sizes: string[] | null
          status: string | null
          title: string
          unit_cost: string | null
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
          images?: string[] | null
          inventory?: number
          is_deleted?: boolean | null
          item_number?: string | null
          price?: string
          product_type?: string | null
          size_inventory?: Json | null
          sizes?: string[] | null
          status?: string | null
          title: string
          unit_cost?: string | null
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
          images?: string[] | null
          inventory?: number
          is_deleted?: boolean | null
          item_number?: string | null
          price?: string
          product_type?: string | null
          size_inventory?: Json | null
          sizes?: string[] | null
          status?: string | null
          title?: string
          unit_cost?: string | null
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
      reviews: {
        Row: {
          admin_comment: Json | null
          comment: string
          created_at: string
          id: string
          likes: string[] | null
          product_id: string
          rating: number
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          admin_comment?: Json | null
          comment: string
          created_at?: string
          id?: string
          likes?: string[] | null
          product_id: string
          rating: number
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          admin_comment?: Json | null
          comment?: string
          created_at?: string
          id?: string
          likes?: string[] | null
          product_id?: string
          rating?: number
          user_avatar?: string | null
          user_id?: string
          user_name?: string
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_store_settings: {
        Row: {
          auto_sync: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          is_maintenance_mode: boolean | null
          low_stock_threshold: number | null
          pos_provider: string | null
          seo_description: string | null
          seo_title: string | null
          shipping_rate: number | null
          store_name: string | null
          tax_rate: number | null
          tiktok_url: string | null
          updated_at: string | null
        }
        Insert: {
          auto_sync?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          is_maintenance_mode?: boolean | null
          low_stock_threshold?: number | null
          pos_provider?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_rate?: number | null
          store_name?: string | null
          tax_rate?: number | null
          tiktok_url?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_sync?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          is_maintenance_mode?: boolean | null
          low_stock_threshold?: number | null
          pos_provider?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_rate?: number | null
          store_name?: string | null
          tax_rate?: number | null
          tiktok_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      increment_product_view: {
        Args: {
          p_product_id: string
          p_product_title?: string
          p_user_id: string
        }
        Returns: undefined
      }
      toggle_review_like: {
        Args: { p_review_id: string; p_user_id: string }
        Returns: undefined
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
