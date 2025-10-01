import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, TrendingUp, MessageCircle, User, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TabIcons = {
  index: Home,
  analyse: TrendingUp,
  chat: MessageCircle,
  profile: User,
};

const TabLabels = {
  index: 'Dashboard',
  analyse: 'Analysis',
  chat: 'AI Chat',
  profile: 'Profile',
};

export default function TabBarCustom({ state, descriptors, navigation }: TabBarProps) {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView
        intensity={effectiveTheme === 'light' ? 90 : 40}
        tint={effectiveTheme}
        style={[styles.tabBar, { borderColor: colors.border }]}
      >
        <LinearGradient
          colors={
            effectiveTheme === 'light'
              ? ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)']
              : ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)']
          }
          style={styles.tabBarGradient}
        >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const IconComponent = TabIcons[route.name as keyof typeof TabIcons];
            const label = TabLabels[route.name as keyof typeof TabLabels] || route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  {isFocused && (
                    <BlurView
                      intensity={30}
                      tint={effectiveTheme}
                      style={[styles.activeBackground, { backgroundColor: `${colors.primary}20` }]}
                    />
                  )}
                  <View style={[styles.iconContainer, isFocused && { transform: [{ scale: 1.1 }] }]}>
                    <IconComponent
                      size={22}
                      color={isFocused ? colors.primary : colors.textMuted}
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? colors.primary : colors.textMuted,
                        fontWeight: isFocused ? '600' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </BlurView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fabContainer}>
        <BlurView
          intensity={40}
          tint={effectiveTheme}
          style={[styles.fab, { borderColor: colors.border }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.fabGradient}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabBar: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  tabBarGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
    borderRadius: 20,
    minHeight: 56,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 4,
    transition: 'transform 0.2s ease',
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  fabContainer: {
    position: 'absolute',
    top: -25,
    right: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});