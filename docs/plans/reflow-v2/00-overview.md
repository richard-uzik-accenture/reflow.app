# Reflow v2 — Implementation Plan Overview

Six deliverables, built on the existing Phase 1–10 Reflow app. Each is a **complete package**: schema/code, styling, brand adherence, motion, and docs. The brand system (`branding.md`) and product mechanics (`PRODUCT.md`) are **locked** — nothing here re-litigates them.

## Source of the work

`features.md` at the project root, plus one user-added deliverable (a fresh-session project-state skill).

| # | Feature | Plan file |
|---|---|---|
| A | Fix mobile view (forensic responsiveness review + fixes) | [01-mobile-forensics.md](01-mobile-forensics.md) |
| B | Edit an existing task (pencil affordance + shared modal) | [02-task-edit.md](02-task-edit.md) |
| C | Tags on tasks (freeform + autocomplete) | [03-tags.md](03-tags.md) |
| D | PWA install prompt (deferred banner + iOS sheet) | [04-pwa-install.md](archive/04-pwa-install.md) (done) |
| E | Optional due time (today-view edit only) | [05-due-time.md](archive/05-due-time.md) (done) |
| F | Project-state onboarding skill (fresh-session explainer) | [06-onboarding-skill.md](06-onboarding-skill.md) |

## Confirmed product decisions (do not re-derive)

- **Tags:** freeform text with autocomplete from previously-used tags. No management screen, no tag table. Stored as a `tags text[]` column on `tasks`.
- **PWA prompt:** deferred, one-time, dismissible. Android/Chrome uses captured `beforeinstallprompt`; iOS Safari gets a one-time "add to home screen" instruction sheet. Never nags again.
## Shared foundations (build first, before B/C)

1. **Migration `0002_task_fields.sql`** — adds `tags text[] not null default '{}'` to `public.tasks`. Additive only; RLS unchanged. Backfill is implicit (defaults).
2. **`Task` type + data layer** (`src/lib/tasks.ts`) — extend the interface with `tags: string[]`; add `updateTask(taskId, patch)` covering title/tags. `devMock.ts` and `mockTasksApi` gain matching fields + an `update` method.
3. **Shared `TaskModal`** — generalize `AddTaskFab`'s inline modal into a reusable `TaskModal` (mode: `'add' | 'edit'`) that hosts title + tags. Features B and C render through it, sharing one styled, animated, accessible surface.

Building these three first means B and C become thin. Do them in this order: **A → foundations → C → B → D → F** (A is independent and highest-user-pain; F is independent and can slot anywhere).

## Global constraints (inherited, still binding)

- **Coral only at decision moments.** Tags, edit pencil, PWA banner, autocomplete — all use violet/dusk/mist, never coral.
- **Stroke icons only**, 24px grid, 1.75px stroke, built from the bar/chevron/circle atoms. New icons (pencil, clock, tag) follow this exactly.
- **Motion:** reuse the existing `transitions.ts` vocabulary (`reflowSpring`, `stepVariants`) and `--duration-*` tokens. Every new framer-motion surface threads `useReducedMotion`, matching the established pattern.
- **Tone of voice:** lowercase, calm, no exclamation marks. New copy ("edit this," "tag it," "add to home screen," "was 2pm") stays in register.
- **Optimistic + rollback + inline error**: every new mutation follows the existing `useTasks` pattern (optimistic set, `catch` rolls back, sets a brand-voiced error).

## Verification contract

Each plan file ends with **"Test it yourself"** steps runnable in `VITE_DEV_MODE=true` (no Supabase needed) and, where logic is non-trivial (tag normalization, install-prompt gating), a Vitest unit test written first. Pure logic gets real tests; UI gets manual browser steps + one Playwright pass on iPhone-viewport for feature A.
