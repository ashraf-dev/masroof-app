import { useMemo } from 'react';
import { useAppStore } from './store';
import { translate, deviceLanguage } from '@/i18n';
import type { Category, Expense, Lang, RecurringExpense, SalaryEntry } from './types';

const alive = <T extends { deleted_at: string | null }>(r: T) => !r.deleted_at;

export function useLang(): Lang {
  return useAppStore((s) => s.profile?.language ?? s.preferredLanguage ?? deviceLanguage());
}

export function useCurrency() {
  return useAppStore((s) => s.profile?.currency ?? 'EGP');
}

export function useCategories(): Category[] {
  const map = useAppStore((s) => s.rows.categories);
  return useMemo(() => Object.values(map).filter(alive).sort((a, b) => a.sort_order - b.sort_order), [map]);
}

/** All categories including deleted ones, for looking up the category of old expenses. */
export function useCategoryMap() {
  return useAppStore((s) => s.rows.categories);
}

export function useExpenses(): Expense[] {
  const map = useAppStore((s) => s.rows.expenses);
  return useMemo(
    () => Object.values(map).filter(alive).sort((a, b) => (a.spent_at === b.spent_at ? b.created_at.localeCompare(a.created_at) : b.spent_at.localeCompare(a.spent_at))),
    [map],
  );
}

export function useRecurring(): RecurringExpense[] {
  const map = useAppStore((s) => s.rows.recurring_expenses);
  return useMemo(() => Object.values(map).filter(alive).sort((a, b) => a.next_date.localeCompare(b.next_date)), [map]);
}

export function useSalaryEntries(): SalaryEntry[] {
  const map = useAppStore((s) => s.rows.salary_entries);
  return useMemo(() => Object.values(map).filter(alive), [map]);
}

export function categoryLabel(c: Pick<Category, 'key' | 'name'> | undefined, lang: Lang) {
  if (!c) return translate(lang, 'categories.uncategorized');
  return c.key ? translate(lang, `categories.${c.key}`) : c.name;
}

export function useProfile() {
  return useAppStore((s) => s.profile);
}
