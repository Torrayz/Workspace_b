// ============================================================================
// Main Layout — Bottom Tab Navigator: Home, Rencana, History
// + hidden screens for sub-pages (laporan/buat)
// Redesign v2: Polished tab bar with rounded corners + active indicator
// ============================================================================

import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Shadows } from '@/constants/theme';

function TabIcon({ symbol, label, focused }: { symbol: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{symbol}</Text>
      {focused && <View style={tabStyles.activeDot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  icon: {
    fontSize: 22,
    opacity: 0.45,
  },
  iconActive: {
    opacity: 1,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
    marginTop: 3,
  },
});

export default function MainLayout() {
  const { isLoggedIn, isInitialized } = useAuth();
  const insets = useSafeAreaInsets();

  // Ensure tab bar height adapts to device bottom safe area (3-button nav, gesture bar, etc.)
  const tabBarBottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + tabBarBottomPadding;

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
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: tabBarBottomPadding,
          paddingTop: 10,
          height: tabBarHeight,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          ...Shadows.header,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rencana"
        options={{
          title: 'Rencana',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📋" label="Rencana" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📄" label="History" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar — accessed via router.push() */}
      <Tabs.Screen
        name="laporan/buat"
        options={{
          href: null, // Hides from tab bar
          tabBarStyle: { display: 'none' }, // Hide tab bar entirely on form screen
        }}
      />
    </Tabs>
  );
}
