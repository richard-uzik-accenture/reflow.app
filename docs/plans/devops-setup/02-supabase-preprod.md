# Phase 2 — Supabase preprod (shared project, separate schema)

Original plan assumed a third Supabase project for QUALITY. The free tier caps at 2
projects, and paying for Pro isn't on the table, so PROD keeps its own project and
DEV+QUALITY share the *existing* dev project, isolated by Postgres schema instead of
by project. See the `devops-workflow` skill's Environments section for the full
rationale, including the tradeoffs being accepted (auth users shared between dev and
preprod; isolation is schema-level, not project-level).

DEV keeps using the `public` schema exactly as today — no changes to existing dev
data. QUALITY gets a new `preprod` schema in that same project.

## Deliverables

- [x] Code change: `src/lib/supabase.ts` reads `VITE_SUPABASE_SCHEMA` (defaulting to
      `public`) and passes it to `createClient`'s `db.schema` option. `.env.example`
      documents the new variable. Committed straight to `dev` (small, config-driven,
      not treated as a feature-branch-worthy change per user direction).
- [x] Ran `supabase/migrations/preprod_schema_init.sql` by hand in the SQL Editor of
      the existing dev Supabase project. `preprod.tasks` confirmed to exist alongside
      `public.tasks` (verified via `information_schema.tables`), RLS enabled.
- [x] Added `preprod` to Project Settings → Data API → "Exposed schemas" (alongside
      the existing `public`).
- [x] Deferred: one-time copy of prod data into `preprod`. Attempted via a generated
      `insert into preprod.tasks (...)` script from prod's `public.tasks`, but prod's
      `user_id` values don't exist in the dev project's `auth.users` (separate
      projects, separate auth), so every row would fail the FK constraint. Decision:
      leave `preprod.tasks` empty for now; seed a few rows manually (via Table Editor,
      using a real dev-project test user's id) once QUALITY is actually being used
      for testing, not before.
- [x] Record: the dev project's URL + anon key are reused for both DEV and QUALITY
      Vercel env vars in Phase 3 (same URL/key, different `VITE_SUPABASE_SCHEMA`) —
      done as part of Phase 3, confirmed in its archived file.

## Not part of this phase's checklist — why this file isn't archived yet

This phase's actual Supabase/schema work is done (all items above are checked). It's
still sitting un-archived, on purpose, as a visible reminder of one real gap:

- **Prod's `public.tasks` is missing the `tags` column** that migration
  `0002_task_fields.sql` adds — prod is behind the migrations already in the repo
  (discovered while building the prod→preprod data copy query in this phase; see git
  history). The app sends `tags` on every insert, so this is a live bug risk on prod,
  not just a migration hygiene issue. Not caused by and not fixable as part of
  devops-setup — needs its own fix (apply the missing migration to prod), tracked here
  so it isn't lost. Once fixed (or explicitly deferred by the user with a reason),
  archive this file.

## Explicitly out of scope for this pass

Automatic daily drop-and-reload of preprod from prod. The `devops-workflow` skill
notes this as "not yet implemented." Do a one-time copy now; automate the refresh
once the DEV/QUALITY/PROD pipeline is working end to end.

## Revisit later

If this project ever needs to leave the Supabase free tier (or the shared-project
tradeoffs stop being acceptable — e.g. dev/preprod auth users need to be distinct),
split `preprod` into its own Supabase project. Nothing else in this design assumes
the schema-sharing is permanent; it's a cost-driven interim choice.
