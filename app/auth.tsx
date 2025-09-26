import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, TrendingUp, Shield, Zap, Users } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { colors, effectiveTheme } = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'AI-Powered Analysis',
      description: 'Get intelligent trading insights powered by advanced AI',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Stay ahead with instant market data and notifications',
    },
    {
      icon: Users,
      title: 'Expert Community',
      description: 'Connect with traders and learn from the best',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          effectiveTheme === 'light'
            ? ['#F8FAFC', '#E2E8F0', '#CBD5E1']
            : ['#0F172A', '#1E293B', '#334155']
        }
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <BlurView
            intensity={effectiveTheme === 'light' ? 80 : 30}
            tint={effectiveTheme}
            style={[styles.logoContainer, { borderColor: colors.border }]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.logoGradient}
            >
              <TrendingUp size={32} color="#FFFFFF" />
            </LinearGradient>
          </BlurView>
          
          <Text style={[styles.title, { color: colors.text }]}>TradApp</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your AI-Powered Trading Assistant
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <BlurView
              key={index}
              intensity={effectiveTheme === 'light' ? 60 : 20}
              tint={effectiveTheme}
              style={[styles.featureCard, { borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}20` }]}>
                <feature.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textTertiary }]}>
                  {feature.description}
                </Text>
              </View>
            </BlurView>
          ))}
        </View>

        {/* Sign In Button */}
        <View style={styles.authContainer}>
          <BlurView
            intensity={effectiveTheme === 'light' ? 80 : 30}
            tint={effectiveTheme}
            style={[styles.authCard, { borderColor: colors.border }]}
          >
            <Text style={[styles.authTitle, { color: colors.text }]}>
              Get Started
            </Text>
            <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
              Sign in to access your personalized trading dashboard
            </Text>
            
            <TouchableOpacity
              style={[styles.googleButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.googleGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Mail size={20} color="#FFFFFF" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  authContainer: {
    paddingBottom: 20,
  },
  authCard: {
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  googleButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  googleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});