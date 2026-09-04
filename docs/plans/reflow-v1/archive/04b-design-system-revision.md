# Phase 4b: Design System Revision

> Depends on: Phase 4 (done/drop working). Read `docs/plans/reflow-v1/archive/00-overview.md` and the revised `branding.md` (§1 logo, §2 color) before starting — §2 was rewritten in this revision and is the source of truth for every hex value below.

**Goal of this phase:** Phases 1-4 shipped with placeholder layout (a plain centered form-page shell, a persistent bottom input bar, inline styles with no real hierarchy) and the original petrol-teal/amber palette. Both were revisited before continuing to Phase 5, because building three more phases (drag-reorder, compare-duel, morning-flow) on top of placeholder styling would mean redoing everything twice. This phase retrofits the color and structural decisions below into every screen that already exists, and locks the layout spec every later phase (5-10) must build against — replacing Phase 10's job of a pure polish pass with "polish, not redesign."

This is **not** a jump ahead to Phase 10. Fonts are still `system-ui` after this phase (real font files are still Phase 10, Task 2) and icons are still a text "×" (Phase 10, Task 3). This phase only fixes color and structural layout — the two things that would be expensive to redo per-phase later.

## Why this phase exists

Mid-build, after Phase 4 shipped, the running app was reviewed against `branding.md` and two things were flagged:

1. **The petrol-teal + amber + warm-paper palette read as washed out and generic** — a real product decision, not a polish detail, so it was revisited and replaced. `branding.md` §2 now specifies **ink violet + signal coral** on cool-white neutrals instead. Every hex value in this repo's code changes; the *rules* (one scarce decision accent, no red/green pair) don't.
2. **The layout itself was placeholder-grade**: a persistent bottom text-input bar (read as a chat app, not a task list), a plain single-column form-page shell with no real desktop/mobile distinction, and — worst — the compare duel (the product's signature mechanic) rendered as two side-by-side boxes, which is genuinely confusing (unclear which one you're supposed to act on) and not what `idea.md` actually specifies ("Tinder-style" — one card, swiped).

Both are addressed below as concrete specs, not prose — later phases implement directly from this file the same way they'd implement from any other phase file.

## Files

- Modify: `src/styles/tokens.css` — replace every color value
- Modify: `src/components/TaskRow.tsx`, `src/components/TaskList.tsx` — restructure for the rail+column desktop layout and card-based mobile layout
- Modify: `src/components/AddBar.tsx` → **delete**, replaced by `src/components/AddTaskFab.tsx` and `src/components/AddTaskModal.tsx`
- Modify: `src/pages/Today.tsx` — new layout shell (rail on desktop, compact header on mobile), wires the FAB + modal instead of the bottom bar
- Modify: `src/pages/Landing.tsx`, `src/pages/Auth.tsx` — recolor only, no structural change (out of scope for this pass — flagged, not redone)
- No change to `src/hooks/useTasks.ts` or any `.ts` logic file — this phase is presentation-only

## Task 1: Replace every color token

**Interfaces:** No change to token *names* consumers already use (`var(--petrol)`, `var(--paper)`, etc. keep working) — only their values change, plus new tokens are added. This means no component `.tsx` file needs an edit for color alone; only `tokens.css` changes for this task.

- [x] **Step 1: Modify `src/styles/tokens.css`**

Replace the `:root` block's color values with the new palette from `branding.md` §2:

```css
:root {
  /* Brand */
  --petrol-ink: #171335;   /* ink violet — kept the old --petrol-ink NAME for zero-diff in consuming components */
  --petrol: #4B3F8F;       /* violet — primary */
  --shallow: #7A70B8;      /* violet soft — secondary */
  --signal-amber: #FF6B4A; /* signal coral — decisions only. NAME KEPT for now to avoid a mass rename; see Step 2. */
  --amber-wash: #FFE1D6;   /* coral wash */

  /* Neutrals */
  --paper: #FAF9FB;
  --sand: #F0EEF5;
  --silt: #D9D6E4;
  --stone: #7D7A8C;
  --graphite: #1A1A2E;

  /* Type */
  --font-display: 'Switzer', 'General Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace;

  /* Motion (see branding.md §6) */
  --ease-reflow: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-reflow: 380ms;
  --duration-decide: 175ms;
}
```

- [x] **Step 2: Rename the variables to match the new names** (do this rather than leaving `--petrol`/`--signal-amber` as misleading aliases for violet/coral — a future contributor grepping for "amber" to find the decision-accent color should find it):

```css
:root {
  /* Brand */
  --ink-violet: #171335;
  --violet: #4B3F8F;
  --violet-soft: #7A70B8;
  --signal-coral: #FF6B4A;
  --coral-wash: #FFE1D6;

  /* Neutrals */
  --paper: #FAF9FB;
  --mist: #F0EEF5;
  --haze: #D9D6E4;
  --dusk: #7D7A8C;
  --ink: #1A1A2E;

  /* Type */
  --font-display: 'Switzer', 'General Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace;

  /* Motion (see branding.md §6) */
  --ease-reflow: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-reflow: 380ms;
  --duration-decide: 175ms;
}
```

Then do a project-wide find/replace across every `.tsx` file under `src/`: `--petrol-ink` → `--ink-violet`, `--petrol` → `--violet` (careful: do this replacement *before* `--petrol-ink`, or do a whole-word replace, since `--petrol` is a substring of `--petrol-ink`), `--shallow` → `--violet-soft`, `--signal-amber` → `--signal-coral`, `--amber-wash` → `--coral-wash`, `--paper` stays `--paper`, `--sand` → `--mist`, `--silt` → `--haze`, `--stone` → `--dusk`, `--graphite` → `--ink`.

- [x] **Step 3: Modify `src/styles/global.css`** — update the two hardcoded var references (`body`'s `background`/`color`) to the renamed tokens:

```css
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
}
```

- [x] **Step 4: Test it yourself**

Run `npm run dev`, sign in. Confirm every screen (landing, auth, today) now renders in cool violet-on-paper rather than warm petrol-on-cream — no leftover warm-toned elements, no console errors about undefined CSS variables.

- [x] **Step 5: Commit**

```bash
git add src/styles src/pages src/components
git commit -m "feat: revise palette to ink violet + signal coral"
```

## Task 2: `Today` page — rail + column layout (desktop), compact header (mobile)

**Interfaces:**
- `Today.tsx` no longer renders the plain flex header from Phase 3/4 — replaced by a responsive shell: a left rail on wide viewports (≥ 900px), a compact top header on narrow ones.
- No change to what `Today.tsx` consumes from `useTasks()`/`useAuth()` — this is a pure layout restructure.

- [x] **Step 1: Modify `src/pages/Today.tsx`** — replace the existing `<header>` + flat body with:

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { AddTaskFab } from '../components/AddTaskFab';

export function Today() {
  const { tasks, loading, completeTask, dropTask } = useTasks();
  const { session, signOut } = useAuth();

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
        <TaskList tasks={tasks} onComplete={completeTask} onDrop={dropTask} />
      </main>

      <AddTaskFab />
    </div>
  );
}
```

`session` stays imported/used only if a later phase needs it here (Phase 6+ do); if unused after this task, remove the import per the "remove imports your changes made unused" rule.

- [x] **Step 2: Add the layout CSS** — append to `src/styles/global.css`:

```css
.today-shell {
  display: grid;
  grid-template-columns: 1fr;
}

.today-rail { display: none; }
.today-header-mobile {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--mist);
}
.today-main { padding: 16px 16px 40px; }

@media (min-width: 900px) {
  .today-shell {
    grid-template-columns: 240px minmax(0, 560px);
    justify-content: center;
  }
  .today-rail {
    display: flex;
    flex-direction: column;
    gap: 30px;
    padding: 48px 32px;
    border-right: 1px solid var(--haze);
  }
  .today-header-mobile { display: none; }
  .today-main { padding: 48px 40px 64px; }
}

.wordmark {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  color: var(--violet);
  text-transform: lowercase;
  letter-spacing: -0.01em;
}
.day-meta { display: flex; flex-direction: column; gap: 4px; }
.day-meta .date { font-family: var(--font-mono); font-size: 12px; color: var(--dusk); }
.day-meta .count { font-size: 14px; color: var(--ink); }
.rail-spacer { flex: 1; }
.rail-action, .rail-signout {
  font-family: var(--font-mono);
  font-size: 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
}
.rail-action { color: var(--dusk); }
.rail-signout { color: var(--haze); }

.header-right { display: flex; align-items: center; gap: 12px; }
.count-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dusk);
  background: var(--mist);
  padding: 3px 9px;
  border-radius: 999px;
}

.list-heading {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  color: var(--ink);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.list-sub { font-size: 13px; color: var(--dusk); margin: 0 0 28px; }
```

The mobile "start my day" trigger is intentionally not re-added yet — Phase 7/8 own that control and will place it appropriately once the morning flow exists; this phase only establishes the shell.

- [x] **Step 3: Commit**

```bash
git add src/pages/Today.tsx src/styles/global.css
git commit -m "feat: rail+column desktop layout, compact mobile header"
```

## Task 3: Task rows — desktop hairline list vs. mobile cards

**Interfaces:** No change to `TaskRowProps`/`TaskListProps` (`task`, `onComplete`, `onDrop`) — this task only restructures the CSS, not the component contracts, so Phase 5's `Reorder.Item` wiring and Phase 4's `AnimatePresence` continue to work unmodified.

- [x] **Step 1: Modify `src/components/TaskRow.tsx`** — replace the single hardcoded `--sand` card style with responsive classes:

```tsx
import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskRow({ task, onComplete, onDrop }: TaskRowProps) {
  return (
    <div className="task-row">
      <span className="rank" aria-hidden="true" />
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check" />
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">×</button>
    </div>
  );
}
```

The `rank` span is a placeholder for Phase 5's actual rank-number display (currently the plan has no rank display at all — this reserves the grid slot; Phase 5 or a later polish task fills in the real ordinal). Leave it empty for now rather than inventing rank-number logic in this presentation-only phase.

- [x] **Step 2: Add the responsive row CSS** — append to `src/styles/global.css`:

```css
.task-row {
  display: grid;
  grid-template-columns: 22px 1fr 22px;
  align-items: center;
  gap: 12px;
  padding: 14px 13px;
  border-radius: 14px;
  background: var(--mist);
  margin-bottom: 8px;
}
.task-row .rank { display: none; }
.task-row .check {
  width: 19px;
  height: 19px;
  border-radius: 50%;
  border: 1.75px solid var(--dusk);
  background: transparent;
  cursor: pointer;
}
.task-row .title { font-size: 14px; color: var(--ink); line-height: 1.35; }
.task-row .close { border: none; background: none; color: var(--haze); font-size: 15px; cursor: pointer; }

@media (min-width: 900px) {
  .task-row {
    grid-template-columns: 24px 20px 1fr 22px;
    background: transparent;
    border-radius: 0;
    border-bottom: 1px solid var(--mist);
    padding: 13px 0;
    margin-bottom: 0;
  }
  .task-row .rank {
    display: inline;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--haze);
    font-variant-numeric: tabular-nums;
  }
}
```

- [x] **Step 3: Modify `src/components/TaskList.tsx`** — remove the inline `style` prop (now handled by CSS classes) and the `paddingBottom: 96` hack (no longer needed without a fixed bottom bar):

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
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <div className="task-list">
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

Add `.empty-state { color: var(--dusk); font-family: var(--font-body); padding: 18px 0; }` and `.task-list { display: flex; flex-direction: column; }` to `global.css`.

- [x] **Step 4: Test it yourself**

Run `npm run dev`. Confirm: on a narrow viewport (< 900px), rows render as rounded cards on a `mist` background with no visible rank number. Resize past 900px (or open desktop dev tools' responsive mode) — rows flatten into a hairline-divided list with a small tabular-mono rank placeholder slot on the left (empty for now) and the identity rail appears on the left of the page.

- [x] **Step 5: Commit**

```bash
git add src/components/TaskRow.tsx src/components/TaskList.tsx src/styles/global.css
git commit -m "feat: responsive task row — hairline list desktop, cards mobile"
```

## Task 4: Floating add button + modal, replacing the persistent bottom bar

The Phase 3 `AddBar` (always-visible bottom text input + button) is removed entirely — in review it read as a chat app's message composer, which fights the "calm list" tone, and ate permanent vertical space from the list on mobile. Replaced with a single floating "+" (bottom-right, both breakpoints) that opens a centered modal (desktop) / full-width sheet (mobile) with one autofocused input.

**Interfaces:**
- Produces: `src/components/AddTaskFab.tsx` — no props; owns its own open/close state and calls `addTask` (or `begin`, once Phase 6's compare mechanic exists) internally via `useTasks()`.
- Deletes: `src/components/AddBar.tsx` and its one remaining import in `Today.tsx` (already removed in Task 2).

- [x] **Step 1: Delete `src/components/AddBar.tsx`**

- [x] **Step 2: Write `src/components/AddTaskFab.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useTasks } from '../hooks/useTasks';

export function AddTaskFab() {
  const { addTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    addTask(title);
    setValue('');
    setOpen(false);
  }

  return (
    <>
      <button aria-label="add task" className="fab" onClick={() => setOpen(true)}>+</button>
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

**Note for Phase 6 (compare duel):** once `useCompareInsertion`'s `begin` function exists, this component's `addTask(title)` call becomes `begin(title)` instead — Phase 6's plan file should be read alongside this one when that phase is implemented, since it's the same submit handler this component owns.

- [x] **Step 3: Add the FAB + modal CSS** — append to `src/styles/global.css`:

```css
.fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--violet);
  color: var(--paper);
  border: none;
  font-size: 26px;
  line-height: 1;
  display: grid;
  place-items: center;
  box-shadow: 0 12px 26px -10px rgba(23, 19, 53, 0.5);
  cursor: pointer;
}

.modal-scrim {
  position: fixed;
  inset: 0;
  background: rgba(23, 19, 53, 0.28);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 20;
}
.modal-card {
  width: 100%;
  max-width: 420px;
  background: var(--paper);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 24px 48px -16px rgba(23, 19, 53, 0.35);
}
.modal-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dusk);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.modal-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--haze);
  background: var(--mist);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  margin-bottom: 16px;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-cancel {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--dusk);
  background: none;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
}
.modal-submit {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--paper);
  background: var(--violet);
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
}
```

- [x] **Step 4: Test it yourself**

Run `npm run dev`. Confirm: no bottom bar is visible on load; a violet circular "+" sits bottom-right on both narrow and wide viewports. Clicking it opens a centered card with one autofocused input; typing a title and pressing Enter (or clicking "add task") adds the task, closes the modal, and clears the input for next time. Clicking the dimmed background or "cancel" closes without adding.

- [x] **Step 5: Commit**

```bash
git add src/components/AddTaskFab.tsx src/styles/global.css
git rm src/components/AddBar.tsx
git commit -m "feat: floating add button and modal, remove persistent bottom bar"
```

## Task 5: Recolor `Landing.tsx` and `Auth.tsx` (no structural change)

These two screens are explicitly **out of scope for structural redesign** in this pass — they're seen once (or rarely), unlike `Today`, which is opened dozens of times a day. Only their hardcoded color values need updating so nothing on the auth path still shows the old petrol/amber colors.

- [x] **Step 1: Modify `src/pages/Landing.tsx` and `src/pages/Auth.tsx`** — every inline `style={{ color: 'var(--petrol)', ... }}` etc. already resolves through the renamed CSS variables from Task 1, so **if these files only ever reference the CSS custom properties (not hardcoded hex), no edit is needed here** — confirm by grepping both files for a literal `#` hex value; if none exist, this step is a no-op. If either file has a hardcoded hex (bypassing the token), replace it with the equivalent `var(--...)` token instead of a new hardcoded value.

- [x] **Step 2: Test it yourself**

Sign out, view the landing page and auth form. Confirm both now render in violet/paper, not petrol/cream, with no visual regression otherwise.

- [x] **Step 3: Commit** (only if Step 1 required changes)

```bash
git add src/pages/Landing.tsx src/pages/Auth.tsx
git commit -m "fix: recolor landing and auth to revised palette"
```

## Task 6: Record the compare-duel and morning-flow layout specs for Phases 6 and 7

Phases 6 and 7 haven't been built yet, so there's no running code to retrofit — but their plan files (`06-compare-duel.md`, `07-morning-flow.md`) still specify the old two-box duel layout and a bare-bones morning flow with no step indicator or desktop version. Rather than edit those files' code blocks in place (they'll be read fresh when those phases start), this task records the authoritative replacement spec here; **Phase 6 and 7 must build against the spec below, not their own file's original code samples for `CompareDuel.tsx` and `MorningFlow.tsx`.**

### Compare duel — single card, not two boxes

Rejected: the original `CompareDuel.tsx` design (two side-by-side option boxes, "existing" vs "new") — confusing in review ("which one should I swipe or what to do?"), and not what `idea.md` specifies ("Tinder-style" is one card against a reference, not a two-up choice).

**Replacement shape**, both breakpoints (mobile: full-width centered; desktop: same shape, centered over a dimmed list — no side-by-side layout on either):

- A fixed headline naming the existing candidate by title: `more urgent than "{candidate.title}"?` — this is the comparison; it never moves or is itself draggable.
- Exactly one swipeable card below the headline: the **new** task, styled with `coral-wash` background and `signal-coral` border (this is one of branding.md's three named coral moments — "the task currently being slotted").
- Drag-x on both breakpoints (Framer Motion `drag="x"`, same `dragConstraints`/`dragElastic` pattern as the original plan's `CompareDuel.tsx`), but on desktop the card is additionally accompanied by two labeled buttons directly under it (`← no, later` / `yes, sooner →`) as the primary, discoverable affordance — dragging still works but isn't the only way to decide, since drag-to-decide is a touch-native pattern with lower discoverability under a mouse.
- Below the card: progress dots (one per remaining comparison in the binary search — reuse `CompareState`'s `low`/`high`/`candidateIndex` from `06-compare-duel.md`'s already-planned `compare.ts` to derive how many dots are `done` vs. `active` vs. pending; this is presentation only, no change to the search algorithm itself).
- The rest of the list dims behind the duel (as `06-compare-duel.md` already specifies via `TaskList`'s `dimmed` prop) rather than disappearing.

### Morning flow — step indicator + desktop version

Additions to `07-morning-flow.md`'s `MorningFlow.tsx`, on top of its already-planned three `step` states (`'leftover' | 'braindump' | 'merge'`):

- A persistent step indicator: three equal-width horizontal bars (not numbered — this is a ritual with a fixed 3 stops, not an arbitrary-length sequence needing numerals) — `done` (past steps, `violet` fill), `active` (current step, `signal-coral` fill — a fourth, motion-only-adjacent use of coral: "the task currently being slotted" extends naturally to "the step currently being resolved"), and pending (`mist` fill, no color).
- Desktop (≥ 900px): the flow renders as a centered panel (fixed ~460px content width) over the dimmed `Today` list, rather than a full-bleed takeover — desktop has room to keep "you're inside a flow, here started from" visible at the edges; mobile keeps the existing full-bleed `position: fixed; inset: 0` approach from the original plan.
- The merge step's rows (`07-morning-flow.md` Task 6) get a `merge-section-label` ("kept from yesterday" / "new today") above each group, plus a colored left edge on each row: `violet-soft` for kept-from-yesterday rows, `signal-coral` for new-today rows — so the interleaving task is legible before any dragging starts, not just inferred from list order.

No changes to either phase's underlying hooks (`useCompareInsertion`, `useMorningFlow`) or algorithms (`compare.ts`, `triage.ts`) — this task is presentation-only, same as the rest of this phase.

## Phase 4b done when

Every currently-built screen (landing, auth, today) renders in the revised ink-violet + signal-coral palette with no leftover petrol/amber values anywhere in the codebase; the `Today` page has a real rail+column desktop layout and compact mobile header; task rows are responsive cards (mobile) vs. hairline list (desktop); the persistent bottom add-bar is gone, replaced by a floating "+" and modal; and the compare-duel / morning-flow specs above are recorded as the authoritative layout Phases 6 and 7 must implement against instead of their original file's code samples.
