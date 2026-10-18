import { useMemo } from 'react';
import { payCycle, today } from './dates';
import { useExpenses, useProfile, useSalaryEntries } from './selectors';
import { inRange, sum } from './stats';

/** Salary vs. spending for the current pay cycle. */
export function useBudget() {
  const profile = useProfile();
  const expenses = useExpenses();
  const salaries = useSalaryEntries();
  return useMemo(() => {
    const cycle = payCycle(today(), profile?.salary_day ?? null);
    const entry = salaries.find((s) => s.month === cycle.month);
    const salary = entry?.amount ?? profile?.monthly_salary ?? null;
    const spent = sum(inRange(expenses, cycle.start, cycle.end));
    return { cycle, salary, salaryConfirmed: !!entry, spent, remaining: salary == null ? null : salary - spent };
  }, [profile, expenses, salaries]);
}
