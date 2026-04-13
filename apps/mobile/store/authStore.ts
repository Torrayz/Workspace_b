// ============================================================================
// Auth Store — Zustand + subscribeWithSelector + persist
// Manages user session dari custom JWT login flow
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface UserInfo {
  id: string;
  nama: string;
  nomor_induk: string;
  nomor_rekening: string;
  role: string;
}

interface AuthState {
  /** User data setelah login berhasil */
  user: UserInfo | null;
  /** JWT token dari Edge Function */
  token: string | null;
  /** Apakah sedang loading session */
  isLoading: boolean;
  /** Apakah sudah cek session awal */
  isInitialized: boolean;

  /** Set user + token setelah login berhasil */
  setAuth: (user: UserInfo, token: string) => Promise<void>;
  /** Clear session (logout) */
  clearAuth: () => Promise<void>;
  /** Load session dari SecureStore saat app start */
  initializeAuth: () => Promise<void>;
}

const AUTH_TOKEN_KEY = 'fm_auth_token';
const AUTH_USER_KEY = 'fm_auth_user';

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    user: null,
    token: null,
    isLoading: true,
    isInitialized: false,

    setAuth: async (user, token) => {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
      set({ user, token, isLoading: false });
    },

    clearAuth: async () => {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_USER_KEY);
      set({ user: null, token: null, isLoading: false });
    },

    initializeAuth: async () => {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const userStr = await SecureStore.getItemAsync(AUTH_USER_KEY);

        if (token && userStr) {
          const user = JSON.parse(userStr) as UserInfo;
          set({ user, token, isLoading: false, isInitialized: true });
        } else {
          set({ user: null, token: null, isLoading: false, isInitialized: true });
        }
      } catch {
        set({ user: null, token: null, isLoading: false, isInitialized: true });
      }
    },
  })),
);
