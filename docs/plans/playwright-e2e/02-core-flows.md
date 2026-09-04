# Phase 2 — Core flows: shell, Today baseline, task CRUD, tags, theme

All specs in this phase run against `VITE_DEV_MODE=true` (see `00-overview.md`).

## Deliverables

### `e2e/landing-auth-shell.spec.ts`
- [ ] Landing page renders (logged out state — this one spec runs without
      dev mode, or with a way to force `session: null`; check whether
      `devMock.ts` needs a small opt-out flag, e.g. `VITE_DEV_MODE=true` plus
      a query param, to reach Landing/Auth in automation — flag this as a
      possible small source change if no such path exists yet).
- [ ] "get started" navigates to the Auth screen; "back" (chevron) returns
      to Landing.
- [ ] Dev-mode: app resolves directly to the Today screen (loading → today,
      no Landing/Auth flash) — this is the baseline for every other spec in
      phases 2-4.

### `e2e/today-basics.spec.ts`
- [ ] Seeded tasks from `devMock.ts` render in rank order (id order:
      quarterly report, PR review, dentist, slides, legal, onboarding, then
      the two "still open" leftovers).
- [ ] Header/rail task count text matches (`"N today"`), "up next" shows the
      first task's title in both the desktop rail and mobile header (resize
      viewport to hit both `today-rail` and `today-header-mobile` CSS paths).
- [ ] Completing every task drives the empty state: count becomes "all
      clear", `list-sub` copy switches to "today's settled."

### `e2e/task-crud.spec.ts`
- [ ] Add task via the floating `+` (`AddTaskFab`) → `TaskModal` (mode
      "add") → submit → new row appears. With ≤1 existing task this skips
      `CompareDuel` entirely (product rule in `PRODUCT.md`) — assert no duel
      screen appears and the task lands directly; deeper compare-insertion
      behavior belongs in `03-compare-and-reorder.md`.
- [ ] Add-task validation: empty title blocks submit with the inline error
      copy, and `TITLE_MAX_LENGTH` enforcement (see `src/lib/validation.ts`)
      truncates or blocks at the boundary.
- [ ] Edit task: pencil icon opens `TaskModal` (mode "edit") pre-filled with
      current title/tags, change title, save → row updates, modal closes.
- [ ] Complete task: check icon → success toast (`"settled"`) → row leaves
      the active list.
- [ ] Drop task: X icon → success toast (`"let go"`) → row removed.
- [ ] Failed-mutation path: at least one case where a mutation is forced to
      fail (e.g. stub the relevant `mockTasksApi` method via
      `page.addInitScript`/route to reject) and assert the row gets the
      `failed` shake state (`failedRowId`) and an error toast — not a silent
      no-op.

### `e2e/tags-theme.spec.ts`
- [ ] `TagInput`: add a tag while creating a task, remove a tag, tag chips
      render on the resulting `TaskRow`.
- [ ] Known-tag autocomplete/reuse: a tag used on one task is offered as a
      known tag (`allKnownTags`) when adding another.
- [ ] Theme toggle: click switches light/dark (assert whatever DOM
      attribute/class `useTheme` sets), and the choice survives a page
      reload (localStorage-backed per `useTheme`).
