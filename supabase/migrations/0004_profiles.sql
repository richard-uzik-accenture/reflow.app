create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark'))
);

alter table public.profiles enable row level security;

create policy "Users manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
