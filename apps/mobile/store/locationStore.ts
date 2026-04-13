// ============================================================================
// Location Store — Zustand GPS state management
// Tracks user coordinates and upserts to Supabase every 30s
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface LocationState {
  /** Koordinat GPS terkini */
  latitude: number | null;
  longitude: number | null;
  /** Apakah GPS permission granted */
  hasPermission: boolean;
  /** Apakah GPS aktif (receiver on) */
  isTracking: boolean;
  /** Terakhir kali berhasil update lokasi */
  lastUpdated: string | null;
  /** Error message */
  error: string | null;

  setLocation: (lat: number, lng: number) => void;
  setPermission: (granted: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLocationStore = create<LocationState>()(
  subscribeWithSelector((set) => ({
    latitude: null,
    longitude: null,
    hasPermission: false,
    isTracking: false,
    lastUpdated: null,
    error: null,

    setLocation: (lat, lng) =>
      set({
        latitude: lat,
        longitude: lng,
        lastUpdated: new Date().toISOString(),
        error: null,
      }),

    setPermission: (granted) => set({ hasPermission: granted }),
    setTracking: (tracking) => set({ isTracking: tracking }),
    setError: (error) => set({ error }),
  })),
);
