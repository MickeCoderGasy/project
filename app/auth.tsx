import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, TrendingUp, Shield, Zap, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

const { width, height } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [loading, setLoading] = useState(false); // Chargement pour Google
  const [emailLoading, setEmailLoading] = useState(false); // Chargement pour email/mot de passe
  const [email, setEmail] = useState(''); // État pour l'email saisi
  const [password, setPassword] = useState(''); // État pour le mot de passe saisi
  const { colors, effectiveTheme } = useTheme();
  const router = useRouter();

  
  
  const debugRedirectUris = {
    makeRedirectUriDefault: makeRedirectUri(),
    makeRedirectUriWithScheme: makeRedirectUri({ scheme: 'myapp', path: 'auth' }),
    custom: 'myapp://auth',
  };
  


  // --- Configuration Google Auth for Expo ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    // For Expo Go development - you need to create a WEB client ID in Google Console
    iosClientId: '1033668392601-01r2sc132d5oq29ht2h53cb2cf6j20qu.apps.googleusercontent.com', // Replace with your web client ID
    // For native iOS builds (when you build standalone app)
    scopes: ['openid', 'profile', 'email'],
    // Try different redirect URI strategies
    redirectUri: debugRedirectUris.makeRedirectUriDefault,
  });

 

  // Handle Google OAuth response with detailed logging
  React.useEffect(() => {
    
    if (response?.type === 'success') {
      const { authentication } = response;
      
      // Use idToken instead of accessToken for Supabase
      if (authentication?.idToken) {
        handleSupabaseSignInWithGoogle(authentication.idToken);
      } else if (authentication?.accessToken) {
        handleSupabaseSignInWithGoogle(authentication.accessToken);
      } else {
        Alert.alert('Authentication Error', 'No authentication token received');
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Authentication Error', response.error?.message || 'Failed to authenticate with Google');
      setLoading(false);
    } else if (response?.type === 'cancel') {
      setLoading(false);
    } else if (response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  // Function to sign in with Supabase using Google token
  const handleSupabaseSignInWithGoogle = async (token: string) => {
    
    try {
      console.log('Attempting Supabase sign in with token...');
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: token,
      });

      console.log('=== SUPABASE RESPONSE ===');
      if (error) {
        // error.details n'est pas toujours typé; on affiche l'objet complet via JSON.stringify ci-dessus
        Alert.alert('Sign In Error', `Supabase Error: ${error.message}`);
      } else {
        Alert.alert('Success', 'Authentication successful! Redirecting...');
        router.replace('/(tabs)/chat');
      }
    } catch (err: any) {
      Alert.alert('Unexpected Error', err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In button press
  const handleGoogleSignIn = async () => {
    
    if (!request) {
      Alert.alert('Error', 'OAuth request not ready. Please try again.');
      return;
    }

    setLoading(true);
    try {
      
      const result = await promptAsync();
    } catch (error: any) {
      Alert.alert('Launch Error', `Failed to launch Google authentication: ${error.message}`);
      setLoading(false);
    }
  };

  // Bypass login for development
  const handleBypassLogin = () => {
    router.replace('/(tabs)/chat');
  };

  // --- Connexion par email/mot de passe ---
  // Connexion classique avec Supabase (email/password)
  const handleEmailSignIn = async () => {
    // Vérifications simples côté client
    if (!email || !password) {
      Alert.alert('Champs requis', "Merci de saisir l'email et le mot de passe.");
      return;
    }
    setEmailLoading(true);
    try {
      // Appel Supabase pour se connecter avec email/mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert('Connexion échouée', error.message);
        return;
      }
      // Connexion réussie → navigation vers l'app principale
      router.replace('/(tabs)/chat');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Inscription avec email/mot de passe
  const handleEmailSignUp = async () => {
    // Vérifications simples côté client
    if (!email || !password) {
      Alert.alert('Champs requis', "Merci de saisir l'email et le mot de passe.");
      return;
    }
    setEmailLoading(true);
    try {
      // Appel Supabase pour créer un compte
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: undefined, // Laisser vide pour mobile; ajouter une URL si nécessaire
        },
      });
      if (error) {
        Alert.alert("Inscription échouée", error.message);
        return;
      }
      // Selon la config Supabase, un email de confirmation peut être requis
      Alert.alert('Compte créé', "Vérifie ta boîte mail si la confirmation est requise.");
      // On tente de naviguer si la session est déjà active
      if (data.session) {
        router.replace('/(tabs)/chat');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue.');
    } finally {
      setEmailLoading(false);
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
            
            {/* Séparateur visuel */}
            <View style={styles.separatorRow}>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.separatorText, { color: colors.textMuted }]}>ou</Text>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Connexion par Email / Mot de passe */}
            <View style={styles.emailContainer}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              />
              <TextInput
                placeholder="Mot de passe"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              />

              <View style={styles.emailButtonsRow}>
                <TouchableOpacity
                  onPress={handleEmailSignIn}
                  style={[styles.emailButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  {emailLoading ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <Text style={[styles.emailButtonText, { color: colors.text }]}>Se connecter</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEmailSignUp}
                  style={[styles.emailButton, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  {emailLoading ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <Text style={[styles.emailButtonText, { color: colors.text }]}>Créer un compte</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>

            {/* Development bypass button */}
            <TouchableOpacity
              style={[styles.bypassButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={handleBypassLogin}
            >
              <Ionicons name="arrow-forward" size={20} color={colors.text} />
              <Text style={[styles.bypassButtonText, { color: colors.text }]}>
                Skip Login (Dev)
              </Text>
            </TouchableOpacity>
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
  // Styles pour la section Email / Mot de passe
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  separatorText: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  emailContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  emailButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emailButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bypassButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});