import { Pressable, Text, View } from 'react-native';
import { categoryLabel, useCategories, useLang } from '@/lib/selectors';
import { CategoryIcon } from './ui';
import { colors, spacing } from './theme';

export function CategoryGrid({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const categories = useCategories();
  const lang = useLang();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {categories.map((c) => {
        const selected = value === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            style={{
              width: '23%',
              alignItems: 'center',
              gap: 4,
              paddingVertical: spacing.sm,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selected ? c.color : 'transparent',
              backgroundColor: selected ? c.color + '14' : colors.card,
            }}
          >
            <CategoryIcon icon={c.icon} color={c.color} size={36} />
            <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text }}>
              {categoryLabel(c, lang)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
