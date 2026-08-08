import { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types';
import { authService } from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const user = await authService.login(email, pass);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logoutUser();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    logout,
  };
}
