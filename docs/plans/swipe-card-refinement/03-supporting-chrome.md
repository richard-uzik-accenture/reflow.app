# Phase 03 — Supporting chrome on the new dark ground

## The issue

Phases 01–02 move the screen and the card to ink-violet. Everything else on
these two screens — the duel action buttons, the progress dots, the leftover
hint buttons, the rank/kicker mono text — was styled assuming a `--paper`
background (light borders, `--dusk` text, `--haze` dots) and will be
low-contrast or invisible once the ground goes dark.

## The fix

### `.duel-actions` / `.duel-action`

```css
.duel-action {
  border: 1px solid rgba(250, 249, 251, 0.16);
  background: rgba(250, 249, 251, 0.04);
  color: #B7B2D1; /* violet-soft family, dimmed — matches .desc treatment in the artifact */
}
.duel-action:hover {
  background: rgba(250, 249, 251, 0.09);
  color: var(--paper);
}
.duel-action:focus-visible {
  outline: 2px solid var(--violet-soft);
  outline-offset: 2px;
}
.duel-action.sooner {
  color: var(--signal-coral);
  font-weight: 600;
}
.duel-action.sooner:hover {
  border-color: var(--signal-coral);
  color: var(--signal-coral);
}
```

Note: `.duel-action.sooner` moving to coral-colored *text* is a deliberate,
narrow read of the coral-scarcity rule — the button itself has no coral
fill/background, only the label color, and it only appears on the one
full-bleed decision screen where coral is already sanctioned everywhere else
(the stamp, per branding.md's explicit carve-out: "the compare/duel" is one of
the three named coral-allowed moments in §2). This preserves today's behavior
(`.duel-action.sooner` is already `color: var(--violet)` today) — only the hue
changes to match the corrected on-brand palette for this screen, not the
scope of where coral appears.

### `.duel-progress .dot`

```css
.duel-progress .dot { background: rgba(250, 249, 251, 0.18); }
.duel-progress .dot.done { background: var(--violet-soft); }
.duel-progress .dot.active { background: var(--signal-coral); }
```

### `.leftover-actions` / `.leftover-hint`

```css
.leftover-hint {
  color: #B7B2D1;
}
.leftover-hint:hover {
  background: rgba(250, 249, 251, 0.09);
  color: var(--paper);
}
.leftover-hint:focus-visible {
  outline: 2px solid var(--violet-soft);
  outline-offset: 2px;
}
.leftover-hint.keep {
  color: var(--signal-coral);
  font-weight: 600;
}
```

`.leftover-hint.keep` moving to coral matches the same reasoning as
`.duel-action.sooner` above — "keep" is the leftover screen's decision-moment
action, already inside the compare/duel's coral-sanctioned surface.

### `.duel-card-rank` (mono rank indicator, if adopted from the artifact)

The artifact's Direction A panel includes an optional `rank N` mono label
with a small bar glyph next to the kicker — this was shown in the design
exploration but is **not** in the current `CompareDuel.tsx`/`LeftoverCard.tsx`
markup. Do not add it in this plan; it's a new information element, not a
restyle of an existing one, and adding it would go beyond "refinement of the
existing cards" into new UI. Flag to the user as a possible future addition
if wanted, but treat it as out of scope here per CLAUDE.md §2 (no
speculative additions beyond what was asked).

## Deliverables

- [ ] `.duel-action` (base, hover, focus-visible, `.sooner` variant) recolored
      for the dark ground.
- [ ] `.duel-progress .dot` (base, `.done`, `.active`) recolored for the dark
      ground.
- [ ] `.leftover-hint` (base, hover, focus-visible, `.keep` variant)
      recolored for the dark ground.
- [ ] Confirm every recolored element still meets WCAG AA contrast against
      the ink-violet ground (4.5:1 for text, 3:1 for UI component boundaries)
      — spot-check `#B7B2D1` on `#171335` and the coral/violet-soft dot
      colors against the same ground.
- [ ] Confirm `:focus-visible` outlines remain clearly visible on the dark
      ground (outline color `--violet-soft` on ink-violet — verify by eye,
      it's a light violet on dark violet, should read but check at actual
      size).

## Explicitly out of scope

- No new rank/progress information added beyond what exists today (see the
  rank-glyph note above).
- No change to button/hint copy — "later", "sooner", "let it go", "keep" stay
  exactly as-is.
- No change to `.duel-progress` dot count/behavior logic — purely color.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`, with Phases 01–02 already applied.
2. Trigger the compare duel with a list of 4+ tasks so multiple progress dots
   render. Confirm: action buttons are legible against the dark ground,
   hover/focus states are visible, progress dots show clear done/active/
   pending states.
3. Trigger the leftover-triage step with 2+ leftover tasks. Confirm the
   `← let it go` / `keep →` hints are legible and the `keep` hint reads in
   coral.
4. Keyboard nav: Tab to each action button/hint and confirm the focus ring is
   visible against the dark ground.
5. Run a contrast checker (browser DevTools accessibility panel, or
   WebAIM contrast checker) on the dimmed `#B7B2D1` text against
   `#171335` — must clear 4.5:1.

## Risk / atomicity note

CSS-only, confined to the action/hint/dot selectors already scoped to these
two screens. No markup or logic changes. Depends on Phases 01 and 02 landing
first (this phase's colors are chosen against the ink-violet ground they
introduce); does not block anything else.
