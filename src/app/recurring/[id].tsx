import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { CategoryGrid } from '@/components/CategoryGrid';
import { DateField } from '@/components/DateField';
import { Button, Chip, Field, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { today } from '@/lib/dates';
import { parseAmount } from '@/lib/format';
import { materializeRecurring } from '@/lib/recurring';
import { useAppStore } from '@/lib/store';
import type { Frequency } from '@/lib/types';

export default function RecurringEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const existing = useAppStore((s) => (id && id !== 'new' ? s.rows.recurring_expenses[id] : undefined));
  const upsert = useAppStore((s) => s.upsert);
  const remove = useAppStore((s) => s.remove);

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'monthly');
  const [nextDate, setNextDate] = useState(existing?.next_date ?? today());
  const [active, setActive] = useState(existing?.active ?? true);

  const parsed = parseAmount(amount);
  const valid = !!parsed && parsed > 0 && !!categoryId;

  const save = () => {
    if (!valid) return;
    upsert('recurring_expenses', { id: existing?.id, amount: parsed!, category_id: categoryId, note: note.trim() || null, frequency, next_date: nextDate, active });
    materializeRecurring();
    router.back();
  };

  const del = () =>
    Alert.alert(t('common.confirmDelete'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          remove('recurring_expenses', existing!.id);
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? t('recurring.edit') : t('recurring.new') }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Field label={t('expense.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus={!existing} />
        <Field label={t('expense.note')} value={note} onChangeText={setNote} placeholder="Netflix, إيجار…" />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>{t('expense.category')}</Text>
          <CategoryGrid value={categoryId} onChange={setCategoryId} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>{t('recurring.frequency')}</Text>
          <View style={styles.row}>
            <Chip label={t('recurring.monthly')} selected={frequency === 'monthly'} onPress={() => setFrequency('monthly')} />
            <Chip label={t('recurring.weekly')} selected={frequency === 'weekly'} onPress={() => setFrequency('weekly')} />
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>{t('recurring.nextDate')}</Text>
          <DateField value={nextDate} onChange={setNextDate} allowFuture />
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.body}>{t('recurring.active')}</Text>
          <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.primary }} />
        </View>
        <Button title={t('common.save')} onPress={save} disabled={!valid} />
        {existing && <Button title={t('common.delete')} variant="danger" onPress={del} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
