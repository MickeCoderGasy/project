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
  KeyboardAvoidingView,
  ScrollView,
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
    androidClientId: '1033668392601-01r2sc132d5oq29ht2h53cb2cf6j20qu.apps.googleusercontent.com', // Replace with your web client ID
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
            ? ['#FAFBFF', '#F0F4FF', '#E6EFFF']
            : ['#0A0E1A', '#1A1F2E', '#2A2F3E']
        }
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
        {/* Header */}
        <View style={styles.header}>
          <BlurView
            intensity={effectiveTheme === 'light' ? 90 : 35}
            tint={effectiveTheme}
            style={[styles.logoContainer, { borderColor: colors.border }]}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              style={styles.logoGradient}
            >
              <TrendingUp size={28} color="#FFFFFF" />
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
              intensity={effectiveTheme === 'light' ? 70 : 25}
              tint={effectiveTheme}
              style={[styles.featureCard, { borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}25` }]}>
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
            intensity={effectiveTheme === 'light' ? 90 : 35}
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
              style={[styles.googleButton, { opacity: loading ? 0.8 : 1 }]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#4285F4', '#34A853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.googleGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Mail size={18} color="#FFFFFF" />
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
              style={[styles.bypassButton, { backgroundColor: colors.surfaceOverlay, borderColor: colors.border }]}
              onPress={handleBypassLogin}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.text} />
              <Text style={[styles.bypassButtonText, { color: colors.text }]}>
                Skip Login (Dev)
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
          </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
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
    paddingTop: 50,
    paddingBottom: 50,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 24,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
       // elevation: 15, manala an'ilay hafa2 anaty Card
      },
    }),
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        //elevation: 10, manala an'ilay hafa2 anaty Card
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  authContainer: {
    paddingBottom: 20,
  },
  authCard: {
    padding: 32,
    borderRadius: 28,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
      },
      android: {
       // elevation: 20, manala an'ilay hafa2 anaty Card
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    }),
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  authSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  googleButton: {
    borderRadius: 16,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
    //    elevation: 10, manala an'ilay hafa2 anaty Card
      },
    }),
  },
  googleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  emailContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  emailButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emailButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bypassButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});