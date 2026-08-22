# Phase 01 — Move the duel/leftover screens to ink-violet ground

## The issue

`.duel-screen` and `.leftover-shell` currently render on `var(--paper)`
(`#FAF9FB`, near-white) — see `src/styles/global.css:548-561` and `:721`.
Direction A puts the card itself on an ink-violet gradient. If only the card
changes, the screen behind it stays white, producing a bright gutter around a
dark card that reads as a rendering bug, not a design choice (this was the
user's first flagged concern: "is purple on white going to work calmly").

The fix is to move the **whole screen**, not just the card, to ink-violet —
matching what the corrected artifact demonstrates.

## The fix

### `.duel-screen`

```css
.duel-screen {
  position: fixed;
  inset: 0;
  z-index: 15;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(120% 140% at 15% -10%, rgba(122, 112, 184, 0.35), transparent 55%),
    var(--ink-violet);
  padding: /* unchanged */;
  overscroll-behavior: contain;
}
```

The radial wash uses `--violet-soft` (`#7A70B8`) at 35% alpha, fading to
transparent — a single quiet highlight in the top-left, not a decorative
gradient hero. This is the same wash used in the artifact's Direction A panel.

### `.leftover-shell`

Same ground treatment. `.leftover-shell` today is an in-flow section (not
`position: fixed`), so confirm its parent (`MorningFlow`'s leftover step)
doesn't need its own background cleared/covered — if the parent has no
competing background, the shell's own background covers the viewport-height
`min-height: 70dvh` area correctly as-is.

```css
.leftover-shell {
  display: grid;
  place-items: center;
  min-height: 70vh;
  min-height: 70dvh;
  padding: 24px;
  position: relative;
  background:
    radial-gradient(120% 140% at 15% -10%, rgba(122, 112, 184, 0.35), transparent 55%),
    var(--ink-violet);
}
```

### Text/foreground colors that must flip with the ground

Anything currently assuming a light background needs to become paper/light
on this screen:

- `.duel-question` (`color: var(--ink)`) → `var(--paper)`.
- `.duel-question .ref-title` (`color: var(--violet)`) → stays legible on
  dark (violet `#4B3F8F` is too low-contrast on ink-violet — use
  `--violet-soft` `#7A70B8` instead, which is the token already reserved for
  "secondary/supporting" per `branding.md` §2).
- `.leftover-kicker` (`color: var(--dusk)`) → needs a light-on-dark
  equivalent; `--haze` (`#D9D6E4`) at reduced opacity reads correctly as a
  muted label on ink-violet (same role `--dusk` plays on paper).
- `.leftover-error` (currently `background: var(--mist)`, `color: var(--ink)`)
  — this is a rare error banner overlaid on the shell; give it its own
  dark-ground treatment (`background: rgba(250,249,251,0.08)`,
  `color: var(--paper)`) so an error message is never invisible dark-on-dark.

Do not touch `.task-list-dimmed` or anything outside these two screens — the
rest of `Today.tsx` stays on `--paper` exactly as today.

## Deliverables

- [x] `.duel-screen` background updated to the ink-violet + violet-soft radial
      wash gradient (`src/styles/global.css`).
- [x] `.leftover-shell` background updated identically.
- [x] `.duel-question` color updated for legibility on the new dark ground
      (`.duel-question .ref-title` does not exist in current code — no such
      class in `CompareDuel.tsx`; nothing to change).
- [x] `.leftover-kicker` color updated for legibility on the new dark ground.
- [x] `.leftover-error` given an explicit dark-ground treatment so it's never
      dark-text-on-dark-background.
- [x] Confirmed no other selector inherits a light-background assumption
      inside these two screens — also caught and fixed `.duel-caption`
      (`var(--dusk)` → light-on-dark), which the original deliverable list
      missed. Card-face selectors (`.duel-card`, `.duel-ghost`, etc.) are
      correctly left on `var(--paper)`/`var(--haze)` for now — that's Phase 02.

## Explicitly out of scope

- No change to `Today.tsx`'s own `--paper` background — only the two
  full-bleed decision screens change.
- No change to the mount/exit transition timing on `CompareDuel`'s outer
  `motion.div` (`reflowSpring` in/`0.16s easeIn` out) — see 00-overview's
  "open call" note. If the paper→ink-violet jump feels too abrupt in
  practice, that's a follow-up phase, not something to preempt here.
- No card-face styling — that's Phase 02.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`.
2. From Today, add a new task that triggers the compare duel (needs 2+
   existing tasks) — confirm the full screen is now ink-violet with the
   subtle top-left violet wash, not white, and the question text is legible.
3. Start the morning flow with a mock leftover task (or trigger via dev
   seed data) — confirm `.leftover-shell` matches the same ground treatment.
4. Force the leftover error banner (temporarily throw in the fetch path, or
   review code path) — confirm the error text is readable against the new
   dark ground, then revert the temporary change.
5. Regression: `Today.tsx`'s task list itself is unchanged — still on
   `--paper`.

## Risk / atomicity note

CSS-only, confined to two selectors' `background` plus their direct
light-background-dependent children. No component logic touched. Safe to
ship independently of Phase 02/03, though visually incomplete until they land
(card will still render its old paper style on the new dark ground until
Phase 02).
