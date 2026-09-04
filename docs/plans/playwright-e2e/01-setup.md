# Phase 1 — Setup

Get Playwright installed, configured, and runnable, with a CI hook that can
later become the merge/deploy gate.

## Deliverables

- [ ] Add `@playwright/test` as a devDependency; run `npx playwright install
      --with-deps chromium` (start with one browser; add firefox/webkit later
      only if a real cross-browser bug shows up — this is a single-user PWA,
      not a broad-compatibility product).
- [ ] `playwright.config.ts` at repo root:
  - `webServer`: runs `npm run dev` (or a dedicated `vite --mode e2e`) with
    `VITE_DEV_MODE=true` injected, waits on `http://localhost:5173`, reuses
    an existing server locally (`reuseExistingServer: !process.env.CI`).
  - `testDir: 'e2e'`, reasonable `timeout`/`expect timeout` given
    framer-motion animation durations noted in `branding.md` (~380ms reflow
    spring, 150-200ms compare/decide) — assertions should wait for these
    rather than hard-coding sleeps.
  - `use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' }`.
- [ ] `.env.e2e` (gitignored, like `.env.local`) or inline env in the
      `webServer.env` config — do not require a real Supabase project for
      the dev-mode suite.
- [ ] `package.json` script: `"test:e2e": "playwright test"`.
- [ ] `e2e/fixtures.ts` — shared helpers: a `devModePage` fixture (or just a
      documented `baseURL` since dev mode is the default when the env var is
      set), plus common selectors/locators used across specs (e.g. task row
      by title text, toast locator, FAB button).
- [ ] Confirm `oxlint`/`tsc` don't choke on the new `e2e/` directory (add to
      `tsconfig`/lint excludes if needed, matching how the repo already
      separates `src` from tooling config).
- [ ] Wire `npm run test:e2e` into CI (check `devops-workflow` skill for
      where the existing GitHub Actions build lives —
      `.github/workflows/release.yml` — and whether this should be a new
      workflow gating PRs into `main`, or a step added to the existing one).
      Do not touch Octopus/release steps themselves in this phase — just get
      the test job running and required.
- [ ] Sanity spec (`e2e/smoke.spec.ts`): loads the app in dev mode, asserts
      the Today screen renders with the seeded mock tasks from
      `devMock.ts` (e.g. "ship the quarterly report" visible). This proves
      the harness works before writing real coverage in later phases.
