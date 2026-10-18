import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAppStore } from './store';
import { categoryLabel } from './selectors';
import { translate } from '@/i18n';
import type { Lang } from './types';

function csvCell(v: string | number | null) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportExpensesCsv(lang: Lang) {
  const { rows, profile } = useAppStore.getState();
  const header = [
    translate(lang, 'expense.date'),
    translate(lang, 'expense.amount'),
    translate(lang, 'settings.currency'),
    translate(lang, 'expense.category'),
    translate(lang, 'expense.note'),
  ];
  const lines = Object.values(rows.expenses)
    .filter((e) => !e.deleted_at)
    .sort((a, b) => a.spent_at.localeCompare(b.spent_at))
    .map((e) =>
      [e.spent_at, e.amount, profile?.currency ?? 'EGP', categoryLabel(e.category_id ? rows.categories[e.category_id] : undefined, lang), e.note]
        .map(csvCell)
        .join(','),
    );
  // BOM so Excel opens Arabic text correctly.
  const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\n');
  const file = new File(Paths.cache, `masroofy-${Date.now()}.csv`);
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}
