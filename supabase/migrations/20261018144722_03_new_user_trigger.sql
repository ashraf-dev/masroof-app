-- Every new user gets a profile row and the default categories.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.categories (user_id, key, name, icon, color, sort_order) values
    (new.id, 'food',          'أكل',      'fast-food',          '#FF9500', 1),
    (new.id, 'transport',     'مواصلات',  'bus',                '#007AFF', 2),
    (new.id, 'bills',         'فواتير',   'receipt',            '#FF3B30', 3),
    (new.id, 'shopping',      'تسوق',     'cart',               '#AF52DE', 4),
    (new.id, 'health',        'صحة',      'medkit',             '#34C759', 5),
    (new.id, 'entertainment', 'ترفيه',    'game-controller',    '#FF2D55', 6),
    (new.id, 'education',     'تعليم',    'school',             '#5856D6', 7),
    (new.id, 'other',         'أخرى',     'ellipsis-horizontal','#8E8E93', 8);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
