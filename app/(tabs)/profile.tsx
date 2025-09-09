import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut, ChevronRight, Moon, Globe, Smartphone } from 'lucide-react-native';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const userInfo = {
    name: 'John Trader',
    email: 'john.trader@email.com',
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
          hasSwitch: true,
          switchValue: darkMode,
          onSwitchChange: setDarkMode
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
          onPress: () => Alert.alert('Logged Out', 'You have been logged out successfully')
        }
      ]
    );
  };

  const renderMenuItem = (item: any, index: number) => (
    <BlurView
      key={index} 
      intensity={15}
      tint="light"
      style={styles.menuItem}
    >
      <TouchableOpacity 
        style={styles.menuItemContent}
        onPress={item.onPress}
        disabled={item.hasSwitch}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIcon}>
            <item.icon size={20} color="#60A5FA" />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
        </View>
        <View style={styles.menuItemRight}>
          {item.hasSwitch ? (
            <Switch
              value={item.switchValue}
              onValueChange={item.onSwitchChange}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#60A5FA' }}
              thumbColor={item.switchValue ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'}
            />
          ) : (
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
          )}
        </View>
      </TouchableOpacity>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
          <BlurView intensity={20} tint="dark" style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </BlurView>

        {/* User Info Card */}
          <BlurView intensity={30} tint="dark" style={styles.userCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.userCardGradient}
            >
              <View style={styles.avatar}>
                <LinearGradient
                  colors={['#60A5FA', '#3B82F6']}
                  style={styles.avatarGradient}
                >
                  <User size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Text style={styles.userEmail}>{userInfo.email}</Text>
                <View style={styles.accountBadge}>
                  <BlurView intensity={20} tint="light" style={styles.accountTypeContainer}>
                    <Text style={styles.accountType}>{userInfo.accountType} Member</Text>
                  </BlurView>
                  <Text style={styles.memberSince}>Since {userInfo.memberSince}</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Trading Stats */}
          <BlurView intensity={25} tint="dark" style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>$125,420</Text>
              <Text style={styles.statLabel}>Portfolio Value</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>+15.7%</Text>
              <Text style={styles.statLabel}>Total Return</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>247</Text>
              <Text style={styles.statLabel}>Total Trades</Text>
            </View>
          </BlurView>

        {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <BlurView intensity={20} tint="dark" style={styles.menuCard}>
                {section.items.map(renderMenuItem)}
              </BlurView>
            </View>
          ))}

        {/* Logout Button */}
          <BlurView intensity={25} tint="dark" style={styles.logoutButton}>
            <TouchableOpacity style={styles.logoutButtonContent} onPress={handleLogout}>
              <LinearGradient
                colors={['rgba(248, 113, 113, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                style={styles.logoutGradient}
              >
                <LogOut size={20} color="#F87171" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          <View style={styles.footer}>
            <Text style={styles.versionText}>AI Trading Assistant v1.0.0</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  userCardGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  accountType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuItemRight: {
    marginLeft: 12,
  },
  logoutButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonContent: {
    width: '100%',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});