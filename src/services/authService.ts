import { User } from 'firebase/auth';
import { subscribeToAuth, signInWithGoogle, logoutUser } from '../lib/firebase';

export const authService = {
  subscribeToAuth: (callback: (user: User | null) => void) => {
    return subscribeToAuth(callback);
  },
  signInWithGoogle: async (): Promise<User> => {
    return signInWithGoogle();
  },
  logoutUser: async (): Promise<void> => {
    return logoutUser();
  }
};
