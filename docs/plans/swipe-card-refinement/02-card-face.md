# Phase 02 — Card face: ink-violet card, shift-mark motif, corrected stamps

## The issue

`.duel-card`, `.duel-ghost`, and `.leftover-card` are currently flat
`var(--paper)`/`var(--mist)` rectangles with a plain border and drop shadow —
the "plain, boring, just white" cards named in the original ask. This phase
replaces the card face with the Direction A treatment from the design
artifact, corrected for the two bugs the user caught in the first pass:

- **Stamp/text collision:** the original artifact draft positioned
  `.duel-stamp` by `top` offset only, so on a shorter card the "sooner"/"later"
  badge could land on top of the title text.
- **Clipped logo motif:** the shift-mark background image was positioned
  partly outside the card's own box (`top: -18px; right: -22px`), so
  `overflow: hidden` on the card clipped the bottom bar — the mark was never
  fully visible.

Both are fixed below; the values here match the corrected, republished
artifact exactly.

## The fix

### Card face

```css
.duel-card,
.leftover-card {
  background: linear-gradient(160deg, #211D45 0%, var(--ink-violet) 78%);
  border: 1px solid rgba(250, 249, 251, 0.09);
  box-shadow:
    0 30px 60px -24px rgba(6, 5, 20, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: var(--paper);
}
```

`#211D45` is a lightened step off `--ink-violet` for the gradient's top edge
(not a new named token — it's the same relationship the artifact uses to give
the card a subtle top-to-bottom depth rather than a flat fill). If a named
token is preferred for reuse, add `--ink-violet-raised: #211D45` to
`tokens.css`; otherwise inline it as shown (single use, matches CLAUDE.md §2's
"no speculative abstraction" guidance since it's used in exactly one place).

`.duel-ghost` (the peeking stack cards) follows the same family a step
darker/flatter, no gradient needed since it's never the focal element:

```css
.duel-ghost {
  background: #1D1A3E;
  border: 1px solid rgba(250, 249, 251, 0.06);
  box-shadow: none; /* the live card's shadow already sells the stack depth */
}
```

### Shift-mark motif (ghosted, fully inside card bounds)

```css
.duel-card::before,
.leftover-card::before {
  content: '';
  position: absolute;
  top: 16px;
  right: 16px;
  width: 100px;
  height: 100px;
  opacity: 0.08;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 118 118'%3E%3Cg fill='%23FAF9FB'%3E%3Crect x='16' y='10' width='64' height='20' rx='10'/%3E%3Cpath d='M 16 38 H 66 L 76 48 L 66 58 H 16 A 10 10 0 0 1 16 38 Z'/%3E%3Cpath d='M 72 38 H 84 L 94 48 L 84 58 H 72 L 82 48 Z'/%3E%3Crect x='16' y='66' width='64' height='20' rx='10'/%3E%3C/g%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
}
```

This is the exact `public/favicon.svg` mark geometry (see `branding.md` §1's
SVG source), recolored to `--paper` and ghosted to 8% opacity. `top: 16px;
right: 16px` with a `100px` box keeps the full mark — both bars and the
chevron notch — inside the card's own padding box, so `overflow: hidden`
never clips it. This does not violate branding.md's "no gradient, no shadow,
no glow **on the mark**" rule (§1, app icon section) — that rule scopes the
canonical app-icon lockup; this is the mark reused as ghosted card texture,
same pattern as icons being "constructible from the two atoms" per §5. If
that reading is contested, confirm with the user before shipping — the
plan's default is "allowed, this is texture not a second logo lockup."

Ensure `.duel-card` and `.leftover-card` keep `overflow: hidden` (already
present) so the motif never bleeds past the card's own border-radius.

### Decision stamps — corrected placement

Both `.duel-stamp` and any leftover-card equivalent stamp move from
`top`-anchored to vertically centered on the card's left/right edge, clear of
the text column entirely, with an opaque backing:

```css
.duel-stamp {
  position: absolute;
  top: 50%;
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid currentColor;
  background: var(--ink-violet);
  box-shadow: 0 8px 20px -8px rgba(6, 5, 20, 0.6);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
}
.duel-stamp.sooner {
  right: -6px;
  transform: translateY(-50%) rotate(9deg);
  color: var(--signal-coral);
}
.duel-stamp.later {
  left: -6px;
  transform: translateY(-50%) rotate(-9deg);
  color: var(--violet-soft);
}
```

Why this placement is safe against future title-length changes: the stamp
sits at the vertical midpoint of the whole card, straddling the edge (`-6px`,
partially overhanging the card boundary the way a physical stamp would), while
the title text lives inside `.duel-card-title` with its own `padding: 32px
28px` horizontal inset (existing rule, unchanged). The stamp's horizontal
position is outside that inset entirely, so no title-length or line-count
change can bring the two into contact. The opaque `background:
var(--ink-violet)` is a second line of defense — even in an unanticipated
layout, text behind the stamp would be covered, not blended through it.

`LeftoverCard.tsx` currently has no visual stamp at all (only the buttons
below the card serve as affordances) — this phase adds one, reusing the same
`.duel-stamp` CSS class and pattern (`keep`/`let go` instead of
`sooner`/`later`), since `LeftoverCard.tsx` shares `decideSwipeDirection` /
`planDuelFling` with `DuelCard` already. See Deliverables for the markup
change this requires.

### Text colors inside the card

```css
.duel-card-title,
.leftover-card { color: var(--paper); }
.duel-card-meta { color: #8A82C4; } /* violet-soft family, dimmed for meta */
```

`#8A82C4` is `--violet-soft` lightened for legibility as small mono text on
the dark card gradient — same relationship as `--dusk` on paper. If reused
more than in this one meta line, promote to a token in Phase 03; not needed
yet per CLAUDE.md §2.

## Deliverables

- [ ] `.duel-card` / `.leftover-card`: background gradient, border, shadow,
      and base text color updated per above (`src/styles/global.css`).
- [ ] `.duel-ghost`: updated to the flatter dark variant, shadow removed.
- [ ] `.duel-card::before` / `.leftover-card::before`: ghosted shift-mark
      motif added, positioned fully inside card bounds (`top: 16px; right:
      16px; width: 100px; height: 100px`).
- [ ] `.duel-stamp` repositioned to vertically centered left/right edges with
      opaque background, per the CSS above — confirm visually it never
      overlaps `.duel-card-title` at both the shortest and longest realistic
      task titles (test with a 4-word and a 12-word title).
- [ ] `LeftoverCard.tsx`: add the two stamp `<motion.span>` elements (mirroring
      `DuelCard`'s `duel-stamp` markup/opacity-transform wiring in
      `CompareDuel.tsx:141-146`), wired to the same `x` motion value already
      present in `LeftoverCard.tsx`, labelled `keep` / `let go`.
- [ ] `.duel-card-meta` / `.leftover-card` meta text color updated for
      legibility on dark ground.
- [ ] Confirm `overflow: hidden` remains set on both card classes so the
      ghosted motif never bleeds past the rounded corners.

## Explicitly out of scope

- No change to drag physics, thresholds, or fling math (`swipe.ts`,
  `planDuelFling`) — purely visual.
- No new stamp copy — "sooner"/"later"/"keep"/"let go" are the existing
  product copy (`branding.md` §4); this phase only adds the missing visual
  stamp to the leftover card, it does not invent new words.
- No change to `.duel-card-title` font size/weight/line-height — only color.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`, with Phase 01 already applied (screen
   ground must be ink-violet first, or the card will look correct but the
   white gutter bug from Phase 01 will still be visible around it).
2. Trigger the compare duel. Confirm: card face is a dark violet gradient
   (not flat), the shift mark is faintly visible in the top-right corner with
   all three bars and the chevron notch intact (not clipped), and dragging
   left/right reveals the "later"/"sooner" stamp at the card's edge without
   ever touching the title text — test with both a short task title
   ("call mom") and a long one ("finish reviewing Q3 budget variance report
   with finance team before Friday standup").
3. Trigger the leftover-triage step. Confirm the same card face treatment,
   and confirm the new "keep"/"let go" stamps appear on drag, correctly
   positioned.
4. Regression: swipe-to-commit and the button fallbacks (`← later` / `sooner
   →`, `← let it go` / `keep →`) still work identically — only appearance
   changed.

## Risk / atomicity note

Touches `global.css` (card selectors only) and adds a small, additive markup
block to `LeftoverCard.tsx` (two `<motion.span>` stamps, following the exact
pattern already proven in `CompareDuel.tsx`). No changes to hooks, drag
handlers, or `lib/swipe.ts`. Depends on Phase 01 landing first for the ground
color; otherwise independent of Phase 03.
