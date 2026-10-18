import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { ExpenseRow } from '@/components/ExpenseRow';
import { AddExpenseFab } from '@/components/Fab';
import { PeriodFilter, usePeriod } from '@/components/PeriodFilter';
import { Empty, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { useCurrency, useExpenses } from '@/lib/selectors';
import { inRange, sum } from '@/lib/stats';

export default function ExpensesScreen() {
  const { t, lang } = useT();
  const currency = useCurrency();
  const expenses = useExpenses();
  const state = usePeriod('month');
  const { period } = state;
  const items = useMemo(() => inRange(expenses, period.start, period.end, period.categoryId), [expenses, period]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={
          <View>
            <PeriodFilter state={state} />
            <View style={[styles.row, { justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
              <Text style={styles.muted}>{t('expenses.total')}</Text>
              <Text style={[styles.h2, { color: colors.primaryDark }]}>{formatMoney(sum(items), currency, lang)}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <ExpenseRow expense={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Empty text={t('expenses.empty')} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <AddExpenseFab />
    </View>
  );
}
