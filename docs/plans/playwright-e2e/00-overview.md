# Playwright E2E Coverage — Overview

Goal: a Playwright suite that, at 100% pass rate, is a reliable "safe to push
to production" signal for reflow. Complements the existing `vitest` unit
suite (pure `src/lib/*.ts` logic) by covering full user flows through real
rendered UI, browser APIs (drag, motion, storage), and — for one small
suite — real Supabase auth.

## Strategy

- **Primary suite runs against `VITE_DEV_MODE=true`** (`src/lib/devMock.ts`),
  which already exists in the codebase for exactly this purpose (see its
  doc comment: "used to reach authenticated screens... in local browser
  automation without a real Supabase login"). This gives deterministic
  seeded tasks, no network flakiness, and skips auth entirely — fast and
  stable, which is what a merge/deploy gate needs.
- **Secondary suite covers real Supabase auth** (sign in / sign out / bad
  credentials) using one dedicated, pre-created test user against the
  `dev` schema (see `devops-workflow` skill for the DEV/QUALITY/PROD split).
  Credentials come from GitHub Actions secrets (`E2E_TEST_EMAIL` /
  `E2E_TEST_PASSWORD`), never committed. Reuse the same user every run —
  don't sign up a fresh account each time, to avoid accumulating junk
  accounts. Sign-up itself is out of scope for automation (manual/periodic
  check only), since it requires a disposable inbox to fully verify.
- Swipe-driven interactions (`LeftoverCard`, `CompareDuel`) both have
  click-button fallbacks for every swipe outcome (`← let it go` / `keep →`,
  `← do it later` / `do it first →`) — tests drive those via `click()`
  rather than simulating drag gestures, which is far more reliable in
  Playwright.
- Manual list reordering (`Reorder.Item` in `TaskRow.tsx`, via
  `useLongPressDrag`) has no button fallback — it's a real pointer-drag
  gesture and must be simulated with mouse `down/move/up` sequences. Full
  coverage requested for this despite the added brittleness, since it's
  core product functionality (Phase 3 "merge" step and everyday reordering).

## Phases

- `01-setup.md` — install Playwright, config, npm scripts, CI wiring.
- `02-core-flows.md` — app shell/routing, Today baseline, task CRUD, tags, theme.
- `03-compare-and-reorder.md` — binary-search compare-insertion, drag-and-drop reorder.
- `04-morning-flow.md` — three-phase Start My Day flow, rollover banner.
- `05-auth.md` — real-Supabase sign in / sign out / error states, dedicated test user.

## Explicitly out of scope (for now)

- PWA install prompt, update banner, version badge — low value for a
  personal single-user tool, skip unless trivial to add later.
- Realtime-stale banner — hard to trigger deterministically without
  injecting a fake Supabase realtime disconnect; revisit if it becomes a
  recurring source of bugs.
- Sign-up flow end-to-end (needs a disposable inbox to click the
  confirmation link, or "Confirm email" turned off in a throwaway
  project) — do manually if needed.

## Definition of done (per phase)

Every checkbox in the phase file is checked, the spec file(s) it describes
exist and pass locally (`npm run test:e2e`), and — once `01-setup.md` wires
CI — pass in GitHub Actions. Move the phase file to `archive/` when done.
