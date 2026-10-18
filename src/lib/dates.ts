/** All dates the app stores are local calendar dates as YYYY-MM-DD strings. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toISODate(new Date());
}

export function addDays(s: string, n: number) {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Same day-of-month `n` months later, clamped to the month length (Jan 31 → Feb 28). */
export function addMonths(s: string, n: number, preferredDay?: number) {
  const d = parseISODate(s);
  const day = preferredDay ?? d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  target.setDate(Math.min(day, daysInMonth(target.getFullYear(), target.getMonth())));
  return toISODate(target);
}

export function monthStart(s: string) {
  return s.slice(0, 8) + '01';
}

export function monthEnd(s: string) {
  const d = parseISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** Week whose last day is `endWeekday` (0 = Sunday). Returns [start, end] containing `s`. */
export function weekRange(s: string, endWeekday: number): [string, string] {
  const d = parseISODate(s);
  const startWeekday = (endWeekday + 1) % 7;
  const back = (d.getDay() - startWeekday + 7) % 7;
  const start = addDays(s, -back);
  return [start, addDays(start, 6)];
}

export interface PayCycle {
  start: string;
  end: string;
  /** Key for the salary entry of this cycle: YYYY-MM-01 of the cycle start. */
  month: string;
}

/**
 * The pay cycle that contains `s`. If the salary arrives on day 25, the cycle
 * runs from the 25th to the 24th of the next month. Without a salary day the
 * calendar month is used.
 */
export function payCycle(s: string, salaryDay: number | null): PayCycle {
  if (!salaryDay) return { start: monthStart(s), end: monthEnd(s), month: monthStart(s) };
  const d = parseISODate(s);
  const thisMonthPayday = Math.min(salaryDay, daysInMonth(d.getFullYear(), d.getMonth()));
  let start: string;
  if (d.getDate() >= thisMonthPayday) {
    start = toISODate(new Date(d.getFullYear(), d.getMonth(), thisMonthPayday));
  } else {
    start = addMonths(toISODate(new Date(d.getFullYear(), d.getMonth(), 1)), -1, salaryDay);
  }
  const end = addDays(addMonths(monthStart(start), 1, salaryDay), -1);
  return { start, end, month: monthStart(start) };
}

export function daysBetween(start: string, end: string) {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}
