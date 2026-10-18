import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { I18nManager, Pressable, ScrollView, Text, View } from 'react-native';
import { addDays, addMonths, monthEnd, monthStart, today, weekRange } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { categoryLabel, useCategories, useLang } from '@/lib/selectors';
import { useAppStore } from '@/lib/store';
import { useT } from '@/i18n';
import { Chip, styles } from './ui';
import { colors, spacing } from './theme';

export type PeriodMode = 'week' | 'month';

export interface Period {
  mode: PeriodMode;
  start: string;
  end: string;
  /** undefined = all categories */
  categoryId?: string | null;
}

export function usePeriod(initial: PeriodMode = 'month') {
  const [mode, setMode] = useState<PeriodMode>(initial);
  const [offset, setOffset] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null | undefined>(undefined);
  const summaryDay = useAppStore((s) => s.profile?.weekly_summary_day ?? 5);
  const period = useMemo<Period>(() => {
    if (mode === 'week') {
      const [s, e] = weekRange(addDays(today(), offset * 7), summaryDay);
      return { mode, start: s, end: e, categoryId };
    }
    const anchor = addMonths(monthStart(today()), offset);
    return { mode, start: anchor, end: monthEnd(anchor), categoryId };
  }, [mode, offset, categoryId, summaryDay]);
  return {
    period,
    setMode: (m: PeriodMode) => {
      setMode(m);
      setOffset(0);
    },
    shift: (d: number) => setOffset((o) => Math.min(0, o + d)),
    canGoForward: offset < 0,
    setCategoryId,
  };
}

export function PeriodFilter({ state, showCategories = true }: { state: ReturnType<typeof usePeriod>; showCategories?: boolean }) {
  const { t, dict } = useT();
  const lang = useLang();
  const categories = useCategories();
  const { period } = state;
  const label =
    period.mode === 'month'
      ? `${monthName(period.start, lang)} ${period.start.slice(0, 4)}`
      : `${formatDate(period.start, lang)} – ${formatDate(period.end, lang)}`;
  const chevron = (dir: 'back' | 'forward') => (I18nManager.isRTL ? (dir === 'back' ? 'chevron-forward' : 'chevron-back') : `chevron-${dir}` as const);

  return (
    <View style={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
      <View style={[styles.row, { paddingHorizontal: spacing.lg }]}>
        <Chip label={t('filters.week')} selected={period.mode === 'week'} onPress={() => state.setMode('week')} />
        <Chip label={t('filters.month')} selected={period.mode === 'month'} onPress={() => state.setMode('month')} />
      </View>
      <View style={[styles.row, { justifyContent: 'space-between', paddingHorizontal: spacing.lg }]}>
        <Pressable hitSlop={12} onPress={() => state.shift(-1)}>
          <Ionicons name={chevron('back')} size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.body, { fontWeight: '600' }]}>{label}</Text>
        <Pressable hitSlop={12} disabled={!state.canGoForward} onPress={() => state.shift(1)}>
          <Ionicons name={chevron('forward')} size={22} color={state.canGoForward ? colors.text : colors.border} />
        </Pressable>
      </View>
      {showCategories && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          <Chip label={dict.common.all} selected={period.categoryId === undefined} onPress={() => state.setCategoryId(undefined)} />
          {categories.map((c) => (
            <Chip key={c.id} label={categoryLabel(c, lang)} color={c.color} selected={period.categoryId === c.id} onPress={() => state.setCategoryId(c.id)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export function monthName(iso: string, lang: 'ar' | 'en') {
  return MONTHS[lang][Number(iso.slice(5, 7)) - 1];
}
