# Phase 10: Brand Polish

> Depends on: Phase 9 (the whole app is functionally complete) and [04b-design-system-revision.md](04b-design-system-revision.md) (color palette and structural layout — rail/column desktop, responsive rows, floating add button, single-card duel, morning-flow step indicator — were already revised there, mid-build). Read `branding.md` in full before starting this phase — it's the source of truth for every task below, more than this file's paraphrasing of it, and note it now specifies **ink violet + signal coral**, not the original petrol-teal + amber this file's hex values below have already been updated to match.

**Goal of this phase:** by this point every screen has real color and real structural layout (from 04b), but still uses system fonts, a text "×" instead of a real icon, and `easeOut` tweens instead of tuned spring physics. This phase closes those specific remaining gaps against `branding.md` — fonts, icons, motion tuning, tone-of-voice copy, and PWA installability — in one pass. **This phase does not touch color or layout** — that scope moved to 04b once it became clear redoing styling twice (once now, once "properly" later) wasted more effort than fixing it once, mid-build.

## Files

- Create: `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png` (or reuse the SVG directly where the target supports it)
- Modify: `index.html` — favicon link, page title
- Create: `public/fonts/` (self-hosted font files you download — see Task 2)
- Modify: `src/styles/tokens.css` — real `@font-face` declarations
- Create: `src/components/icons/Check.tsx`, `src/components/icons/Close.tsx`
- Modify: `src/components/TaskRow.tsx` — use real icons instead of a bare circle and a text `×`
- Modify: `src/components/TaskRow.tsx`, `src/components/TaskList.tsx` — tune the reflow transition to a spring
- Audit (modify as needed): every `.tsx` file under `src/` with a user-visible string
- Modify: `vite.config.ts` — add `vite-plugin-pwa`
- Modify: `index.html` — theme-color meta, apple-touch-icon
- (No separate manifest file needed — `vite-plugin-pwa` generates it from `vite.config.ts`)
- Modify: `src/components/AddTaskFab.tsx` — `+`/`n` keyboard shortcut to open quick-add on desktop

## Task 1: App icon and favicon

`branding.md` §1 specifies Concept B ("The reflow") as the primary mark, on an `ink violet #171335` background.

- [ ] **Step 1: Create `public/favicon.svg`** using the exact SVG from `branding.md`'s "B — The reflow" source block:

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#171335"/>
  <circle cx="80" cy="61" r="14" fill="#FF6B4A"/>
  <rect x="24" y="23" width="70" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="37" width="70" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="51" width="36" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="65" width="36" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="79" width="70" height="6" rx="3" fill="#FAF9FB"/>
</svg>
```

- [ ] **Step 2: Test it yourself** — open `public/favicon.svg` directly in a browser tab at a small size (or zoom your browser out) and confirm the mark still reads clearly at roughly 40px, per branding.md's "test at 40px before anything else" rule. If the bars blur into a solid block, the gaps between them need to be wider — do not ship it if this check fails.

- [ ] **Step 3: Wire it into `index.html`**

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>reflow</title>
```

(Remove any default Vite favicon reference already in the template.)

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg index.html
git commit -m "feat: app favicon from the pinned brand mark"
```

## Task 2: Self-hosted fonts

`branding.md` §3 specifies Söhne/Switzer/General Sans for display, Inter for body, JetBrains Mono/Geist Mono for ranks and durations — not the `system-ui` fallback earlier phases shipped with.

- [ ] **Step 1: Download font files**
  - General Sans (free): fontshare.com/fonts/general-sans — download the woff2 files for Regular (400) and Medium (500), place them at `public/fonts/GeneralSans-Regular.woff2` and `public/fonts/GeneralSans-Medium.woff2`.
  - Inter: `npm install @fontsource/inter` (self-hosted via npm, no manual download needed).
  - JetBrains Mono: `npm install @fontsource/jetbrains-mono`.

- [ ] **Step 2: Modify `src/styles/tokens.css`** — replace the font block with real declarations:

```css
@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}

:root {
  --font-display: 'General Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 3: Import the npm-hosted fonts** — in `src/main.tsx`, add:

```ts
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
```

- [ ] **Step 4: Set the wordmark's `fl` ligature** — `branding.md` §3 calls for the wordmark's `fl` to render as a true ligature. Wherever "reflow" is set as the wordmark (currently `Landing.tsx`'s `<h1>`, `Auth.tsx`'s `<h1>`, `Today.tsx`'s header `<span>`, and `MorningFlow.tsx`'s header), add `style={{ fontVariantLigatures: 'common-ligatures', fontFeatureSettings: '"liga" 1' }}` — General Sans supports standard ligatures, so this alone is enough; no custom glyph substitution needed.

- [ ] **Step 5: Test it yourself**

Run `npm run dev`. Confirm the sign-in screen's "reflow" heading and body text visibly changed from the system font to General Sans/Inter (check via browser dev tools' computed font-family if the visual difference is subtle on your system).

- [ ] **Step 6: Commit**

```bash
git add public/fonts src/styles/tokens.css src/main.tsx src/pages/Landing.tsx src/pages/Auth.tsx src/pages/Today.tsx src/components/MorningFlow.tsx package.json
git commit -m "feat: self-hosted brand fonts"
```

## Task 3: Real stroke icons

`branding.md` §5: stroke icons only, 24px grid, 1.75px stroke, round caps/joins, built from the mark's two atoms (rounded bar = a task, chevron = the verb) plus a circle. The current "×" drop button is a text glyph, not an icon — replace it.

**Interfaces:**
- Produces: `Check` and `Close` components, both accepting standard SVG props (`className`, `style`), consumed by `TaskRow.tsx`.

- [ ] **Step 1: Write `src/components/icons/Check.tsx`**

```tsx
import type { SVGProps } from 'react';

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 13 L10 18 L19 7" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Write `src/components/icons/Close.tsx`**

```tsx
import type { SVGProps } from 'react';

export function Close(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 3: Modify `src/components/TaskRow.tsx`** — replace the bare circle button's empty content and the text `×` with the two new icon components. `TaskRow` already uses 04b's className-based structure (`className="check"` / `className="close"`, styled via `global.css`, not inline `style` objects) — this step only changes what renders *inside* those two buttons, not their styling. Add the imports `import { Check } from './icons/Check';` and `import { Close } from './icons/Close';`, then update the two buttons:

```tsx
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check">
        <Check width={12} height={12} />
      </button>
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">
        <Close width={14} height={14} />
      </button>
```

Add `display: grid; place-items: center; color: var(--dusk);` to `.check` and `display: grid; place-items: center;` to `.close` in `global.css` (both currently just center a bare circle/glyph via their existing declarations — this only adds the flex/grid centering needed for an SVG child instead of a text character, which centers automatically).

- [ ] **Step 4: Test it yourself**

Confirm both icons render as thin, rounded-cap strokes (not filled shapes) at a legible size in the row, matching the 1.75px weight visually against the logo mark.

- [ ] **Step 5: Commit**

```bash
git add src/components/icons src/components/TaskRow.tsx
git commit -m "feat: real stroke icons for done and drop"
```

## Task 4: Tune the reflow spring

`branding.md` §6: the reflow (reorder) transition should feel like "water finding level" — roughly 380ms, a gentle spring, near-zero overshoot. Earlier phases used Framer Motion's default `layout` spring, which is close but not verified against this spec.

- [ ] **Step 1: Modify `src/components/TaskRow.tsx`** — add an explicit `layout` transition to the `Reorder.Item`:

```tsx
<Reorder.Item
  value={task}
  dragListener={false}
  dragControls={dragControls}
  onDragEnd={onReorderCommit}
  onPointerDown={onPointerDown}
  onPointerMove={onPointerMove}
  onPointerUp={onPointerUp}
  onPointerCancel={onPointerCancel}
  transition={{ layout: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 } }}
  style={{ /* unchanged */ }}
>
```

- [ ] **Step 2: Test it yourself**

Drag-reorder a list of 5+ tasks and watch the other rows settle into their new positions. They should glide to a stop smoothly, taking roughly a third to half a second, with no visible bounce past the final position. If it overshoots and bounces back, raise `damping` (e.g. to 34-36); if it feels sluggish or takes noticeably longer than ~400ms, raise `stiffness`. These numbers are a tuned starting point, not a spec to match exactly — trust your eyes over the numbers.

- [ ] **Step 3: Commit**

```bash
git add src/components/TaskRow.tsx
git commit -m "feat: tune reflow spring to match brand motion spec"
```

## Task 5: Tone-of-voice audit

`branding.md` §4: the app never implies you failed. No streaks, no "missed" language, no overdue counts. Calm-friend register, lowercase-friendly, no exclamation marks, dry wit only at the compare.

- [ ] **Step 1: Check every user-visible string against `branding.md`'s say/not table.** Known strings from earlier phases to review — go through each file and adjust anything that doesn't fit, using this as a starting checklist rather than an exhaustive one (re-read each component's JSX for anything missed here):

| File | String | Verify |
|---|---|---|
| `src/components/TaskList.tsx` | "nothing on the list yet — add your first task below." | Calm, factual, no guilt — already compliant, but re-read against the say/not table for tone consistency with the rest. |
| `src/components/LeftoverCard.tsx` | "still open · {remaining} left" | Uses the exact locked phrase "still open" (not "overdue") — compliant, verify it stayed that way. |
| `src/components/BrainDump.tsx` | "what's new today? add as many as you want, in any order — you'll sort them next." | Check for stray exclamation marks or coach-y phrasing. |
| `src/components/CompareDuel.tsx` | "more urgent than '{candidate.title}'?" (see [04b-design-system-revision.md](04b-design-system-revision.md)'s single-card redesign — the original "which first?" two-box copy no longer applies) | This is the app's one high-energy, dry-wit moment per branding.md — check the actual shipped phrasing still reads decisive and slightly playful, not clinical, even though the exact wording changed from the originally-planned "which first?" |
| `src/pages/Auth.tsx` | Error messages surfaced from Supabase Auth (e.g. "Invalid login credentials") | These come from Supabase directly and won't match the brand voice out of the box — wrap them in a small map of known error codes to on-brand phrasing, e.g. `"that password doesn't match"` instead of the raw Supabase string, falling back to the raw message for anything unmapped. |
| `src/pages/Landing.tsx` | Tagline and one-liner ("your day doesn't fall apart — it reflows." / "one ranked list for today...") | Already on-brand (from `branding.md`'s own thesis line) — check it still reads calm and factual next to whatever else got added to the page since Phase 1. |
| `src/hooks/useRolloverPrompt.ts` banner copy (in `Today.tsx`) | "still open from before — start my day?" / "not now" | Verify against the say/not table — this is the closest the app comes to "you have unfinished work," so it's worth a second read specifically for guilt-adjacent framing. |

- [ ] **Step 2: Test it yourself** — read through the whole app once, screen by screen (sign-in, empty list, populated list, compare duel, leftover triage, brain dump, merge), out loud, and flag anything that reads like "software talking down to you" rather than branding.md's "calm friend."

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "polish: tone-of-voice pass against branding.md"
```

## Task 6: PWA manifest and installability

This is the one product requirement (PWA-enabled) that no earlier phase touches at all. It belongs here, after Task 1, because the manifest needs real app icons — reusing `public/icon-192.png`/`icon-512.png` from Task 1 rather than inventing separate PWA-only artwork.

**Interfaces:**
- Consumes: `public/icon-192.png`, `public/icon-512.png` (Task 1), the brand colors from `branding.md` (`ink-violet` / `paper`).
- Produces: an installable app (manifest + service worker), no new app code — this task is config only.

- [ ] **Step 1: Install the plugin**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Modify `vite.config.ts`** — register the plugin with the manifest fields

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'reflow',
        short_name: 'reflow',
        description: 'your day doesn\'t fall apart — it reflows.',
        theme_color: '#171335',
        background_color: '#FAF9FB',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Precache the built app shell only — this app is realtime-sync-dependent,
        // so task data is deliberately NOT cached for offline use. Opening the app
        // offline shows the shell; data operations still require a connection.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
});
```

`theme_color` (`ink-violet`) and `background_color` (`paper`) reuse the exact brand tokens from `tokens.css` — don't invent separate values here.

- [ ] **Step 3: Modify `index.html`** — add the theme-color meta tag and apple-touch-icon (iOS Safari doesn't read the manifest's icons for the home-screen icon; it needs this explicitly)

```html
<meta name="theme-color" content="#171335" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

- [ ] **Step 4: Test it yourself**

Run `npm run build && npm run preview` (PWA install prompts don't reliably fire on the plain `dev` server). Open the preview URL:
1. Desktop Chrome/Edge: confirm an install icon appears in the address bar; install it and confirm it opens in its own window, titled "reflow", with the ink-violet-background icon.
2. Android Chrome (via the deployed Vercel URL from Phase 9, or the LAN preview URL): confirm "Add to Home Screen" is offered; add it and confirm the home-screen icon and splash use the brand colors, not a generic browser icon.
3. iOS Safari (via the deployed URL — iOS requires HTTPS for install prompts, so this one needs Phase 9's real Vercel deploy, not LAN): Share → "Add to Home Screen"; confirm the icon is the `apple-touch-icon`, not a screenshot thumbnail.
4. Turn off wifi/data with the app already open: confirm the app shell still loads (even though task data won't load without a connection — that's expected, per the caching note in Step 2).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html package.json
git commit -m "feat: PWA manifest and installability"
```

## Task 7: Keyboard shortcut for quick-add (desktop)

On desktop, opening the add-task modal currently requires clicking the floating `+` button. Add a global keyboard shortcut so a keyboard-only user on the `Today` screen can open it without reaching for the mouse.

**Interfaces:**
- Modifies `AddTaskFab.tsx` only — no new files, no prop changes to other components.

- [ ] **Step 1: Modify `src/components/AddTaskFab.tsx`** — listen for the shortcut key on `window` and open the same modal the `+` button opens. Guard against firing while the user is typing in any input/textarea/contenteditable (including while the add-task modal itself is already open), so the shortcut doesn't leak into normal typing elsewhere in the app:

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useTasks } from '../hooks/useTasks';

export function AddTaskFab() {
  const { addTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '+' && e.key !== 'n') return;
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping || open) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // ...rest unchanged
```

`+` is the literal key (works without a modifier on most layouts via Shift+= or the numpad `+`); `n` is included as a mnemonic fallback ("new task") since `+` requires Shift on most keyboards and isn't always comfortable to reach one-handed. Both are ignored while any modal or text input already has focus, so they never collide with normal typing.

- [ ] **Step 2: Test it yourself**

Run `npm run dev` on desktop. With focus on the page background (not inside any input), press `+` — the add-task modal should open exactly as if you'd clicked the FAB. Press `n` — same result. Then open the modal and type a task title containing neither key issue (e.g. confirm typing `n` or `+` inside the title input does *not* re-trigger or close the modal). Confirm the shortcut does nothing while any other text field on the page (e.g. a future settings field) has focus.

- [ ] **Step 3: Commit**

```bash
git add src/components/AddTaskFab.tsx
git commit -m "feat: keyboard shortcut to open quick-add on desktop"
```

## Phase 10 done when

The app's favicon is the real mark (legible at 40px), fonts match `branding.md` instead of system defaults, done/drop use real stroke icons, the reorder animation is a tuned spring rather than the untuned default, every visible string has been checked against the tone-of-voice table, the app is installable to a home screen on desktop, Android, and iOS with the correct brand icon and colors, and desktop users can open quick-add via a keyboard shortcut without touching the mouse.
