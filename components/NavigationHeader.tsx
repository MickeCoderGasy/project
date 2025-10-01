import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MoreHorizontal, Search, Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onMenu?: () => void;
  rightComponent?: React.ReactNode;
}

export default function NavigationHeader({
  title,
  subtitle,
  showBack = false,
  showSearch = false,
  showNotifications = false,
  showMenu = false,
  onBack,
  onSearch,
  onNotifications,
  onMenu,
  rightComponent,
}: NavigationHeaderProps) {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView
        intensity={effectiveTheme === 'light' ? 90 : 40}
        tint={effectiveTheme}
        style={[styles.header, { borderColor: colors.border }]}
      >
        <LinearGradient
          colors={
            effectiveTheme === 'light'
              ? ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)']
              : ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)']
          }
          style={styles.headerGradient}
        >
          {/* Left Section */}
          <View style={styles.leftSection}>
            {showBack && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.primary}20` }]}
                onPress={onBack}
              >
                <ArrowLeft size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {showSearch && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.primary}15` }]}
                onPress={onSearch}
              >
                <Search size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            {showNotifications && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.warning}15` }]}
                onPress={onNotifications}
              >
                <Bell size={18} color={colors.warning} />
                <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
              </TouchableOpacity>
            )}
            {showMenu && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.textMuted}15` }]}
                onPress={onMenu}
              >
                <MoreHorizontal size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {rightComponent}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});