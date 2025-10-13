declare namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_WEBHOOK_URL: string;
      EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL?: string; // Webhook pour l'interprétation du signal (optionnel)
      EXPO_PUBLIC_TEST_SIGNAL_ID?: string; // ID de signal pour tester le streaming (optionnel)
      // Vous pouvez aussi ajouter les autres si vous les utilisez ailleurs
      // EXPO_PUBLIC_GEMINI_API_KEY: string;
      // EXPO_PUBLIC_SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET: string;
    }
  }
  