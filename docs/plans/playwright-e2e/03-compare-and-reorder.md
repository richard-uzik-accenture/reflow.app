# Phase 3 — Compare-insertion and drag-and-drop reorder

The two most product-differentiating and most implementation-risky
interactions (binary-search insertion, long-press drag reorder). Both need
care to keep deterministic and non-flaky.

## Deliverables

### `e2e/compare-insertion.spec.ts`
- [ ] With 2+ existing tasks, adding a new task via the FAB opens
      `CompareDuel` (not silent insertion). Assert `duel-question` shows the
      new task's title and `duel-progress` dot count matches
      `progress.total` for the current list size.
- [ ] Drive the duel via the button fallbacks (`.ranks-higher` "do it
      first →" / `.ranks-lower` "← do it later"), not simulated drag —
      `commitRef.current` fires the same commit path either way (see
      `CompareDuel.tsx`).
- [ ] Insert at the very top: always choose "do it first" until the duel
      closes; assert the new task lands at rank 0 and the success toast
      reads `"task added — #1 of N"`.
- [ ] Insert at the very bottom: always choose "do it later"; assert last
      position and matching toast text.
- [ ] Insert in the middle: mixed choices land the task at a specific
      predictable index — compute expected index the same way
      `useCompareInsertion`/`compare.ts`'s binary search would (reuse the
      unit-tested logic in `src/lib/compare.ts` as the source of truth
      rather than hand-deriving it) and assert final list order matches.
- [ ] 0-1 existing tasks: confirm duel is skipped entirely (already covered
      in Phase 2's `task-crud.spec.ts` add-task case; cross-reference rather
      than duplicate).
- [ ] Closing/interrupting mid-duel: verify there's no way to strand the
      task in limbo (check current behavior in `useCompareInsertion` — if
      there's no cancel affordance mid-duel, note that as a product gap
      rather than inventing test coverage for behavior that doesn't exist).

### `e2e/reorder.spec.ts`
This is the one spec requiring real pointer-drag simulation
(`Reorder.Item` + `useLongPressDrag`, no button fallback).

- [ ] Confirm `LONG_PRESS_MS` (from `useLongPressDrag.ts`) — the drag only
      activates after a long-press charge, so the simulated gesture must:
      `mouse.down()` on a row → wait ≥ `LONG_PRESS_MS` → `mouse.move()` in
      small steps to the target position → `mouse.up()`. A move before the
      charge completes should NOT start a drag (assert this negative case
      once, to guard the long-press-not-instant-drag product requirement in
      `PRODUCT.md`: "Mobile reordering must use true long-press drag... not
      up/down arrow buttons").
- [ ] Reorder two adjacent tasks on the main Today list; assert new order
      renders immediately (optimistic) and persists after a page reload
      (i.e. `commitRank`/`updateRanks` actually landed, not just local
      state) — reload and re-assert order using the dev-mode mock's
      in-memory state, or re-navigate within the same test context.
- [ ] Reorder within the morning-flow "merge" step's `TaskList` instance
      (separate `Reorder.Item` mount) — cross-reference with
      `04-morning-flow.md`'s merge-step spec rather than duplicating full
      flow setup; a light smoke check here is enough if Phase 4 already
      covers it end-to-end.
- [ ] Dragging near the top/bottom edge of the viewport doesn't crash or
      silently drop the task from the list (basic robustness check, not
      exhaustive scroll-container testing).
