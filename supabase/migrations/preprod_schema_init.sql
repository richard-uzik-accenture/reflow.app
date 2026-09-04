-- One-time setup for the QUALITY/preprod environment, which shares the DEV
-- Supabase project but keeps its data in a separate schema so the two never
-- collide. Run this once, by hand, in the SQL Editor of the existing dev
-- Supabase project (the one currently holding the "public" schema data).
--
-- This is the final-state equivalent of migrations 0001-0002 applied to a
-- schema named "preprod" instead of "public". It is not meant to be replayed
-- against public — public already has this shape. See
-- preprod_profiles_and_input_limits.sql for the preprod equivalent of
-- 0004/0005.

create schema if not exists preprod;

create table preprod.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'active' check (status in ('active', 'done', 'dropped')),
  rank double precision not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  last_triaged_on date not null default current_date,
  tags text[] not null default '{}',
  due_time time
);

create index tasks_user_status_rank_idx on preprod.tasks (user_id, status, rank);

alter table preprod.tasks enable row level security;

create policy "Users manage their own tasks"
  on preprod.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- After running this: Project Settings -> API -> "Exposed schemas" must
-- include "preprod" (alongside "public"), or PostgREST will reject requests
-- against it with a schema-not-exposed error.
