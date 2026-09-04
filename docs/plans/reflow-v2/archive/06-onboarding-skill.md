# Feature F — Project-state onboarding skill

> **Archived 2026-09-04 as superseded — never built.** `/reflow-status` does not exist. The
> briefing it would have assembled is now covered by `docs/ARCHITECTURE.md` (data model,
> module map, cross-cutting patterns), `docs/BACKLOG.md` (what's open), and the
> `project-specs` skill (stack summary) — all of which landed after this was written.

**Request:** there's no quick way for a fresh session to understand the project's state. Provide one.

**Goal:** a user-invocable Claude Code skill, `/reflow-status`, that in a fresh session produces an accurate, current briefing of the project: what Reflow is, the stack, the architecture, what's built, what's in flight (reflow-v2), and where the authoritative docs live — assembled from live repo signals, not a frozen snapshot that rots.

## Why a skill, not a static doc

A static `STATE.md` goes stale the moment code moves. A skill re-derives the briefing each run from files that are already the source of truth (`PRODUCT.md`, `branding.md`, the plan folders, `package.json`, migrations, git log), so it stays correct for free.

## Deliverable: `.claude/skills/reflow-status/SKILL.md`

Frontmatter + instructions. The skill, when invoked, directs the assistant to:

1. **Read the anchors** (in this order, stop early if enough): `PRODUCT.md`, `branding.md`, `docs/plans/reflow-v1/archive/00-overview.md`, `docs/plans/reflow-v2/00-overview.md`, `README.md`.
2. **Sample the code reality:** `package.json` (stack + scripts), `supabase/migrations/*` (data model as actually migrated), `src/` component/hook/lib inventory (one-line each), and the most recent ~10 `git log` entries for momentum.
3. **Diff intent vs. state:** which reflow-v1 phases are done (present in `src/`), which reflow-v2 features are planned vs. started (cross-reference the plan files against existing files).
4. **Emit a fixed-shape briefing:**
   - **What Reflow is** (one paragraph, from PRODUCT.md).
   - **Stack & architecture** (React/Vite SPA → Supabase, RLS, no API tier).
   - **Data model** (columns actually in the latest migration).
   - **What's built** (v1 phases 1–10).
   - **In flight** (reflow-v2 A–F with per-feature status: planned / in-progress / done).
   - **Brand guardrails** (the non-negotiables: coral only at decisions, lowercase wordmark, stroke icons, motion timings) so a fresh session doesn't violate them.
   - **Where to look next** (pointer to the exact plan file per active task).
   - **Open decisions** (from `11-open-decisions.md`).

## Skill design constraints

- **Read-only.** The skill never edits; it only reports. State that explicitly in the instructions.
- **Cheap.** Bias toward the anchor docs; only sample `src/` breadth if the docs are stale or missing. Cap the git log.
- **Self-correcting note:** the skill instructs the assistant to flag any place where a doc and the code disagree (e.g. a plan says "done" but the file is absent), rather than trusting the doc blindly — this is what makes it a *state* skill, not a doc re-print.
- **Voice:** the briefing itself is plain and technical (this is developer-facing), not the app's calm-friend product voice — don't confuse the two registers.

## Deliverables checklist

- [ ] `.claude/skills/reflow-status/SKILL.md` with `name: reflow-status` and a description that triggers on "project state / what's the status / bring me up to speed on reflow."
- [ ] Fixed briefing shape as above.
- [ ] Read-only + self-correcting (doc-vs-code disagreement flagging) explicitly instructed.
- [ ] Verified by invoking `/reflow-status` in a fresh session and confirming the briefing matches reality.

## Test it yourself

1. In a fresh session, run `/reflow-status`.
2. Confirm the briefing names the correct stack, lists the migration columns actually present, marks reflow-v2 features by real status, and restates the brand guardrails.
3. Introduce a deliberate drift (e.g. delete a planned file) and re-run → the skill flags the mismatch rather than parroting the plan.
