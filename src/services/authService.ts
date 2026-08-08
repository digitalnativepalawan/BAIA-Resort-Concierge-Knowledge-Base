import { pb } from '../lib/pocketbase';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export const authService = {
  subscribeToAuth: (callback: (user: AdminUser | null) => void) => {
    // Notify on initial load
    if (pb.authStore.isValid && pb.authStore.record) {
      callback({
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        name: pb.authStore.record.name,
        role: pb.authStore.record.role || 'staff'
      });
    } else {
      callback(null);
    }

    // Subscribe to auth state changes
    const removeListener = pb.authStore.onChange((token, record) => {
      if (token && record) {
        callback({
          id: record.id,
          email: record.email,
          name: record.name,
          role: record.role || 'staff'
        });
      } else {
        callback(null);
      }
    }, true);

    return () => {
      removeListener();
    };
  },

  login: async (email: string, password: string): Promise<AdminUser> => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return {
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
      role: authData.record.role || 'staff'
    };
  },

  logoutUser: async (): Promise<void> => {
    pb.authStore.clear();
  },

  getCurrentUser: (): AdminUser | null => {
    if (pb.authStore.isValid && pb.authStore.record) {
      return {
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        name: pb.authStore.record.name,
        role: pb.authStore.record.role || 'staff'
      };
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return pb.authStore.isValid;
  }
};
