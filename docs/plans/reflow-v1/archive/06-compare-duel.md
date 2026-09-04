# Phase 6: The Compare Duel

> Depends on: Phase 5 (reflow/layout animation established via `Reorder.Item`) and [04b-design-system-revision.md](04b-design-system-revision.md) (single-card duel layout spec, ink-violet/coral tokens). Read `docs/plans/reflow-v1/archive/00-overview.md`.

**Goal of this phase:** the signature mechanic. Adding a task while 2+ tasks already exist triggers a binary-search "duel" — the new task compared against the list's midpoint, narrowing until its exact rank is found — instead of a plain append. This is the one place coral and the fast (150–200ms) decisive motion appear, per branding.md. **UI note:** the duel is now a single Tinder-style swipeable card against a fixed reference question (see Task 4), not the two-box side-by-side layout an earlier draft of this phase specified — 04b's Task 6 documents why that changed.

This is the highest-risk logic in the whole app (idea.md flags several of its edge cases as explicitly undecided), so unlike most other phases, the core algorithm gets real test-first treatment before any UI is built.

## Files

- Create: `src/lib/compare.ts`
- Create: `src/lib/compare.test.ts`
- Modify: `src/hooks/useTasks.ts` — add `insertTaskAtIndex`
- Create: `src/hooks/useCompareInsertion.ts` — also exposes `progress` for the duel's step-count dots
- Create: `src/components/CompareDuel.tsx` — single-card design per 04b
- Modify: `src/components/TaskList.tsx` — add a `dimmed` prop
- Modify: `src/components/AddTaskFab.tsx` (created in 04b) — accept `onAdd`/`disabled` props instead of owning `addTask` directly
- Modify: `src/styles/global.css` — duel layout CSS
- Modify: `src/pages/Today.tsx` — wire the duel in

`[OPEN DECISION]` markers apply to this whole phase — three compare-mechanic edge cases are explicitly undecided in `PRODUCT.md`: a confirmation (or not) when a task lands at the very top/bottom, cancel/skip mid-compare, and a "similar/tie" third option. This phase ships the simplest defensible behavior for each (silent placement, no cancel button, binary-only — no tie option) so the mechanic is usable end to end; `11-open-decisions.md` tracks revisiting them.

## Task 1: The binary-search compare algorithm

**Interfaces:**
- Produces: `startCompare(length: number): CompareState | null`, `narrow(state: CompareState, newTaskWon: boolean): CompareState | { done: true; insertIndex: number }`, the `CompareState` type — consumed by `useCompareInsertion.ts`.

The algorithm is a standard binary insertion search over index positions `[0, length]`. `low`/`high` bound the still-possible insertion index (as a half-open range `[low, high)`); `candidateIndex` (the midpoint) is the task shown to the user. `newTaskWon: true` means the new task is **more urgent** than the candidate, which rules out every insertion index after the candidate.

- [x] **Step 1: Write the failing tests** — `src/lib/compare.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { startCompare, narrow, type CompareState } from './compare';

describe('startCompare', () => {
  it('returns null for an empty list (skip the mechanic)', () => {
    expect(startCompare(0)).toBeNull();
  });

  it('returns null for a single-item list (skip the mechanic)', () => {
    expect(startCompare(1)).toBeNull();
  });

  it('returns the midpoint candidate for a 15-item list', () => {
    expect(startCompare(15)).toEqual({ low: 0, high: 15, candidateIndex: 7 });
  });
});

describe('narrow', () => {
  it('resolves a 15-item list to index 0 in exactly 4 shown comparisons when the new task always wins', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, true);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, true);
    }
    expect(shownCandidates).toEqual([7, 3, 1, 0]);
    expect(result).toEqual({ done: true, insertIndex: 0 });
  });

  it('resolves a 15-item list to the bottom in exactly 4 shown comparisons when the new task always loses', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, false);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, false);
    }
    expect(shownCandidates).toEqual([7, 11, 13, 14]);
    expect(result).toEqual({ done: true, insertIndex: 15 });
  });

  it('places a task in the middle correctly for a mixed sequence on a 7-item list', () => {
    // list indices 0..6, true = new task more urgent than candidate
    let state = startCompare(7) as CompareState; // candidateIndex 3
    let result = narrow(state, true); // more urgent than index 3 -> search [0,3)
    expect(result).toEqual({ low: 0, high: 3, candidateIndex: 1 });
    result = narrow(result as CompareState, false); // less urgent than index 1 -> search [2,3)
    expect(result).toEqual({ low: 2, high: 3, candidateIndex: 2 });
    result = narrow(result as CompareState, true); // more urgent than index 2 -> search [2,2)
    expect(result).toEqual({ done: true, insertIndex: 2 });
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './compare'`.

- [x] **Step 3: Write the implementation** — `src/lib/compare.ts`

```ts
export interface CompareState {
  low: number;
  high: number;
  candidateIndex: number;
}

export type CompareResult = CompareState | { done: true; insertIndex: number };

function computeState(low: number, high: number): CompareResult {
  if (low >= high) return { done: true, insertIndex: low };
  const candidateIndex = Math.floor((low + high) / 2);
  return { low, high, candidateIndex };
}

/** Starts a compare-insertion search over a list of the given length. Returns null when the mechanic should be skipped (0 or 1 existing tasks) — PRODUCT.md's explicit edge case. */
export function startCompare(length: number): CompareState | null {
  if (length <= 1) return null;
  const result = computeState(0, length);
  return 'done' in result ? null : result;
}

/** newTaskWon = true means the new task is MORE urgent than the current candidate. */
export function narrow(state: CompareState, newTaskWon: boolean): CompareResult {
  const { low, high, candidateIndex } = state;
  return newTaskWon ? computeState(low, candidateIndex) : computeState(candidateIndex + 1, high);
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all `compare.ts` tests plus the existing `ranking.ts` tests.

- [x] **Step 5: Commit**

```bash
git add src/lib/compare.ts src/lib/compare.test.ts
git commit -m "feat: binary-search compare algorithm with tests"
```

## Task 2: `insertTaskAtIndex` on `useTasks`

**Interfaces:**
- Produces (added to the existing hook — every function from Phases 3–5 is unchanged): `insertTaskAtIndex: (title: string, index: number) => Promise<void>`.

- [x] **Step 1: Modify `src/hooks/useTasks.ts`** — add:

```ts
  async function insertTaskAtIndex(title: string, index: number) {
    if (!session) return;
    const before = index > 0 ? tasks[index - 1].rank : null;
    const after = index < tasks.length ? tasks[index].rank : null;
    const rank = rankBetween(before, after);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => {
      const next = [...prev];
      next.splice(index, 0, created);
      return next;
    });
  }
```

Add `insertTaskAtIndex` to the returned object. Note: `addTask` (plain append, from Phase 3) is **kept, not replaced** — `07-morning-flow.md`'s brain-dump phase needs append-only capture with no compare mechanic, per idea.md ("capture only, no ranking" during brain dump).

- [x] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: insert task at a specific index"
```

## Task 3: `useCompareInsertion` orchestration hook

**Interfaces:**
- Consumes: `startCompare`, `narrow` from `src/lib/compare.ts`.
- Produces: `{ pendingTitle: string | null, candidate: Task | null, active: boolean, begin: (title: string) => void, decide: (newTaskWon: boolean) => void }`, consumed by `Today.tsx`.

- [x] **Step 1: Write `src/hooks/useCompareInsertion.ts`**

```ts
import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number) => Promise<void>;
}

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [state, setState] = useState<CompareState | null>(null);

  function begin(title: string) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length); // 0-1 existing tasks: skip the mechanic entirely
      return;
    }
    setPendingTitle(title);
    setState(initial);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex);
      setPendingTitle(null);
      setState(null);
    } else {
      setState(result);
    }
  }

  const candidate = state ? tasks[state.candidateIndex] : null;

  return { pendingTitle, candidate, active: pendingTitle !== null, begin, decide };
}
```

- [x] **Step 2: Commit**

```bash
git add src/hooks/useCompareInsertion.ts
git commit -m "feat: compare-insertion orchestration hook"
```

## Task 4: `CompareDuel` UI and wiring

> **Builds the single-card design from [04b-design-system-revision.md](04b-design-system-revision.md#compare-duel--single-card-not-two-boxes), not the two-box layout originally drafted for this phase.** The original design (existing-candidate box vs. new-task box, side by side) was rejected in review as confusing — unclear which box you're meant to act on — and doesn't match idea.md's literal "Tinder-style" framing. Read 04b's Task 6 spec alongside this section; what follows implements that spec.

**Interfaces:**
- `CompareDuel` consumes: `candidate: Task`, `newTaskTitle: string`, `progress: { done: number; total: number }`, `onDecide: (newTaskWon: boolean) => void`.
- `TaskList` consumes (added prop): `dimmed?: boolean`.
- `AddTaskFab` (from 04b) is modified so its submit calls `onAdd: (title: string) => void` instead of owning `addTask` directly — the duel needs to intercept "what happens on submit" (plain append vs. `begin()` the compare flow), so the FAB stops calling `useTasks()` itself.

- [x] **Step 1: Write `src/components/CompareDuel.tsx`**

```tsx
import { motion, type PanInfo } from 'framer-motion';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  progress: { done: number; total: number };
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;

export function CompareDuel({ candidate, newTaskTitle, progress, onDecide }: CompareDuelProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) onDecide(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) onDecide(false);
  }

  return (
    <div className="duel-overlay">
      <div className="duel-headline">
        <div className="duel-kicker">new task landed</div>
        <h2 className="duel-question">
          more urgent than<br />
          <span className="ref-title">"{candidate.title}"</span>?
        </h2>
      </div>

      <motion.div
        className="swipe-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        transition={{ duration: 0.175 }}
      >
        <div className="label">just added — drag me</div>
        <div className="title">{newTaskTitle}</div>
      </motion.div>

      <div className="swipe-hints">
        <button className="swipe-hint less" onClick={() => onDecide(false)}>← no, later</button>
        <button className="swipe-hint more" onClick={() => onDecide(true)}>yes, sooner →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
```

One card, one fixed reference question — no side-by-side comparison. The tap buttons exist alongside the swipe gesture because a mouse-only desktop user shouldn't be forced to drag — both commit the same `onDecide` call. `progress` is presentation-only: derive `{ done, total }` from `CompareState`'s `low`/`high` bounds in `useCompareInsertion` (Step 4 below) — no change to the search algorithm itself.

- [x] **Step 2: Add the duel CSS** — append to `src/styles/global.css`:

```css
.duel-overlay {
  position: fixed;
  inset: 0;
  z-index: 15;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: linear-gradient(180deg, rgba(250,249,251,0.55) 0%, rgba(250,249,251,0.97) 30%);
  padding: 0 24px;
}
.duel-headline { text-align: center; max-width: 420px; }
.duel-kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dusk);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.duel-question {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
  line-height: 1.4;
}
.duel-question .ref-title { color: var(--violet); font-weight: 600; }

.swipe-card {
  width: 100%;
  max-width: 380px;
  padding: 30px 26px;
  border-radius: 22px;
  background: var(--coral-wash);
  border: 1.5px solid var(--signal-coral);
  text-align: center;
  cursor: grab;
  box-shadow: 0 18px 36px -16px rgba(23, 19, 53, 0.22);
}
.swipe-card .label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: #A8451E;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.swipe-card .title { font-size: 18px; font-weight: 500; color: var(--ink); line-height: 1.4; }

.swipe-hints { display: flex; justify-content: space-between; width: 100%; max-width: 380px; }
.swipe-hint {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--dusk);
  background: none;
  border: none;
  cursor: pointer;
}
.swipe-hint.more { color: var(--violet); font-weight: 600; }

.duel-progress { display: flex; justify-content: center; gap: 6px; }
.duel-progress .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--haze); }
.duel-progress .dot.done { background: var(--violet); }
.duel-progress .dot.active { background: var(--signal-coral); }
```

Same shape on mobile and desktop — no separate desktop-only layout, per 04b's spec (true swipe doesn't exist with a mouse, so the card stays draggable but the labeled buttons are the primary affordance on both).

- [x] **Step 3: Modify `src/components/TaskList.tsx`** to accept `dimmed`

Add `dimmed?: boolean` to `TaskListProps`, and apply a class conditionally on the existing wrapper:

```tsx
export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit, dimmed }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={tasks}
      onReorder={onReorder}
      className={dimmed ? 'task-list task-list-dimmed' : 'task-list'}
    >
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onComplete={onComplete} onDrop={onDrop} onReorderCommit={onReorderCommit} />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}
```

(Add `dimmed?: boolean;` to the `TaskListProps` interface above it.) Append to `global.css`:

```css
.task-list-dimmed { opacity: 0.25; transition: opacity 0.2s ease; pointer-events: none; }
```

- [x] **Step 4: Modify `src/components/AddTaskFab.tsx`** (from 04b) so its submit is pluggable

The FAB currently calls `addTask` from `useTasks()` directly (04b Task 4). It needs to instead accept an `onAdd` prop, so `Today.tsx` can pass either plain `addTask` (pre-duel behavior) or the new `begin` function from `useCompareInsertion`:

```tsx
import { useState, type FormEvent } from 'react';

interface AddTaskFabProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddTaskFab({ onAdd, disabled }: AddTaskFabProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
    setOpen(false);
  }

  return (
    <>
      <button aria-label="add task" className="fab" onClick={() => setOpen(true)} disabled={disabled} />
      {open && (
        <div className="modal-scrim" onClick={() => setOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <label className="modal-label" htmlFor="add-task-input">what needs doing?</label>
            <input
              id="add-task-input"
              className="modal-input"
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. call the plumber back"
            />
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setOpen(false)}>cancel</button>
              <button type="submit" className="modal-submit">add task</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

Remove the `+` glyph text child from the earlier version's `<button className="fab">+</button>` — keeping `+` as the visible label still works, this just also wires `disabled` so the FAB can't be clicked while a duel is already active. Keep the `+` character in the button if 04b's version already renders it; only the props signature changes here.

- [x] **Step 5: Modify `src/hooks/useCompareInsertion.ts`** to expose progress

Add a `progress` value derived from the current `CompareState`, alongside the existing returned fields:

```ts
  const progress = state
    ? { done: Math.ceil(Math.log2(Math.max(state.high - state.low, 1))) === 0 ? 1 : 0, total: 0 }
    : { done: 0, total: 0 };
```

This naive placeholder is wrong on purpose to flag it: computing an accurate "N of M comparisons" from `low`/`high` bounds alone (without knowing the original list length at `begin()` time) needs the *initial* range remembered, not just the current one. Store it properly instead:

```ts
import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number) => Promise<void>;
}

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [state, setState] = useState<CompareState | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);

  function begin(title: string) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length);
      return;
    }
    setPendingTitle(title);
    setState(initial);
    setTotalSteps(Math.ceil(Math.log2(tasks.length + 1)));
    setStepsDone(0);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    setStepsDone((n) => n + 1);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex);
      setPendingTitle(null);
      setState(null);
    } else {
      setState(result);
    }
  }

  const candidate = state ? tasks[state.candidateIndex] : null;

  return {
    pendingTitle,
    candidate,
    active: pendingTitle !== null,
    progress: { done: stepsDone, total: totalSteps },
    begin,
    decide,
  };
}
```

`Math.ceil(Math.log2(tasks.length + 1))` is the binary search's worst-case step count for the list size at the moment the duel started — a reasonable approximation for the progress dots; it doesn't need to be exact since it's a UI affordance, not the search logic itself (which is `compare.ts`'s job, untouched by this task).

- [x] **Step 6: Modify `src/pages/Today.tsx`** to wire the duel in

Only the additions are shown — `Today.tsx` already has the rail/header shell and `AddTaskFab` from 04b, and the reorder props from Phase 5:

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';
import { CompareDuel } from '../components/CompareDuel';

export function Today() {
  const {
    tasks, loading, addTask, completeTask, dropTask,
    reorderTasks, commitReorder, insertTaskAtIndex,
  } = useTasks();
  const { signOut } = useAuth();
  const { pendingTitle, candidate, active, progress, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  if (loading) return null;

  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="today-shell">
      <aside className="today-rail">
        <span className="wordmark">reflow</span>
        <div className="day-meta">
          <span className="date">{today.toLowerCase()}</span>
          <span className="count">{tasks.length} today</span>
        </div>
        <div className="rail-spacer" />
        <button className="rail-action">start my day</button>
        <button className="rail-signout" onClick={signOut}>sign out</button>
      </aside>

      <header className="today-header-mobile">
        <span className="wordmark">reflow</span>
        <div className="header-right"><span className="count-chip">{tasks.length} today</span></div>
      </header>

      <main className="today-main">
        <h1 className="list-heading">today</h1>
        <p className="list-sub">{tasks.length} thing{tasks.length === 1 ? '' : 's'}, in order.</p>
        <TaskList
          tasks={tasks}
          onComplete={completeTask}
          onDrop={dropTask}
          onReorder={reorderTasks}
          onReorderCommit={commitReorder}
          dimmed={active}
        />
      </main>

      {active && candidate && pendingTitle && (
        <CompareDuel candidate={candidate} newTaskTitle={pendingTitle} progress={progress} onDecide={decide} />
      )}
      <AddTaskFab onAdd={begin} disabled={active} />
    </div>
  );
}
```

`addTask` (plain append) stays imported even though this file no longer calls it directly here — `07-morning-flow.md`'s brain-dump step needs it, per that phase's own notes; if Phase 7 isn't implemented yet, remove the now-unused import rather than leave dead code, and re-add it when Phase 7 needs it.

- [x] **Step 7: Test it yourself**

Run `npm run dev` with 0 tasks. Confirm:
1. Adding the 1st and 2nd tasks append directly — no duel appears (0-1 task skip case).
2. Adding a 3rd task **does** trigger the duel: the list dims behind a scrim, a centered card appears reading "more urgent than '[existing task title]'?" above a single coral-wash card showing the new task's title, with "← no, later" / "yes, sooner →" beneath it.
3. Dragging the card right (or tapping "yes, sooner →") and confirming the outcome: with only 3 tasks total, one decision should resolve it — the new task lands in the list, the duel closes, the list undims.
4. Add a 4th, 5th, 6th task, each time deliberately picking the new task as more urgent every time — confirm it always ends up at the very top after enough duels, and the progress dots fill in as each comparison resolves.
5. Refresh the page — confirm the final order persisted.
6. In the Supabase Table Editor, spot-check that inserted ranks sit strictly between their neighbors' ranks.

- [x] **Step 8: Commit**

```bash
git add src/components/CompareDuel.tsx src/components/TaskList.tsx src/components/AddTaskFab.tsx src/hooks/useCompareInsertion.ts src/pages/Today.tsx src/styles/global.css
git commit -m "feat: wire up the compare duel"
```

## Phase 6 done when

Adding a task to a list of 2+ triggers the single-card duel, `npm test` passes the full compare-algorithm test suite, swiping or tapping resolves it, the task lands at the mathematically correct position, the list dims/undims around the duel, and the progress dots reflect how many comparisons remain.
