import type { Category, Expense } from './types';
import { daysBetween } from './dates';

export interface CategoryTotal {
  categoryId: string | null;
  total: number;
  percent: number;
}

export function inRange(expenses: Expense[], start: string, end: string, categoryId?: string | null) {
  return expenses.filter((e) => e.spent_at >= start && e.spent_at <= end && (categoryId === undefined || e.category_id === categoryId));
}

export function sum(expenses: Expense[]) {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<string | null, number>();
  for (const e of expenses) totals.set(e.category_id, (totals.get(e.category_id) ?? 0) + e.amount);
  const all = sum(expenses);
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total, percent: all ? (total / all) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function totalsByDay(expenses: Expense[], start: string, end: string) {
  const byDay = new Map<string, number>();
  for (const e of expenses) byDay.set(e.spent_at, (byDay.get(e.spent_at) ?? 0) + e.amount);
  return daysBetween(start, end).map((day) => ({ day, total: byDay.get(day) ?? 0 }));
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function categoryColor(categories: Record<string, Category>, id: string | null) {
  return (id && categories[id]?.color) || '#8E8E93';
}
