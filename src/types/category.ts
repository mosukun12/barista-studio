export interface Category {
  id: string;
  user_id: string;
  category_type: 'recipe' | 'ingredient' | 'guide';
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  created_at: string;
  count?: number;
}
