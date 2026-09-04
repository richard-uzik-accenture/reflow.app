-- Brings the preprod schema in line with what public already has from
-- 0004_profiles.sql and 0005_input_limits.sql. Both were applied by hand
-- against the dev/preprod Supabase project at the time, with no migration
-- file capturing them — this file closes that gap (confirmed against the
-- live schema; the constraint/policy shapes here match exactly).
--
-- Run this once, by hand, in the SQL Editor of the dev/preprod Supabase
-- project, after preprod_schema_grants.sql. Safe to re-run.

create table if not exists preprod.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark'))
);

alter table preprod.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'preprod' and tablename = 'profiles'
  ) then
    create policy "Users manage their own profile"
      on preprod.profiles
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_title_length' and conrelid = 'preprod.tasks'::regclass
  ) then
    alter table preprod.tasks
      add constraint tasks_title_length check (char_length(title) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tasks_title_not_blank' and conrelid = 'preprod.tasks'::regclass
  ) then
    alter table preprod.tasks
      add constraint tasks_title_not_blank check (char_length(trim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tasks_tags_count' and conrelid = 'preprod.tasks'::regclass
  ) then
    alter table preprod.tasks
      add constraint tasks_tags_count check (array_length(tags, 1) is null or array_length(tags, 1) <= 10);
  end if;
end $$;
