import * as Crypto from 'expo-crypto';
import { useAppStore } from './store';
import { addDays, addMonths, monthEnd, today } from './dates';
import type { RecurringExpense } from './types';

/** Deterministic id per (recurring, date) so two offline devices can't create the same occurrence twice. */
async function occurrenceId(recurringId: string, date: string) {
  const h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${recurringId}:${date}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function nextOccurrence(r: Pick<RecurringExpense, 'frequency' | 'next_date'>) {
  if (r.frequency === 'weekly') return addDays(r.next_date, 7);
  // Something due on the last day of the month (e.g. the 31st) stays on the last day.
  const anchorDay = r.next_date === monthEnd(r.next_date) ? 31 : undefined;
  return addMonths(r.next_date, 1, anchorDay);
}

/** Creates expenses for every recurring item that is due, then advances its next date. */
export async function materializeRecurring() {
  const { rows, upsert, userId } = useAppStore.getState();
  if (!userId) return;
  const now = today();
  for (const r of Object.values(rows.recurring_expenses)) {
    if (r.deleted_at || !r.active || r.next_date > now) continue;
    let next = r.next_date;
    // Cap the catch-up so a long-abandoned device doesn't create hundreds of rows.
    for (let i = 0; next <= now && i < 60; i++) {
      const id = await occurrenceId(r.id, next);
      if (!useAppStore.getState().rows.expenses[id]) {
        upsert('expenses', {
          id,
          amount: r.amount,
          category_id: r.category_id,
          recurring_id: r.id,
          note: r.note,
          spent_at: next,
        });
      }
      next = nextOccurrence({ frequency: r.frequency, next_date: next });
    }
    upsert('recurring_expenses', { ...r, next_date: next });
  }
}
