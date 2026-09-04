# Phase 04 — Prevent text selection on the item list

## The issue (from `features.md`)

> reordering on phone and desktop, selecting text is annoying and we should prevent text selection on the list of items

## What's actually happening

None of the interactive list/card surfaces set `user-select`. So:

- On **desktop**, a mouse-down-drag to reorder (`useLongPressDrag` starts the drag immediately for `pointerType === 'mouse'`) also begins a native text selection of the task title — you end up dragging the row *and* highlighting the text.
- On **phone**, a long-press to start the reorder drag triggers the OS text-selection callout (magnifier + "Copy" bubble) over the task title.
- The swipe cards (`.swipe-card`, `.leftover-card`) have the same problem during a swipe.

The task titles are display text, never meant to be selected/copied in-place.

## The fix

Add `user-select: none` (plus `-webkit-user-select: none` for iOS Safari, which still needs the prefix) to the **draggable/swipeable surfaces only**:

- `.task-row` — the reorderable list item.
- `.swipe-card` — the compare card.
- `.leftover-card` — the leftover triage card.

Also set `-webkit-touch-callout: none` on these so iOS doesn't show the long-press "Copy/Share" callout during a long-press drag.

### Do NOT globally disable selection

Do not put `user-select: none` on `body` or `*`. Text must stay selectable where it's legitimately useful:

- **Inputs** (`.modal-input`, `.tag-input-text`, `.time-picker-segment`, `.auth-input`, `.braindump-input`) — users must be able to select/edit their typed text. `user-select: none` on a container does not disable selection *inside* a focused input in practice, but scope the rule to the card/row classes anyway so there's zero risk.
- **Error/empty-state copy** the user might want to read/copy is unaffected.

Scoping to the three surface classes is the surgical choice.

## Deliverables

- [ ] `src/styles/global.css` — add to `.task-row`:
      `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;`
- [ ] `src/styles/global.css` — add the same three declarations to `.swipe-card`.
- [ ] `src/styles/global.css` — add the same three declarations to `.leftover-card`.
- [ ] Verify the tag input, title input, and due-time input inside the modal are **still selectable/editable** (they are not descendants of these three classes, so they're unaffected — confirm by inspection).

## Explicitly out of scope

- No global `user-select` rule.
- No change to `.braindump-entry` list (that flow's short-lived entries aren't a drag/swipe surface and there's no report about them).
- Do not touch `touch-action` values (phases 01/02/05 own those).

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`.
2. **Desktop**: press-drag a task title to reorder → the title text must **not** get highlighted while dragging.
3. **Desktop**: double-click a task title → it should no longer select the word (acceptable/expected given titles aren't copy targets).
4. **Phone / touch emulation**: long-press a task row to start reorder → **no** iOS text-selection magnifier/callout appears.
5. Swipe a compare card and a leftover card → no text selection during the swipe.
6. Regression: in the edit modal, you can still select and edit text in the title, tags, and due-time fields.

## Risk / atomicity note

Three CSS blocks, additive declarations only. No JS, no layout change. Independent and reversible.
