# Phase 03 — Stop iOS zooming in when focusing an input (tag field)

## The issue (from `features.md`)

> when editing task, focus on tag zooms in on phone -> again annoying you need to unzoom

## What's actually happening

iOS Safari **auto-zooms the viewport whenever a focused input/textarea/select has a computed `font-size` below 16px.** It's a fixed platform behaviour, independent of the pinch-zoom from phase 01 (phase 01's `user-scalable=no` actually *also* suppresses this on iOS, but relying on that alone is fragile and the two concerns should be fixed independently — this phase makes the inputs correct regardless of viewport policy).

Auditing every focusable field in the app for sub-16px font sizes (`src/styles/global.css`):

| Selector | Current font-size | Zooms on focus? |
|---|---|---|
| `.modal-input` (task title) | 16px | no ✅ |
| `.auth-input` | 16px | no ✅ |
| `.braindump-input` | 16px | no ✅ |
| **`.tag-input-text`** (the tag field) | **14px** | **yes ← the reported one** |
| **`.time-picker-segment`** (due-time hh/mm) | **15px** | **yes** |

So the user's exact report is `.tag-input-text` at 14px. The due-time `TimePicker` segments at 15px have the identical bug and are reached from the same edit modal, so fix both in this phase (same root cause, same modal, atomic).

## The fix

Raise the **focusable input** font-size to 16px on these two controls. This is the minimal, universally-recommended fix and needs no JS.

Concern: bumping the tag input text to 16px could enlarge the chips row visually. Mitigation — the *typed text* input must be 16px, but the surrounding **chips** (`.tag-chip`, 10px mono) and suggestions are not focusable inputs and stay as they are. Only `.tag-input-text` (the `<input>`) changes. Verify the field still aligns with chips (they're `align-items: center` in `.tag-input-field`, so a 16px input sits fine next to 10px chips).

For the TimePicker segments (`.time-picker-segment`), 16px is fine within the pill; confirm the `width: 1.4em` still holds two digits (1.4em at 16px ≈ 22px, ample for "12").

## Deliverables

- [ ] `src/styles/global.css` — `.tag-input-text`: `font-size: 14px` → `font-size: 16px`.
- [ ] `src/styles/global.css` — `.time-picker-segment`: `font-size: 15px` → `font-size: 16px`.
- [ ] Visually confirm in the edit modal that (a) the tag input aligns with existing chips and (b) the time segments still read cleanly and don't overflow the pill.
- [ ] Grep the codebase for any other `<input>`/`<textarea>`/`<select>` with `font-size < 16px` and note there are none beyond these two (audit table above is the record).

## Explicitly out of scope

- Do not change non-input font sizes (chips, labels, hints) — they don't trigger focus-zoom and changing them is scope creep that risks the brand's type scale.
- Do not rely on phase 01's `user-scalable=no` to "cover" this — keep the fixes independent so either can be reverted without reintroducing the bug.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev` on a real iPhone (this is iOS-specific; DevTools emulation does **not** reproduce focus-zoom — it must be a real iOS Safari, or accept the visual check + the known 16px rule).
2. Open a task's edit modal (pencil icon) → tap into the **tags** field → the viewport must **not** zoom.
3. Tap into the **due-time** hh field → must not zoom.
4. Regression (desktop): tag field and time picker still look correct; typing/committing tags still works; chip alignment unchanged.

## Risk / atomicity note

Two CSS `font-size` values. No structural, logic, or component change. Independent of every other phase and trivially reversible.
