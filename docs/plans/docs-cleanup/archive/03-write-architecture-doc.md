# Phase 3 — Write `docs/ARCHITECTURE.md`

The gap this plan exists to fix: there is currently no single doc that explains how the app
actually works. `PRODUCT.md`/`branding.md` cover product and brand; `CLAUDE.md` covers the file
tree at a glance; everything about *how the pieces fit together* — data model, the
optimistic-mutation pattern, the realtime merge, the compare/duel state machine, the rank-gap
scheme — is scattered across 15+ archived plan files, each capturing one moment in time, several
already contradicted by later phases (e.g. `reflow-v1/archive/04-done-and-drop.md`'s original
design vs. what `error-ux-fixes` later changed about rollback behavior).

**Source this from current code, not from the old plans.** The plans are useful for *why* a
decision was made (cite them for rationale), but the doc's factual claims (function names, file
locations, current behavior) must be verified against `src/` as of now — copying stale claims
from a 3-month-old phase file forward would recreate the exact problem this cleanup is solving.

## Task 1: Draft the doc

- [x] Create `docs/ARCHITECTURE.md` with these sections (adjust headings if the code doesn't
      cleanly map to this shape — this is a starting outline, not a template to force-fit):

  1. **Data model** — the `tasks` table shape (columns, what each means), pulled from
     `supabase/migrations/*.sql` in filename order (later migrations override earlier column
     assumptions — read all of them, not just the first).
  2. **Module map** — one paragraph per `src/lib/*.ts` file: what it owns, and critically,
     which are pure/tested (`ranking.ts`, `compare.ts`, `triage.ts`, `tags.ts`, `swipe.ts`,
     `realtimeMerge.ts`, `transitions.ts`, `pwa.ts`) vs. which do I/O (`tasks.ts`, `supabase.ts`,
     `devMock.ts`). State the rule this split enforces (business logic has no React/Supabase
     dependency, lives next to its `*.test.ts`) rather than just listing files.
  3. **The optimistic-mutation pattern** — `useTasks.ts`'s repeated shape (snapshot → optimistic
     apply → rollback on error → toast). Name it once here so future phases can say "follows the
     existing optimistic-mutation pattern" instead of re-explaining it (this shape was flagged as
     worth naming/extracting in `docs/refinement-check-2026-08-21.md` section 2.3 — note that as
     still-open follow-up, don't resolve it here).
  4. **Realtime sync** — how `realtimeMerge.ts` reconciles incoming Supabase Realtime rows against
     local optimistic state, and the `preReorderTasks` ref guard that suppresses realtime
     interference mid-drag.
  5. **Ranking & the compare-duel mechanic** — the rank-gap insertion scheme (`ranking.ts`), the
     pure binary-search comparator (`compare.ts`), and how `useCompareInsertion.ts` +
     `CompareDuel.tsx` wire it to UI (fling physics via `swipe.ts`'s `planDuelFling`, split from
     `decideSwipeDirection` per the `improve-codebase-architecture` scan already applied).
  6. **Morning flow** — the three-step state machine (leftover triage → brain dump → merge),
     `triage.ts`'s keep/drop logic, `useMorningFlow.ts`.
  7. **Auth & dev mode** — real Supabase auth vs. `VITE_DEV_MODE` bypass (`devMock.ts`), why it
     exists (browser automation / UI checks without a Supabase project).
  8. **Known follow-ups** — a short pointer list (not full explanations) to open architectural
     items that exist but aren't scheduled: the `useTasks` optimistic-mutation-primitive extraction
     (refinement-check 2.3), `Today.tsx`'s duplicated failed-row handlers (refinement-check 2.2).
     Link to `docs/refinement-check-2026-08-21.md` rather than duplicating its content.

- [x] For every factual claim (file path, function name, column name), verify it against current
      `src/` / `supabase/migrations/` — do not transcribe from an archived plan file without
      checking it's still accurate.

## Task 2: Cross-link from existing docs

- [x] Add `docs/ARCHITECTURE.md` to `CLAUDE.md`'s "Other docs in this repo" list with a one-line
      description
- [x] Add a pointer to it from `README.md` if `README.md` doesn't already explain module
      structure in a way this doc now supersedes (check for duplication, don't maintain the same
      explanation in two places — if README has a "how it works" section, trim it to a link instead)

## Verify

- [x] A fresh reader (no memory of the archived plans) can answer from `docs/ARCHITECTURE.md`
      alone: "where does rank math live," "how does realtime avoid clobbering an in-progress drag,"
      "what's the difference between a Reflow task's `tags` and title fields and why does dev mode
      exist"
- [x] No claim in the new doc contradicts current `src/` (spot-check 3-4 claims against the actual
      files)
