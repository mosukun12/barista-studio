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
          full_name: string | null;
          avatar_url: string | null;
          role: 'barista' | 'head_barista' | 'shop_owner' | 'trainer';
          theme_preference: 'light' | 'dark' | 'system';
          default_unit_system: 'metric' | 'imperial' | 'custom';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'barista' | 'head_barista' | 'shop_owner' | 'trainer';
          theme_preference?: 'light' | 'dark' | 'system';
          default_unit_system?: 'metric' | 'imperial' | 'custom';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'barista' | 'head_barista' | 'shop_owner' | 'trainer';
          theme_preference?: 'light' | 'dark' | 'system';
          default_unit_system?: 'metric' | 'imperial' | 'custom';
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          category_type: 'recipe' | 'ingredient' | 'guide';
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_type: 'recipe' | 'ingredient' | 'guide';
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
      };
      measurement_units: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          symbol: string;
          unit_type: 'volume' | 'weight' | 'count' | 'custom';
          is_convertible: boolean;
          conversion_factor_to_base: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          symbol: string;
          unit_type?: 'volume' | 'weight' | 'count' | 'custom';
          is_convertible?: boolean;
          conversion_factor_to_base?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          symbol?: string;
          unit_type?: 'volume' | 'weight' | 'count' | 'custom';
          is_convertible?: boolean;
          conversion_factor_to_base?: number | null;
          sort_order?: number;
        };
      };
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          category_id: string | null;
          default_unit_id: string | null;
          description: string | null;
          image_url: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          category_id?: string | null;
          default_unit_id?: string | null;
          description?: string | null;
          image_url?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          brand?: string | null;
          category_id?: string | null;
          default_unit_id?: string | null;
          description?: string | null;
          image_url?: string | null;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name_th: string;
          name_en: string | null;
          description: string | null;
          cover_image_url: string | null;
          category_id: string | null;
          drink_type: 'hot' | 'iced' | 'blended' | 'specialty' | 'cold_brew' | 'filter' | null;
          glass_size: string | null;
          glass_type: string | null;
          lid_type: string | null;
          straw_type: string | null;
          serving_notes: string | null;
          status: 'draft' | 'incomplete' | 'testing' | 'verified' | 'archived';
          difficulty: 'easy' | 'medium' | 'advanced';
          prep_time_seconds: number;
          is_archived: boolean;
          current_version: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name_th: string;
          name_en?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          category_id?: string | null;
          drink_type?: 'hot' | 'iced' | 'blended' | 'specialty' | 'cold_brew' | 'filter' | null;
          glass_size?: string | null;
          glass_type?: string | null;
          lid_type?: string | null;
          straw_type?: string | null;
          serving_notes?: string | null;
          status?: 'draft' | 'incomplete' | 'testing' | 'verified' | 'archived';
          difficulty?: 'easy' | 'medium' | 'advanced';
          prep_time_seconds?: number;
          is_archived?: boolean;
          current_version?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name_th?: string;
          name_en?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          category_id?: string | null;
          drink_type?: 'hot' | 'iced' | 'blended' | 'specialty' | 'cold_brew' | 'filter' | null;
          glass_size?: string | null;
          glass_type?: string | null;
          lid_type?: string | null;
          straw_type?: string | null;
          serving_notes?: string | null;
          status?: 'draft' | 'incomplete' | 'testing' | 'verified' | 'archived';
          difficulty?: 'easy' | 'medium' | 'advanced';
          prep_time_seconds?: number;
          is_archived?: boolean;
          current_version?: number;
          tags?: string[];
          updated_at?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit_id: string | null;
          custom_unit_symbol: string | null;
          sort_order: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit_id?: string | null;
          custom_unit_symbol?: string | null;
          sort_order?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          ingredient_id?: string;
          quantity?: number;
          unit_id?: string | null;
          custom_unit_symbol?: string | null;
          sort_order?: number;
          note?: string | null;
        };
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          step_number: number;
          title: string;
          description: string | null;
          duration_seconds: number;
          equipment: string | null;
          image_url: string | null;
          additional_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          step_number: number;
          title: string;
          description?: string | null;
          duration_seconds?: number;
          equipment?: string | null;
          image_url?: string | null;
          additional_note?: string | null;
          created_at?: string;
        };
        Update: {
          step_number?: number;
          title?: string;
          description?: string | null;
          duration_seconds?: number;
          equipment?: string | null;
          image_url?: string | null;
          additional_note?: string | null;
        };
      };
      recipe_notes: {
        Row: {
          id: string;
          recipe_id: string;
          note_type: 'tip' | 'important' | 'common_mistake' | 'troubleshooting' | 'taste_adjustment' | 'customer_request' | 'avoid';
          title: string | null;
          content: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          note_type: 'tip' | 'important' | 'common_mistake' | 'troubleshooting' | 'taste_adjustment' | 'customer_request' | 'avoid';
          title?: string | null;
          content: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          note_type?: 'tip' | 'important' | 'common_mistake' | 'troubleshooting' | 'taste_adjustment' | 'customer_request' | 'avoid';
          title?: string | null;
          content?: string;
          sort_order?: number;
        };
      };
      recipe_versions: {
        Row: {
          id: string;
          recipe_id: string;
          version_number: number;
          created_by: string | null;
          change_summary: string;
          change_reason: string | null;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          version_number: number;
          created_by?: string | null;
          change_summary: string;
          change_reason?: string | null;
          snapshot: Json;
          created_at?: string;
        };
        Update: {
          change_summary?: string;
          change_reason?: string | null;
        };
      };
    };
  };
}
