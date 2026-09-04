# Phase 5 — Real Supabase auth

The one suite that talks to a real Supabase project instead of dev mode.
Kept small and separate so its network dependency can't destabilize the
primary merge/deploy gate if Supabase has a bad moment.

## Prerequisites

- [ ] Create one dedicated test user in the `dev` schema project (see
      `devops-workflow` skill for which Supabase project/schema is DEV) —
      e.g. `reflow.e2e.test@<domain-you-control>`. Confirm "Confirm email"
      is off for that project (per `README.md` setup step 3) so this user
      can be created once and reused indefinitely without an inbox.
- [ ] Store its credentials as GitHub Actions repo secrets: `E2E_TEST_EMAIL`,
      `E2E_TEST_PASSWORD`. Never commit them; local runs read from
      `.env.e2e.local` (gitignored) or shell env.
- [ ] Confirm this test user's tasks table stays isolated from any real
      data — it's a throwaway account, fine for its task list to
      accumulate test junk, but note it so nobody confuses it with a real
      user later.

## Deliverables

### `e2e/auth.spec.ts` (runs with `VITE_DEV_MODE` unset/false, real
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` pointed at the dev schema)

- [ ] Sign in with the dedicated test user's correct credentials → lands on
      Today screen with that user's real (possibly empty) task list.
- [ ] Sign in with wrong password → brand-voice error copy renders
      (`"that email or password doesn't match"`, from `Auth.tsx`'s
      `KNOWN_ERRORS` map) — not a raw Supabase error string.
- [ ] Sign in with malformed email → client-side validation error from
      `validateEmail` fires before any network call.
- [ ] Sign out from the Today screen (rail button) returns to Landing (or
      Auth) and clears the session — a reload should not silently
      re-authenticate.
- [ ] Rate-limit / generic-error copy path: if feasible to trigger
      deliberately (e.g. several rapid failed attempts), assert the
      `"too many tries — wait a moment and try again"` branch; otherwise
      skip rather than fabricating a fake condition — this is a nice-to-have,
      not a blocker for the phase.

## Explicitly deferred

- Sign-up (new account creation) and OAuth (Google/GitHub) flows are not
  automated here — sign-up needs a disposable inbox to confirm, and OAuth
  needs a real provider redirect round-trip that's awkward and fragile to
  script. Both are candidates for manual pre-release smoke-checking instead.
