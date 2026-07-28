// @ts-ignore: side-effect polyfill import may lack types in this environment
import 'react-native-url-polyfill/auto';
// @ts-ignore: expo-secure-store types might not be available in the build environment
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// In some environments (e.g. RN TypeScript builds) `process` may not be defined
// or have type declarations. Declare it here to avoid TS errors when accessing env vars.
declare const process: any;

// SecureStore-backed adapter so Supabase can persist the auth session
// on-device (Keychain on iOS, Keystore on Android).
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process?.env?.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to your .env file (see .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // omit deprecated processLock
  },
});
