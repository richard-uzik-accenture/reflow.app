# Phase 4 — Per-file disposition for every remaining scattered doc

Every `.md`/`.html` file not already covered by Phases 1-3, with an explicit keep/update/move/remove
call and why. This is the "treat every single one separately" pass the cleanup asked for.

## Root-level files

- [x] **`CLAUDE.md`** — two doc-index updates handled here; the full factual audit of its
  project-specific section (structure tree, commands, env vars) is Phase 5, not this task:
  - Update "Other docs in this repo" list: add `docs/ARCHITECTURE.md`, add `docs/BACKLOG.md`,
    change `idea.md` reference to `docs/idea.md` (done in Phase 2/3, listed here for completeness)
  - Update the "Active plans currently live under `docs/plans/`" example list
    (`reflow-v1`, `reflow-v2`, `reflow-v3`, `devops-setup`) — after this cleanup, `reflow-v3` is
    fully archived and no longer active; `docs-cleanup` and `playwright-e2e` are. Refresh the
    example names so they don't immediately go stale again (or better: reword to not name specific
    folders at all, since this list rots every time a plan finishes — just say "list that directory
    for the current set").

- [x] **`README.md`** — **Update, don't replace.** Two known staleness points found during this
  audit:
  1. It doesn't mention the `feature → dev → main` branch model or point to the `devops-workflow`
     skill — this was already flagged as unfinished work in
     `docs/plans/devops-setup/06-close-the-loop.md` Task 3, predating this cleanup. Fold that fix
     in here since this plan is already touching doc hygiene, rather than leaving it split across
     two plans.
  2. Cross-check its setup steps still match `CLAUDE.md`'s "Local setup" section (both exist,
     slightly different framing) — decide if one should just link to the other instead of both
     maintaining setup instructions independently. Recommend keeping README as the canonical
     human-facing setup doc and having CLAUDE.md's section link to it instead of duplicating steps.

- [x] **`PRODUCT.md`** — **Keep as-is, do not hand-edit.** Schema-managed by the `impeccable`
  skill per existing CLAUDE.md instruction. Out of scope for this cleanup.

- [x] **`branding.md`** — **Keep as-is.** Binding brand reference, explicitly "not inspiration."
  Out of scope.

- [x] `idea.md` / `features.md` — handled in Phase 2.

## `docs/` top-level loose files

- [x] **`docs/empty-states-audit.md`** — **Remove.** This audit's findings were fully implemented
  (see `docs/plans/empty-states/archive/00-overview.md` through `09-*`, all 9 phases archived).
  It has no ongoing reference value once `docs/ARCHITECTURE.md` exists — an audit of a gap that's
  since been closed is pure history, and the implementation plan's archive already preserves the
  history if anyone needs it. Do not fold into `ARCHITECTURE.md` — it describes an absence, not a
  design.

- [x] **`docs/error-ux-audit.md`** — **Remove**, same reasoning: fully implemented via
  `docs/plans/error-ux-fixes/` (archived in Phase 1). If `docs/ARCHITECTURE.md`'s error-handling
  discussion needs an example of "what error UX used to look like," pull the one or two relevant
  lines forward as prose — don't keep the whole audit file around as a reference doc.

- [x] **`docs/refinement-check-2026-08-21.md`** — **Keep, but relocate.** This isn't a plan (no
  phases, no CLAUDE.md §5 structure) and isn't stale — it records a point-in-time review with
  genuinely still-open items (`docs/plans/swipe-card-refinement/03-supporting-chrome.md`'s 2
  unchecked boxes trace back to this). Move it to `docs/plans/swipe-card-refinement/` (the plan
  folder it's actually about) rather than leaving it loose in `docs/`. Update its own relative
  links (`../src/...` → `../../src/...`, `architecture-review-2026-08-21/architecture-review.html`
  path) after the move.

- [x] **`docs/architecture-review-2026-08-21/architecture-review.html`** — **Keep, move alongside
  the review it belongs to.** It's the visual companion to `refinement-check-2026-08-21.md` — move
  both together into `docs/plans/swipe-card-refinement/architecture-review-2026-08-21/` (or flatten
  the date-stamped folder name since it'll live inside an already-dated plan context — the
  redundant "2026-08-21" prefix in two places is a bit ugly, use your own judgment on trimming it).
  Do not merge its content into `ARCHITECTURE.md` — it's a visual diagram artifact from a specific
  review session, not living documentation; `ARCHITECTURE.md` Task 1.8 already links to the prose
  review that references it.

## Tool-owned docs — confirmed out of scope, listed so nothing is missed

- [x] **`.claude/skills/devops-workflow/SKILL.md`, `.claude/skills/project-specs/SKILL.md`** — skill
  definitions, not project docs. No action.
- [x] **`.agents/skills/**/*.md`** (codebase-design, domain-modeling, frontend-design, grilling,
  improve-codebase-architecture, thermo-nuclear-code-quality-review) — same, no action.
- [x] **`.impeccable/critique/2026-08-09T23-07-52Z__*.md`** — tool-generated critique snapshot
  owned by the `impeccable` skill's own lifecycle. No action — don't delete or move tool-owned
  output, that's the skill's own concern.

## Verify

- [x] `find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "./.agents/*" -not -path "./.claude/*" -not -path "./.impeccable/*"`
      shows: root (`CLAUDE.md`, `README.md`, `PRODUCT.md`, `branding.md`), `docs/ARCHITECTURE.md`,
      `docs/BACKLOG.md`, `docs/idea.md`, and only `docs/plans/**` phase/archive files below that —
      no other loose file remains under `docs/`
- [x] Every internal markdown link touched by a move in this phase still resolves (spot check with
      a relative-link grep, not just visual read-through)
