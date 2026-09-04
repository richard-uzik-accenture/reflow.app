# Phase 05 — Fix reorder row staying visually "in movement" after drop

## The issue (from `features.md`)

> drag and drop reorder states when task is picked and not dropped yet is bugged — after you drop the task, it's still visually as when it was in "movement"

## What's actually happening

The reorderable row is `src/components/TaskRow.tsx`, a framer-motion `Reorder.Item`. While dragging it applies `whileDrag`:

```tsx
whileDrag={{ scale: 1.02, boxShadow: '0 12px 24px -10px rgba(23, 19, 53, 0.35)' }}
```

and while charging the long-press it animates `scale`/`backgroundColor` via the `animate` prop (driven by the `charging` flag from `useLongPressDrag`).

The "stuck in movement" symptom (row keeps the lifted scale/shadow, or the charged background, after release) comes from one or both of these known interactions:

1. **`whileDrag` visual not clearing on drop.** `Reorder.Item` ends the drag internally, but the committing side-effect (`onDragEnd={onReorderCommit}` → `commitReorder()` in `useTasks`, which does an async rank write and, in the realtime path, can push a new `tasks` array) can cause the item to re-render / re-key mid-transition such that framer-motion doesn't run the `whileDrag`→rest transition. The row is left painted with the drag style.

2. **`charging` state not reset on all release paths.** `useLongPressDrag.onPointerUp`/`onPointerCancel` both call `cancel()`, which clears `charging`. But when the long-press **succeeds** and a real drag starts, `cancel()` may not fire on `pointerup` in every browser because the pointer capture moved to the Reorder drag. If `charging` is left `true`, the row keeps `scale: 0.98` + `--haze` background — looking "held". Inspect whether `onPointerUp` reliably fires after a successful drag; if not, `charging` sticks.

Both must be checked on a real device; the fix addresses both defensively.

## The fix

### A. Guarantee the drag-rest visual transition

Give the drag/charge visuals an explicit spring/duration in the `transition` prop for `scale`, `boxShadow`, and `backgroundColor` so framer-motion always animates *back* to the resting `animate` values, and ensure the resting state is unambiguous. The row's resting `animate` already defines `scale` and `backgroundColor`; add `boxShadow: 'none'` (or the row's natural shadow) to the resting `animate` so there is an explicit target to animate the `whileDrag` shadow back to on release. Without a resting `boxShadow` target, the shadow from `whileDrag` can be left applied.

### B. Reset `charging` on drag start, not only on pointer-release

In `useLongPressDrag`, when the long-press timer fires and `dragControls.start(e)` is called, it already does `setCharging(false)`. Verify that's sufficient. Additionally, make the hook resilient by clearing `charging` in an `onDragStart`-equivalent path: expose the existing `cancel()` and also call it from `TaskRow`'s `onDragEnd` (alongside `onReorderCommit`) so any residual charging/lifted state is torn down the moment the drag ends, regardless of which pointer event fired.

Concretely in `TaskRow`:

```tsx
onDragEnd={() => { onReorderCommit(); onPointerUp(); }}
```

(`onPointerUp` is the hook's `cancel`, which is idempotent and resets `charging`.) This guarantees the charged/lifted state is cleared on the drop itself.

### C. If (A)+(B) don't fully clear the lifted scale/shadow

If a real-device repro shows the `whileDrag` scale/shadow still sticking after B, the robust fix is to **drive the lift from state instead of `whileDrag`**: track an `isDragging` boolean (set on `onDragStart`, cleared on `onDragEnd`) and put `scale`/`boxShadow` into the `animate` object conditioned on `isDragging`, dropping the `whileDrag` prop. `animate`-driven values always transition to their new target on state change, eliminating the stuck paint. Prefer A+B first (smaller change); escalate to C only if the repro survives.

## Deliverables

- [ ] Reproduce the stuck state first (see "Test it yourself" step 2) and note **which** artifact sticks: lifted scale, drop shadow, or charged background. Record it in the PR/commit so the fix is verified against the real symptom.
- [ ] `TaskRow.tsx`: add an explicit resting `boxShadow` target in the `animate` object so the `whileDrag` shadow has something to animate back to.
- [ ] `TaskRow.tsx`: change `onDragEnd={onReorderCommit}` → `onDragEnd={() => { onReorderCommit(); onPointerUp(); }}` (destructure `onPointerUp` from `useLongPressDrag`, which is already returned).
- [ ] `useLongPressDrag.ts`: confirm `cancel()` is idempotent (it is — guards on `timerRef`/`startPointRef`) so the extra call from `onDragEnd` is safe.
- [ ] Only if the repro survives A+B: implement variant **C** (state-driven `isDragging` lift, remove `whileDrag`). Otherwise leave `whileDrag` in place.
- [ ] Verify the drop still triggers the rank persistence (`commitReorder`) exactly once and the reorder spring (`layout` transition) still plays.

## Explicitly out of scope

- Do not change the reorder *ordering* logic, `renumber`, or `commitReorder`'s persistence.
- Do not alter the long-press timing (`LONG_PRESS_MS = 350`) or the move-cancel threshold.
- Do not touch swipe cards (phase 02) — different gesture, different components.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev` with ≥3 seeded tasks (the dev mock provides these; add more with `+` if needed).
2. **Reproduce the bug (pre-fix):** on the today list, long-press (touch) or press-drag (mouse) a row, move it to a new position, release. Observe the row keeps a lifted scale / shadow / darker background instead of settling flat. Note which.
3. **After the fix:** repeat — on release the row must settle to the normal resting card style (flat, `--mist` background, no lift, no shadow) with the reorder spring animating neighbours into place.
4. Do it repeatedly and fast (pick/drop several rows in a row) — no row should be left in the lifted state.
5. **Charged-but-not-dragged path:** press and hold just past 350ms then release *without moving* → the row should charge (slight scale/darken) and then fully return to rest on release, not stay charged.
6. Regression: rank order persists after reload; the reorder spring still plays; desktop mouse press-drag still starts immediately (no long-press required for mouse).

## Risk / atomicity note

Scoped to `TaskRow.tsx` and (read-only) `useLongPressDrag.ts`. The A+B fix is additive and low-risk. Variant C is a larger local rewrite of the row's motion props but still confined to one component and does not touch data or other phases. Because it's a real-device rendering bug, this phase **must** be verified against an actual repro, not assumed fixed — hence the "record which artifact sticks" deliverable.
