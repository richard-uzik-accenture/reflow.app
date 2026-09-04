# Phase 8: Automatic Rollover Detection

> Depends on: Phase 7 (morning flow works when manually triggered) and [04b-design-system-revision.md](04b-design-system-revision.md) (rail+header layout, ink-violet/coral tokens). Read `docs/plans/reflow-v1/archive/00-overview.md`.

**Goal of this phase:** stop relying on manually clicking "start my day" in the desktop rail. When the app loads and leftovers exist (from `isLeftover`/`getLeftoverTasks`, Phase 7), show a calm, dismissible prompt instead — never force-navigate into the flow, since you might open the app mid-task and not be ready to triage yet. "Nothing silently falls off" (a `PRODUCT.md` principle) is satisfied by the prompt reappearing every time the app loads with leftovers still untriaged, not by forcing the flow. **This is also where the mobile trigger gap flagged in `07-morning-flow.md`'s Task 6 gets closed** — mobile's compact header has no "start my day" control of its own; the banner this phase adds is that control on narrow viewports, appearing whenever there's something to triage. (Mobile with *zero* leftovers still has no manual trigger after this phase — flagged again below, not silently dropped.)

## Files

- Create: `src/hooks/useRolloverPrompt.ts`
- Modify: `src/pages/Today.tsx` — replace the plain "start my day" button with the conditional prompt

## Task 1: `useRolloverPrompt` hook

**Interfaces:**
- Consumes: `getLeftoverTasks` from `src/lib/triage.ts` (Phase 7).
- Produces: `{ hasLeftovers: boolean, dismissed: boolean, dismiss: () => void }`, consumed by `Today.tsx`.

- [x] **Step 1: Write `src/hooks/useRolloverPrompt.ts`**

```ts
import { useMemo, useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

export function useRolloverPrompt(tasks: Task[]) {
  const [dismissed, setDismissed] = useState(false);

  const hasLeftovers = useMemo(() => getLeftoverTasks(tasks).length > 0, [tasks]);

  return { hasLeftovers, dismissed, dismiss: () => setDismissed(true) };
}
```

`dismissed` is deliberately local, in-memory state — it resets on every reload. That's the point: a genuine new day (or just reopening the app tomorrow) should prompt again, but dismissing the banner shouldn't need a persisted "don't ask me again" flag. Recomputing `hasLeftovers` from `tasks` on every render (rather than once at mount) means finishing the morning flow makes the banner disappear immediately, without a page reload.

- [x] **Step 2: Commit**

```bash
git add src/hooks/useRolloverPrompt.ts
git commit -m "feat: rollover prompt detection hook"
```

## Task 2: Wire the prompt into `Today.tsx`

By this point `Today.tsx` (from 04b, extended in Phase 7) has a desktop rail with a working `rail-action` "start my day" button, and a mobile compact header (`today-header-mobile`) with no trigger at all. This task adds the banner **above `<main>`, inside `today-main` on mobile / below the rail's fixed controls on desktop** — it doesn't replace the rail button (which stays exactly as Phase 7 left it), it adds a second, more prominent entry point that only appears when there's something to triage.

- [x] **Step 1: Modify `src/pages/Today.tsx`**

Add the import and hook call:

```tsx
import { useRolloverPrompt } from '../hooks/useRolloverPrompt';
```

```tsx
  const rollover = useRolloverPrompt(tasks);
```

Insert the banner as the first child of `<main className="today-main">`, before the `<h1 className="list-heading">`:

```tsx
      <main className="today-main">
        {rollover.hasLeftovers && !rollover.dismissed && (
          <div className="rollover-banner">
            <button className="rollover-prompt" onClick={morning.start}>
              still open from before — start my day?
            </button>
            <button className="rollover-dismiss" onClick={rollover.dismiss}>not now</button>
          </div>
        )}
        <h1 className="list-heading">today</h1>
        {/* ...rest of today-main unchanged from Phase 7 */}
      </main>
```

Add to `src/styles/global.css`:

```css
.rollover-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--mist);
  margin-bottom: 18px;
}
.rollover-prompt {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--violet);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
}
.rollover-dismiss {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--dusk);
  background: none;
  border: none;
  cursor: pointer;
}
```

Placing the banner inside `today-main` (rather than `position: fixed`, which the original draft of this phase used) means it sits naturally above the list on both breakpoints, scrolls with the page instead of overlapping content, and needs no manual `top` offset to dodge the header — it just occupies its own row in the existing flex/grid flow.

This closes the mobile trigger gap from `07-morning-flow.md`: on narrow viewports, the banner (when leftovers exist) is now the only way to start the flow, since the compact mobile header has no button of its own. **Zero-leftover mobile still has no manual trigger** — if you want one regardless of leftover state, add a small icon button to `.today-header-mobile` calling `morning.start`; this phase doesn't add one, since the rail's plain button already covers "no leftovers, but I want to re-triage/brain-dump anyway" on desktop, and mobile's use case (open app mid-interruption, add one task, close it) rarely needs that path — revisit if it turns out you want it in practice.

- [x] **Step 2: Test it yourself**

Simulate a leftover again (Supabase Table Editor, set an active task's `last_triaged_on` to yesterday), then:
1. Reload the app — confirm a `mist`-colored banner appears above the list reading "still open from before — start my day?" in violet, with a "not now" dismiss button in dusk grey.
2. Click "not now" — the banner disappears; the leftover task is untouched in Supabase (still yesterday's `last_triaged_on`, still active). On desktop, confirm the rail's "start my day" button is still there and still works regardless of the banner's state.
3. Reload again — confirm the banner reappears (dismissal doesn't persist across reloads).
4. This time click the banner itself, complete the morning flow (Phase 7's steps) — confirm that once you return to the normal Today view, the banner is gone (no leftovers remain), without needing a reload.
5. At a narrow (< 900px) viewport with a simulated leftover, confirm the banner is the only visible way to start the flow (no rail is present at this width).

- [x] **Step 3: Commit**

```bash
git add src/pages/Today.tsx src/styles/global.css
git commit -m "feat: auto-prompt the morning flow when leftovers exist"
```

## Phase 8 done when

Opening the app with untriaged leftovers shows the calm banner prompt above the list (not a forced redirect, not overlapping other chrome), dismissing it works for the current session, it clears itself the moment the morning flow resolves every leftover, and mobile — which has no other trigger — can start the flow via the banner whenever leftovers exist.
