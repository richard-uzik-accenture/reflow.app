# Phase 1 — Archive finished plans

Pure relocation. No content edits except one broken cross-reference fix
(Task 2). Every move is `git mv` so history follows the file.

## Task 1: Move fully-checked plan files to `archive/`

Verified by checkbox count (`- [x]` occurrences remaining) — each of these
has **zero** unchecked boxes, or is a prose overview whose own status line
says "done":

- [x] `docs/plans/error-ux-fixes/00-overview.md` → `docs/plans/error-ux-fixes/archive/00-overview.md`
      (all 4 phases already archived; this overview says "All phases done" but was never moved itself)
- [x] `docs/plans/devops-setup/02-supabase-preprod.md` → `docs/plans/devops-setup/archive/02-supabase-preprod.md`
      (5/5 checked)
- [x] `docs/plans/devops-setup/04-octopus-setup.md` → `docs/plans/devops-setup/archive/04-octopus-setup.md`
      (12/12 checked)

## Task 2: Leave genuinely-active plans where they are

Confirmed still open (unchecked boxes present) — **do not move**:

- `docs/plans/devops-setup/00-overview.md` (index; archive only once Phase 6 below is done)
- `docs/plans/devops-setup/06-close-the-loop.md` (0/4 checked)
- `docs/plans/reflow-v1/09-multi-device-sync.md` (0/12 — despite being numbered as part of "v1", this phase was never built; still real)
- `docs/plans/reflow-v1/10-brand-polish.md` (0/29 — same)
- `docs/plans/reflow-v2/00-overview.md` (index; `06-onboarding-skill.md` still open)
- `docs/plans/reflow-v2/06-onboarding-skill.md` (0/4 checked)
- `docs/plans/reflow-v3/00-overview.md` (index)
- `docs/plans/reflow-v3/03-no-input-focus-zoom.md`, `04-prevent-text-selection.md`,
  `05-fix-drag-drop-stuck-state.md`, `06-mobile-tag-submit.md` — **checkboxes say unchecked, but a
  code audit run in this cleanup found all 6 corresponding features already implemented in current
  `src/`** (pinch-zoom, diagonal swipe, input zoom, text selection, drag-stuck-state, mobile tag
  submit are all done — see Phase 2's verification table). These files are stale trackers, not open
  work. Recommend: check their boxes against reality, then archive the whole `reflow-v3` folder
  including `00-overview.md`. Do this as part of this task, not a future session — the code already
  matches the plan, only the paperwork is behind.
- `docs/plans/swipe-card-refinement/00-overview.md` (index)
- `docs/plans/swipe-card-refinement/03-supporting-chrome.md` (2/6 unchecked — genuinely incomplete)
- `docs/plans/multi-list/00-brainstorm.md` — explicitly pre-planning, not a phase plan (has its own
  "Status: brainstorm / pre-planning" line). Leave in place; it's the one folder in `plans/` that's
  correctly *not* phase-structured.
- `docs/plans/playwright-e2e/*` — new, untouched, 0% started. Leave as-is (this is presumably the
  work item that prompted noticing the folder was already messy — it's correctly placed).
- `docs/plans/drag-drop-fixes/testing-guide.md` — not a phase file (no checkboxes), a standalone
  manual-QA script for already-shipped drag-drop fixes. Verified fixes are live in code (Phase 2
  audit). Recommend moving this into `docs/plans/reflow-v3/archive/` alongside the phase it
  validates, since `drag-drop-fixes/` as a folder otherwise sits empty. Do this as part of Task 3
  below rather than leaving an orphaned single-file folder.
- `docs/plans/reflow-todos/*` — disposed of in Phase 2, not here.

## Task 3: Fold `reflow-v3` and `drag-drop-fixes` together once verified

- [x] Re-check all boxes in `docs/plans/reflow-v3/03-no-input-focus-zoom.md`,
      `04-prevent-text-selection.md`, `05-fix-drag-drop-stuck-state.md`,
      `06-mobile-tag-submit.md` against the current running app (quick manual spot-check per the
      file's own "Test it yourself" section — don't just trust the code audit blindly for
      user-facing behavior).
- [x] Move all four files + `00-overview.md` to `docs/plans/reflow-v3/archive/`
- [x] Move `docs/plans/drag-drop-fixes/testing-guide.md` to `docs/plans/reflow-v3/archive/testing-guide.md`
      (it documents the manual QA for phase 05's fix)
- [x] Delete the now-empty `docs/plans/drag-drop-fixes/` folder

## Task 4: Fix broken cross-reference found during the audit

- [x] `docs/plans/reflow-v1/09-multi-device-sync.md` and `docs/plans/reflow-v2/06-onboarding-skill.md`
      both reference `docs/plans/reflow/00-overview.md` — **this path has never existed** (the real
      folder is `reflow-v1`, and it has no single top-level `00-overview.md` of its own — the closest
      analog was archived at `docs/plans/reflow-v1/archive/00-overview.md`). Fix both references to
      point at `docs/plans/reflow-v1/archive/00-overview.md`.

## Verify

- [x] `find docs/plans -maxdepth 2 -type f -name "*.md" ! -path "*/archive/*"` shows only:
      `devops-setup/00-overview.md`, `devops-setup/06-close-the-loop.md`,
      `reflow-v1/09-multi-device-sync.md`, `reflow-v1/10-brand-polish.md`,
      `reflow-v2/00-overview.md`, `reflow-v2/06-onboarding-skill.md`,
      `multi-list/00-brainstorm.md`, `playwright-e2e/*` (all 6 files, none done yet),
      `swipe-card-refinement/00-overview.md`, `swipe-card-refinement/03-supporting-chrome.md`
- [x] No file anywhere still references the dead `docs/plans/reflow/00-overview.md` path
      (`grep -r "plans/reflow/00-overview" docs/` returns nothing)
