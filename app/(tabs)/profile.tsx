import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Moon, Globe, Smartphone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import NavigationHeader from '@/components/NavigationHeader';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, effectiveTheme, theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const userInfo = {
    name: user?.user_metadata?.full_name || 'Trader',
    email: user?.email || 'trader@email.com',
    accountType: 'Premium',
    memberSince: 'Jan 2024'
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { 
          icon: User, 
          label: 'Personal Information', 
          onPress: () => Alert.alert('Feature', 'Personal Information settings') 
        },
        { 
          icon: CreditCard, 
          label: 'Subscription & Billing', 
          onPress: () => Alert.alert('Feature', 'Subscription management') 
        },
        { 
          icon: Shield, 
          label: 'Security Settings', 
          onPress: () => Alert.alert('Feature', 'Security settings') 
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Bell, 
          label: 'Notifications', 
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled
        },
        { 
          icon: Moon, 
          label: 'Dark Mode', 
          hasThemeSelector: true,
        },
        { 
          icon: Smartphone, 
          label: 'Biometric Login', 
          hasSwitch: true,
          switchValue: biometricsEnabled,
          onSwitchChange: setBiometricsEnabled
        },
        { 
          icon: Globe, 
          label: 'Language & Region', 
          onPress: () => Alert.alert('Feature', 'Language settings') 
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Help & Support', 
          onPress: () => Alert.alert('Help', 'Contact support for assistance') 
        },
        { 
          icon: Settings, 
          label: 'App Settings', 
          onPress: () => Alert.alert('Feature', 'App settings') 
        },
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  const handleThemeChange = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const renderMenuItem = (item: any, index: number) => (
    <BlurView
      key={index} 
      intensity={effectiveTheme === 'light' ? 60 : 15}
      tint={effectiveTheme}
      style={[styles.menuItem, { borderColor: colors.border }]}
    >
      <TouchableOpacity 
        style={styles.menuItemContent}
        onPress={item.hasThemeSelector ? handleThemeChange : item.onPress}
        disabled={item.hasSwitch && !item.hasThemeSelector}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}30` }]}>
            <item.icon size={20} color={colors.primary} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        </View>
        <View style={styles.menuItemRight}>
          {item.hasThemeSelector ? (
            <View style={styles.themeSelector}>
              <Text style={[styles.themeText, { color: colors.textSecondary }]}>
                {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          ) : item.hasSwitch ? (
            <Switch
              value={item.switchValue}
              onValueChange={item.onSwitchChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={item.switchValue ? '#FFFFFF' : colors.textMuted}
            />
          ) : (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    </BlurView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: 100 }]}>
      <LinearGradient
        colors={
          effectiveTheme === 'light'
            ? ['#FAFBFF', '#F0F4FF', '#E6EFFF']
            : ['#0A0E1A', '#1A1F2E', '#2A2F3E']
        }
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Enhanced Navigation Header */}
        <NavigationHeader
          title="Profile"
          subtitle="Manage your account"
          showSearch={false}
          showNotifications={false}
          showMenu={true}
          onMenu={() => Alert.alert('Menu', 'Profile menu options')}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
          <View style={styles.userCardContainer}>
            <BlurView intensity={effectiveTheme === 'light' ? 80 : 35} tint={effectiveTheme} style={[styles.userCard, { borderColor: colors.border }]}>
            <LinearGradient
              colors={effectiveTheme === 'light' ? 
                ['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)'] :
                ['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.1)']
              }
              style={styles.userCardGradient}
            >
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[colors.primaryLight, colors.primary]}
                  style={styles.avatar}
                >
                  <User size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{userInfo.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userInfo.email}</Text>
                <View style={styles.accountBadge}>
                  <BlurView intensity={30} tint={effectiveTheme} style={[styles.accountTypeContainer, { borderColor: `${colors.primary}40` }]}>
                    <Text style={[styles.accountType, { color: colors.primary }]}>{userInfo.accountType} Member</Text>
                  </BlurView>
                  <Text style={[styles.memberSince, { color: colors.textMuted }]}>Since {userInfo.memberSince}</Text>
                </View>
              </View>
            </LinearGradient>
            </BlurView>
          </View>

          {/* Trading Stats */}
          <View style={styles.statsContainerWrapper}>
            <BlurView intensity={effectiveTheme === 'light' ? 70 : 30} tint={effectiveTheme} style={[styles.statsContainer, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>$125.4K</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Portfolio Value</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>+15.7%</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Return</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>247</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Trades</Text>
            </View>
            </BlurView>
          </View>

        {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
              <BlurView intensity={effectiveTheme === 'light' ? 70 : 25} tint={effectiveTheme} style={[styles.menuCard, { borderColor: colors.border }]}>
                {section.items.map(renderMenuItem)}
              </BlurView>
            </View>
          ))}

        {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <BlurView intensity={effectiveTheme === 'light' ? 70 : 30} tint={effectiveTheme} style={[styles.logoutButton, { borderColor: `${colors.error}30` }]}>
            <TouchableOpacity style={styles.logoutButtonContent} onPress={handleLogout}>
              <LinearGradient
                colors={[`${colors.error}20`, `${colors.error}05`]}
                style={styles.logoutGradient}
              >
                <LogOut size={18} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
            </BlurView>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>TradApp v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  userCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  userCard: {
    borderRadius: 28,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 15,
  },
  userCardGradient: {
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginHorizontal: 20,
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accountType: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberSince: {
    fontSize: 12,
  },
  statsContainerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 24,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 20,
  },
  menuSectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuCard: {
    borderRadius: 24,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    marginLeft: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutButtonContent: {
    width: '100%',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
  },
});