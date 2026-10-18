alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.expenses enable row level security;
alter table public.salary_entries enable row level security;

create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own rows select" on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows insert" on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows update" on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows delete" on public.categories for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own rows select" on public.recurring_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows insert" on public.recurring_expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows update" on public.recurring_expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows delete" on public.recurring_expenses for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own rows select" on public.expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows insert" on public.expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows update" on public.expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows delete" on public.expenses for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own rows select" on public.salary_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows insert" on public.salary_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows update" on public.salary_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows delete" on public.salary_entries for delete to authenticated using ((select auth.uid()) = user_id);
