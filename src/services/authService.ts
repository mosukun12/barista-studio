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
            full_name: p.full_name || userData.user.user_metadata?.full_name,
            avatar_url: p.avatar_url,
            role: p.role || 'barista',
            theme_preference: p.theme_preference || 'light',
            default_unit_system: p.default_unit_system || 'metric',
          };
        }

        return {
          id: userData.user.id,
          email: userData.user.email,
          full_name: userData.user.user_metadata?.full_name || 'Barista User',
          avatar_url: null,
          role: 'barista',
          theme_preference: 'light',
          default_unit_system: 'metric',
        };
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

  async signIn(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    }
    // Local mode simulate login
    localStorage.setItem('barista_studio_local_user', email);
    return { user: { email } };
  },

  async signUp(email: string, password: string, fullName: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw new Error(error.message);
      return data;
    }
    // Local mode simulate signup
    localStorage.setItem('barista_studio_local_user', email);
    return {
      user: { id: 'local-barista-01', email, user_metadata: { full_name: fullName } },
      session: { access_token: 'local-token' } as any,
    };
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('barista_studio_local_user');
  },
};
