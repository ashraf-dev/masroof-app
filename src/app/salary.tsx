import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Button, Field, styles } from '@/components/ui';
import { spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { payCycle, today } from '@/lib/dates';
import { parseAmount } from '@/lib/format';
import { useProfile, useSalaryEntries } from '@/lib/selectors';
import { useAppStore } from '@/lib/store';

/** "Got paid? Enter the amount" — opened from the payday notification or settings. */
export default function SalaryScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const { t } = useT();
  const profile = useProfile();
  const entries = useSalaryEntries();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const upsert = useAppStore((s) => s.upsert);

  const month = params.month ?? payCycle(today(), profile?.salary_day ?? null).month;
  const entry = entries.find((e) => e.month === month);
  const [amount, setAmount] = useState(String(entry?.amount ?? profile?.monthly_salary ?? ''));
  const [day, setDay] = useState(profile?.salary_day ? String(profile.salary_day) : '');

  const parsed = parseAmount(amount);

  const save = () => {
    if (parsed == null) return;
    const salaryDay = parseAmount(day);
    updateProfile({
      monthly_salary: parsed,
      salary_day: salaryDay ? Math.min(31, Math.max(1, Math.round(salaryDay))) : null,
    });
    upsert('salary_entries', { id: entry?.id, month, amount: parsed });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.h2}>{t('salary.prompt')}</Text>
        <Field label={t('salary.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
        <Field label={t('settings.salaryDay')} value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
        <Button title={t('common.save')} onPress={save} disabled={parsed == null} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
