// getRedirectUri.js
const { makeRedirectUri } = require('expo-auth-session');

// Assurez-vous que le "scheme" correspond à celui de votre app.json
// Par défaut, c'est 'exp' pour les applications Expo Go.
// Si vous avez un "scheme" personnalisé dans votre app.json, utilisez-le ici.
const redirectUri = makeRedirectUri({
  scheme: 'exp', // La plupart du temps, c'est 'exp'
  // Le 'path' est important car Supabase l'attend dans la redirection
  path: 'auth/callback',
});

console.log('--- VOTRE URI DE REDIRECTION EXPO EST ---');
console.log(redirectUri);
console.log('-----------------------------------------');
