# Phase 9: Multi-Device Sync

> Depends on: Phase 8. Read `docs/plans/reflow-v1/archive/00-overview.md` — multi-device sync is a locked product requirement (`PRODUCT.md` Operating Context).

**Goal of this phase:** changes made on one device appear on another without a manual refresh, via Supabase Realtime. Also covers getting the app onto a phone for real testing (LAN dev server, then a proper deploy) since this phase can't be meaningfully tested on one laptop tab alone.

## Files

- Create: `src/lib/realtimeMerge.ts`
- Create: `src/lib/realtimeMerge.test.ts`
- Modify: `src/hooks/useTasks.ts` — subscribe to Realtime changes
- Create: `vercel.json` (optional, only if Vercel needs routing hints — see Task 3)

## Task 1: Merge logic for incoming realtime rows

Applying a realtime row naively (e.g. always appending) risks duplicate rows or wrong order. This needs the same care as the ranking and compare algorithms — a small pure function, tested.

**Interfaces:**
- Produces: `upsertActiveTask(tasks: Task[], row: Task): Task[]`, consumed by `useTasks.ts`.

- [ ] **Step 1: Write the failing tests** — `src/lib/realtimeMerge.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { upsertActiveTask } from './realtimeMerge';
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

describe('upsertActiveTask', () => {
  it('inserts a new active row at the correct sorted position', () => {
    const existing = [makeTask({ id: 'a', rank: 0 }), makeTask({ id: 'c', rank: 2 })];
    const incoming = makeTask({ id: 'b', rank: 1 });
    const result = upsertActiveTask(existing, incoming);
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('replaces an existing row rather than duplicating it', () => {
    const existing = [makeTask({ id: 'a', rank: 0, title: 'old title' })];
    const incoming = makeTask({ id: 'a', rank: 0, title: 'new title' });
    const result = upsertActiveTask(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('new title');
  });

  it('re-sorts when an existing row arrives with a changed rank', () => {
    const existing = [makeTask({ id: 'a', rank: 0 }), makeTask({ id: 'b', rank: 1 })];
    const incoming = makeTask({ id: 'a', rank: 5 });
    const result = upsertActiveTask(existing, incoming);
    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('removes a task that transitions away from active status', () => {
    const existing = [makeTask({ id: 'a', rank: 0 }), makeTask({ id: 'b', rank: 1 })];
    const incoming = makeTask({ id: 'a', rank: 0, status: 'done' });
    const result = upsertActiveTask(existing, incoming);
    expect(result.map((t) => t.id)).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './realtimeMerge'`.

- [ ] **Step 3: Write the implementation** — `src/lib/realtimeMerge.ts`

```ts
import type { Task } from './tasks';

/** Merges an incoming realtime row into the current active-task list: upserts by id, sorted by rank, or removes the row if it's no longer active. */
export function upsertActiveTask(tasks: Task[], row: Task): Task[] {
  const withoutRow = tasks.filter((t) => t.id !== row.id);
  if (row.status !== 'active') return withoutRow;

  const insertIndex = withoutRow.findIndex((t) => t.rank > row.rank);
  const index = insertIndex === -1 ? withoutRow.length : insertIndex;
  const next = [...withoutRow];
  next.splice(index, 0, row);
  return next;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests across every phase's `.test.ts` file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/realtimeMerge.ts src/lib/realtimeMerge.test.ts
git commit -m "feat: realtime row merge logic with tests"
```

## Task 2: Subscribe to Realtime changes

- [ ] **Step 1: Enable Realtime on the table** — dashboard step: Supabase dashboard → Database → Replication → toggle the `tasks` table on.

- [ ] **Step 2: Modify `src/hooks/useTasks.ts`** — add a subscription effect

```ts
useEffect(() => {
  if (!session) return;

  const channel = supabase
    .channel(`tasks-changes-${session.user.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
      (payload) => {
        if (payload.eventType === 'DELETE') return; // the app never deletes rows, only changes status
        setTasks((prev) => upsertActiveTask(prev, payload.new as Task));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session]);
```

Add this as a second `useEffect` alongside the existing `reload`-on-mount effect (don't merge them — one fetches once, the other subscribes for the session's lifetime). Update the import line to add `upsertActiveTask`: `import { upsertActiveTask } from '../lib/realtimeMerge';`, and add `useEffect` to the React import if not already present.

Every local mutation (`addTask`, `completeTask`, etc.) still updates `tasks` state directly for an instant local response — the realtime event for that same change arrives shortly after and simply upserts over itself as a no-op-equivalent, which is safe because `upsertActiveTask` replaces by id rather than appending.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: subscribe to realtime task changes"
```

## Task 3: Get the app onto a second device

Two ways to test this for real — do the LAN method first (free, immediate), then deploy for lasting multi-device access away from home wifi.

- [ ] **Step 1: LAN test**

Run `npm run dev -- --host`. Vite prints a "Network" URL (e.g. `http://192.168.1.23:5173`) alongside the usual localhost one. On your phone, connected to the same wifi, open that Network URL and sign in with the same account.

- [ ] **Step 2: Test it yourself — the actual sync check**

With the laptop browser and phone browser both open and signed in:
1. On the laptop, add a task. Confirm it appears on the phone within a second or two, with no manual refresh.
2. On the phone, mark a task done. Confirm it fades out on the laptop too.
3. On the laptop, drag-reorder the list. Confirm the phone's list re-settles into the same order.
4. On the phone, add a 3rd+ task to trigger the compare duel, resolve it there — confirm the laptop's list reflects the final inserted position once you're done (the duel itself is local, unshared, interaction — only the *result* needs to sync, which is what Task 1's upsert handles).

- [ ] **Step 3: Deploy for real multi-device use**

The LAN method only works on the same wifi network. For actual daily use from your phone away from home, deploy to Vercel. Per the overview's architecture decisions, this is the *only* hosting to set up — the frontend goes to Vercel, the database/auth/realtime stays on Supabase, and there is no third host to configure because there is no separate API app:

```bash
npm install -g vercel
vercel
```

Follow the prompts (link or create a project), then set the two environment variables from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings, and redeploy (`vercel --prod`). No `vercel.json` is needed for a plain Vite SPA — Vercel detects the framework automatically.

- [ ] **Step 4: Test it yourself**

Open the deployed URL on your phone (any network) and on your laptop. Repeat the four sync checks from Step 2 against the deployed URL instead of the LAN address.

## Phase 9 done when

Actions on one device appear on another within a couple seconds without a manual refresh, verified over LAN and again against the real deployed URL.
