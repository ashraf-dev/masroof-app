import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { LockScreen } from '@/components/LockScreen';
import { colors } from '@/components/theme';
import { applyDirection, useT } from '@/i18n';
import { scheduleReminders } from '@/lib/notifications';
import { materializeRecurring } from '@/lib/recurring';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { startSyncListeners, syncNow } from '@/lib/sync';

SplashScreen.preventAutoHideAsync().catch(() => {});

const RELOCK_AFTER_MS = 30_000;

export default function RootLayout() {
  const hydrated = useAppStore((s) => s.hydrated);
  const profile = useAppStore((s) => s.profile);
  const lockEnabled = useAppStore((s) => s.lockEnabled);
  const { t, lang } = useT();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [locked, setLocked] = useState(true);
  const backgroundedAt = useRef<number | null>(null);

  // Auth
  useEffect(() => {
    if (!hydrated) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      useAppStore.getState().setUser(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      useAppStore.getState().setUser(s?.user.id ?? null);
      if (s) syncNow().then(materializeRecurring);
    });
    return () => data.subscription.unsubscribe();
  }, [hydrated]);

  // Lock on cold start; re-lock after time in the background.
  useEffect(() => {
    if (hydrated && !lockEnabled) setLocked(false);
  }, [hydrated, lockEnabled]);

  // Sync & recurring on start/foreground
  useEffect(() => {
    if (!session) return;
    const stop = startSyncListeners();
    syncNow().then(materializeRecurring);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active') {
        if (useAppStore.getState().lockEnabled && backgroundedAt.current && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) setLocked(true);
        backgroundedAt.current = null;
        syncNow().then(materializeRecurring);
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [session]);

  // Layout direction follows the language.
  useEffect(() => {
    if (hydrated) applyDirection(lang);
  }, [hydrated, lang]);

  // Reminders follow the profile settings.
  const reminderKey = profile?.onboarded ? `${profile.language}|${profile.weekly_summary_day}|${profile.notification_hour}|${profile.salary_day}` : null;
  useEffect(() => {
    if (reminderKey && profile) scheduleReminders(profile).catch((e) => console.warn('reminders', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderKey]);

  // Notification taps deep-link into the app.
  useEffect(() => {
    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => sub.remove();
  }, []);

  const ready = hydrated && session !== undefined;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!session;
  const waitingForProfile = signedIn && !profile;
  const onboarded = !!profile?.onboarded;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {waitingForProfile ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <Stack screenOptions={{ headerTitleAlign: 'center', headerBackTitle: t('common.back'), contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && !onboarded}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && onboarded}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="expense/[id]" options={{ presentation: 'modal', title: '' }} />
            <Stack.Screen name="weekly-summary" options={{ title: t('summary.title') }} />
            <Stack.Screen name="salary" options={{ presentation: 'modal', title: t('salary.title') }} />
            <Stack.Screen name="categories/index" options={{ title: t('categories.title') }} />
            <Stack.Screen name="categories/[id]" options={{ presentation: 'modal', title: '' }} />
            <Stack.Screen name="recurring/index" options={{ title: t('recurring.title') }} />
            <Stack.Screen name="recurring/[id]" options={{ presentation: 'modal', title: '' }} />
            <Stack.Screen name="security" options={{ title: t('security.title') }} />
          </Stack.Protected>
        </Stack>
      )}
      {signedIn && lockEnabled && locked && <LockScreen onUnlock={() => setLocked(false)} />}
    </SafeAreaProvider>
  );
}

