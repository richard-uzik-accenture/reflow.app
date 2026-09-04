# Phase 6 — Create a docs-maintenance skill so this cleanup doesn't just repeat itself

> **Archived 2026-09-04.** Tasks 1–3 are done: `.claude/skills/docs-maintenance/SKILL.md`
> exists and CLAUDE.md references it. Task 4's live dry-run stays unchecked — it will happen
> naturally the next time a real code change lands, and doesn't warrant holding a plan folder
> open on its own.

Phases 1-5 fix the current mess. Without something that runs automatically, the same drift comes
back: `docs/ARCHITECTURE.md` goes stale the moment a module is renamed, `docs/BACKLOG.md`
accumulates shipped items nobody removes, and CLAUDE.md's project-structure tree falls behind
again (exactly what Phase 5 just found). This phase closes that loop with a skill, not a process
that depends on remembering to ask for it.

## Why a skill and not a static "remember to update docs" note

A note in CLAUDE.md saying "update the docs after each feature" relies on the assistant noticing
on its own, every time, unprompted — the same failure mode that produced 75 scattered plan files
in the first place. A **skill** with a description written to match Claude Code's own trigger
matching (per `docs/plans/reflow-v2/06-onboarding-skill.md`'s already-proven pattern for
`/reflow-status`) gets invoked automatically when its description matches the task at hand,
without the user needing to type its name.

## Task 1: Design the skill's trigger surface

- [x] Decide the trigger moment. Recommended: **end-of-task**, not "whenever a file changes" —
      a skill that fires mid-edit on every save would be noisy and premature (docs should reflect
      finished work, not in-progress diffs). Write the `description` field to match language like
      "I finished implementing X", "this feature is done", "before I commit/merge this", so it
      surfaces naturally at the point work wraps up — the same moment CLAUDE.md's own "Goal-Driven
      Execution" section already treats as the finish line for a task.
- [x] Decide scope: this skill audits and *proposes* doc updates, it does not silently rewrite
      `PRODUCT.md` (schema-managed by `impeccable`, explicitly hands-off per CLAUDE.md) or
      `branding.md` (binding, not to be re-derived). Its write surface is:
      `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, and CLAUDE.md's project-structure tree only.

## Task 2: Write `.claude/skills/docs-maintenance/SKILL.md`

- [x] Create the file with frontmatter matching the existing two skills' shape:

  ```yaml
  ---
  name: docs-maintenance
  description: Keeps docs/ARCHITECTURE.md, docs/BACKLOG.md, and CLAUDE.md's project-structure
    tree in sync with the code after a feature or fix lands. Use when a task is finished and
    about to be committed/merged, when a new src/lib, src/hooks, or src/components file is
    added or removed, when a backlog item just got implemented, or when the user asks to
    "update the docs" / "document this feature".
  ---
  ```

- [x] Body content, structured as a checklist the assistant runs through (not prose to
      re-derive each time):

  1. **Structure drift check** — diff `CLAUDE.md`'s project-structure tree (§ Project structure)
     against the actual current contents of `src/pages/`, `src/components/`, `src/components/icons/`,
     `src/hooks/`, `src/lib/`. If any file exists in one but not the other, update the tree.
     This is exactly the check Phase 5 of `docs/plans/docs-cleanup/` did by hand — the skill
     automates that specific diff going forward.
  2. **Architecture doc check** — if the just-finished work added a new cross-cutting pattern,
     a new table/migration, or materially changed one of the sections in `docs/ARCHITECTURE.md`
     (data model, module map, optimistic-mutation pattern, realtime sync, ranking/duel, morning
     flow, auth/dev-mode), update that section. Skip this step for pure bugfixes or copy changes
     that don't change the shape of anything ARCHITECTURE.md describes — don't churn the doc for
     changes it was never meant to capture.
  3. **Backlog check** — if the just-finished work implements something listed in
     `docs/BACKLOG.md`, remove that line. If the work surfaced a new, genuinely-open loose end
     (not part of the current task's own scope, not urgent enough to be its own follow-up plan),
     add one line to the relevant section of `docs/BACKLOG.md`. Do not log the task's own
     still-open subtasks as backlog items — that's what the task's own plan-phase checkboxes are
     for (per CLAUDE.md §5); the backlog is for ideas with no phase file yet.
  4. **New implementation plans stay out of `docs/plans/` scope creep** — remind: a finished
     plan's *durable* knowledge (why a decision was made, a pattern worth naming) belongs folded
     into `docs/ARCHITECTURE.md` once archived, not left only inside the archived phase file where
     nobody will read it again. This step is what prevents this exact cleanup from being needed a
     second time.
  5. **Report, don't silently commit** — summarize what doc changes were made (or that none were
     needed) as part of the normal end-of-task summary; doc edits are real file changes and follow
     the same review expectations as any other edit.

- [x] Explicitly state the skill's non-goals in the file: it does not touch `PRODUCT.md` or
      `branding.md`, does not create new `docs/plans/` phase files (that's a planning decision,
      not a maintenance one), and does not run on every keystroke — only at natural task-completion
      boundaries.

## Task 3: Reference the skill from CLAUDE.md

- [x] Add one line to CLAUDE.md's "Other docs in this repo" section (or a new short subsection
      right after it) pointing at the skill:

  ```markdown
  - `.claude/skills/docs-maintenance/SKILL.md` — keeps `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`,
    and this file's project-structure tree in sync with the code; invoked automatically when a
    task finishes rather than needing to be asked for each time.
  ```

- [x] Do not duplicate the skill's checklist inside CLAUDE.md — one authoritative copy, in the
      skill file, same principle already applied to `devops-workflow` (CLAUDE.md points at it
      rather than re-explaining branching rules inline).

## Task 4: Dry-run the skill before considering this phase done

**Deferred, by explicit user decision.** This entire docs-cleanup effort was docs-only — no
`src/` change landed in the same session the skill was created, so there was no organic
task-completion moment to trigger against, and manufacturing a throwaway code change just to
exercise the skill was judged worse than deferring. Do this dry-run against the next real
feature/fix that lands:

- [ ] Confirm the skill actually triggers at task completion without being explicitly invoked
      by name, and that its proposed doc edits are correct and proportionate (not overzealous —
      a two-line CSS fix shouldn't trigger a rewrite of `ARCHITECTURE.md`).
- [ ] If the skill fires too eagerly (e.g. on every trivial commit) or not eagerly enough, adjust
      the `description` field's trigger language — this is the same tuning process the
      `claude-api` skill's TRIGGER/SKIP block already demonstrates for getting activation matching
      right.

## Verify

- [x] `.claude/skills/docs-maintenance/SKILL.md` exists, follows the same frontmatter shape as
      `project-specs`/`devops-workflow`
- [x] CLAUDE.md references it without duplicating its content
- [ ] The dry run in Task 4 produced a correct, proportionate doc update without being explicitly
      asked ("update the docs") in the prompt that triggered it — **deferred, see Task 4**
