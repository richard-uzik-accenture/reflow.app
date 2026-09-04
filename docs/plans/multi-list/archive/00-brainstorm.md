# Multi-List Feature — Brainstorm & Decisions

> Status: **brainstorm / pre-planning** — no implementation committed yet.
> Written: 2026-08-26. Review before starting any phase work.

---

## The Idea

A user's friend observed that he doesn't keep one todo list for everything — he makes small lists
by topic. The question: can Reflow support multiple lists without undermining the core product?

---

## What Was Ruled Out

### Option A — Lists as tag filters over one unified list
Reuse `tags text[]` as "list" identities. Cheapest (no schema change), but:
- Many-to-many (a task can be in multiple "lists" simultaneously) — doesn't match "separate lists."
- Morning flow / rollover / compare-duel still operate globally over all tasks — multi-list is just
  a display lens, not a real partition.
- Ruled out: feels like feature theater, doesn't solve the real user need.

### Option B — True separate lists, each with independent ranking + morning flow
Each list gets its own rank sequence, its own morning triage, its own compare-duel.
- Directly conflicts with Product Principle 1 (low daily effort).
- Four morning flows every day is *more* discipline than the app currently requires.
- Ruled out: goes against the core product positioning.

---

## The Chosen Direction: Two Distinct List Types

### Type 1 — Reflow (daily plan, unchanged in mechanics)
- Exactly what exists today: one ordered, priority-ranked list per day.
- Morning flow (leftover triage → brain dump → merge) remains intact with **one addition** (see below).
- **Remove `due_time`** — same-day urgency signals don't belong at this grain; rank handles urgency.
- **Remove `tags`** — simplifies the data model and the Reflow UX; tags move to long-term lists.
- Nothing in the duel-combat mechanic or rollover logic changes.

### Type 2 — Long-Term Lists (new)
- A persistent backlog the user can name and manage independently of any given day.
- No morning triage, no rollover — tasks live here until deliberately acted on.
- **Add `due_date`** (date, not time) — appropriate grain for backlog items.
- **Tags belong here** — tags are the filtering/grouping key *within* a long-term list.
  (e.g. a "Projects" long-term list filtered by `#home`, `#work`, `#side` etc.)
- Duel-combat available per long-term list, operating only over tasks filtered by the active tag.
- Multiple long-term lists can exist per user (named, independently ranked).

---

## Morning Flow: New Phase (Pull from Long-Term Lists)

A new phase is inserted between **leftover triage** and **brain dump**:

> **Phase 1.5 — Pull from long-term lists**
> Shows all long-term lists, expandable to task level, with checkboxes.
> A "Add to today" button promotes selected tasks into today's Reflow list.

- Uses checkbox + button interaction (not a new swipe gesture — consistent with fixed vocabulary).
- Promoted tasks are a **reference** to the original long-term-list row, not a copy.
- UI note: tasks in long-term lists should show `due_date` to help the user decide what to pull.

---

## The Reference Mechanic (critical design decision)

When a long-term task is pulled into today's Reflow:
- It is **not duplicated** — it is the same underlying task row.
- It gets a **today-rank** (its position in today's Reflow list, independent of its long-term rank).
- **Completing or deleting in Reflow** propagates back automatically — only one `status` field, one row.
- **At end-of-day rollover**, a referenced-but-unfinished task **snaps back to the long-term list only**
  — it does NOT carry forward into tomorrow's Reflow as a leftover.

### Deliberate tension with Product Principle 5
Product Principle 5: *"nothing silently falls off the list."*
Snapping back to long-term is a controlled exception: the task is not *lost* (still visible and ranked
in its long-term list), but it does leave today's Reflow without a keep/drop decision.

**Mitigation:** the long-term list should surface "pulled into today, not finished" tasks prominently
(e.g. top of list, subtle marker) so the user isn't surprised days later. This is a UX/copy detail,
not a new mechanic.

---

## Schema Changes Required

| Change | Reflow tasks | Long-term tasks |
|---|---|---|
| Remove `due_time` | yes | N/A |
| Remove `tags` | yes | N/A (tags belong here) |
| Add `due_date` (date) | no | yes |
| Tags (`tags text[]`) | remove from Reflow | keep/move to long-term |
| New `lists` table | — | yes (named, user-scoped) |
| `list_id` FK on task | null = Reflow | non-null = long-term list |
| Today-reference mechanism | `today_refs` table: `(task_id, date, rank)` | — |

> **Migration note:** any schema change must be hand-applied in the Supabase SQL Editor AND
> manually mirrored into the `preprod` schema (`preprod_schema_init.sql`). No migration runner exists.

---

## Duel-Combat Generalization (engineering)

The compare mechanic currently assumes "the one array from `useTasks`." Two use cases now exist:
1. Insert a new task (or promoted long-term task) into today's Reflow — operating over today-rank sequence.
2. Insert/reorder within a long-term list — operating over that list's rank sequence, filtered by active tag.

`compare.ts` is already abstract (pure index-based state machine, no task/list knowledge).
`useCompareInsertion.ts` needs to accept *whichever* ranked subset it's dueling over as a parameter,
plus a callback that knows which rank-scope to write back into.

This is a moderate, well-contained refactor — the math doesn't change, only the caller wiring.

---

## Open Questions (not yet decided)

1. **Promoting a long-term task into today via duel vs. direct placement.** When the user pulls a
   long-term task into Reflow via the morning-flow checkbox screen, does it go straight into the duel
   (binary-search insert against the day's existing tasks), or does it land at the bottom for manual
   drag? If multiple tasks are pulled at once, running a duel for each could be tedious — maybe bulk
   pull lands at bottom, single pull goes through duel.

2. **Long-term list navigation UI.** No routing library exists (App.tsx is a hand-rolled screen state
   machine, no react-router). "Navigate between long-term lists" as a URL (`/list/:id`) requires
   introducing a router from scratch. Alternative: in-page client-state (tab/segmented-control) avoids
   new routing infrastructure but forecloses deep-linking. Not decided.

3. **Limit on number of long-term lists.** No cap discussed. Worth a product call — unlimited is fine
   technically but may lead to list sprawl that undermines the "low-effort" positioning.

4. **Morning-flow phase order.** "Pull from long-term" is described as Phase 1.5 (after leftover triage,
   before brain dump). Worth confirming: should it come *before* seeing yesterday's leftovers (gives
   full context before deciding), or *after* (you know what's already carrying forward before deciding
   what to pull)?

5. **What "delete in Reflow" means for the long-term task.** Currently: completing or deleting in
   Reflow propagates back. But "delete" in long-term context may mean "remove from backlog entirely,"
   whereas the user in Reflow might mean "I don't want this today" (un-reference, not destroy). These
   need distinct actions: **un-pull** (remove today-reference, task stays in long-term list) vs.
   **delete** (destroy the row everywhere). Only decided that completing propagates; delete semantics
   are still open.

6. **Tag filtering within long-term list duel.** "Duel-combat in long-term list takes into
   consideration only filtered/grouped by tag" — confirmed. But: what if a task has multiple tags?
   Does the duel operate over the intersection (task matches all active filter tags), or union (matches
   any)? Not decided.
