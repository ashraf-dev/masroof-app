import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BarChart, DonutChart } from '@/components/charts';
import { PeriodFilter, usePeriod } from '@/components/PeriodFilter';
import { Card, CategoryIcon, Empty, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { parseISODate, today } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { categoryLabel, useCategoryMap, useCurrency, useExpenses } from '@/lib/selectors';
import { categoryColor, inRange, sum, totalsByCategory, totalsByDay } from '@/lib/stats';

export default function Reports() {
  const { t, lang, dict } = useT();
  const currency = useCurrency();
  const expenses = useExpenses();
  const categories = useCategoryMap();
  const state = usePeriod('month');
  const { period } = state;

  const data = useMemo(() => {
    const items = inRange(expenses, period.start, period.end, period.categoryId);
    return {
      total: sum(items),
      byCat: totalsByCategory(items),
      byDay: totalsByDay(items, period.start, period.end),
    };
  }, [expenses, period]);

  const money = (n: number) => formatMoney(n, currency, lang);
  const todayIndex = data.byDay.findIndex((d) => d.day === today());

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <PeriodFilter state={state} />
      {data.total === 0 ? (
        <Empty text={t('reports.noData')} />
      ) : (
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Card>
            <Text style={styles.h2}>{t('reports.byCategory')}</Text>
            <View style={{ alignItems: 'center' }}>
              <DonutChart
                data={data.byCat.map((c) => ({ value: c.total, color: categoryColor(categories, c.categoryId) }))}
                center={
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.muted}>{t('expenses.total')}</Text>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{money(data.total)}</Text>
                  </View>
                }
              />
            </View>
            {data.byCat.map((c) => {
              const cat = c.categoryId ? categories[c.categoryId] : undefined;
              return (
                <View key={c.categoryId ?? 'none'} style={[styles.row, { gap: spacing.md }]}>
                  <CategoryIcon icon={cat?.icon ?? 'help'} color={cat?.color ?? colors.muted} size={32} />
                  <Text style={[styles.body, { flex: 1 }]}>{categoryLabel(cat, lang)}</Text>
                  <Text style={styles.muted}>{Math.round(c.percent)}%</Text>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{money(c.total)}</Text>
                </View>
              );
            })}
          </Card>
          <Card>
            <Text style={styles.h2}>{t('reports.byDay')}</Text>
            <BarChart
              highlightIndex={todayIndex >= 0 ? todayIndex : undefined}
              data={data.byDay.map((d) => ({
                value: d.total,
                label: period.mode === 'week' ? dict.weekdaysShort[parseISODate(d.day).getDay()] : String(Number(d.day.slice(8))),
              }))}
            />
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
