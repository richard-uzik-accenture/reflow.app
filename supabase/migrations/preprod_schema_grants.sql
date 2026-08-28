-- Fixes a gap in preprod_schema_init.sql: creating a custom schema by hand does
-- not automatically grant PostgREST's anon/authenticated roles USAGE on it or
-- privileges on its tables (Supabase's dashboard does this for you on "public",
-- but a hand-run script against a new schema does not get it for free). Without
-- this, every request against preprod.* fails with "permission denied for
-- schema preprod" (Postgres error 42501) even though RLS policies are correct.
--
-- Run this once, by hand, in the SQL Editor of the dev/preprod Supabase project,
-- after preprod_schema_init.sql. Safe to re-run.

grant usage on schema preprod to anon, authenticated;
grant all on all tables in schema preprod to anon, authenticated;
grant all on all sequences in schema preprod to anon, authenticated;
alter default privileges in schema preprod grant all on tables to anon, authenticated;
alter default privileges in schema preprod grant all on sequences to anon, authenticated;
