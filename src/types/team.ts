import { Recipe, Ingredient } from './recipe';
import { Category } from './category';

export type TeamRole = 'owner' | 'admin' | 'barista' | 'viewer';
export type TeamShareItemType = 'recipe' | 'ingredient' | 'category';

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  members_count?: number;
  shared_recipes_count?: number;
  shared_ingredients_count?: number;
  shared_categories_count?: number;
  current_user_role?: TeamRole;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: TeamRole;
  joined_at: string;
}

export interface TeamShare {
  id: string;
  team_id: string;
  item_type: TeamShareItemType;
  item_id: string;
  shared_by: string;
  created_at: string;
}

export interface TeamExportBundle {
  version: string;
  app: string;
  exported_at: string;
  team: {
    id?: string;
    name: string;
    description?: string | null;
  };
  recipes: Recipe[];
  ingredients: Ingredient[];
  categories: Category[];
}
