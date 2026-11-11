export * from './database.types';
export * from './recipe';
export * from './category';
export * from './team';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'barista' | 'head_barista' | 'shop_owner' | 'trainer';
  theme_preference: 'light' | 'dark' | 'system';
  default_unit_system: 'metric' | 'imperial' | 'custom';
}
