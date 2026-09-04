# DevOps Setup — Overview

Finishes the three-environment pipeline described in the `devops-workflow` skill:
DEV/QUALITY/PROD, each a separate Vercel project with its own Supabase database,
promoted by **Octopus Deploy** from a single build produced on `main`.

## Current state (as of 2026-08-18) — pipeline works, one notification-UX bug open

- Repo `richard-uzik-accenture/OneCodeToRuleThemAll` is **public**. `main` requires
  PRs to merge (0 required approvals — solo maintainer can't self-approve).
- Branches: `dev` and `main` exist, `feature/combat-screen-polish` (pre-dates `dev`)
  still needs retargeting — Phase 6. No `preprod` branch (intentional).
- Supabase: one project holds both DEV (`public` schema) and QUALITY (`preprod`
  schema, empty — data copy deferred), one separate project holds PROD. **PROD is
  missing migration 0002** (`tags` column) — flagged, unfixed, not part of devops-setup.
- Vercel: three projects (DEV/QUALITY/PROD), domains set, git auto-deploy disabled,
  `VITE_SUPABASE_ANON_KEY` unmarked as "Sensitive" on all three.
- GitHub Actions (Phase 5, archived): every push to `main` builds via `vercel
  build`, packages, and creates a matching-numbered Octopus release with commit
  info in the release notes.
- **Octopus Deploy (Phase 4): the full promotion pipeline is built, tested, and
  has been used for a real production deployment.** `dev` genuinely auto-deploys
  (via an explicit Lifecycle phase with auto-deploy on — this needed a real fix
  mid-session, "default conventions" alone does NOT auto-deploy, see Phase 4).
  `preprod`/`prod` require manual trigger + `Approve Deployment` (Manual
  Intervention, approver team "Space Managers"). A real release has been deployed
  through all three environments, `usereflow.app` confirmed serving it.
- **Version traceability**: package version, Octopus release number, and an
  in-app badge (bottom corner, `v0.0.16 · afb799e` format) all show the same
  number and short commit SHA.
- **Outside-web-UI notifications: built, but with an open bug.** iPhone push via
  Octopus Subscription → Pushcut, fires when `dev` or `preprod` finishes
  deploying (prompting you to trigger the next stage). **The notification's link
  currently opens Octopus's generic Tasks page, which has nothing useful on it at
  that moment** — you still have to self-navigate to Releases. This is the
  concrete thing to fix first next session — see Phase 4's "Open problem" section
  for three ranked options.
- **Task hygiene note**: Octopus manual interventions never auto-timeout and
  there's no bulk-cancel — cancel abandoned test deploys explicitly, don't just
  navigate away, or Octopus Cloud's task-slot cap could eventually block new
  deployments. Zero stuck tasks as of end of this session.
- **Pre-launch follow-up, not urgent now**: do a real RLS/security audit across all
  Supabase tables before real users/payments — deliberately deferred, flagged in
  Phase 4's file so it isn't lost.

## What's left

1. **Fix first**: the dev/preprod-success Pushcut notification links to the wrong
   Octopus page (Tasks instead of somewhere the next deploy can actually be
   triggered from). Phase 4 has 3 ranked options, cheapest first.
2. Phase 6: retarget `feature/combat-screen-polish` onto `dev`, update README to
   describe the branch model, archive Phase 4 once fully done.
3. Before real users/payments: the RLS/security audit noted above.
4. Optional cleanup: PROD's missing migration 0002 (`tags` column) — unrelated bug
   found during this work, still open.

## Target state

```
feature/*  ─┐
fix/*       ├─▶  dev  ──(PR + review, human-only merge)──▶  main
docs/*      │
refactor/*  ─┘
                                                                │
                                                    push to main triggers
                                                                │
                                                                ▼
                                                    GitHub Actions: build,
                                                    package / push / create-release
                                                                │
                                                                ▼
                                              Octopus Deploy orchestrates one release:
                                              ├─ dev      (auto)
                                              ├─ preprod  (manual approval in Octopus)
                                              └─ prod     (manual approval in Octopus)
```

**This is now reality, not just a target** — confirmed working end-to-end this
session. Key departure from the older per-branch-per-Vercel-project model: there is
**no `preprod` git branch**. `main` is the only branch that produces a release;
preprod and prod are Octopus deployment targets for that same release. See the
`devops-workflow` skill for full rationale and guardrails.

## Phases

| Phase | File | What it does |
|---|---|---|
| 1 | archived | Create `dev`, protect `main` — done |
| 2 | [02-supabase-preprod.md](02-supabase-preprod.md) | Supabase schema for QUALITY — done except unrelated prod-migration gap |
| 3 | archived | Three Vercel projects, git auto-deploy disabled, env vars set — done |
| 4 | [04-octopus-setup.md](04-octopus-setup.md) | Octopus instance, project, environments, lifecycle, deploy steps, approvals — **pipeline fully working**, nice-to-have notification still open |
| 5 | archived | Build workflow on `main` that packages and hands off to Octopus — done |
| 6 | [06-close-the-loop.md](06-close-the-loop.md) | Retarget in-flight feature branch, update docs |

A phase is done when every checkbox in its file is checked; move it to `archive/` at
that point per the root `CLAUDE.md` convention.
