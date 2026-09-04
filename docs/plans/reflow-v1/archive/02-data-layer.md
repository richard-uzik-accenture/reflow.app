# Phase 2: Data Layer

> Depends on: Phase 1 (auth working, Supabase client connected). Read `docs/plans/reflow-v1/archive/00-overview.md` for the schema and global constraints.

**Goal of this phase:** the `tasks` table exists with RLS locked to the signed-in user, the ranking algorithm is implemented and unit-tested, and typed data-access functions exist for every operation later phases need. No visible UI change yet — this phase is verified via a temporary debug page and Vitest.

## Files

- Create: `supabase/migrations/0001_tasks.sql` (kept for the record; you'll actually run this via the Supabase SQL editor)
- Create: `src/lib/ranking.ts`
- Create: `src/lib/ranking.test.ts`
- Create: `src/lib/tasks.ts`
- Modify: `src/App.tsx` (temporary debug view, replaced in Phase 3)
- Create: `vitest.config.ts`

## Task 1: Create the `tasks` table

- [x] **Step 1: Write the migration file** — `supabase/migrations/0001_tasks.sql`

```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'active' check (status in ('active', 'done', 'dropped')),
  rank double precision not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  last_triaged_on date not null default current_date
);

create index tasks_user_status_rank_idx on public.tasks (user_id, status, rank);

alter table public.tasks enable row level security;

create policy "Users manage their own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Run it** — paste the contents into the Supabase dashboard's SQL Editor and run it against your project. (Supabase CLI migrations are overkill for a single-developer project at this stage; the file above is kept in the repo purely as a readable record of the schema.)

- [ ] **Step 3: Test it yourself**

In the Supabase dashboard, Table Editor → `tasks` → Insert row manually: `user_id` = your user's UUID (find it in Authentication → Users), `title` = `"test"`, `rank` = `0`. Confirm the row saves and `status` defaulted to `'active'`.

Then, in the SQL Editor, run `select * from tasks;` while authenticated as a *different* or anonymous session — confirm RLS blocks it (0 rows / permission denied), and that `select * from tasks` in the dashboard's own privileged connection still shows your row (the dashboard bypasses RLS, so this only confirms the table isn't empty — the real RLS check happens in Task 3 of this phase, through the app's own client).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_tasks.sql
git commit -m "feat: add tasks table with RLS"
```

## Task 2: Ranking algorithm

**Interfaces:**
- Produces: `rankBetween(before: number | null, after: number | null): number` and `renumber(count: number): number[]`, consumed by `src/lib/tasks.ts` (this phase), Phase 5 (drag reorder), and Phase 6 (compare duel).

- [x] **Step 1: Write the failing tests** — `src/lib/ranking.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { rankBetween, renumber } from './ranking';

describe('rankBetween', () => {
  it('returns 0 for an empty list (both neighbors null)', () => {
    expect(rankBetween(null, null)).toBe(0);
  });

  it('returns after - 1 when inserting before everything', () => {
    expect(rankBetween(null, 10)).toBe(9);
  });

  it('returns before + 1 when inserting after everything', () => {
    expect(rankBetween(10, null)).toBe(11);
  });

  it('returns the midpoint when inserting between two ranks', () => {
    expect(rankBetween(10, 20)).toBe(15);
  });

  it('handles adjacent integer ranks without colliding', () => {
    const result = rankBetween(10, 11);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(11);
  });
});

describe('renumber', () => {
  it('produces evenly spaced integer ranks for the given count', () => {
    expect(renumber(4)).toEqual([0, 1, 2, 3]);
  });

  it('returns an empty array for zero items', () => {
    expect(renumber(0)).toEqual([]);
  });
});
```

- [x] **Step 2: Configure Vitest** — `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [x] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './ranking'` (file doesn't exist yet).

- [x] **Step 4: Write the implementation** — `src/lib/ranking.ts`

```ts
/**
 * Computes a rank value that sorts strictly between `before` and `after`.
 * Pass `null` for a missing neighbor (inserting at the very top or bottom).
 */
export function rankBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

/** Evenly spaced integer ranks for `count` items, in order. Used to defragment ranks after a full manual reorder. */
export function renumber(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}
```

- [x] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 7 tests.

- [x] **Step 6: Commit**

```bash
git add src/lib/ranking.ts src/lib/ranking.test.ts vitest.config.ts package.json
git commit -m "feat: rank calculation with tests"
```

## Task 3: Typed data-access functions

**Interfaces:**
- Consumes: `supabase` client from `src/lib/supabase.ts` (Phase 1), `rankBetween` from `src/lib/ranking.ts`.
- Produces: the `Task` type and the functions below, consumed by every UI phase from Phase 3 onward. Later phases must use these exact names and signatures — don't invent parallel ad-hoc queries in components.

- [x] **Step 1: Write `src/lib/tasks.ts`**

```ts
import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  status: 'active' | 'done' | 'dropped';
  rank: number;
  created_at: string;
  completed_at: string | null;
  last_triaged_on: string; // ISO date, e.g. "2026-08-09"
}

/** All active tasks for the signed-in user, ordered most-urgent-first. */
export async function listActiveTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

/** Creates a task at the given rank. Callers compute the rank (top-level list append, or via the compare mechanic). */
export async function createTask(userId: string, title: string, rank: number): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, rank, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  const patch: Partial<Task> = { status };
  if (status === 'done') patch.completed_at = new Date().toISOString();
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
  if (error) throw error;
}

export async function updateTaskRank(taskId: string, rank: number): Promise<void> {
  const { error } = await supabase.from('tasks').update({ rank }).eq('id', taskId);
  if (error) throw error;
}

/** Bulk rank update used after a full manual reorder (Phase 5). */
export async function updateTaskRanks(updates: { id: string; rank: number }[]): Promise<void> {
  await Promise.all(updates.map((u) => updateTaskRank(u.id, u.rank)));
}

export async function markTriaged(taskId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('tasks').update({ last_triaged_on: today }).eq('id', taskId);
  if (error) throw error;
}
```

- [x] **Step 2: Temporary debug view in `src/App.tsx`**

Replace the "signed in as…" placeholder body with a call to `listActiveTasks()` on mount and a raw `<pre>` dump, purely to prove the round trip works end to end:

```tsx
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { SignIn } from './pages/SignIn';
import { listActiveTasks, type Task } from './lib/tasks';

function App() {
  const { session, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (session) listActiveTasks().then(setTasks);
  }, [session]);

  if (loading) return null;
  if (!session) return <SignIn />;

  return (
    <div style={{ padding: 24 }}>
      <p>signed in as {session.user.email}</p>
      <pre>{JSON.stringify(tasks, null, 2)}</pre>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Test it yourself**

Run `npm run dev`, sign in. You should see the one task you manually inserted in Task 1 rendered as JSON. In the Supabase Table Editor, insert a second row for your `user_id` with a different `rank`; refresh the app; confirm it appears in the array **in ascending rank order**.

- [x] **Step 4: Commit**

```bash
git add src/lib/tasks.ts src/App.tsx
git commit -m "feat: typed task data-access functions"
```

## Phase 2 done when

`npm test` passes all ranking tests, and the app (once signed in) shows your manually-inserted Supabase rows as JSON, correctly ordered by rank.
