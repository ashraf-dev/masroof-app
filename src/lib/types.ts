export type Lang = 'ar' | 'en';

export interface Profile {
  id: string;
  display_name: string | null;
  monthly_salary: number | null;
  salary_day: number | null;
  currency: string;
  language: Lang;
  /** 0 = Sunday … 6 = Saturday */
  weekly_summary_day: number;
  notification_hour: number;
  onboarded: boolean;
  updated_at?: string;
}

interface SyncedRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  deleted_at: string | null;
}

export interface Category extends SyncedRow {
  /** Set for built-in categories so their name can be translated; cleared when the user renames it. */
  key: string | null;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Expense extends SyncedRow {
  category_id: string | null;
  recurring_id: string | null;
  amount: number;
  note: string | null;
  /** YYYY-MM-DD, local date */
  spent_at: string;
}

export type Frequency = 'weekly' | 'monthly';

export interface RecurringExpense extends SyncedRow {
  category_id: string | null;
  amount: number;
  note: string | null;
  frequency: Frequency;
  next_date: string;
  active: boolean;
}

export interface SalaryEntry extends SyncedRow {
  /** First day of the pay cycle's month, YYYY-MM-01 */
  month: string;
  amount: number;
}

export type TableName = 'categories' | 'recurring_expenses' | 'expenses' | 'salary_entries';

export interface TableRows {
  categories: Category;
  recurring_expenses: RecurringExpense;
  expenses: Expense;
  salary_entries: SalaryEntry;
}
