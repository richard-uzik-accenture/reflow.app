# Phase 3: Ranked List UI

> Depends on: Phase 2 (data layer). Read `docs/plans/reflow-v1/archive/00-overview.md` for brand tokens and the structural brief (persistent bottom quick-add bar, list fills the space above it).
>
> **Superseded by [04b-design-system-revision.md](04b-design-system-revision.md).** This file is kept as a historical record of what was actually built and committed at the time — the persistent bottom `AddBar` and petrol/amber colors described below were replaced (floating "+" + modal, ink-violet/coral palette) once Phase 4 was done. If you're implementing this app fresh rather than resuming an in-progress build, skip straight to 04b's version of these components instead of building this file's `AddBar` only to delete it.

**Goal of this phase:** replace the debug JSON dump with the real main day view — a persistent bottom quick-add bar and, above it, today's tasks rendered as a single ranked list in the Reflow visual language. Adding a task appends it at the bottom of the list (the compare/duel insertion behavior is Phase 6). No done/drop/reorder interaction yet (Phase 4/5).

## Files

- Create: `src/hooks/useTasks.ts` — **this file is extended, not replaced, by Phases 4, 5, and 6. Its shape here must match the "Interfaces" block below exactly, because those phases add to it by name.**
- Create: `src/components/AddBar.tsx`
- Create: `src/components/TaskRow.tsx`
- Create: `src/components/TaskList.tsx`
- Create: `src/pages/Today.tsx`
- Modify: `src/App.tsx` (render `Today` instead of the debug dump)

## Task 1: `useTasks` hook

**Interfaces:**
- Consumes: `listActiveTasks`, `createTask`, `Task` from `src/lib/tasks.ts`; `rankBetween` from `src/lib/ranking.ts`; `session` from `useAuth()`.
- Produces (this phase's subset — Phases 4/5/6 add more functions to this same object, never rename these): `{ tasks: Task[], loading: boolean, addTask: (title: string) => Promise<void>, reload: () => Promise<void> }`.

- [x] **Step 1: Write `src/hooks/useTasks.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listActiveTasks, createTask, type Task } from '../lib/tasks';
import { rankBetween } from '../lib/ranking';

export function useTasks() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const data = await listActiveTasks();
    setTasks(data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addTask(title: string) {
    if (!session) return;
    const lastRank = tasks.length > 0 ? tasks[tasks.length - 1].rank : null;
    const rank = rankBetween(lastRank, null);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => [...prev, created]);
  }

  return { tasks, loading, addTask, reload };
}
```

- [x] **Step 2: Test it yourself** — deferred to the end of this phase, once there's a UI to see it through.

- [x] **Step 3: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: useTasks hook with append-only addTask"
```

## Task 2: `AddBar` — the persistent bottom anchor

**Interfaces:**
- Consumes: `onAdd: (title: string) => void` prop.

- [x] **Step 1: Write `src/components/AddBar.tsx`**

```tsx
import { useState, type FormEvent } from 'react';

interface AddBarProps {
  onAdd: (title: string) => void;
}

export function AddBar({ onAdd }: AddBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        gap: 8,
        padding: 12,
        background: 'var(--paper)',
        borderTop: `1px solid var(--silt)`,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="what needs doing?"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 999,
          border: `1px solid var(--silt)`,
          background: 'var(--sand)',
          color: 'var(--graphite)',
          fontFamily: 'var(--font-body)',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--petrol)',
          color: 'var(--paper)',
          fontFamily: 'var(--font-body)',
        }}
      >
        add
      </button>
    </form>
  );
}
```

Note: amber is deliberately absent here — branding.md reserves it for decision moments only, and adding a task is not one of those (see the overview's Global Constraints).

- [x] **Step 2: Commit**

```bash
git add src/components/AddBar.tsx
git commit -m "feat: persistent bottom quick-add bar"
```

## Task 3: `TaskRow` and `TaskList`

**Interfaces:**
- `TaskRow` consumes: `task: Task` prop.
- `TaskList` consumes: `tasks: Task[]` prop.

- [x] **Step 1: Write `src/components/TaskRow.tsx`**

The rounded-bar shape echoes the "reflow" logo mark (a stack of rounded bars) — this row *is* the logo's shape, at content scale.

```tsx
import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 14,
        background: 'var(--sand)',
        color: 'var(--graphite)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {task.title}
    </div>
  );
}
```

- [x] **Step 2: Write `src/components/TaskList.tsx`**

```tsx
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)', padding: 18 }}>
        nothing on the list yet — add your first task below.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, paddingBottom: 96 }}>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}
```

The `paddingBottom: 96` keeps the last row clear of the fixed `AddBar`.

The empty-state copy ("nothing on the list yet…") follows branding.md's tone rules: no guilt language, calm and factual. It's a placeholder good enough to ship — Phase 10's tone-of-voice pass revisits every string in the app together, this one included.

- [x] **Step 3: Commit**

```bash
git add src/components/TaskRow.tsx src/components/TaskList.tsx
git commit -m "feat: task row and list components"
```

## Task 4: `Today` page and wiring

- [x] **Step 1: Write `src/pages/Today.tsx`**

Includes a small header carrying forward the sign-out control from Phase 1's placeholder shell — this is the app's real home now, so sign-out needs a permanent, visible home too.

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { AddBar } from '../components/AddBar';

export function Today() {
  const { tasks, loading, addTask } = useTasks();
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
      <TaskList tasks={tasks} />
      <AddBar onAdd={addTask} />
    </div>
  );
}
```

- [x] **Step 2: Update `src/App.tsx`** to render it instead of the debug dump

```tsx
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Today } from './pages/Today';

function App() {
  const { session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  if (!session) {
    return showAuth ? <Auth onBack={() => setShowAuth(false)} /> : <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  return <Today />;
}

export default App;
```

- [x] **Step 3: Test it yourself**

Run `npm run dev`, sign in. Confirm:
1. Any tasks you inserted manually in Phase 2 render as rounded rows, below the new header.
2. Typing a title into the bottom bar and pressing "add" (or Enter) appends a new row at the **bottom** of the list, and the input clears.
3. Refresh the page — the new task is still there (confirms it persisted to Supabase, not just local state).
4. With zero tasks (delete them all via the Supabase Table Editor and refresh), the empty-state message shows instead of a blank area.
5. Click "sign out" in the header — you land back on the landing page (not the auth form), and signing back in returns you to your list.

- [x] **Step 4: Commit**

```bash
git add src/pages/Today.tsx src/App.tsx
git commit -m "feat: wire up the main day view"
```

## Phase 3 done when

You can sign in, see your real tasks as a ranked list, add a new one via the bottom bar, and it persists across a refresh.
