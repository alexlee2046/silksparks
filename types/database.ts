/**
 * Supabase Database Types
 *
 * Auto-generated from schema analysis. Run `supabase gen types typescript`
 * with proper authentication for full type generation.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          birth_date: string | null;
          birth_time: string | null;
          birth_place: string | null;
          lat: number | null;
          lng: number | null;
          preferences: Json | null;
          points: number;
          tier: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          birth_place?: string | null;
          lat?: number | null;
          lng?: number | null;
          preferences?: Json | null;
          points?: number;
          tier?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          birth_place?: string | null;
          lat?: number | null;
          lng?: number | null;
          preferences?: Json | null;
          points?: number;
          tier?: string;
          is_admin?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: string | null;
          stock: number | null;
          featured: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category?: string | null;
          stock?: number | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: string | null;
          stock?: number | null;
          featured?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_tags: {
        Row: {
          id: number;
          product_id: number;
          tag: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          tag: string;
        };
        Update: {
          product_id?: number;
          tag?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total: number;
          currency: string;
          status: "pending" | "completed" | "delivered" | "cancelled";
          payment_status: "pending" | "processing" | "paid" | "failed" | "refunded";
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          shipping_address: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total: number;
          currency?: string;
          status?: "pending" | "completed" | "delivered" | "cancelled";
          payment_status?: "pending" | "processing" | "paid" | "failed" | "refunded";
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          shipping_address?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          total?: number;
          currency?: string;
          status?: "pending" | "completed" | "delivered" | "cancelled";
          payment_status?: "pending" | "processing" | "paid" | "failed" | "refunded";
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          shipping_address?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: number | null;
          name: string;
          price: number;
          type: "product" | "service" | "consultation";
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: number | null;
          name: string;
          price: number;
          type?: "product" | "service" | "consultation";
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          product_id?: number | null;
          name?: string;
          price?: number;
          type?: "product" | "service" | "consultation";
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      archives: {
        Row: {
          id: string;
          user_id: string;
          type: "Astrology" | "Tarot" | "Five Elements";
          title: string;
          summary: string | null;
          content: Json;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "Astrology" | "Tarot" | "Five Elements";
          title: string;
          summary?: string | null;
          content: Json;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          type?: "Astrology" | "Tarot" | "Five Elements";
          title?: string;
          summary?: string | null;
          content?: Json;
          image_url?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          product_id?: number;
        };
        Relationships: [];
      };
      experts: {
        Row: {
          id: string;
          name: string;
          title: string | null;
          bio: string | null;
          avatar_url: string | null;
          specialties: string[] | null;
          hourly_rate: number;
          rating: number | null;
          review_count: number;
          featured: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          title?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          specialties?: string[] | null;
          hourly_rate: number;
          rating?: number | null;
          review_count?: number;
          featured?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          title?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          specialties?: string[] | null;
          hourly_rate?: number;
          rating?: number | null;
          review_count?: number;
          featured?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      expert_availability: {
        Row: {
          id: string;
          expert_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expert_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          date?: string;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          expert_id: string;
          booked_at: string;
          duration_minutes: number;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          expert_id: string;
          booked_at: string;
          duration_minutes?: number;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          booked_at?: string;
          duration_minutes?: number;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      currencies: {
        Row: {
          id: number;
          code: string;
          name: string;
          symbol: string;
          rate: number;
          is_default: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          code: string;
          name: string;
          symbol?: string;
          rate?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          symbol?: string;
          rate?: number;
          is_default?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      shipping_zones: {
        Row: {
          id: number;
          name: string;
          countries: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          countries?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          countries?: string[];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      shipping_rates: {
        Row: {
          id: number;
          zone_id: number;
          name: string;
          price: number;
          min_days: number | null;
          max_days: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          zone_id: number;
          name: string;
          price: number;
          min_days?: number | null;
          max_days?: number | null;
          created_at?: string;
        };
        Update: {
          zone_id?: number;
          name?: string;
          price?: number;
          min_days?: number | null;
          max_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "shipping_zones";
            referencedColumns: ["id"];
          }
        ];
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          value?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          feature: string;
          model: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          feature: string;
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_tarot_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          current_streak: number;
          longest_streak: number;
          total_readings: number;
          last_reading_date: string | null;
          recent_cards: Json;
        };
      };
      record_tarot_reading: {
        Args: {
          p_user_id: string;
          p_reading_type: "daily" | "three_card" | "celtic_cross";
          p_cards: Json;
          p_question: string | null;
          p_interpretation: string | null;
          p_core_message: string | null;
          p_action_advice: string | null;
          p_lucky_elements: Json | null;
          p_seed: string | null;
        };
        Returns: {
          reading_id: string;
          current_streak: number;
          longest_streak: number;
          total_readings: number;
          is_new_streak: boolean;
        };
      };
    };
    Enums: Record<string, never>;
  };
}

// Helper types for common use cases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenient type aliases
export type Profile = Tables<"profiles">;
export type Product = Tables<"products">;
export type ProductTag = Tables<"product_tags">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Archive = Tables<"archives">;
export type Favorite = Tables<"favorites">;
export type Expert = Tables<"experts">;
export type ExpertAvailability = Tables<"expert_availability">;
export type Appointment = Tables<"appointments">;
export type Currency = Tables<"currencies">;
export type ShippingZone = Tables<"shipping_zones">;
export type ShippingRate = Tables<"shipping_rates">;
export type SystemSetting = Tables<"system_settings">;
export type Notification = Tables<"notifications">;
export type AdminAuditLog = Tables<"admin_audit_logs">;
export type AIUsageLog = Tables<"ai_usage_logs">;

// Product with tags (common join)
export type ProductWithTags = Product & {
  product_tags: ProductTag[];
};

// Shipping zone with rates (common join)
export type ShippingZoneWithRates = ShippingZone & {
  shipping_rates: ShippingRate[];
};

// Order with items (common join)
export type OrderWithItems = Order & {
  order_items: OrderItem[];
};
