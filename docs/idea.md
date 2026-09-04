# App Idea: Interrupt-Resilient Day Planner

## The Problem

I start most days with a clear plan of 3-5 things to do. But my job (team lead, data
engineer) means I constantly get pulled into unplanned-but-important work — helping
others, consulting on hard topics, unexpected fires. When that happens, I push my
planned work aside to help, and by the time I come back to my own list, I've fallen
behind. Many days end with *more* on my todo list than when the day started, because
the re-prioritization never happens consciously — it just happens by default, and
things get lost.

This is not a "I forget to write things down" problem — it's a **triage / re-planning
problem**. A static todo list doesn't help because it doesn't adapt when the day gets
disrupted, and I know myself well enough to know a tool that requires heavy manual
discipline (e.g. detailed logging) won't stick.

## The Core Idea

A day planner where:
- Every day has one **ordered list** of tasks, ranked by priority (not just a flat list).
- New tasks that land on you mid-day get **inserted into the correct spot** in the
  ranked list via a fast, low-effort mechanic — not manually re-sorted by hand each time.
- Unfinished tasks automatically **carry forward**, so nothing silently falls off.
- The whole thing should feel closer to "good UI that's fast to use" than
  "minimize taps at all costs" — friction is about *how natural it feels*, not raw
  step count.

## Signature Feature: Binary-Search "Tinder-Style" Task Insertion

When a single new task lands on you during the day:
1. The app picks the task currently in the **middle** of today's ranked list and shows
   the new task next to it.
2. You swipe/tap to say which is more urgent.
3. Based on your answer, the app narrows to the upper or lower half of the list and
   repeats.
4. This is a binary search, so even a list of ~15 tasks only takes ~4 comparisons to
   place the new task exactly where it belongs.

This is intentionally kept as a **separate mechanic** from bulk list-building (see
below) — comparisons are the right tool for inserting *one* new item reactively, but
would be tedious for building a list from scratch with several items at once.

### Edge cases decided for the compare mechanic
- **Empty or near-empty list (0-1 tasks):** skip the mechanic entirely, just add the
  task directly — nothing meaningful to compare against.
- **Task lands at the very top or bottom** (most/least urgent of everything): to be
  decided — either show a small confirmation ("Placed as #1 today") or let it place
  silently.
- **Changing your mind mid-compare:** to be decided — likely a "skip/cancel" option
  that dumps the task at the bottom for manual placement later via drag.
- **"About the same" / ties:** to be decided — whether to allow a third "similar,
  place adjacent" option instead of forcing a binary choice every time.

## Morning Flow: "Start My Day"

Ranking a whole batch of tasks (leftovers + new) via one-by-one compare would be
tedious, so the morning flow is split into three distinct phases:

**Phase 1 — Resolve yesterday's leftovers (keep/drop, not ranking)**
Unfinished tasks from yesterday are shown one at a time. Swipe right = keep (task
carries forward, retains its previous rank automatically — no re-litigating its
priority). Swipe left = drop (no longer relevant). This is a simple binary decision,
distinct from the urgency-comparison mechanic.

**Phase 2 — Brain dump new tasks (capture only, no ranking)**
Add today's new tasks as a flat list — quick text entry, no ranking friction at this
stage. Capturing and ranking are deliberately kept separate steps (mixing them slows
you down).

**Phase 3 — Merge into one ordered list (single drag-and-drop pass)**
Kept carryover tasks appear at the top (already ranked, untouched). New tasks are
appended below in entry order. One continuous drag-and-drop pass over the *whole*
list (carryover + new together) lets you interleave everything into final priority
order — one motion, not four separate triage sessions.

## During the Day

- Add a new task anytime (same brain-dump input, available globally).
- New task → binary-search compare mechanic → gets inserted into the exact right
  spot in today's ranked list.
- Mark any task done anytime.

## End of Day / Rollover

No manual action needed. Whatever's left undone automatically becomes tomorrow's
"leftovers" list, ready for the next morning's Phase 1 triage. Order is preserved
from before.

## Interaction Vocabulary (consistent across the app)

- **Swipe right / left** = binary decisions (keep/drop leftovers; urgency comparisons
  for new task insertion).
- **Drag and drop** = reordering / building the list (morning merge, and available
  anytime for manual reordering).
- These two gestures are kept deliberately distinct so the app stays predictable and
  easy to use without thinking.

### Mobile-specific decision
- Reordering on mobile uses **true drag** (long-press and drag, Trello-style),
  not up/down arrow buttons.

## Still To Decide

- What a task actually contains: just text, or also a note/subtask/time estimate?
- What "done" looks like: does a completed task disappear immediately, or stay
  visible (crossed out) for the rest of the day?
- Compare-mechanic edge cases listed above (confirmation on top/bottom placement,
  cancel/skip mid-compare, tie/"similar" option).
- v2 idea (parked): "plan vs. actual" analytics over time — which days/meetings
  tend to blow up the plan, how consistently the plan holds, etc. Natural fit given
  a data engineering background, but explicitly out of scope for v1.