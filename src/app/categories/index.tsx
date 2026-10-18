import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, CategoryIcon, ListRow, styles } from '@/components/ui';
import { spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { categoryLabel, useCategories } from '@/lib/selectors';

export default function Categories() {
  const { t, lang } = useT();
  const categories = useCategories();
  return (
    <FlatList
      data={categories}
      keyExtractor={(c) => c.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <ListRow
          title={categoryLabel(item, lang)}
          left={<CategoryIcon icon={item.icon} color={item.color} size={36} />}
          onPress={() => router.push({ pathname: '/categories/[id]', params: { id: item.id } })}
        />
      )}
      ListFooterComponent={
        <View style={{ padding: spacing.lg }}>
          <Button title={t('categories.new')} icon="add" onPress={() => router.push({ pathname: '/categories/[id]', params: { id: 'new' } })} />
        </View>
      }
    />
  );
}
