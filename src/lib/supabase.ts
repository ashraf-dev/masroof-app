import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { encryptedStorage } from './secureStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://vfpbvnvyekfroxdhtysl.supabase.co';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_TSdMb8vttFyQQtZbpqKhbA_YxWl7er-';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : encryptedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Only refresh tokens while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
