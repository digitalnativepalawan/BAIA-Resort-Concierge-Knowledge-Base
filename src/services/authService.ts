import { pb } from '../lib/pocketbase';

export interface TalaUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

let authListeners: Array<(user: TalaUser | null) => void> = [];

function notifyListeners(user: TalaUser | null) {
  authListeners.forEach((cb) => cb(user));
}

function pbUserToTalaUser(record: any): TalaUser {
  return {
    id: record.id,
    email: record.email || '',
    name: record.name || record.email?.split('@')[0] || 'Admin',
    role: record.role || 'staff',
    avatar: record.avatar || ''
  };
}

pb.authStore.onChange(() => {
  if (pb.authStore.isValid && pb.authStore.record) {
    notifyListeners(pbUserToTalaUser(pb.authStore.record));
  } else {
    notifyListeners(null);
  }
});

export const authService = {
  subscribeToAuth: (callback: (user: TalaUser | null) => void) => {
    authListeners.push(callback);

    // Emit current state immediately
    if (pb.authStore.isValid && pb.authStore.record) {
      callback(pbUserToTalaUser(pb.authStore.record));
    } else {
      callback(null);
    }

    return () => {
      authListeners = authListeners.filter((cb) => cb !== callback);
    };
  },

  login: async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return pbUserToTalaUser(authData.record);
  },

  logoutUser: async (): Promise<void> => {
    pb.authStore.clear();
    notifyListeners(null);
  },

  getCurrentUser: (): TalaUser | null => {
    if (pb.authStore.isValid && pb.authStore.record) {
      return pbUserToTalaUser(pb.authStore.record);
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return pb.authStore.isValid;
  }
};
