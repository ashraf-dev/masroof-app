import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Field, styles } from '@/components/ui';
import { spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { CURRENCIES, parseAmount } from '@/lib/format';
import { payCycle, today } from '@/lib/dates';
import { useAppStore } from '@/lib/store';

export default function Onboarding() {
  const { t, lang } = useT();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const upsert = useAppStore((s) => s.upsert);
  const [salary, setSalary] = useState('');
  const [day, setDay] = useState('1');
  const [currency, setCurrency] = useState('EGP');

  const finish = (skip: boolean) => {
    const amount = skip ? null : parseAmount(salary);
    const salaryDay = skip ? null : Math.min(31, Math.max(1, Number(parseAmount(day) ?? 1)));
    updateProfile({ monthly_salary: amount, salary_day: salaryDay, currency, language: lang, onboarded: true });
    if (amount) {
      upsert('salary_entries', { month: payCycle(today(), salaryDay).month, amount });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>{t('onboarding.title')}</Text>
          <Field label={t('onboarding.salary')} value={salary} onChangeText={setSalary} keyboardType="decimal-pad" placeholder="10,000" autoFocus />
          <Field label={t('onboarding.salaryDay')} value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
          <Text style={styles.label}>{t('onboarding.currency')}</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {CURRENCIES.map((c) => (
              <Chip key={c} label={t(`currencies.${c}`)} selected={currency === c} onPress={() => setCurrency(c)} />
            ))}
          </View>
          <Button title={t('onboarding.finish')} onPress={() => finish(false)} disabled={!parseAmount(salary)} />
          <Button title={t('onboarding.skip')} variant="ghost" onPress={() => finish(true)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
