import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronRight, Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onHomePress?: () => void;
}

export default function BreadcrumbNavigation({
  items,
  showHome = true,
  onHomePress,
}: BreadcrumbNavigationProps) {
  const { colors, effectiveTheme } = useTheme();

  return (
    <View style={styles.container}>
      <BlurView
        intensity={effectiveTheme === 'light' ? 60 : 20}
        tint={effectiveTheme}
        style={[styles.breadcrumbContainer, { borderColor: colors.border }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {showHome && (
            <>
              <TouchableOpacity
                style={[styles.breadcrumbItem, styles.homeItem]}
                onPress={onHomePress}
              >
                <View style={[styles.homeIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Home size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
              {items.length > 0 && (
                <ChevronRight size={14} color={colors.textMuted} style={styles.separator} />
              )}
            </>
          )}

          {items.map((item, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.breadcrumbItem,
                  item.isActive && styles.activeBreadcrumb,
                ]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    {
                      color: item.isActive ? colors.primary : colors.textSecondary,
                      fontWeight: item.isActive ? '600' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
              {index < items.length - 1 && (
                <ChevronRight size={14} color={colors.textMuted} style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  breadcrumbContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  breadcrumbItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  homeItem: {
    paddingHorizontal: 6,
  },
  homeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBreadcrumb: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  breadcrumbText: {
    fontSize: 13,
    textAlign: 'center',
  },
  separator: {
    marginHorizontal: 6,
  },
});