# Phase 5: Drag Reorder

> Depends on: Phase 4 and [04b-design-system-revision.md](04b-design-system-revision.md) (done/drop with `layout` animation working, on the revised rail+column layout and ink-violet/coral tokens). Read `docs/plans/reflow-v1/archive/00-overview.md`, especially the locked constraint: mobile reordering must be true long-press drag, never up/down buttons.

**Goal of this phase:** manually drag any row to a new position, on both mouse and touch, with ranks renumbered and persisted once the drag ends. This is also the last piece `06-compare-duel.md` needs — the reflow spring animation this phase wires up is reused, unchanged, for compare-insertion.

## Files

- Create: `src/hooks/useLongPressDrag.ts`
- Modify: `src/lib/tasks.ts` (no change — `updateTaskRanks` already exists from Phase 2)
- Modify: `src/hooks/useTasks.ts` — add `reorderTasks` (local, called continuously during drag) and `commitReorder` (persists once, on drag end)
- Modify: `src/components/TaskList.tsx` — swap the plain `motion.div` list for `Reorder.Group`/`Reorder.Item`
- Modify: `src/components/TaskRow.tsx` — attach the long-press-drag handlers

## Task 1: Long-press-to-drag hook

Mouse users can start a drag immediately (there's no scroll-gesture ambiguity with a mouse). Touch users need to hold briefly first, so an ordinary vertical swipe-to-scroll isn't mistaken for a reorder — this is the Trello-style behavior `PRODUCT.md` locks in.

**Interfaces:**
- Produces: `useLongPressDrag(): { dragControls: DragControls, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }`, consumed by `TaskRow.tsx`.

- [x] **Step 1: Write `src/hooks/useLongPressDrag.ts`**

```ts
import { useRef } from 'react';
import { useDragControls } from 'framer-motion';

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_THRESHOLD_PX = 10;

export function useLongPressDrag() {
  const dragControls = useDragControls();
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function cancel() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') {
      dragControls.start(e);
      return;
    }
    startPointRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = window.setTimeout(() => {
      dragControls.start(e);
      timerRef.current = null;
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startPointRef.current || timerRef.current === null) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) cancel();
  }

  return { dragControls, onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel };
}
```

On mouse, drag starts on pointer-down with no delay — the long press is specifically a touch affordance to disambiguate from scrolling, not a universal delay.

> **Deviation from the original sample:** the installed `framer-motion` (13.0.0) doesn't export a `PointerEvent` type — `DragControls.start()` takes `React.PointerEvent | PointerEvent` directly, so the cast through a framer-motion-specific type in earlier drafts of this file was removed. The code above is what's actually on disk.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useLongPressDrag.ts
git commit -m "feat: long-press-to-drag hook for touch reordering"
```

## Task 2: Extend `useTasks` with reorder + commit

**Interfaces:**
- Produces (added to the existing hook — `tasks`, `loading`, `addTask`, `completeTask`, `dropTask`, `reload` are unchanged): `reorderTasks: (newOrder: Task[]) => void` (synchronous, local-only — called on every drag-move for a responsive feel), `commitReorder: () => Promise<void>` (persists the current order's ranks — called once, on drag end).

- [x] **Step 1: Modify `src/hooks/useTasks.ts`** — add:

```ts
  function reorderTasks(newOrder: Task[]) {
    setTasks(newOrder);
  }

  async function commitReorder() {
    const ranks = renumber(tasks.length);
    await updateTaskRanks(tasks.map((t, i) => ({ id: t.id, rank: ranks[i] })));
  }
```

Update the import to `import { rankBetween, renumber } from '../lib/ranking';` and `import { listActiveTasks, createTask, updateTaskStatus, updateTaskRanks, type Task } from '../lib/tasks';`, and the return statement to include `reorderTasks, commitReorder`.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: local reorder + persisted commit"
```

## Task 3: Drag-enabled `TaskRow` and `TaskList`

> **Builds on [04b-design-system-revision.md](04b-design-system-revision.md), not on this phase's original pre-revision markup.** By the time this phase is implemented, `TaskRow`/`TaskList` already use the className-based responsive structure from 04b's Task 3 (hairline list desktop / card list mobile, ink-violet/coral tokens) instead of the inline `style` objects and petrol/sand/silt tokens this file originally specified. The code below reflects that — swap in `Reorder.Item`/`Reorder.Group` and the drag handlers while keeping 04b's `className`s and CSS, not the other way around.

**Interfaces:**
- `TaskList` consumes (added props): `onReorder: (newOrder: Task[]) => void`, `onReorderCommit: () => void`.
- `TaskRow` consumes (added props): same two, passed through, plus renders as a `Reorder.Item` instead of a plain `div`.

- [x] **Step 1: Modify `src/components/TaskRow.tsx`**

```tsx
import { Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { useLongPressDrag } from '../hooks/useLongPressDrag';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorderCommit: () => void;
}

export function TaskRow({ task, onComplete, onDrop, onReorderCommit }: TaskRowProps) {
  const { dragControls, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useLongPressDrag();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onReorderCommit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="task-row"
      style={{ touchAction: 'pan-y' }}
    >
      <span className="rank" aria-hidden="true" />
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check" />
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">×</button>
    </Reorder.Item>
  );
}
```

`className="task-row"` reuses 04b's existing responsive CSS unchanged — only the wrapping element (`Reorder.Item` instead of `div`) and the drag-related props are new. `touchAction: 'pan-y'` (kept as an inline style since it's JS-driven behavior, not a design token) lets an ordinary vertical scroll pass through to the page during the pre-long-press window, instead of the browser treating every touch on a row as a potential drag.

- [x] **Step 2: Modify `src/components/TaskList.tsx`**

```tsx
import { AnimatePresence, Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
}

export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <Reorder.Group as="div" axis="y" values={tasks} onReorder={onReorder} className="task-list">
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDrop={onDrop}
            onReorderCommit={onReorderCommit}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}
```

Reuses 04b's `.task-list`/`.empty-state` classes unchanged — no new CSS needed for this step.

`Reorder.Item` (used inside `TaskRow`) is itself a `motion` component with built-in `layout` animation and `exit` support, so it slots into the existing `AnimatePresence` from Phase 4 without changes to the done/drop animation.

- [x] **Step 3: Modify `src/pages/Today.tsx`** to pass the new reorder props through

`Today.tsx` already has the rail+header shell and `AddTaskFab` from 04b — this step only adds `onReorder`/`onReorderCommit` to the existing `<TaskList>` call, nothing else in the file changes:

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';

export function Today() {
  const { tasks, loading, completeTask, dropTask, reorderTasks, commitReorder } = useTasks();
  const { signOut } = useAuth();

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
        <div className="header-right">
          <span className="count-chip">{tasks.length} today</span>
        </div>
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
        />
      </main>

      <AddTaskFab />
    </div>
  );
}
```

- [ ] **Step 4: Test it yourself** — NOT yet verified in a real browser; only automated checks (`tsc --noEmit`, `vitest run`, `vite build`) were run during implementation. Still needs a manual pass:

Run `npm run dev` with at least 4 tasks. On desktop with a mouse:
1. Press and drag a row — it should lift and follow the cursor immediately (no delay), other rows should smoothly reflow to make space.
2. Release — the row settles into its new position. Refresh the page — the new order persisted (check `rank` values in Supabase: they should now be clean integers `0, 1, 2, …`).

On an actual touch device (or Chrome DevTools device toolbar with touch simulation) on the deployed or LAN-accessible dev server (see Phase 9 for exposing the dev server to your phone):
3. A quick tap-and-release on a row does **not** start a drag.
4. Touching and holding for roughly a third of a second, then dragging, **does** move the row — confirm ordinary scrolling still works when you don't pause first.

- [x] **Step 5: Commit**

```bash
git add src/components/TaskRow.tsx src/components/TaskList.tsx src/pages/Today.tsx
git commit -m "feat: drag-to-reorder with long-press on touch"
```

## Phase 5 done when

Rows can be manually dragged into a new order on both mouse and touch (touch requiring a brief hold first), the reflow is animated rather than an instant jump, and the new order survives a refresh with clean integer ranks.
