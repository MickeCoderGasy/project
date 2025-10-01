import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceSecondary: '#F1F5F9',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.5)',
  surfaceOverlay: 'rgba(248, 250, 252, 0.95)',
  cardBackground: '#FFFFFF',
  inputBackground: '#F8FAFC',
  tabBarBackground: 'rgba(248, 250, 252, 0.95)',
  headerBackground: 'rgba(255, 255, 255, 0.95)',
};

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: '#334155',
  borderLight: '#475569',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.7)',
  surfaceOverlay: 'rgba(30, 41, 59, 0.95)',
  cardBackground: '#1E293B',
  inputBackground: '#334155',
  tabBarBackground: Platform.OS === 'android' ? '#1E293B' : 'rgba(30, 41, 59, 0.95)',
  headerBackground: Platform.OS === 'android' ? '#0F172A' : 'rgba(15, 23, 42, 0.95)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  const effectiveTheme = theme === 'system' ? (systemColorScheme || 'dark') : theme;
  const colors = effectiveTheme === 'light' ? lightColors : darkColors;

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}