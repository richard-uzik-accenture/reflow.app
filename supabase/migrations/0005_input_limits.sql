-- Defense-in-depth limits mirroring the client-side validation in
-- src/lib/validation.ts. The client is not the only possible writer (a
-- direct PostgREST call bypasses it entirely), so these constraints stop an
-- oversized or blank title, or an unbounded tag list, from ever landing in
-- the table regardless of what wrote it. RLS still scopes any such attempt
-- to the caller's own rows.
--
-- Safe to re-run: constraints are only added if missing.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_title_length'
  ) then
    alter table public.tasks
      add constraint tasks_title_length check (char_length(title) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tasks_title_not_blank'
  ) then
    alter table public.tasks
      add constraint tasks_title_not_blank check (char_length(trim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tasks_tags_count'
  ) then
    alter table public.tasks
      add constraint tasks_tags_count check (array_length(tags, 1) is null or array_length(tags, 1) <= 10);
  end if;
end $$;
