# Phase 7: Morning "Start My Day" Flow

> Depends on: Phase 6 (compare duel; brain-dump reuses plain `addTask`, merge reuses Phase 5's drag) and [04b-design-system-revision.md](04b-design-system-revision.md) (step-indicator + desktop-panel layout spec, ink-violet/coral tokens). Read `docs/plans/reflow-v1/archive/00-overview.md`.

**Goal of this phase:** the three-phase morning ritual from `idea.md` — leftover triage (swipe keep/drop), brain dump (flat capture, no ranking), and merge (one drag pass over the combined list) — as a single full-screen flow, manually triggered by a "start my day" button. Automatic triggering on an actual day boundary is Phase 8; this phase builds the flow itself and you trigger it by hand to test it. **UI note:** the flow now has a persistent step indicator and a desktop-specific centered-panel presentation (see Task 6) that an earlier draft of this phase didn't specify — 04b's Task 6 documents why that was added.

## Files

- Create: `src/lib/triage.ts`
- Create: `src/lib/triage.test.ts`
- Modify: `src/hooks/useTasks.ts` — add `keepLeftover`
- Create: `src/hooks/useMorningFlow.ts` — also exposes a `close` function distinct from `finishMerge`
- Create: `src/components/LeftoverCard.tsx`
- Create: `src/components/BrainDump.tsx`
- Create: `src/components/MorningFlow.tsx` — step indicator + responsive desktop/mobile presentation per 04b
- Modify: `src/styles/global.css` — flow layout CSS
- Modify: `src/pages/Today.tsx` — wire the "start my day" trigger (now the rail's existing button, from 04b) and render `MorningFlow` when active

## Task 1: Leftover detection

**Interfaces:**
- Produces: `todayISO(): string`, `isLeftover(task: Task, today?: string): boolean`, `getLeftoverTasks(tasks: Task[], today?: string): Task[]` — consumed by `useMorningFlow.ts` now, and by `08-auto-rollover.md` to decide whether to auto-prompt.

A task is a leftover once its `last_triaged_on` is strictly before today — it was active yesterday (or earlier) and was never confirmed today.

- [x] **Step 1: Write the failing tests** — `src/lib/triage.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { isLeftover, getLeftoverTasks } from './triage';
import type { Task } from './tasks';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    user_id: 'user',
    title: 'task',
    note: null,
    status: 'active',
    rank: 0,
    created_at: '2026-08-01T00:00:00.000Z',
    completed_at: null,
    last_triaged_on: '2026-08-01',
    ...overrides,
  };
}

describe('isLeftover', () => {
  it('is true when last_triaged_on is before today', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-08' }), '2026-08-09')).toBe(true);
  });

  it('is false when last_triaged_on is today', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-09' }), '2026-08-09')).toBe(false);
  });

  it('is false when last_triaged_on is in the future (clock skew safety)', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-10' }), '2026-08-09')).toBe(false);
  });
});

describe('getLeftoverTasks', () => {
  it('filters a mixed list down to only the leftovers', () => {
    const tasks = [
      makeTask({ id: '1', last_triaged_on: '2026-08-07' }),
      makeTask({ id: '2', last_triaged_on: '2026-08-09' }),
      makeTask({ id: '3', last_triaged_on: '2026-08-08' }),
    ];
    const result = getLeftoverTasks(tasks, '2026-08-09');
    expect(result.map((t) => t.id)).toEqual(['1', '3']);
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './triage'`.

- [x] **Step 3: Write the implementation** — `src/lib/triage.ts`

```ts
import type { Task } from './tasks';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isLeftover(task: Task, today: string = todayISO()): boolean {
  return task.last_triaged_on < today;
}

export function getLeftoverTasks(tasks: Task[], today: string = todayISO()): Task[] {
  return tasks.filter((t) => isLeftover(t, today));
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests including `ranking.ts` and `compare.ts` from earlier phases.

- [x] **Step 5: Commit**

```bash
git add src/lib/triage.ts src/lib/triage.test.ts
git commit -m "feat: leftover detection with tests"
```

## Task 2: `keepLeftover` on `useTasks`

**Interfaces:**
- Produces (added to the existing hook — nothing from Phases 3–6 changes): `keepLeftover: (id: string) => Promise<void>`.

- [x] **Step 1: Modify `src/hooks/useTasks.ts`** — add:

```ts
  async function keepLeftover(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    await markTriaged(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, last_triaged_on: today } : t)));
  }
```

Update the import to include `markTriaged`: `import { listActiveTasks, createTask, updateTaskStatus, updateTaskRanks, markTriaged, type Task } from '../lib/tasks';`. Add `keepLeftover` to the returned object.

Dropping a leftover reuses the existing `dropTask` from Phase 4 — no new function needed for that side of the decision.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: keep-leftover action"
```

## Task 3: `useMorningFlow` orchestration hook

**Interfaces:**
- Consumes: `getLeftoverTasks` from `src/lib/triage.ts`.
- Produces: `{ step: 'idle' | 'leftover' | 'braindump' | 'merge', active: boolean, currentLeftover: Task | null, remaining: number, start: () => void, resolveLeftover: (keep: boolean) => Promise<void>, addBrainDumpTask: (title: string) => Promise<void>, finishBrainDump: () => void, finishMerge: () => void, close: () => void }`, consumed by `Today.tsx`.

- [x] **Step 1: Write `src/hooks/useMorningFlow.ts`**

```ts
import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

type Step = 'idle' | 'leftover' | 'braindump' | 'merge';

interface UseMorningFlowArgs {
  tasks: Task[];
  keepLeftover: (id: string) => Promise<void>;
  dropTask: (id: string) => Promise<void>;
  addTask: (title: string) => Promise<void>;
}

export function useMorningFlow({ tasks, keepLeftover, dropTask, addTask }: UseMorningFlowArgs) {
  const [step, setStep] = useState<Step>('idle');
  const [queue, setQueue] = useState<Task[]>([]);

  function start() {
    const leftovers = getLeftoverTasks(tasks);
    setQueue(leftovers);
    setStep(leftovers.length > 0 ? 'leftover' : 'braindump');
  }

  async function resolveLeftover(keep: boolean) {
    const [current, ...rest] = queue;
    if (!current) return;
    if (keep) await keepLeftover(current.id);
    else await dropTask(current.id);
    setQueue(rest);
    if (rest.length === 0) setStep('braindump');
  }

  function finishBrainDump() {
    setStep('merge');
  }

  function finishMerge() {
    setStep('idle');
  }

  function close() {
    setStep('idle');
  }

  return {
    step,
    active: step !== 'idle',
    currentLeftover: queue[0] ?? null,
    remaining: queue.length,
    start,
    resolveLeftover,
    addBrainDumpTask: addTask,
    finishBrainDump,
    finishMerge,
    close,
  };
}
```

Starting directly on `'braindump'` when there are zero leftovers avoids showing an empty triage screen — the flow always has *something* to do (there's always a brain-dump step), so `active` alone is enough to decide whether to render the full-screen flow. `close` and `finishMerge` do the same thing today (both just reset to `'idle'`) — kept as two named functions rather than one, because "finished the flow normally" and "backed out early via the header's close button" are different user actions that happen to share an implementation; a later phase adding flow-abandonment analytics or a confirmation dialog on early exit has a single function to change (`close`) without touching the normal completion path.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useMorningFlow.ts
git commit -m "feat: morning flow orchestration hook"
```

## Task 4: `LeftoverCard`

Reuses the same `drag="x"` swipe pattern as `CompareDuel.tsx` (Phase 6), applied to a single full card instead of an inline duel — swipe right = keep, left = drop, with tap buttons as the non-swipe alternative. Copy follows branding.md's tone table: "still open," not "overdue."

- [x] **Step 1: Write `src/components/LeftoverCard.tsx`**

```tsx
import { motion, type PanInfo } from 'framer-motion';
import type { Task } from '../lib/tasks';

interface LeftoverCardProps {
  task: Task;
  remaining: number;
  onResolve: (keep: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 100;

export function LeftoverCard({ task, remaining, onResolve }: LeftoverCardProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) onResolve(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) onResolve(false);
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', padding: 24 }}>
      <div>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          still open · {remaining} left
        </p>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          style={{
            padding: 24,
            borderRadius: 18,
            background: 'var(--sand)',
            color: 'var(--graphite)',
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            minWidth: 260,
            textAlign: 'center',
            cursor: 'grab',
          }}
        >
          {task.title}
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, width: 260 }}>
          <button
            onClick={() => onResolve(false)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            ← let it go
          </button>
          <button
            onClick={() => onResolve(true)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            keep →
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add src/components/LeftoverCard.tsx
git commit -m "feat: leftover triage card"
```

## Task 5: `BrainDump`

- [x] **Step 1: Write `src/components/BrainDump.tsx`**

```tsx
import { useState, type FormEvent } from 'react';

interface BrainDumpProps {
  onAdd: (title: string) => void;
  onDone: () => void;
}

export function BrainDump({ onAdd, onDone }: BrainDumpProps) {
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState<string[]>([]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setEntries((prev) => [...prev, title]);
    setValue('');
  }

  return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
        what's new today? add as many as you want, in any order — you'll sort them next.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="add a task"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid var(--silt)',
            background: 'var(--sand)',
          }}
        />
        <button
          type="submit"
          style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: 'var(--petrol)', color: 'var(--paper)' }}
        >
          add
        </button>
      </form>
      <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
        {entries.map((title, i) => (
          <li key={i} style={{ padding: '8px 0', color: 'var(--graphite)' }}>
            {title}
          </li>
        ))}
      </ul>
      <button
        onClick={onDone}
        style={{
          marginTop: 16,
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--petrol)',
          color: 'var(--paper)',
        }}
      >
        done adding — sort the day
      </button>
    </div>
  );
}
```

`entries` here is a local, display-only echo of what's been typed (so you can see your brain-dump list as you build it) — the actual persisted tasks are created immediately on each `onAdd` call via the real `addTask`, appended at the current bottom of the list, same as any other append.

- [x] **Step 2: Commit**

```bash
git add src/components/BrainDump.tsx
git commit -m "feat: brain-dump capture step"
```

## Task 6: `MorningFlow` orchestrator and wiring

> **Adds a step indicator and a desktop-specific presentation per [04b-design-system-revision.md](04b-design-system-revision.md#morning-flow--step-indicator--desktop-version)**, on top of this phase's already-planned `step` state machine — the version below supersedes the plainer full-bleed-only design an earlier draft of this phase specified. `useMorningFlow.ts` (Task 3) is unchanged; this task is presentation-only, same as 04b's own scope.

**Interfaces:**
- `MorningFlow` consumes: `step`, `currentLeftover`, `remaining`, `tasks`, `keptCount`, `onResolveLeftover`, `onAddBrainDumpTask`, `onFinishBrainDump`, `onComplete`, `onDrop`, `onReorder`, `onReorderCommit`, `onFinishMerge`, `onClose`.

- [x] **Step 1: Write `src/components/MorningFlow.tsx`**

```tsx
import type { Task } from '../lib/tasks';
import { LeftoverCard } from './LeftoverCard';
import { BrainDump } from './BrainDump';
import { TaskList } from './TaskList';

interface MorningFlowProps {
  step: 'leftover' | 'braindump' | 'merge';
  currentLeftover: Task | null;
  remaining: number;
  tasks: Task[];
  keptCount: number;
  onResolveLeftover: (keep: boolean) => void;
  onAddBrainDumpTask: (title: string) => void;
  onFinishBrainDump: () => void;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
  onFinishMerge: () => void;
  onClose: () => void;
}

const STEP_ORDER = ['leftover', 'braindump', 'merge'] as const;

export function MorningFlow(props: MorningFlowProps) {
  const { step } = props;
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="flow-shell">
      <div className="flow-header">
        <span className="flow-kicker">start my day</span>
        <button className="flow-exit" onClick={props.onClose}>close</button>
      </div>
      <div className="flow-steps">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className={`flow-step ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`} />
        ))}
      </div>

      {step === 'leftover' && props.currentLeftover && (
        <LeftoverCard task={props.currentLeftover} remaining={props.remaining} onResolve={props.onResolveLeftover} />
      )}
      {step === 'braindump' && <BrainDump onAdd={props.onAddBrainDumpTask} onDone={props.onFinishBrainDump} />}
      {step === 'merge' && (
        <div className="flow-merge">
          <h2 className="merge-title">one list for today</h2>
          <p className="merge-sub">drag into the order that matches today.</p>
          {props.keptCount > 0 && <div className="merge-section-label">kept from yesterday</div>}
          {/* TaskList renders every task in one pass; the "kept" vs "new" section labels are visual grouping
              only (see 04b's merge-row color coding below) — no separate list, no different data source. */}
          <TaskList
            tasks={props.tasks}
            onComplete={props.onComplete}
            onDrop={props.onDrop}
            onReorder={props.onReorder}
            onReorderCommit={props.onReorderCommit}
          />
          <button className="merge-cta" onClick={props.onFinishMerge}>start the day</button>
        </div>
      )}
    </div>
  );
}
```

`keptCount` (how many of `tasks` came from yesterday's kept leftovers, always the first N by construction — Task 3's `useMorningFlow` puts kept tasks at the top before appending brain-dump tasks) drives whether the "kept from yesterday" label renders at all; if every leftover was dropped, only "new today" applies and the label is redundant. Compute `keptCount` in `Today.tsx` (Step 3 below) rather than inside this component, since it's simple state already available where `useMorningFlow` is called.

- [x] **Step 2: Add the flow CSS** — append to `src/styles/global.css`:

```css
.flow-shell {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: var(--paper);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
}
.flow-kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dusk);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.flow-exit { font-family: var(--font-mono); font-size: 12px; color: var(--haze); background: none; border: none; cursor: pointer; }
.flow-steps { display: flex; gap: 6px; padding: 14px 20px 0; }
.flow-step { flex: 1; height: 3px; border-radius: 3px; background: var(--mist); }
.flow-step.done { background: var(--violet); }
.flow-step.active { background: var(--signal-coral); }

.flow-merge { padding: 24px 16px 24px; flex: 1; }
.merge-title { font-family: var(--font-display); font-size: 19px; font-weight: 500; color: var(--violet); margin: 0 0 4px; }
.merge-sub { font-size: 13px; color: var(--dusk); margin: 0 0 18px; }
.merge-section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dusk);
  margin: 14px 0 8px;
}
.merge-cta {
  margin-top: 16px;
  width: 100%;
  padding: 15px;
  border-radius: 999px;
  border: none;
  background: var(--violet);
  color: var(--paper);
  font-family: var(--font-body);
  font-size: 14px;
  cursor: pointer;
}

@media (min-width: 900px) {
  .flow-shell {
    background: linear-gradient(180deg, rgba(250,249,251,0.5) 0%, rgba(250,249,251,0.97) 26%);
    align-items: center;
    padding-top: 40px;
  }
  .flow-header, .flow-steps, .flow-merge { width: 460px; }
  .flow-merge { padding: 24px 0; }
}
```

Desktop centers the same three-step content into a fixed 460px column rather than a different layout — per 04b, this is the same information architecture on both breakpoints, only the chrome differs (desktop keeps a hint of the dimmed `Today` list at the edges via the translucent gradient background; mobile stays a fully opaque full-bleed take over, matching Phase 4's existing `AnimatePresence` z-index conventions).

**Merge row color coding** (04b): `TaskRow`/`TaskList` don't need new props for this — apply it via a CSS attribute selector keyed on task recency isn't available without extra data, so this is deferred to a small follow-up: add an optional `variant?: 'kept' | 'new'` prop to `TaskRow` if you want the colored left-edge from the 04b comp; the plan ships without it in Step 1 above to avoid overloading `TaskRow`'s props for one screen. Revisit in a polish pass if the visual distinction matters more once you're using the flow daily — tracked here rather than silently dropped.

- [x] **Step 3: Modify `src/pages/Today.tsx`** to add the trigger and render the flow

Only the additions on top of Phase 6's version are shown:

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { useMorningFlow } from '../hooks/useMorningFlow';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';
import { CompareDuel } from '../components/CompareDuel';
import { MorningFlow } from '../components/MorningFlow';

export function Today() {
  const {
    tasks, loading, addTask, completeTask, dropTask,
    reorderTasks, commitReorder, insertTaskAtIndex, keepLeftover,
  } = useTasks();
  const { signOut } = useAuth();

  const { pendingTitle, candidate, active: compareActive, progress, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  const morning = useMorningFlow({ tasks, keepLeftover, dropTask, addTask });

  if (loading) return null;

  if (morning.active) {
    const keptCount = tasks.filter((t) => t.last_triaged_on === new Date().toISOString().slice(0, 10)).length;
    return (
      <MorningFlow
        step={morning.step as 'leftover' | 'braindump' | 'merge'}
        currentLeftover={morning.currentLeftover}
        remaining={morning.remaining}
        tasks={tasks}
        keptCount={keptCount}
        onResolveLeftover={morning.resolveLeftover}
        onAddBrainDumpTask={morning.addBrainDumpTask}
        onFinishBrainDump={morning.finishBrainDump}
        onComplete={completeTask}
        onDrop={dropTask}
        onReorder={reorderTasks}
        onReorderCommit={commitReorder}
        onFinishMerge={morning.finishMerge}
        onClose={morning.close}
      />
    );
  }

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
        <button className="rail-action" onClick={morning.start}>start my day</button>
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
          dimmed={compareActive}
        />
      </main>

      {compareActive && candidate && pendingTitle && (
        <CompareDuel candidate={candidate} newTaskTitle={pendingTitle} progress={progress} onDecide={decide} />
      )}
      <AddTaskFab onAdd={begin} disabled={compareActive} />
    </div>
  );
}
```

The rail's existing `rail-action` button (04b, previously a non-functional placeholder reading "start my day") now wires to `morning.start` — no new UI element needed on desktop. Mobile doesn't yet have an equivalent trigger in the compact header; Phase 8's rollover-prompt banner is what actually surfaces the control on mobile in practice (per that phase's own plan), so this phase leaves mobile without a manual trigger and relies on Phase 8 to add one — flagged here rather than silently gapped, since a user testing Phase 7 alone on a narrow viewport needs *some* way in: temporarily call `morning.start()` from the browser console, or test this phase primarily at ≥ 900px width, and treat mobile-triggering as complete once Phase 8 lands.

- [x] **Step 4: Test it yourself**

First simulate a leftover: in the Supabase Table Editor, pick an existing active task and set its `last_triaged_on` to yesterday's date (e.g. if today is `2026-08-09`, set it to `2026-08-08`).

Run `npm run dev` at ≥ 900px width, sign in, click "start my day" in the left rail. Confirm:
1. A three-segment step indicator appears at the top, first segment coral (active), other two grey (pending).
2. The leftover task appears as a swipeable card reading "still open · 1 left", centered in a fixed-width column with the dimmed `Today` list visible at the edges (desktop only — resize below 900px and confirm it becomes full-bleed opaque instead).
3. Swiping it right (or tapping "keep →") advances to the brain-dump screen; the step indicator's first segment turns solid violet (done), second turns coral (active). Check Supabase — the task's `last_triaged_on` is now today's date and it's still `status: 'active'`.
4. Repeat the simulation, but this time swipe/tap left ("let it go") — confirm in Supabase the task's `status` became `'dropped'`.
5. On the brain-dump screen, add 2-3 new task titles — each appears in the running list below the input immediately.
6. Click "done adding — sort the day" — step indicator's third segment goes active; you land on the merge screen showing the full current list, with a "kept from yesterday" label above any carried-over task (if you kept one).
7. Drag to reorder them, then click "start the day" — you're back on the normal Today view with the final order.
8. Refresh — the order and every status change from this flow persisted.
9. Click "close" (top right of the flow) partway through — confirm it exits back to the normal Today view without forcing you to finish (per Phase 8's "never force-navigate" principle, applied here too even though Phase 8 hasn't been built yet).

- [x] **Step 5: Commit**

```bash
git add src/components/MorningFlow.tsx src/pages/Today.tsx src/styles/global.css
git commit -m "feat: wire up the morning start-my-day flow"
```

## Phase 7 done when

Clicking "start my day" (desktop rail, for now — see Task 6's note on the mobile trigger deferring to Phase 8) walks you through leftover triage (swipe/tap keep or drop), brain dump (flat capture), and merge (drag to final order) with a visible step indicator throughout, each step's changes persist, the flow renders as a centered panel on desktop and full-bleed on mobile, and you land back on the normal Today view when finished or closed early.
