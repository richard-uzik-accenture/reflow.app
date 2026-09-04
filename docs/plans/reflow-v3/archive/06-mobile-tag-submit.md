# Phase 06 — Make tags easy to submit on phones

## The issue (from `features.md`)

> tags not submitted via phone easily — you have to manually click the Enter button on the keyboard, which I almost never do. Is there a way to improve submitting tags on phone devices?

## What's actually happening

`src/components/TagInput.tsx` commits a tag **only** on `Enter` or `,` keydown (`handleKeyDown`, lines 25–34). On a phone:

- The on-screen keyboard's return key is easy to miss / labelled ambiguously ("return", "go", a ↵ glyph).
- Users type a tag and then tap **away** (into the next field, or the Save button) expecting the tag to "take" — but the half-typed query is silently discarded because nothing commits on blur.
- There's no visible "add" affordance, so on touch there's no obvious tap target to commit a tag.

## The fix (three complementary, low-risk improvements)

### A. Commit the pending query on blur

When the tag `<input>` loses focus with a non-empty trimmed `query`, commit it (same path as pressing Enter). This is the single highest-impact fix: tapping Save or tapping the next field now keeps the tag the user just typed.

Guard against double-commit: if a suggestion `onMouseDown`/tap already committed (it calls `commit` and clears `query`), blur sees an empty query and does nothing. Because suggestion selection uses `onMouseDown` + `preventDefault` (already in place), it fires before blur and clears the query first — no double add.

### B. Add a visible "add" affordance (tap target) on the field

Render a small `+`/"add" button at the end of `.tag-input-field`, shown when `query.trim()` is non-empty, that calls the same `commit(query)`. This gives phone users an unmistakable tap target. Styling stays in brand: mono/violet, **no coral** (tags are not a decision moment). Use the existing `Plus` icon atom or a text "add" in the calm register.

### C. Improve the mobile keyboard hint

On the `<input>`, add:

- `enterKeyHint="done"` — relabels the phone return key to a clear "done" affordance.
- `inputMode="text"`, `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="off"` — tags are short lowercase tokens; autocorrect mangling them is a known annoyance and these attributes prevent it.

### Interaction with autocomplete

Keep the existing behaviour where, if a suggestion is highlighted (`activeIndex >= 0`), Enter commits the *suggestion*. Blur (A) and the add button (B) commit the **typed query** (`commit(query)`), matching what the user sees in the field. This is consistent: the visible text is what gets added.

## Deliverables

- [ ] `TagInput.tsx`: add `onBlur` on the `<input>` that commits `query` when `query.trim()` is non-empty (reuse `commit`). Verify no double-add with suggestion selection.
- [ ] `TagInput.tsx`: render an "add" tap-target button inside `.tag-input-field`, visible only when `query.trim()` is non-empty, calling `commit(query)`. Keep it `type="button"` so it never submits the surrounding `<form>` in `TaskModal`.
- [ ] `TagInput.tsx`: add `enterKeyHint="done"`, `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="off"`, `inputMode="text"` to the input.
- [ ] `src/styles/global.css`: style the new add button to match the chip/mono register (violet-on-hover, no coral); ensure it doesn't disrupt the flex-wrap layout of `.tag-input-field`.
- [ ] Confirm the add button does **not** submit/close the `TaskModal` form (it's `type="button"`; the modal's submit is a separate `type="submit"`).
- [ ] Extend `src/lib/tags.test.ts` (or add a case) covering that committing via the query path normalizes identically to the Enter path — the logic already lives in `addTag`, so this asserts blur/button reuse the same normalization and dedupe.

## Explicitly out of scope

- No change to `addTag`/`removeTag`/`suggestTags` normalization logic (`src/lib/tags.ts`) — reuse it as-is.
- No tag management screen, tag table, or schema change (locked in v2 decisions).
- Do not auto-commit on every space/keystroke — only on blur, Enter/comma, or the add button. Spaces can be valid inside a tag.
- No coral anywhere.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`; open a task's edit modal (pencil) or the add-task modal (`+`).
2. **Blur commit:** type `finance` in the tags field, then tap the **Save** button *without* pressing return → the tag `finance` must be committed and saved (not lost).
3. **Add button:** type `school` → an "add" affordance appears → tap it → chip appears, field clears.
4. **Keyboard hint (real phone):** focus the tag field → the return key reads "done"; pressing it commits.
5. **No double-add:** type `sc`, tap a suggestion `school` from the list → single `school` chip, no duplicate from the subsequent blur.
6. Regression: Enter and comma still commit; Backspace on empty query still removes the last chip; arrow-key suggestion navigation still works on desktop.

## Risk / atomicity note

Confined to `TagInput.tsx` + its CSS + a tags test case. Reuses existing normalization. Independent of all other phases; the edit modal it lives in is untouched structurally.
