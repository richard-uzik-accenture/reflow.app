# Docs Cleanup — Overview

The project has ~75 markdown files under `docs/plans/` alone, plus a scatter of
loose files at the repo root and in `docs/`. Most of `docs/plans/` is finished
implementation history, not documentation — there's no single place that
answers "how does this app actually work today." This plan fixes that:
archive what's done, consolidate what's still open into one backlog, add the
one architecture doc that's been missing, and give every scattered `.md` file
an explicit disposition.

## Decisions locked in with the user before this plan was written

- Fully-checked plan files get moved to their `archive/` folders now (pure
  relocation, no content edits).
- `idea.md` is kept, not deleted — relocated and given a short framing note
  marking it as the project's inception document, not current state.
- A new `docs/BACKLOG.md` replaces `features.md` +
  `docs/plans/reflow-todos/*` — but only carries items **verified as not yet
  implemented**. Anything already shipped gets dropped, not copied over
  wholesale. See the verification table in Phase 2.
- A new `docs/ARCHITECTURE.md` is added as the living "how this app works"
  reference. `docs/plans/` goes back to holding only active/not-yet-started
  work once this plan lands.

## Phases

| Phase | File | What it does | Status |
|---|---|---|---|
| 1 | [archive/01-archive-finished-plans.md](archive/01-archive-finished-plans.md) | Move every fully-checked plan file/folder to its `archive/`, fix the one broken cross-reference found along the way | Done |
| 2 | [archive/02-consolidate-backlog.md](archive/02-consolidate-backlog.md) | Build `docs/BACKLOG.md` from verified-open items only; retire `features.md`, `idea.md` (relocate+reframe), `docs/plans/reflow-todos/` | Done |
| 3 | [archive/03-write-architecture-doc.md](archive/03-write-architecture-doc.md) | Write `docs/ARCHITECTURE.md`: data model, module map, cross-cutting patterns — derived from code, not from plan files | Done |
| 4 | [archive/04-loose-file-disposition.md](archive/04-loose-file-disposition.md) | Per-file decision (keep/update/move/remove) for every other scattered `.md`/`.html` file found in the audit, including root-level docs and `.impeccable/`, `docs/architecture-review-2026-08-21/` | Done |
| 5 | [archive/05-audit-claude-md.md](archive/05-audit-claude-md.md) | Full accuracy audit of CLAUDE.md's project-specific section (project structure tree, commands, env vars, migrations, deployment) against current code — not just the doc-index pointers touched in Phase 4 | Done |
| 6 | [06-create-docs-maintenance-skill.md](06-create-docs-maintenance-skill.md) | Create a `docs-maintenance` skill, referenced from CLAUDE.md, that keeps `ARCHITECTURE.md`/`BACKLOG.md`/CLAUDE.md's structure tree in sync going forward — so this cleanup is a one-time fix, not a recurring one | Skill built and wired in; Task 4's live dry-run deferred to the next real feature/fix (no `src/` change landed in this session to trigger it against) |

## Full file inventory (audit result, for reference)

Root-level:
- `CLAUDE.md` — behavioral guidelines (§1-5) kept as-is, out of scope; the project-specific section
  (stack, structure, commands, env vars) gets a full accuracy audit, Phase 5
- `README.md` — keep, minor update in Phase 4 (branch-model pointer already partially stale)
- `PRODUCT.md` — keep as-is (schema-managed by `impeccable` skill, binding)
- `branding.md` — keep as-is (binding brand reference)
- `idea.md` — relocate + reframe, Phase 2
- `features.md` — retire, Phase 2

`docs/` top-level loose files:
- `docs/empty-states-audit.md` — superseded (implemented, see `docs/plans/empty-states/archive/`), Phase 4
- `docs/error-ux-audit.md` — superseded (implemented, see `docs/plans/error-ux-fixes/`), Phase 4
- `docs/refinement-check-2026-08-21.md` — point-in-time review record, Phase 4
- `docs/architecture-review-2026-08-21/architecture-review.html` — point-in-time artifact, Phase 4

`docs/plans/*` — see Phase 1 for the done/not-done split; full per-folder detail there.

Other tool-owned docs (not touched by this plan — out of scope, listed so nothing is missed):
- `.claude/skills/**/SKILL.md`, `.agents/skills/**/*.md` — skill definitions, not project docs
- `.impeccable/critique/*.md` — tool-generated critique snapshot owned by the `impeccable` skill

## Done convention

Same as every other plan (`CLAUDE.md` §5): a phase is done when every
checkbox in its file is checked, then move it to `archive/`. Archive this
`00-overview.md` once all six phases are done. Unlike most plans here,
this one is explicitly designed not to need repeating: Phase 6 leaves a
skill behind whose entire job is preventing the drift that made Phases 1-5
necessary in the first place.
