// ============================================================================
// useAuth — Session management + logout
// ============================================================================

import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

export function useAuth() {
  const { user, token, isLoading, isInitialized, clearAuth } = useAuthStore();

  const logout = async () => {
    // Stop GPS tracking
    useLocationStore.getState().setTracking(false);
    await clearAuth();
    router.replace('/(auth)');
  };

  return {
    user,
    token,
    isLoading,
    isInitialized,
    isLoggedIn: !!user && !!token,
    logout,
  };
}
