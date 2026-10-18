import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, CategoryIcon, Field, styles, type IconName } from '@/components/ui';
import { CATEGORY_COLORS, CATEGORY_ICONS, colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { categoryLabel, useCategories } from '@/lib/selectors';
import { useAppStore } from '@/lib/store';

export default function CategoryEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const existing = useAppStore((s) => (id && id !== 'new' ? s.rows.categories[id] : undefined));
  const all = useCategories();
  const upsert = useAppStore((s) => s.upsert);
  const remove = useAppStore((s) => s.remove);

  const initialName = existing ? categoryLabel(existing, lang) : '';
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(existing?.icon ?? 'pricetag');
  const [color, setColor] = useState(existing?.color ?? CATEGORY_COLORS[0]);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const renamed = trimmed !== initialName;
    upsert('categories', {
      id: existing?.id,
      // Keep the translation key until the user renames a built-in category.
      key: existing && !renamed ? existing.key : null,
      name: trimmed,
      icon,
      color,
      sort_order: existing?.sort_order ?? Math.max(0, ...all.map((c) => c.sort_order)) + 1,
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
          remove('categories', existing!.id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? t('categories.edit') : t('categories.new') }} />
      <View style={{ alignItems: 'center' }}>
        <CategoryIcon icon={icon} color={color} size={72} />
      </View>
      <Field label={t('categories.name')} value={name} onChangeText={setName} autoFocus={!existing} />

      <Text style={styles.label}>{t('categories.color')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {CATEGORY_COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
            {c === color && <Ionicons name="checkmark" size={20} color="#fff" />}
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t('categories.icon')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {CATEGORY_ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i === icon ? color + '22' : colors.card, borderWidth: 1, borderColor: i === icon ? color : colors.border }}
          >
            <Ionicons name={i as IconName} size={22} color={i === icon ? color : colors.muted} />
          </Pressable>
        ))}
      </View>

      <Button title={t('common.save')} onPress={save} disabled={!name.trim()} />
      {existing && <Button title={t('common.delete')} variant="danger" onPress={del} />}
    </ScrollView>
  );
}
