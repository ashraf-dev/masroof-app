import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, CategoryIcon, Empty, ListRow, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { formatDate, formatMoney } from '@/lib/format';
import { categoryLabel, useCategoryMap, useCurrency, useRecurring } from '@/lib/selectors';

export default function RecurringList() {
  const { t, lang } = useT();
  const items = useRecurring();
  const categories = useCategoryMap();
  const currency = useCurrency();
  return (
    <FlatList
      data={items}
      keyExtractor={(r) => r.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Empty text={t('recurring.empty')} />}
      renderItem={({ item }) => {
        const cat = item.category_id ? categories[item.category_id] : undefined;
        return (
          <ListRow
            left={<CategoryIcon icon={cat?.icon ?? 'repeat'} color={item.active ? (cat?.color ?? colors.muted) : colors.border} size={36} />}
            title={item.note || categoryLabel(cat, lang)}
            subtitle={`${item.frequency === 'weekly' ? t('recurring.everyWeek') : t('recurring.everyMonth')} · ${t('recurring.nextDate')} ${formatDate(item.next_date, lang)}`}
            value={formatMoney(item.amount, currency, lang)}
            onPress={() => router.push({ pathname: '/recurring/[id]', params: { id: item.id } })}
          />
        );
      }}
      ListFooterComponent={
        <View style={{ padding: spacing.lg }}>
          <Button title={t('recurring.new')} icon="add" onPress={() => router.push({ pathname: '/recurring/[id]', params: { id: 'new' } })} />
        </View>
      }
    />
  );
}
