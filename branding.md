# Reflow — Brand identity

*A day-planning app for people whose plans get interrupted. Your day doesn't fall apart — it reflows.*

---

## The core idea

**"Reflow" is already a typographic term.** It's what text does when its container changes shape: it re-wraps, nothing is lost, the paragraph just finds a new arrangement.

That is the entire brand thesis in one word, and it does two useful things:

1. It's calm by nature. Reflowing is not a crisis, it's a routine layout operation.
2. It gives the identity a ready-made visual vocabulary — lines, bars, wrapping, obstacles, order.

Every decision below traces back to this. When in doubt: *interruption is the assumed condition, not a failure.*

---

## 1. Logo

### The shift (canonical primary mark)

Three rounded horizontal bars — a ranked list. The middle bar breaks right into a chevron point, mid-reorder: the moment one item is actively moving past the others. Top and bottom bars stay full-width and still; only the active row shows motion.

- **Strength:** reads as a list *in the act of reordering*, not a static stack — closer to the product's actual mechanic (an item shifting rank) than a symmetric/decorative arrangement. Distinct silhouette: two plain bars plus one bar-with-a-point, not a generic hamburger or chevron pairing.
- **Risk:** the chevron notch needs its point (x=76 in the source geometry below) to stay proud of the bar body, or it collapses back into a plain rectangle at small sizes. Confirmed clean at 40px — see the SVG source.
- Superseded concepts A ("the comparator": opposing chevrons around a coral sliver), B ("the reflow": bars shortening around a coral circle), C ("the confluence": merging curves), and D (chevron-leg monogram) were explored and rejected — kept here as history only, not as fallback options:

  <details>
  <summary>Superseded concepts A–D</summary>

  - **A — the comparator:** two chevrons (`>` `<`) facing each other with a coral sliver between them. Rejected: chevron-pair shape reads as generic "fast-forward" in the category.
  - **B — the reflow:** a stack of bars shortening around a solid coral circle. Rejected: needed generous bar spacing to avoid reading as a hamburger menu at small sizes, and user testing (informal) found the metaphor didn't land without explanation.
  - **C — the confluence:** two curves merging into one line. Rejected: loses definition below ~32px, better suited to a wordmark companion than a standalone app icon.
  - **D — chevron-leg monogram:** a lowercase/capital `R` with a chevron for a leg. Rejected in favor of the shift's bar-based mark, which ties more directly to the ranked-list visual vocabulary used elsewhere in the icon system (§5).

  </details>

### Lockup rules

- Mark on the left, wordmark on the right.
- Match the mark's height to the wordmark's **x-height**, not its cap-height. Slightly undersizing the mark makes it feel like a companion rather than a badge.
- Gap between mark and wordmark = the width of the wordmark's `o`.
- Minimum clear space on all sides = the height of the mark's smallest element.
- Stacked (mark above wordmark) is permitted for square placements only. Never arch, rotate, or outline the mark.
- Reference assets: `public/logo-lockup.svg` (ink-violet mark + wordmark, for light surfaces) and `public/logo-lockup-dark.svg` (paper mark + wordmark, for dark surfaces).

### App icon

- Background: `ink violet #171335`, full-bleed, system corner radius.
- Mark: `paper #FAF9FB`. Flat single color — no coral on the app icon itself; the coral-reserved-for-decisions rule (§2) stays scoped to in-app moments, not the icon.
- No wordmark, no gradient, no shadow, no inner border.
- Test at 40px before anything else. If the silhouette doesn't survive, the mark is wrong. (Confirmed: at 40px all three bars and the chevron notch remain individually legible.)
- Reference asset: `public/favicon.svg` — regenerate all raster sizes from this file via `node scripts/generate-favicons.mjs` if it changes.

### Where the mark appears

- **Today (authenticated home)** — mark + wordmark together, via the shared `.brand-lockup` class in `src/pages/Today.tsx`: the desktop rail (`.today-rail`, left sidebar) and the mobile header (`.today-header-mobile`) each show it at the top. Sized smaller than the reference lockup SVGs below (22px mark, matched to the in-app 20px wordmark) since this is a persistent header, not a hero moment.
- **Landing (pre-login)** — mark + wordmark stacked, sized as a hero element (`Landing.tsx`, `.landing-mark`/`.landing-wordmark`) — this is the one place the lockup is meant to read as a badge rather than a companion.
- **Auth (sign in/up)** — mark deliberately omitted. Decision (2026-08-19): the auth card keeps only the `reflow` text heading, no icon — the screen is a short, focused form, and the icon added height without adding information the user needed at that point. Don't re-add it without revisiting that reasoning.
- **App loading (auth-check in flight)** — mark alone, no wordmark, in `AppLoading.tsx`. Shown while the app doesn't yet know whether to route to Today or Landing, so it must stay neutral rather than implying either outcome. See `App.tsx`'s `screen` state for the routing logic this depends on.
- **PWA install prompt** (`InstallPrompt.tsx`) — mark alone, 32px, alongside install copy.
- Reference lockup SVGs (`public/logo-lockup.svg`, `public/logo-lockup-dark.svg`) follow the x-height/gap rules above exactly and are meant for external use (README, social/OG images, app store listings) — the in-app placements above intentionally deviate in scale to fit their own UI, not the lockup rules verbatim.

### SVG source

118×118 app-icon tile. For a light-background version, delete the first `<rect>` and change `#FAF9FB` to `#171335`.

**The shift**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#171335"/>
  <g transform="translate(18.88, 20.48) scale(0.8024)" fill="#FAF9FB">
    <rect x="16" y="10" width="64" height="20" rx="10"/>
    <path d="M 16 38 H 66 L 76 48 L 66 58 H 16 A 10 10 0 0 1 16 38 Z"/>
    <path d="M 72 38 H 84 L 94 48 L 84 58 H 72 L 82 48 Z"/>
    <rect x="16" y="66" width="64" height="20" rx="10"/>
  </g>
</svg>
```

---

## 2. Color

> **Revised.** The original petrol-teal palette read as washed out and too close to "eco/finance app" in practice. Replaced with a bolder, higher-contrast direction below — same *rules* (one scarce decision accent, no red/green pair, warm neutrals), different hue and value. Every phase built after this revision uses these tokens; anything built earlier should be migrated, not left on the old values.

### Brand

| Token | Name | Hex | Role |
|---|---|---|---|
| `--ink-violet` | ink violet | `#171335` | Brand black, dark surfaces, app icon background |
| `--violet` | violet | `#4B3F8F` | Primary brand color, mark on light backgrounds |
| `--violet-soft` | violet soft | `#7A70B8` | Secondary/supporting, one side of a comparison |
| `--signal-coral` | signal coral | `#FF6B4A` | Accent — decisions only |
| `--coral-wash` | coral wash | `#FFE1D6` | Resting trace of a recent decision |

### Neutrals

| Token | Name | Hex | Role |
|---|---|---|---|
| `--paper` | paper | `#FAF9FB` | Page background, mark on dark |
| `--mist` | mist | `#F0EEF5` | Raised surfaces, dividers |
| `--haze` | haze | `#D9D6E4` | Hairlines, disabled |
| `--dusk` | dusk | `#7D7A8C` | Secondary text |
| `--ink` | ink | `#1A1A2E` | Body text |

### Dark

Dark mode is a preference, not a low-light-only mode — it leans into ink-violet as its own confident identity rather than a dimmed clone of light mode. It uses an **inverted shade relationship**: the page ground is *lighter* violet, and elements (cards, rows, panels) sitting on top are *darker* — the opposite of the usual "light content floats on a dark page" convention, chosen deliberately over that convention after comparing both directly.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | `#FAF9FB` | `#2C2854` | page ground (lighter than elements) |
| `--mist` | `#F0EEF5` | `#171533` | raised surface (darker than ground) |
| `--haze` | `#D9D6E4` | `#100E28` | hairlines, deepest surfaces |
| `--dusk` | `#7D7A8C` | `#B7B3D6` | secondary text |
| `--ink` | `#1A1A2E` | `#F5F4FA` | body text |
| `--violet` | `#4B3F8F` | `#C3BBF0` | primary accent |
| `--violet-soft` | `#7A70B8` | `#9C93D6` | secondary accent |
| `--coral-wash` | `#FFE1D6` | `#3D2A2A` | resting trace of a decision |

`--signal-coral` (`#FF6B4A`) and `--ink-violet` (`#171335`) are unchanged across themes — the coral rule (§2 above) holds exactly as-is in dark mode: coral stays scoped to the compare/duel, the task being slotted, and the single next action, never chrome. All pairings verified at WCAG AA (4.84:1–17.22:1) against `#2C2854` and `#171533`.

**In-app `Mark` placements invert with theme** (rail/header lockup, landing hero, app-loading, install prompt): light mode is ink-violet tile / paper bars as documented in §1; dark mode swaps to paper tile / ink-violet bars, via `--mark-bg`/`--mark-fg` tokens. This differs from the literal **app-icon/favicon asset** (`public/favicon.svg`, PWA/apple-touch icons), which stays the fixed light-mode version always — those live outside the page's own theming (OS chrome, browser tab, home screen) and aren't rendered through `tokens.css`.

### Why this palette

**Ink violet, not blue or teal.** Deep, saturated violet is uncommon as an app primary — distinct from Todoist (red), Things and most calendars (blue), Linear and Notion (purple-leaning grey, but desaturated where this is fully committed), and distinct from this app's own earlier teal direction, which read as too close to wellness/finance apps. Violet is cool enough to feel considered, saturated enough to not read as washed out.

**Cool-white neutrals, not warm paper.** `paper` and `mist` are a near-white with a faint cool-violet cast, not the warm cream of the original palette — the warmth was part of what made the old palette feel muted rather than sharp. The personal-notebook feeling now comes from tone of voice and layout (see §4), not from a warm page tint.

### The coral rule (the one that makes it "calm but sharp")

**Coral is scarce.** It appears only at the moment of decision:

- the compare/duel
- the task currently being slotted
- the single next action

Everywhere else: violet, paper, dusk. Restraint 95% of the time is what gives the accent its edge. If coral shows up on buttons, headers, and badges, the sharpness is gone.

Coral, not amber: still warm and decisive, but with more presence against the cooler violet ground than amber had against warm paper. Confirmed as read as "this is the decision moment," not "warning/error" — if that ever tests otherwise in practice, revisit before it ships more broadly.

`coral wash` is for the resting trace of a decision — the row that just moved — never for a large fill.

### Do not add a red/green semantic pair

Red/green in a comparison implies one task was the *wrong* answer. Your premise is that neither is wrong — one is just later. Use **violet vs coral** for the two sides of a compare, or **coral vs neutral**.

---

## 3. Typography

### Primary direction

A low-contrast humanist sans, wordmark set **lowercase** — `reflow`, never `Reflow`, never all-caps. Lowercase is the cheapest single signal that this is a personal tool rather than a product with a sales team.

| Use | Typeface | Notes |
|---|---|---|
| Wordmark, headings | **Söhne** (paid) or **Switzer** / **General Sans** (Fontshare, free) | Slight warmth, unfussy lowercase, doesn't look like Inter |
| Body, UI | **Inter** or the platform system font | Nothing gained by being clever here |
| Ranks, times, durations | **Geist Mono** or **JetBrains Mono**, tabular figures | Precision only where precision is the point |

The mono is the typographic equivalent of the coral rule: it appears in exactly two or three places, and that's what makes it feel like an instrument.

### The `fl` ligature

Set the wordmark's **`fl` as a true ligature**. Two letters flowing into one form, inside a word that means re-wrapping text. Almost nobody will consciously notice — which is the correct amount of clever.

### Alternate direction

An editorial serif wordmark (**Instrument Serif**, or **Fraunces** dialed to low wonk) with the sans doing all the work elsewhere. Warmer and more distinctive; slightly harder to keep legible in a tight app icon lockup.

---

## 4. Tone of voice

**Governing principle: the app never implies you failed.**

Getting interrupted is the assumed condition. That rules out streaks, "you missed 4 tasks," red overdue counts, and any language of catching up.

- **Calm friend, not coach.** "three left for today," not "crush your remaining tasks."
- **Verbs from the metaphor:** reflow, settle, slot, keep, drop, let go, later.
- **Short lines, contractions, lowercase-friendly.** No exclamation marks.
- **Dry wit only at the compare.** "which first?" — that's the one high-energy moment in the product.
- **Leftovers get neutral framing:** "still open," not "unfinished."

| Say | Not |
|---|---|
| three left for today | you still have 3 incomplete tasks! |
| which first? | choose the higher priority task |
| still open | overdue |
| let it go | delete task |
| settled | done ✅ |

---

## 5. Iconography

Stroke icons, not filled — lighter and more personal.

- 24px grid, **1.75px stroke**, round caps and joins to match the logo geometry.
- **Two atoms, borrowed from the mark:** the rounded horizontal bar is *a task*; the chevron is *the verb*.
- Every icon should be constructible from those two elements plus a circle.

That constraint keeps the set coherent for free, and makes the app icon feel like the source of the system rather than a decoration on top of it.

---

## 6. Motion

**Slow to settle, fast to decide.** Same tension as the color rule, expressed in time.

| Moment | Feel | Spec |
|---|---|---|
| Resting | Nothing moves unless you move it | No idle animation, no pulsing |
| Reflow | Water finding level | ~380ms, gentle spring, near-zero overshoot, ~25ms stagger |
| The compare | Decisive | 150–200ms, light haptic on commit; coral appears here and nowhere else |
| Dropping a task | Relief, not deletion | Soft fade and collapse. No shake, no destructive red |

The reflow animation matters most: the eye needs to follow where a task went, because understanding the new order is the entire payoff of the mechanic.

---

## Quick reference

**Do**

- Keep coral for decisions only
- Set the wordmark lowercase
- Test every mark at 40px first
- Treat interruption as normal
- Let the list settle slowly and the compare snap fast

**Don't**

- Streaks, guilt copy, or overdue counts
- Red/green for the two sides of a compare
- Gradients, shadows, or glow on the mark
- Warm cream/beige neutrals (superseded — see §2's revision note)
- Coral in a glow/gradient effect, or a multi-hue rainbow gradient, anywhere in the product

**Exception — pointer-reactive edge glow on pre-login surfaces only**

The landing page and sign-in card (`BorderGlow`, `src/components/BorderGlow.tsx`) use a quiet single-hue ink-violet edge light that brightens near the pointer. This is scoped narrowly and should not be treated as license to add glow elsewhere:

- Single hue only — a desaturated violet (`hsl(252deg 38% 55%)`), never the coral accent, never a multi-color mesh.
- Pointer-reactive only, not idle — it stays off at rest and never plays on mount; this keeps it inside the "nothing animates at rest" motion rule (§6).
- Pre-login only (`Landing.tsx`, `Auth.tsx`) — it's a first-impression cue, not a UI pattern. Do not add it to task rows, the compare/duel, modals, or any in-app chrome. Coral stays the only accent inside the product; this glow never appears alongside a decision moment.
- Coral on chrome (buttons, headers, badges)