# Phase 4: Done and Drop

> Depends on: Phase 3 (ranked list renders and can add tasks). Read `docs/plans/reflow-v1/archive/00-overview.md` for the locked motion spec.

**Goal of this phase:** mark a task done, or drop it, from the main list — each with the correct animation from branding.md's motion table (soft fade/collapse, never a shake or red flash). This introduces Framer Motion for the first time; later phases (5, 6, 7) build directly on the patterns established here.

`[OPEN DECISION]` marker: branding.md's motion table doesn't specify a distinct animation for "done" vs. "drop" — only "dropping a task" is specified ("relief, not deletion... soft fade and collapse"). This phase uses that same fade/collapse for both, and has the completed task disappear immediately rather than staying crossed out. `docs/plans/reflow/11-open-decisions.md` tracks whether "done" should instead stay visible, crossed out, for the rest of the day — revisit this phase if that's resolved differently.

## Files

- Modify: `src/lib/tasks.ts` (no change needed — `updateTaskStatus` already exists from Phase 2)
- Modify: `src/hooks/useTasks.ts` — add `completeTask` and `dropTask`
- Modify: `src/components/TaskRow.tsx` — add checkbox and drop button
- Modify: `src/components/TaskList.tsx` — wrap rows in `AnimatePresence`/`motion.div`

## Task 1: Extend `useTasks` with `completeTask` and `dropTask`

**Interfaces:**
- Produces (added to the Phase 3 hook — do not rename the existing `tasks`/`loading`/`addTask`/`reload`): `completeTask: (id: string) => Promise<void>`, `dropTask: (id: string) => Promise<void>`.

- [x] **Step 1: Modify `src/hooks/useTasks.ts`**

Add these two functions inside `useTasks`, and return them alongside the existing ones:

```ts
  async function completeTask(id: string) {
    await updateTaskStatus(id, 'done');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function dropTask(id: string) {
    await updateTaskStatus(id, 'dropped');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }
```

Update the import line to `import { listActiveTasks, createTask, updateTaskStatus, type Task } from '../lib/tasks';` and the return statement to `return { tasks, loading, addTask, completeTask, dropTask, reload };`.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: complete and drop task actions"
```

## Task 2: `TaskRow` checkbox and drop button

Swipe is reserved for binary decisions elsewhere in the app (keep/drop leftovers, urgency compare — see the overview's Global Constraints), so marking done or dropping from the main list uses tap targets, not a swipe, to avoid a third meaning for the same gesture.

**Interfaces:**
- Consumes (added to the Phase 3 props): `onComplete: (id: string) => void`, `onDrop: (id: string) => void`.

- [x] **Step 1: Modify `src/components/TaskRow.tsx`**

```tsx
import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskRow({ task, onComplete, onDrop }: TaskRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 14,
        background: 'var(--sand)',
        color: 'var(--graphite)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <button
        aria-label="mark settled"
        onClick={() => onComplete(task.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `1.75px solid var(--stone)`,
          background: 'transparent',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      />
      <span style={{ flex: 1 }}>{task.title}</span>
      <button
        aria-label="let it go"
        onClick={() => onDrop(task.id)}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--silt)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        ×
      </button>
    </div>
  );
}
```

The `aria-label`s use branding.md's vocabulary ("settled", "let it go") rather than generic terms — this is a small down payment on Phase 10's full tone-of-voice pass, not a substitute for it.

- [x] **Step 2: Commit**

```bash
git add src/components/TaskRow.tsx
git commit -m "feat: done and drop controls on task rows"
```

## Task 3: Animate the exit

**Interfaces:**
- Consumes: `framer-motion`'s `motion` and `AnimatePresence`.

- [x] **Step 1: Modify `src/components/TaskList.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onDrop }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)', padding: 18 }}>
        nothing on the list yet — add your first task below.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, paddingBottom: 96 }}>
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={false}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <TaskRow task={task} onComplete={onComplete} onDrop={onDrop} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

`layout` on each row is what makes the *remaining* rows slide smoothly into the gap left by the removed one — this is the same prop later phases rely on for the reorder and compare-insertion "reflow" animation, so this is the first place it's introduced. `exit` with `height: 0` is the "soft fade and collapse" branding.md calls for; there's no red, no shake.

- [x] **Step 2: Update `src/pages/Today.tsx`** to pass the new props through

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { AddBar } from '../components/AddBar';

export function Today() {
  const { tasks, loading, addTask, completeTask, dropTask } = useTasks();
  const { signOut } = useAuth();

  if (loading) return null;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
        <span style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--petrol)' }}>
          reflow
        </span>
        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: 'var(--stone)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
        >
          sign out
        </button>
      </header>
      <TaskList tasks={tasks} onComplete={completeTask} onDrop={dropTask} />
      <AddBar onAdd={addTask} />
    </div>
  );
}
```

- [x] **Step 3: Test it yourself**

Run `npm run dev`. Add three tasks. Confirm:
1. Clicking the circle on the middle task fades and collapses it out, and the row below smoothly slides up to fill the gap (not an instant jump).
2. Clicking "×" on a task does the same collapse.
3. Refresh the page — completed/dropped tasks stay gone (confirms the Supabase `status` update persisted, not just local removal).
4. In the Supabase Table Editor, confirm the row's `status` is `'done'` or `'dropped'` as expected, and `completed_at` is set for the done one.

- [x] **Step 4: Commit**

```bash
git add src/components/TaskList.tsx src/pages/Today.tsx
git commit -m "feat: animate task completion and drop"
```

## Phase 4 done when

Marking a task done or dropping it removes it from the list with a smooth fade-and-collapse, the remaining rows resettle instead of jumping, and the change survives a refresh.
