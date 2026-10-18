create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  monthly_salary numeric(14,2),
  salary_day smallint check (salary_day between 1 and 31),
  currency text not null default 'EGP',
  language text not null default 'ar' check (language in ('ar','en')),
  weekly_summary_day smallint not null default 5 check (weekly_summary_day between 0 and 6),
  notification_hour smallint not null default 20 check (notification_hour between 0 and 23),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text,
  name text not null,
  icon text not null default 'ellipsis-horizontal',
  color text not null default '#8E8E93',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  frequency text not null check (frequency in ('weekly','monthly')),
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  recurring_id uuid references public.recurring_expenses(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.salary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, month)
);

create index categories_user_updated_idx on public.categories (user_id, updated_at);
create index expenses_user_updated_idx on public.expenses (user_id, updated_at);
create index expenses_user_spent_idx on public.expenses (user_id, spent_at);
create index expenses_category_idx on public.expenses (category_id);
create index expenses_recurring_idx on public.expenses (recurring_id);
create index recurring_user_updated_idx on public.recurring_expenses (user_id, updated_at);
create index recurring_category_idx on public.recurring_expenses (category_id);
create index salary_user_updated_idx on public.salary_entries (user_id, updated_at);

-- updated_at is always set by the server; the client uses it as its sync cursor.
create trigger profiles_updated_at before insert or update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated_at before insert or update on public.categories for each row execute function public.set_updated_at();
create trigger recurring_updated_at before insert or update on public.recurring_expenses for each row execute function public.set_updated_at();
create trigger expenses_updated_at before insert or update on public.expenses for each row execute function public.set_updated_at();
create trigger salary_updated_at before insert or update on public.salary_entries for each row execute function public.set_updated_at();
