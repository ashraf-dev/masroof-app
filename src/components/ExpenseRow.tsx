import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { categoryLabel, useCategoryMap, useCurrency, useLang } from '@/lib/selectors';
import { formatDate, formatMoney } from '@/lib/format';
import type { Expense } from '@/lib/types';
import { CategoryIcon, styles } from './ui';
import { colors, spacing } from './theme';

export function ExpenseRow({ expense }: { expense: Expense }) {
  const categories = useCategoryMap();
  const lang = useLang();
  const currency = useCurrency();
  const cat = expense.category_id ? categories[expense.category_id] : undefined;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })}
      style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.bg }]}
    >
      <CategoryIcon icon={cat?.icon ?? 'help'} color={cat?.color ?? colors.muted} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={[styles.row, { gap: spacing.xs }]}>
          <Text style={styles.rowTitle}>{categoryLabel(cat, lang)}</Text>
          {expense.recurring_id && <Ionicons name="repeat" size={14} color={colors.muted} />}
        </View>
        <Text style={styles.muted} numberOfLines={1}>
          {[formatDate(expense.spent_at, lang), expense.note].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.body, { fontWeight: '600' }]}>{formatMoney(expense.amount, currency, lang)}</Text>
    </Pressable>
  );
}
