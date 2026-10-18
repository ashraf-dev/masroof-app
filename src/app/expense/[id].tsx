import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryGrid } from '@/components/CategoryGrid';
import { DateField } from '@/components/DateField';
import { Button, Field, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { today } from '@/lib/dates';
import { parseAmount } from '@/lib/format';
import { useAppStore } from '@/lib/store';

/** Add / edit an expense. Designed so a new one takes: type amount → tap category → save. */
export default function ExpenseEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const existing = useAppStore((s) => (id && id !== 'new' ? s.rows.expenses[id] : undefined));
  const upsert = useAppStore((s) => s.upsert);
  const remove = useAppStore((s) => s.remove);
  const currency = useAppStore((s) => s.profile?.currency ?? 'EGP');

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.spent_at ?? today());

  const parsed = parseAmount(amount);
  const valid = !!parsed && parsed > 0 && !!categoryId;

  const save = () => {
    if (!parsed || parsed <= 0) return Alert.alert(t('expense.invalidAmount'));
    if (!categoryId) return Alert.alert(t('expense.pickCategory'));
    upsert('expenses', {
      id: existing?.id,
      amount: parsed,
      category_id: categoryId,
      note: note.trim() || null,
      spent_at: date,
      recurring_id: existing?.recurring_id ?? null,
    });
    router.back();
  };

  const del = () =>
    Alert.alert(t('common.confirmDelete'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          remove('expenses', existing!.id);
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? t('expense.edit') : t('expense.new') }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.muted}>{t('expense.amount')}</Text>
          <View style={[styles.row, { justifyContent: 'center' }]}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.border}
              autoFocus={!existing}
              style={{ fontSize: 44, fontWeight: '700', color: colors.text, minWidth: 80, textAlign: 'center' }}
            />
            <Text style={[styles.h2, { color: colors.muted }]}>{t(`currencies.${currency}`)}</Text>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>{t('expense.category')}</Text>
          <CategoryGrid value={categoryId} onChange={setCategoryId} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>{t('expense.date')}</Text>
          <DateField value={date} onChange={setDate} />
        </View>

        <Field label={`${t('expense.note')} (${t('common.optional')})`} value={note} onChangeText={setNote} placeholder={t('expense.notePlaceholder')} />

        <Button title={t('common.save')} onPress={save} disabled={!valid} />
        {existing && <Button title={t('common.delete')} variant="danger" onPress={del} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
