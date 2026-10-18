import { translate } from '@/i18n';
import type { Lang } from './types';

export const CURRENCIES = ['EGP', 'SAR', 'AED', 'KWD', 'USD', 'EUR'] as const;

export function formatNumber(n: number) {
  const rounded = Math.round(n * 100) / 100;
  const [int, frac] = Math.abs(rounded).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}${grouped}${frac === '00' ? '' : '.' + frac}`;
}

/** "1,850 جنيه" / "1,850 EGP" */
export function formatMoney(n: number, currency: string, lang: Lang) {
  return `${formatNumber(n)} ${translate(lang, `currencies.${currency}`)}`;
}

/** Accepts Arabic-Indic digits and both decimal separators. */
export function parseAmount(input: string): number | null {
  const normalized = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, '.')
    .replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function formatDate(iso: string, lang: Lang) {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'ar' ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}
