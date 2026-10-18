import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonutChart, ProgressBar } from '@/components/charts';
import { ExpenseRow } from '@/components/ExpenseRow';
import { AddExpenseFab } from '@/components/Fab';
import { Card, Empty, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { today, weekRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { categoryLabel, useCategoryMap, useCurrency, useExpenses, useProfile } from '@/lib/selectors';
import { categoryColor, inRange, sum, totalsByCategory } from '@/lib/stats';
import { useBudget } from '@/lib/useBudget';
import { syncNow } from '@/lib/sync';

export default function Home() {
  const { t, lang } = useT();
  const currency = useCurrency();
  const profile = useProfile();
  const expenses = useExpenses();
  const categories = useCategoryMap();
  const budget = useBudget();
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((s) => setOffline(s.isConnected === false)), []);

  const week = useMemo(() => {
    const [start, end] = weekRange(today(), profile?.weekly_summary_day ?? 5);
    const items = inRange(expenses, start, end);
    return { total: sum(items), byCat: totalsByCategory(items) };
  }, [expenses, profile?.weekly_summary_day]);

  const money = (n: number) => formatMoney(n, currency, lang);
  const isPayday = !!profile?.salary_day && budget.cycle.start === today();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await syncNow();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.h1}>{t('appName')}</Text>
        {offline && (
          <View style={[styles.row, { backgroundColor: '#FEF3C7', padding: spacing.sm, borderRadius: 8 }]}>
            <Ionicons name="cloud-offline" size={16} color={colors.warning} />
            <Text style={{ color: colors.warning, flex: 1, textAlign: 'left' }}>{t('common.offline')}</Text>
          </View>
        )}

        <Card>
          <Text style={styles.muted}>{t('home.remaining')}</Text>
          {budget.salary != null ? (
            <>
              <Text style={[styles.h1, { color: (budget.remaining ?? 0) < 0 ? colors.danger : colors.primaryDark }]}>{money(budget.remaining ?? 0)}</Text>
              <ProgressBar value={budget.salary ? budget.spent / budget.salary : 1} color={budget.spent > budget.salary * 0.8 ? colors.danger : colors.primary} />
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.muted}>{t('home.spentThisCycle', { amount: money(budget.spent) })}</Text>
                <Text style={styles.muted}>{t('home.of', { total: money(budget.salary) })}</Text>
              </View>
            </>
          ) : (
            <Pressable onPress={() => router.push('/salary')}>
              <Text style={[styles.body, { color: colors.primary }]}>{t('home.noSalary')}</Text>
            </Pressable>
          )}
          {(isPayday || (!budget.salaryConfirmed && !!profile?.salary_day)) && (
            <Pressable onPress={() => router.push('/salary')} style={[styles.row, { backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: 8 }]}>
              <Ionicons name="cash" size={18} color={colors.primaryDark} />
              <Text style={{ color: colors.primaryDark, flex: 1, textAlign: 'left' }}>{t('home.salaryArrived')}</Text>
            </Pressable>
          )}
        </Card>

        <Pressable onPress={() => router.push('/weekly-summary')}>
          <Card>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.h2}>{t('home.thisWeek')}</Text>
              <View style={styles.row}>
                <Text style={{ color: colors.primary }}>{t('home.weeklySummary')}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} style={styles.flipRtl} />
              </View>
            </View>
            <View style={[styles.row, { gap: spacing.lg }]}>
              <DonutChart
                size={120}
                thickness={18}
                data={week.byCat.map((c) => ({ value: c.total, color: categoryColor(categories, c.categoryId) }))}
                center={<Text style={{ fontWeight: '700', fontSize: 13, color: colors.text }}>{money(week.total)}</Text>}
              />
              <View style={{ flex: 1, gap: 6 }}>
                {week.byCat.slice(0, 4).map((c) => (
                  <View key={c.categoryId ?? 'none'} style={[styles.row, { gap: 6 }]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColor(categories, c.categoryId) }} />
                    <Text style={[styles.muted, { flex: 1 }]} numberOfLines={1}>
                      {categoryLabel(c.categoryId ? categories[c.categoryId] : undefined, lang)}
                    </Text>
                    <Text style={styles.muted}>{Math.round(c.percent)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </Pressable>

        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.h2}>{t('home.recent')}</Text>
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={{ color: colors.primary }}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          {expenses.length === 0 ? (
            <Card>
              <Empty text={t('home.empty')} />
            </Card>
          ) : (
            expenses.slice(0, 6).map((e, i) => (
              <View key={e.id}>
                {i > 0 && <View style={styles.separator} />}
                <ExpenseRow expense={e} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <AddExpenseFab />
    </SafeAreaView>
  );
}
