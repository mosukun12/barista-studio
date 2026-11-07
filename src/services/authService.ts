import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

export const authService = {
  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session;
    }
    return null;
  },

  async getCurrentProfile(): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (profile) {
          const p = profile as any;
          return {
            id: p.id,
            email: userData.user.email,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            role: p.role,
            theme_preference: p.theme_preference,
            default_unit_system: p.default_unit_system,
          };
        }
      }
    }

    // Default local studio barista profile
    return {
      id: 'local-barista-01',
      email: 'barista@studio.local',
      full_name: 'Studio Barista',
      avatar_url: null,
      role: 'head_barista',
      theme_preference: 'light',
      default_unit_system: 'metric',
    };
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
