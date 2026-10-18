import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { supabase } from '@/lib/supabase';

/**
 * Target of masroofy://auth-callback — opened by the email confirmation link
 * (and by OAuth on some Android browsers). Exchanges the PKCE code for a session.
 */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { t } = useT();
  const [state, setState] = useState<'working' | 'done' | 'confirmed'>('working');

  useEffect(() => {
    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return setState('done');
      }
      // The code may already have been used (OAuth) or the link was opened on
      // another device. Supabase confirms the email before redirecting, so the
      // user can simply sign in.
      const { data } = await supabase.auth.getSession();
      setState(data.session ? 'done' : 'confirmed');
    })();
  }, [code]);

  if (state === 'done') return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg }}>
      {state === 'working' ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={[styles.body, { textAlign: 'center' }]}>{t('auth.emailConfirmed')}</Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Button title={t('auth.signIn')} onPress={() => router.replace('/sign-in')} />
          </View>
        </>
      )}
    </View>
  );
}
