# Refinement Check — 2026-08-21

Two reviews run back-to-back on the `dev` branch (compared against `main`): a strict maintainability audit (`thermo-nuclear-code-quality-review` skill) and an architecture deepening scan (`improve-codebase-architecture` skill). Both are read-only — no code was changed as part of this check.

## 1. Thermo-nuclear code quality review

Scope: `git diff main...HEAD` — of 22 changed files, only 4 are source (`src/components/TaskRow.tsx`, `src/hooks/useLongPressDrag.ts`, `src/hooks/useTasks.ts`, `src/styles/global.css`), ~60 changed lines total, all in the drag-and-drop path from commit `57403c5` ("wip: drag-and-drop audit fixes").

**Verdict: does not clear the skill's approval bar.** Three blockers, all the same root pattern — new state introduced to mirror something that already exists, instead of reusing it.

**Status: all three fixed (2026-08-21).** See checkboxes below.

### 1.1 Hand-rolled `dragging` state duplicates framer-motion's `whileDrag` — [x] Fixed
[src/components/TaskRow.tsx:56-62](../src/components/TaskRow.tsx#L56-L62), [src/hooks/useLongPressDrag.ts:9-10,27-44,54](../src/hooks/useLongPressDrag.ts#L9-L10)

The diff adds a `dragging` boolean to `useLongPressDrag`, set at three call sites (mouse `onPointerDown`, the touch long-press timeout, `cancel()`), threaded back out to `TaskRow` and used in `animate` to conditionally apply `scale: 1.02` + a `boxShadow`. But `TaskRow` already has `whileDrag={{ scale: 1.02 }}` — framer-motion's built-in mechanism for exactly this, requiring no manual state. `whileDrag` accepts a `transition` sub-object the same way `animate`/`whileHover`/`whileTap` do, and the codebase already uses this pattern elsewhere ([src/components/CompareDuel.tsx:143](../src/components/CompareDuel.tsx#L143)).

**Remedy:** delete the `dragging` state and its three set-sites; move `boxShadow` (and the now-duplicated `scale`) into `whileDrag` with its own `transition: { boxShadow: { duration: 0.15 } } }`.

### 1.2 New `isDragging` ref duplicates the existing `preReorderTasks.current` signal — [x] Fixed
[src/hooks/useTasks.ts:31,63-69,160-171](../src/hooks/useTasks.ts#L31)

`useTasks` already has `preReorderTasks = useRef<Task[] | null>(null)`, non-null exactly during a drag. The diff adds a second ref, `isDragging`, set/cleared at the same two call sites purely so the realtime subscription callback has a boolean to check — two refs tracking one lifecycle, hand-synced, with no compiler check if they ever drift apart.

**Remedy:** delete `isDragging`; change the realtime-skip check to `if (preReorderTasks.current) return;`.

### 1.3 `useCallback` wrapping on `reorderTasks`/`commitReorder` buys no referential stability — [x] Fixed
[src/hooks/useTasks.ts:160-166,168-180](../src/hooks/useTasks.ts#L160-L166)

Both were plain closures before the diff; now wrapped in `useCallback(..., [tasks])`. Since `tasks` changes on nearly every mutation, identity is unstable across the renders that matter anyway. The only consumer ([src/pages/Today.tsx:81-82,187-188](../src/pages/Today.tsx#L81-L82)) passes them straight through with no downstream `memo` to benefit — pure overhead, no payoff.

**Remedy:** revert to plain function declarations, matching every sibling function in the hook (`addTask`, `completeTask`, `editTask`, `dropTask`, `keepLeftover`).

### Minor, non-blocking notes — [ ] Manual QA pending
- [src/hooks/useLongPressDrag.ts:33-34](../src/hooks/useLongPressDrag.ts#L33-L34): `e.preventDefault()` on touch `onPointerDown` may suppress the subsequent synthetic click on some browsers for a short press — likely already covered by `docs/plans/drag-drop-fixes/testing-guide.md`, worth a manual QA pass.
- [src/hooks/useLongPressDrag.ts:22-24](../src/hooks/useLongPressDrag.ts#L22-L24): `cancel()` unconditionally blurs `document.activeElement`, which now also fires on every completed mouse-drag release, not just the touch long-press case the comment describes. Confirm this is intentional. (No code change made — behavior preserved as-is; testing-guide.md case 3 already covers "no focus ring after drag" for touch. Recommend a quick manual check that this doesn't yank keyboard focus away unexpectedly after a *mouse* drag release, e.g. if a user tabs to a row's edit button right after dragging.)

**What flips this to approve:** fold `boxShadow`/`scale` into `whileDrag` (deleting the `dragging` state), reuse `preReorderTasks.current` instead of `isDragging`, revert the two `useCallback` wraps. The underlying bug fixes (realtime-skip during drag, touch text-selection/focus) are sound — only the *mechanism* for drag-visual-state and reorder-callback memoization needs to change.

No file-size or major structural concerns; all touched files are far under the 1000-line threshold.

## 2. Architecture deepening scan

Full visual report with before/after diagrams: **[architecture-review.html](architecture-review-2026-08-21/architecture-review.html)**.

Scope: the drag-and-drop / compare-duel / task-ranking hot spot (per recent commit history), explored using the `codebase-design` vocabulary (module, interface, depth, seam, adapter, leverage, locality) and the deletion test. No `CONTEXT.md` or `docs/adr/` existed yet at scan time, so no ADR conflicts were checked against; both are left for the grilling/design step once a candidate is picked.

Three candidates surfaced:

### 2.1 Give the duel commit its own module — **Strong** — [x] Implemented (2026-08-21)
[src/lib/swipe.ts](../src/lib/swipe.ts), [src/components/CompareDuel.tsx](../src/components/CompareDuel.tsx)

`swipe.ts`'s `decideSwipe` only answers "which direction" — the real duel behavior (fling distance, velocity-scaled duration, haptic pulse, snap-back spring, resolve timing) lives untested inside `DuelCard.commit` in `CompareDuel.tsx`. It's the only file in `src/lib` with no sibling `*.test.ts`: the wrong function got extracted for testability, and the actual logic worth testing is still trapped in the component. Top recommendation — sits squarely in the flagged hot spot with an objective, checkable signal (missing test file).

**Implementation:** `swipe.ts` split into two functions — `decideSwipeDirection` (the threshold/velocity gate, used only for drag-release: should this commit or snap back?) and `planDuelFling` (unconditional: given a direction, returns `{ direction, duration, distance, haptic }`, used by every commit whether it came from a drag release or a button press). `CompareDuel.tsx`'s `DuelCard.commit` is now pure playback — it calls `planDuelFling` and plays the result through `animate()`/`navigator.vibrate`, no decisions left in the component. Added `swipe.test.ts` (14 tests) covering the threshold boundary, velocity-flick override, and duration curve — the coverage gap the review flagged. `LeftoverCard.tsx` had the identical duplicated fling logic (same formula, same duplication the review's "leverage" win called out) and consumed the old `decideSwipe` export, so it was updated to the new two-function API too — otherwise it would have been left with a compile error.

### 2.2 Collapse Today's duplicated failed-row handlers — **Worth exploring**
[src/pages/Today.tsx](../src/pages/Today.tsx)

`handleComplete` / `handleDrop` repeat the same four-line flash-timeout pattern. A third row action would copy it a third time.

### 2.3 Deepen `useTasks` around one optimistic-mutation primitive — **Worth exploring**
[src/hooks/useTasks.ts](../src/hooks/useTasks.ts)

Five of nine functions (`completeTask`, `editTask`, `dropTask`, `keepLeftover`, `commitReorder`) repeat the same snapshot → optimistic-apply → rollback → error shape — interface width is nearly proportional to implementation size because it's the same pattern five times. Noted wrinkle: `commitReorder`'s rollback source (a ref snapshot) doesn't fit the primitive as cleanly as the other four — a design question to resolve during the grilling step, not before.

## Next step

- [x] Apply the three fixes from the code-quality review (1.1–1.3) to clear the approval bar on the current drag-and-drop diff.
- [ ] Manual QA: run through `docs/plans/drag-drop-fixes/testing-guide.md`, paying attention to the two minor notes above (touch click suppression, blur-on-mouse-drag-release).
- [x] Implement candidate 2.1 (duel commit module) directly, skipping the grilling loop per user request. `swipe.ts` deepened, `CompareDuel.tsx` and `LeftoverCard.tsx` updated to consume it, `swipe.test.ts` added.
- [ ] Manual QA: duel swipe (compare-duel screen) and leftover swipe (rollover leftovers) — drag-release commit, button-press commit, snap-back under threshold, reduced-motion. See testing steps.
- [ ] Candidates 2.2 (Today.tsx failed-row handlers) and 2.3 (useTasks optimistic-mutation primitive) — not implemented, still open if wanted.
