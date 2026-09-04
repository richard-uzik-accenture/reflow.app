# Phase 2 — Consolidate the backlog

Replace three unstructured scratch files (`features.md`, `docs/plans/reflow-todos/todo.md`,
`docs/plans/reflow-todos/ultimate-todo.txt`) with one `docs/BACKLOG.md` that carries **only
verified-still-open** items. A code audit (run as part of this cleanup) checked every candidate
item against current `src/` — most of what these files list is already shipped. Do not
copy items over just because they appear in the source files.

## Verification table (source of truth for what goes in / gets dropped)

| Item (paraphrased) | Source | Verdict | Action |
|---|---|---|---|
| Reordering creates duplicate tasks + selects text; "forensic audit" | ultimate-todo.txt | Text-selection: **fixed** (`user-select:none` throughout, `global.css`). Duplicate-on-reorder: no bug found in current `commitReorder`/reorder path, no repro on hand. | Drop text-selection sub-claim. Keep a trimmed "confirm no duplicate-task-on-reorder regression" as a low-priority watch item only if it recurs — otherwise drop entirely. |
| Loading skeletons | ultimate-todo.txt | **Done** — `TaskListSkeleton` renders on `loading` in `Today.tsx` | Drop |
| Visible feedback/confirmations on each action | ultimate-todo.txt | **Done** — `showToast(...)` on complete/drop/insert/edit in `Today.tsx` | Drop |
| "Duel rework" | ultimate-todo.txt | **Done** — `stays-ahead`/`loses-spot` rework already landed in `CompareDuel.tsx` | Drop |
| "Seamless flow between screens" | ultimate-todo.txt | **Done** — `AnimatePresence` + `pageVariants` in `App.tsx` | Drop |
| "Toast messages disappear too fast" | ultimate-todo.txt | Toast system now exists (`Toast.tsx`/`useToast.ts`, success 4375ms / error 6250ms) — audit written before this existed | **Keep, reframed**: not "build toasts" (done) but "confirm toast duration is long enough" — genuinely still a subjective tuning call nobody has closed out |
| Dynamic tag filter buttons (with animation) | todo.md | **Not done** — no filter UI found anywhere in `src/` | **Keep** |
| Fix tag contrast on dark theme | todo.md | Tag chip already uses theme-aware tokens (`--mist`/`--dusk`/`--haze`); can't confirm actual rendered contrast without a visual pass | **Keep, reframed**: "spot-check tag-chip contrast in dark mode" — quick verification task, not a rebuild |
| Reposition tag to right side, floating, in task row | todo.md | **Not done** — tags currently render stacked below the title, not floating right | **Keep** |
| Better filter icon | todo.md | **Not done** — no filter icon exists yet (blocked on the filter feature above anyway) | **Keep, merged into the tag-filter item** (no point tracking the icon separately from the feature it belongs to) |
| Conflicting popup on adding a task row | todo.md | **Done** — fixed by the `fix: remove redundant placed-confirmation popup on task add` commit already on `dev` | Drop |
| "Get rid of Supabase" | todo.md | Still the backend by design (`src/lib/supabase.ts`); this is a one-line venting note, not a scoped request — no alternative backend, no migration plan, no product reason given anywhere | **Drop as a backlog item.** If the user wants to revisit backend choice, that's a product conversation, not a to-do line — flag this omission to the user rather than inventing scope for it. |
| Mobile forensics: pinch-zoom, diagonal swipe, focus-zoom, text-select, drag-stuck-state, tag-submit (6 items) | idea.md "issues" section | **All 6 done** — see `docs/plans/reflow-v3/archive/` after Phase 1 | Drop all 6 |
| CLAUDE.md rework, empty states, error states, OAuth, logo/favicon | todo.md (marked "- done") | Already marked done by the user | Drop (already-acknowledged done items, no reason to carry forward) |

## Task 1: Write `docs/BACKLOG.md`

- [x] Create `docs/BACKLOG.md` containing only the "Keep" rows above, organized as a flat
      checklist grouped by rough theme (UI polish / verification-only spot-checks). Suggested shape:

  ```markdown
  # Backlog

  Open ideas and unresolved polish items not yet turned into a phase plan. When one of these
  becomes real scoped work, promote it into its own `docs/plans/<name>/` folder per CLAUDE.md §5
  and remove it from this list — don't track it in both places.

  ## Open features

  - [x] Dynamic tag filter: derive clickable filter chips from tasks' active tags, animate them in;
        needs a matching filter icon (see `src/components/icons/`)
  - [x] Reposition tags in `TaskRow` to float on the right side instead of stacking under the title

  ## Verification / spot-checks (likely already fine, unconfirmed)

  - [x] Confirm toast display duration (currently 4375ms success / 6250ms error in `useToast.ts`)
        feels long enough in real use — raised once as "disappears too fast," never re-confirmed
        after the toast system was built
  - [x] Spot-check tag-chip contrast in dark theme (tokens are theme-aware; rendered contrast
        unverified)

  ## Open product question (not a scoped task)

  - The multi-list brainstorm (`docs/plans/multi-list/00-brainstorm.md`) has 6 unresolved open
    questions blocking any implementation start — see that file directly, don't duplicate its
    questions here.
  ```

  (Exact wording is a starting point — keep the user's voice/tone where their original phrasing was
  clearer than the paraphrase above.)

## Task 2: Retire `docs/plans/reflow-todos/`

- [x] Delete `docs/plans/reflow-todos/todo.md` and `docs/plans/reflow-todos/ultimate-todo.txt`
      (content fully absorbed into `docs/BACKLOG.md` or dropped as verified-done, per the table above)
- [x] Delete the now-empty `docs/plans/reflow-todos/` folder

## Task 3: Retire `features.md`

- [x] Delete `features.md` from repo root (content fully absorbed: shipped items dropped, open
      mobile-forensics items already superseded by `reflow-v3`, the "issues" section is where the
      6 mobile items in the table above came from)

## Task 4: Relocate and reframe `idea.md`

- [x] Move `idea.md` → `docs/idea.md` (out of the repo root, alongside the other project-context
      docs rather than mixed in with config files)
- [x] Add a one-line framing note at the top marking it as historical:

  ```markdown
  # App Idea: Interrupt-Resilient Day Planner

  > Historical: this is the original problem-framing draft that `PRODUCT.md` was built from.
  > It predates the product's current shape — read `PRODUCT.md` for what's actually true today.
  ```

  (This preserves the existing convention in CLAUDE.md's file list, which already describes
  `idea.md` as "historical record" — this task makes that framing visible in the file itself,
  not just in CLAUDE.md's description of it.)
- [x] Update the one reference to `idea.md` in root `CLAUDE.md`'s "Other docs in this repo" section
      to point at `docs/idea.md`

## Verify

- [x] `docs/BACKLOG.md` exists and contains no item already provably done in current `src/`
- [x] `features.md` and `docs/plans/reflow-todos/` no longer exist
- [x] `docs/idea.md` exists (root `idea.md` does not); `CLAUDE.md` points at the new path
