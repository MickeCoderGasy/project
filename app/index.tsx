import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Redirection automatique quand l'animation se termine (fallback timer au cas où)
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 3500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Utilisez votre fichier Lottie local dans assets, par ex: assets/animations/welcome.json */}
      <LottieView
        ref={animationRef}
        source={require('./assets/animations/welcome.json')} // Chemin corrigé: l'animation est dans app/assets
        autoPlay
        loop={false}
        onAnimationFinish={() => router.replace('/auth')}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width,
    height,
  },
});


