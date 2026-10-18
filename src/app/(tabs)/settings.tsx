import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { OptionPicker, type Option } from '@/components/OptionPicker';
import { ListRow, SectionTitle, styles } from '@/components/ui';
import { spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { deleteAccount } from '@/lib/auth';
import { exportExpensesCsv } from '@/lib/exportData';
import { CURRENCIES, formatMoney } from '@/lib/format';
import { useProfile } from '@/lib/selectors';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';
import type { Lang } from '@/lib/types';

type PickerKind = 'currency' | 'language' | 'summaryDay' | 'hour' | null;

export default function Settings() {
  const { t, lang, dict } = useT();
  const profile = useProfile();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  const pickers: Record<Exclude<PickerKind, null>, { title: string; options: Option<string | number>[]; value: string | number; apply: (v: string | number) => void }> = {
    currency: {
      title: t('settings.currency'),
      options: CURRENCIES.map((c) => ({ value: c, label: `${t(`currencies.${c}`)} (${c})` })),
      value: profile.currency,
      apply: (v) => updateProfile({ currency: String(v) }),
    },
    language: {
      title: t('settings.language'),
      options: [
        { value: 'ar', label: 'العربية' },
        { value: 'en', label: 'English' },
      ],
      value: profile.language,
      apply: (v) => {
        if (v === profile.language) return;
        Alert.alert(t('settings.language'), t('settings.restartNote'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.yes'), onPress: () => updateProfile({ language: v as Lang }) },
        ]);
      },
    },
    summaryDay: {
      title: t('settings.summaryDay'),
      options: dict.weekdays.map((label, value) => ({ value, label })),
      value: profile.weekly_summary_day,
      apply: (v) => updateProfile({ weekly_summary_day: Number(v) }),
    },
    hour: {
      title: t('settings.notificationHour'),
      options: Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` })),
      value: profile.notification_hour,
      apply: (v) => updateProfile({ notification_hour: Number(v) }),
    },
  };
  const active = picker ? pickers[picker] : null;

  const confirmDelete = () =>
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
          } catch (e) {
            Alert.alert(t('common.error'), e instanceof Error ? e.message : '');
          }
        },
      },
    ]);

  const row = (children: React.ReactNode[]) => (
    <View style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: spacing.lg }}>
      {children.map((c, i) => (
        <View key={i}>
          {i > 0 && <View style={styles.separator} />}
          {c}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}>
      <SectionTitle>{t('settings.account')}</SectionTitle>
      {row([
        <ListRow key="s" title={t('settings.salary')} value={profile.monthly_salary != null ? formatMoney(profile.monthly_salary, profile.currency, lang) : t('settings.notSet')} onPress={() => router.push('/salary')} />,
        <ListRow key="d" title={t('settings.salaryDay')} value={profile.salary_day ? String(profile.salary_day) : t('settings.notSet')} onPress={() => router.push('/salary')} />,
        <ListRow key="c" title={t('settings.currency')} value={t(`currencies.${profile.currency}`)} onPress={() => setPicker('currency')} />,
        <ListRow key="l" title={t('settings.language')} value={lang === 'ar' ? 'العربية' : 'English'} onPress={() => setPicker('language')} />,
      ])}

      <SectionTitle>{t('settings.notifications')}</SectionTitle>
      {row([
        <ListRow key="w" title={t('settings.summaryDay')} value={dict.weekdays[profile.weekly_summary_day]} onPress={() => setPicker('summaryDay')} />,
        <ListRow key="h" title={t('settings.notificationHour')} value={`${String(profile.notification_hour).padStart(2, '0')}:00`} onPress={() => setPicker('hour')} />,
      ])}

      <SectionTitle>{t('appName')}</SectionTitle>
      {row([
        <ListRow key="cat" title={t('settings.categories')} onPress={() => router.push('/categories')} />,
        <ListRow key="rec" title={t('settings.recurring')} onPress={() => router.push('/recurring')} />,
        <ListRow key="sec" title={t('settings.security')} onPress={() => router.push('/security')} />,
        <ListRow key="exp" title={t('settings.export')} onPress={() => exportExpensesCsv(lang).catch((e) => Alert.alert(t('common.error'), String(e)))} />,
        <ListRow
          key="sync"
          title={t('settings.syncNow')}
          subtitle={lastSyncAt ? `${t('settings.lastSync')}: ${new Date(lastSyncAt).toLocaleString()}` : undefined}
          onPress={async () => {
            setBusy(true);
            await syncNow();
            setBusy(false);
          }}
          value={busy ? t('common.syncing') : undefined}
          chevron={false}
        />,
      ])}

      <SectionTitle> </SectionTitle>
      {row([
        <ListRow key="out" title={t('settings.signOut')} onPress={async () => {
            // Push pending offline changes before the local copy is cleared.
            await syncNow();
            await supabase.auth.signOut();
          }}
          chevron={false}
        />,
        <ListRow key="del" title={t('settings.deleteAccount')} danger onPress={confirmDelete} chevron={false} />,
      ])}

      <Text style={[styles.muted, { textAlign: 'center', marginTop: spacing.xl }]}>{t('appName')} v1.0.0</Text>

      {active && <OptionPicker visible title={active.title} options={active.options} value={active.value} onSelect={active.apply} onClose={() => setPicker(null)} />}
    </ScrollView>
  );
}
