import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CategoryIcon, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { addDays, parseISODate, today, weekRange } from '@/lib/dates';
import { formatDate, formatMoney } from '@/lib/format';
import { categoryLabel, useCategoryMap, useCurrency, useExpenses, useProfile } from '@/lib/selectors';
import { categoryColor, inRange, percentChange, sum, totalsByCategory, totalsByDay } from '@/lib/stats';

export default function WeeklySummary() {
  const { t, lang, dict } = useT();
  const currency = useCurrency();
  const profile = useProfile();
  const expenses = useExpenses();
  const categories = useCategoryMap();

  const s = useMemo(() => {
    const [start, end] = weekRange(today(), profile?.weekly_summary_day ?? 5);
    const prevStart = addDays(start, -7);
    const prevEnd = addDays(start, -1);
    const items = inRange(expenses, start, end);
    const prevItems = inRange(expenses, prevStart, prevEnd);
    const total = sum(items);
    const prevTotal = sum(prevItems);
    const byCat = totalsByCategory(items);
    return { start, end, total, prevTotal, byCat, top: byCat[0], change: percentChange(total, prevTotal), byDay: totalsByDay(items, start, end) };
  }, [expenses, profile?.weekly_summary_day]);

  const money = (n: number) => formatMoney(n, currency, lang);
  const topCat = s.top?.categoryId ? categories[s.top.categoryId] : undefined;
  const sentence = s.total
    ? t('summary.sentence', { amount: money(s.total), percent: Math.round(s.top!.percent), category: categoryLabel(topCat, lang) })
    : t('summary.sentenceEmpty');

  let changeText = t('summary.noPrev');
  let changeColor: string = colors.muted;
  if (s.change != null) {
    const pct = Math.abs(Math.round(s.change));
    if (pct === 0) changeText = t('summary.same');
    else if (s.change > 0) {
      changeText = t('summary.more', { percent: pct });
      changeColor = colors.danger;
    } else {
      changeText = t('summary.less', { percent: pct });
      changeColor = colors.primaryDark;
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Text style={styles.muted}>
        {formatDate(s.start, lang)} – {formatDate(s.end, lang)}
      </Text>
      <Card style={{ backgroundColor: colors.primarySoft }}>
        <Text style={[styles.h2, { color: colors.primaryDark, lineHeight: 30 }]}>{sentence}</Text>
      </Card>

      <View style={[styles.row, { gap: spacing.md }]}>
        <Card style={{ flex: 1 }}>
          <Text style={styles.muted}>{t('summary.total')}</Text>
          <Text style={styles.h2}>{money(s.total)}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={styles.muted}>{t('summary.vsLast')}</Text>
          <View style={styles.row}>
            {s.change != null && s.change !== 0 && <Ionicons name={s.change > 0 ? 'trending-up' : 'trending-down'} size={20} color={changeColor} />}
            <Text style={[styles.body, { color: changeColor, fontWeight: '600', flexShrink: 1 }]}>{changeText}</Text>
          </View>
          <Text style={styles.muted}>{money(s.prevTotal)}</Text>
        </Card>
      </View>

      {s.top && (
        <Card>
          <Text style={styles.muted}>{t('summary.top')}</Text>
          <View style={[styles.row, { gap: spacing.md }]}>
            <CategoryIcon icon={topCat?.icon ?? 'help'} color={topCat?.color ?? colors.muted} />
            <Text style={[styles.h2, { flex: 1 }]}>{categoryLabel(topCat, lang)}</Text>
            <Text style={styles.body}>{money(s.top.total)}</Text>
          </View>
        </Card>
      )}

      {s.total > 0 && (
        <Card>
          <View style={{ alignItems: 'center' }}>
            <DonutChart data={s.byCat.map((c) => ({ value: c.total, color: categoryColor(categories, c.categoryId) }))} />
          </View>
          {s.byCat.map((c) => (
            <View key={c.categoryId ?? 'none'} style={[styles.row, { gap: spacing.sm }]}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: categoryColor(categories, c.categoryId) }} />
              <Text style={[styles.body, { flex: 1 }]}>{categoryLabel(c.categoryId ? categories[c.categoryId] : undefined, lang)}</Text>
              <Text style={styles.muted}>{Math.round(c.percent)}%</Text>
              <Text style={styles.body}>{money(c.total)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <BarChart data={s.byDay.map((d) => ({ value: d.total, label: dict.weekdaysShort[parseISODate(d.day).getDay()] }))} />
      </Card>
    </ScrollView>
  );
}
