import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';
import { AdminUser } from '../types';

export const authService = {
  subscribeToAuth: (callback: (user: AdminUser | null) => void) => {
    if (!isSupabaseConfigured()) {
      const cached = localCache.get<AdminUser | null>('admin_user', null);
      callback(cached);
      return () => {};
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user: AdminUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'staff',
        };
        localCache.set('admin_user', user);
        callback(user);
      } else {
        callback(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user: AdminUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'staff',
        };
        localCache.set('admin_user', user);
        callback(user);
      } else {
        localCache.set('admin_user', null);
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  login: async (email: string, password: string): Promise<AdminUser> => {
    if (!isSupabaseConfigured()) {
      // Fallback local auth for demo when Supabase environment variables are not yet provided
      const localUser: AdminUser = {
        id: 'local-admin-01',
        email,
        name: email.split('@')[0],
        role: 'admin',
      };
      localCache.set('admin_user', localUser);
      return localUser;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User not found');
    }

    const user: AdminUser = {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      role: data.user.user_metadata?.role || 'staff',
    };
    localCache.set('admin_user', user);
    return user;
  },

  logoutUser: async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localCache.set('admin_user', null);
  },

  getCurrentUser: (): AdminUser | null => {
    return localCache.get<AdminUser | null>('admin_user', null);
  },

  isAuthenticated: (): boolean => {
    return Boolean(localCache.get<AdminUser | null>('admin_user', null));
  },
};
