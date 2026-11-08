export type RecipeStatus = 'draft' | 'incomplete' | 'testing' | 'verified' | 'archived';

export type DrinkType = 'hot' | 'iced' | 'blended' | 'specialty' | 'cold_brew' | 'filter';

export type NoteType =
  | 'tip'
  | 'important'
  | 'common_mistake'
  | 'troubleshooting'
  | 'taste_adjustment'
  | 'customer_request'
  | 'avoid';

export interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  unit_type: 'volume' | 'weight' | 'count' | 'custom';
  is_convertible: boolean;
  conversion_factor_to_base?: number | null;
  sort_order: number;
}

export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  brand?: string | null;
  category_id?: string | null;
  default_unit_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined fields
  category_name?: string;
  default_unit_symbol?: string;
  used_in_recipe_count?: number;
}

export interface RecipeIngredientItem {
  id?: string;
  recipe_id?: string;
  ingredient_id: string;
  quantity: number;
  unit_id?: string | null;
  custom_unit_symbol?: string | null;
  sort_order: number;
  note?: string | null;
  // display joins
  ingredient_name?: string;
  ingredient_brand?: string;
  unit_symbol?: string;
}

export interface RecipeStepItem {
  id?: string;
  recipe_id?: string;
  step_number: number;
  title: string;
  description?: string | null;
  duration_seconds: number;
  equipment?: string | null;
  image_url?: string | null;
  additional_note?: string | null;
  ingredients?: string[]; // รายการวัตถุดิบที่ใช้ในขั้นตอนนี้ (ดึงจาก Section C)
}

export interface RecipeNoteItem {
  id?: string;
  recipe_id?: string;
  note_type: NoteType;
  title?: string | null;
  content: string;
  sort_order: number;
}

export interface RecipeVariantItem {
  id?: string;
  parent_recipe_id: string;
  variant_name: string;
  description?: string | null;
  diff_payload: Record<string, unknown>;
}

export interface RecipeVersionItem {
  id: string;
  recipe_id: string;
  version_number: number;
  created_by?: string | null;
  change_summary: string;
  change_reason?: string | null;
  snapshot: {
    recipe: Partial<Recipe>;
    ingredients: RecipeIngredientItem[];
    steps: RecipeStepItem[];
    notes: RecipeNoteItem[];
  };
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name_th: string;
  name_en?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  drink_type?: DrinkType | null;
  glass_size?: string | null;
  glass_type?: string | null;
  lid_type?: string | null;
  straw_type?: string | null;
  serving_notes?: string | null;
  status: RecipeStatus;
  difficulty: 'easy' | 'medium' | 'advanced';
  prep_time_seconds: number;
  is_archived: boolean;
  current_version: number;
  tags: string[];
  created_at: string;
  updated_at: string;

  // Embedded related records
  ingredients?: RecipeIngredientItem[];
  steps?: RecipeStepItem[];
  notes?: RecipeNoteItem[];
  variants?: RecipeVariantItem[];
}

export interface RecipeFilterOptions {
  searchQuery: string;
  category: string;
  status: string;
  drinkType: string;
  sortBy: 'name' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
  showArchived: boolean;
}
