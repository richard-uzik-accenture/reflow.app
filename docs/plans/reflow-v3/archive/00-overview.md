# Reflow v3 — Mobile interaction hardening

Seven fixes for real-device annoyances found while using the v2 app on an iPhone. Each phase solves **exactly one** issue from the "issues" section of `features.md`, and each is **atomic** — it can ship on its own without touching the others and without regressing existing behaviour.

The brand system (`branding.md`) and product mechanics (`PRODUCT.md`) are **locked**. Nothing here changes the interaction vocabulary (swipe = binary decision, drag = reorder), the copy register, or the coral-only-at-decision rule. These are all polish/bugfix phases.

## Source of the work

The `## issues` block at the bottom of `features.md` (project root), lines 25–37.

## Phases

| # | Issue (verbatim, condensed) | Plan file | Type |
|---|---|---|---|
| 01 | accidental pinch-zoom on phone is annoying — prevent zooming (PWA practice) | [01-prevent-pinch-zoom.md](01-prevent-pinch-zoom.md) | config/CSS |
| 02 | swiping must allow diagonal / curved "lazy" thumb paths, both directions | [02-diagonal-swipe.md](02-diagonal-swipe.md) | interaction |
| 03 | editing a task: focusing the tag field zooms in on phone | [03-no-input-focus-zoom.md](03-no-input-focus-zoom.md) | CSS |
| 04 | selecting text on the item list is annoying — prevent text selection | [04-prevent-text-selection.md](04-prevent-text-selection.md) | CSS |
| 05 | drag-drop reorder: row stays visually "in movement" after drop (bug) | [05-fix-drag-drop-stuck-state.md](05-fix-drag-drop-stuck-state.md) | bugfix |
| 06 | tags hard to submit on phone — Enter key rarely pressed | [06-mobile-tag-submit.md](06-mobile-tag-submit.md) | interaction |

> The `features.md` "issues" list has 7 lines, but two of them (pinch-zoom and focus-zoom-on-tag) are separate causes with separate fixes, and are split into phases **01** and **03**. Every other line maps 1:1 to a phase. That is 6 phase files covering all 7 lines.

## Recommended order

**01 → 03 → 04 → 06 → 02 → 05.**

Rationale: 01/03/04 are near-zero-risk CSS/config wins that remove the most-reported daily friction. 06 is a small, self-contained input improvement. 02 and 05 are the two interaction-logic changes and carry the most regression risk, so they go last and each gets its own manual verification pass on a real touch device (or emulated touch in DevTools).

Every phase is independent — this order is a suggestion, not a dependency chain.

## Global constraints (inherited, still binding)

- **Coral only at decision moments.** None of these phases add coral anywhere new.
- **Motion vocabulary unchanged** — reuse existing `transitions.ts` / `--duration-*` tokens; thread `useReducedMotion` on any new animated surface (none of these phases add one).
- **Tone of voice:** lowercase, calm, no exclamation marks. New copy ("add", tag-field affordances) stays in register.
- **Accessibility:** phase 01 documents and mitigates the known a11y tradeoff of disabling zoom; phases 03/04 must not disable selection or zoom anywhere a user legitimately needs it (inputs, editable text).

## Verification contract

Each phase ends with **"Test it yourself"** steps runnable in `VITE_DEV_MODE=true` (no Supabase). Because these are touch behaviours, each phase names the concrete DevTools/device gesture to reproduce the original bug and confirm the fix. Phases with pure logic (02's decision math, 06's normalization) add/extend a Vitest test where practical; the rest are manual gesture checks.

## Done convention (from CLAUDE.md §5)

A phase is done when every `- [ ]` in its file is checked. Move completed files to `docs/plans/reflow-v3/archive/`. Archive `00-overview.md` once all phases are done.
