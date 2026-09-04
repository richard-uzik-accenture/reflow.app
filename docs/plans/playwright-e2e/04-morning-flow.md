# Phase 4 — Morning flow (Start My Day) and rollover

Covers `useMorningFlow` + `MorningFlow.tsx`'s three phases end-to-end, plus
the rollover banner that offers to start it.

## Deliverables

### `e2e/morning-flow.spec.ts`
- [ ] Seed data with at least one leftover task (`last_triaged_on` from a
      previous day — `devMock.ts`'s two "still open" tasks already qualify,
      confirm `getLeftoverTasks` picks them up) so "start my day" enters at
      the `leftover` step, not straight to `braindump`.
- [ ] Leftover step: `LeftoverCard` shows one task at a time with the
      `remaining` count; use the button fallbacks (`.leftover-hint.keep` /
      `.leftover-hint.drop`) to keep/drop each in turn.
  - [ ] Keeping a leftover retains its prior rank and carries it forward
        (assert it reappears in the final merged list at its original
        relative position, per `PRODUCT.md`'s leftover-triage rule).
  - [ ] Dropping a leftover removes it from the queue and from the eventual
        list.
  - [ ] Forced-failure case: stub `keepLeftover`/`dropTask` to fail once,
        assert `leftoverError` renders (`"couldn't keep that task — try
        again"` / `"couldn't let that go — try again"`) and the same card
        stays put (not auto-advanced) until resolved successfully.
  - [ ] Queue exhausting auto-advances to `braindump` without user action.
- [ ] Brain dump step: add several tasks via the input, assert each appears
      in the running `braindump-list`, empty state shows `"nothing added
      yet"` before the first entry. "done adding — sort the day" advances to
      `merge`.
- [ ] Merge step: kept leftovers appear above new brain-dump entries (kept
      section labeled via `merge-section-label` when `keptCount > 0`); drag
      to interleave (reuse the drag technique from
      `03-compare-and-reorder.md`'s `reorder.spec.ts`); "start the day"
      commits and closes the flow (`step` back to `idle`, flow unmounted).
  - [ ] Empty-merge case: if everything was dropped/nothing brain-dumped,
        assert the `emptyState` copy ("nothing carried over, nothing new").
- [ ] "close" button at any step exits the flow immediately without losing
      already-committed keep/drop decisions (those already wrote through
      `keepLeftover`/`dropTask`, which are per-task commits, not staged).
- [ ] Step indicator (`flow-step` dots) reflects `done`/`active` classes
      correctly across all three steps.

### Rollover banner (can live in the same spec file or `today-basics.spec.ts`)
- [ ] With leftovers present and the flow not yet started, the
      `rollover-banner` renders with prompt text `"still open from before —
      start my day?"`.
- [ ] Clicking the prompt starts the morning flow (same entry point as the
      rail's "start my day" button).
- [ ] "not now" dismisses the banner for the session (`rollover.dismiss`);
      assert it doesn't reappear without a reload/re-mount.
