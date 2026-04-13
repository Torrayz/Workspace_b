// ============================================================================
// Main Layout — Bottom Tab Navigator: Home, Rencana, History
// + hidden screens for sub-pages (laporan/buat)
// ============================================================================

import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>
  );
}

export default function MainLayout() {
  const { isLoggedIn, isInitialized } = useAuth();

  // Guard: kalau tidak ada session, kembali ke auth
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.replace('/(auth)');
    }
  }, [isInitialized, isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rencana"
        options={{
          title: 'Rencana',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📄" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar — accessed via router.push() */}
      <Tabs.Screen
        name="laporan/buat"
        options={{
          href: null, // Hides from tab bar
        }}
      />
    </Tabs>
  );
}
