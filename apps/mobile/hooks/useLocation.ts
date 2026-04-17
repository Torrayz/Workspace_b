// ============================================================================
// useLocation — GPS permission + tracking interval 30 detik
// ============================================================================

import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState, type AppStateStatus } from 'react-native';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const TRACKING_INTERVAL_MS = 30_000; // 30 detik
const BACKGROUND_TIMEOUT_MS = 60 * 60 * 1000; // 1 jam

export function useLocation() {
  const {
    latitude, longitude, hasPermission, isTracking, error,
    setLocation, setPermission, setTracking, setError,
  } = useLocationStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimestampRef = useRef<number | null>(null);

  /** Minta izin GPS dari user */
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermission(granted);
      if (!granted) {
        setError('Izin GPS ditolak. Aktifkan lokasi untuk melanjutkan.');
      }
      return granted;
    } catch {
      setError('Gagal memeriksa izin GPS.');
      return false;
    }
  };

  /** Ambil lokasi satu kali */
  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords.latitude, loc.coords.longitude);
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      setError('Gagal mendapatkan lokasi GPS.');
      return null;
    }
  };

  /** Upsert lokasi ke Supabase */
  const upsertLocation = async (lat: number, lng: number) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await supabase.from('user_locations').upsert(
        {
          user_id: user.id,
          lat: lat,
          lng: lng,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } catch (err) {
      console.error('[useLocation] upsert error:', err);
    }
  };

  /** Mulai GPS tracking interval */
  const startTracking = async () => {
    const granted = hasPermission || await requestPermission();
    if (!granted) return;

    setTracking(true);

    // Langsung ambil lokasi sekali saat start
    const loc = await getCurrentLocation();
    if (loc) await upsertLocation(loc.lat, loc.lng);

    // Set interval 30 detik
    intervalRef.current = setInterval(async () => {
      const currentLoc = await getCurrentLocation();
      if (currentLoc) await upsertLocation(currentLoc.lat, currentLoc.lng);
    }, TRACKING_INTERVAL_MS);
  };

  /** Stop GPS tracking */
  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
  };

  // Stop tracking jika app background > 1 jam
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        const timestamp = backgroundTimestampRef.current;
        if (timestamp && Date.now() - timestamp > BACKGROUND_TIMEOUT_MS) {
          stopTracking();
        }
        backgroundTimestampRef.current = null;
      }
    });
    return () => subscription.remove();
  }, []);

  // Cleanup interval saat unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    latitude,
    longitude,
    hasPermission,
    isTracking,
    error,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
}
