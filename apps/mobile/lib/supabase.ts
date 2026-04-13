// ============================================================================
// Supabase Client — Singleton untuk mobile app (Refactored)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

/**
 * Custom storage adapter menggunakan expo-secure-store.
 * Terdapat proteksi peringatan untuk limit 2KB di Android.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Peringatan jika sesi melebihi limit 2KB di Android (Batas maksimal SecureStore)
      if (Platform.OS === 'android' && value.length > 2048) {
        console.warn('⚠️ AWAS: Sesi Supabase melebihi 2KB. SecureStore Android mungkin gagal menyimpannya.');
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Aman untuk React Native
  }
});