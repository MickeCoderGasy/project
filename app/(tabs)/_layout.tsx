import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import TabBarCustom from '@/components/TabBarCustom';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { colors, effectiveTheme } = useTheme();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth');
    }
  }, [session, loading]);

  if (loading) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBarCustom {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="analyse"
        options={{
          title: 'Analysis',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}