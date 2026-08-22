# Swipe card refinement — Direction A ("brave within brand")

Both the compare-duel card (`CompareDuel.tsx`) and the leftover-triage card
(`LeftoverCard.tsx`) currently render as plain `--paper`/`--mist` rectangles.
This plan takes them to the bolder-but-still-on-brand direction approved from
the design exploration (artifact: two swipe-card directions, Direction A
chosen) — ink-violet depth, the shift mark ghosted into the card face, coral
spent only on the live decision stamp. Direction B (the brand-omitted "working
notebook" look) was **not** chosen and is not part of this plan.

`branding.md` and `PRODUCT.md` are **locked**. This does not change the
interaction vocabulary (swipe = binary decision), the compare mechanic, the
coral-scarcity rule, or the tone of voice. It is a visual refinement of two
existing full-bleed screens, not a redesign.

## Source of the work

Design exploration artifact (this conversation) + three corrections the user
called out on first pass, already fixed in the artifact and carried into this
plan:

1. Card-on-dark-ground is fine, but the **screen behind the card** (`.duel-screen`,
   `.leftover-shell`) is currently `var(--paper)` (near-white). Flipping only the
   card to ink-violet while the screen stays white creates a bright white gutter
   around a dark card — reads as a mistake, not a choice. Both screens move to
   ink-violet together with the card (Phase 01).
2. The decision stamps ("sooner"/"later", "keep"/"let go") were positioned by
   `top` offset alone and could drift over the card title on shorter cards.
   Fixed placement: vertically centered on the card's left/right edges, clear
   of the text column, with an opaque backing so they never visually merge
   with the title even mid-drag (Phase 02).
3. The shift-mark motif (bars + chevron) was cropped by the card's own
   `overflow: hidden` because it was positioned partly outside the card
   bounds. Fixed to sit fully inside the visible card area (Phase 02).

## Phases

| # | Scope | Plan file |
|---|---|---|
| 01 | Screen background: `.duel-screen` / `.leftover-shell` → ink-violet ground | [01-screen-ground.md](01-screen-ground.md) |
| 02 | Card face: ink-violet card, ghosted shift-mark motif, corrected stamp placement | [02-card-face.md](02-card-face.md) |
| 03 | Supporting chrome: duel actions, progress dots, leftover hints, meta/rank text on dark ground | [03-supporting-chrome.md](03-supporting-chrome.md) |

## Recommended order

**01 → 02 → 03.** The screen ground must land first or the card (02) will be
built/tested against a white backdrop that's about to change underneath it.
03 depends on 01+02 because the buttons/dots/hints currently assume a paper
background and need their own contrast pass once the ground is dark.

## Open call for the user (flagged, not decided here)

The transition **from** the paper-background task list **into** this now-dark
duel/leftover screen is a bigger visual jump than before (near-white → near-black,
several times a day). `CompareDuel`'s existing mount transition
(`opacity 0→1`, `reflowSpring`) softens this, and the product's own intent is
that the duel should feel like a distinct "decision mode," not a continuation
of the list — so Phase 01 keeps the existing transition timing rather than
changing it. If the dark screen feels jarring in practice after Phase 01 ships,
that's a follow-up phase (e.g. a brief cross-fade on the underlying task list),
not a reason to keep the screen on `--paper`.

## Global constraints (inherited, still binding)

- **Coral only at the live decision stamp.** No new resting coral on chrome,
  buttons, or badges anywhere in these phases.
- **No red/green pair.** Violet = later/let-go, coral = sooner/keep — unchanged.
- **Motion vocabulary unchanged** — reuse `transitions.ts` / `reflowSpring` /
  `planDuelFling`; no new animation primitives.
- **Tone of voice unchanged** — no copy changes in this plan.
- **No new fonts, hues, or system primitives.** General Sans / Inter /
  JetBrains Mono only; palette drawn entirely from tokens already in
  `tokens.css` (`--ink-violet`, `--violet`, `--violet-soft`, `--signal-coral`,
  `--paper`) plus the alpha/opacity variants needed for the ghosted mark and
  gradient wash (no new named tokens required — see phase files for exact
  values).

## Verification contract

Each phase ends with "Test it yourself" steps runnable in
`VITE_DEV_MODE=true` (no Supabase needed). Visual phases are checked by eye
against the corrected artifact plus a manual drag-through of both cards
(duel and leftover) on desktop pointer and touch emulation. No new business
logic is introduced, so no new Vitest cases are required — existing
`swipe.test.ts` / `transitions` tests are unaffected and must still pass.

## Done convention (from CLAUDE.md §5)

A phase is done when every `- [ ]` in its file is checked. Move completed
files to `docs/plans/swipe-card-refinement/archive/`. Archive
`00-overview.md` once all phases are done.
