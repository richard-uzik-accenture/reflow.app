# Phase 1: Scaffold and Auth

> Depends on: nothing (first phase). Read `docs/plans/reflow-v1/archive/00-overview.md` first for global constraints and tech stack.

**Goal of this phase:** a running Vite/React/TypeScript app, connected to a real Supabase project, that shows a public landing page, lets a visitor sign in or sign up, and — once authenticated — shows an empty authenticated shell with a working sign-out control. Nothing product-specific yet; this phase is pure plumbing plus the full auth workflow (landing → sign in/up → app → sign out).

## Files

- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/lib/supabase.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/pages/Landing.tsx` — public info page, shown to signed-out visitors before they choose to sign in/up
- Create: `src/pages/Auth.tsx` — combined sign-in/sign-up form, mode-toggled
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `.env.local` (gitignored), `.env.example`
- Create: `.gitignore`

## Task 1: Scaffold the Vite project

- [x] **Step 1: Create the project**

```bash
npm create vite@latest . -- --template react-ts
```

If the directory isn't empty (it has `PRODUCT.md`, `branding.md`, `idea.md`, `docs/`), run `npm create vite@latest reflow-tmp -- --template react-ts` in a sibling folder and move its contents (`src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `package.json`) into the project root, then delete `reflow-tmp`.

- [x] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js framer-motion
npm install -D vitest @vitest/ui
```

- [x] **Step 3: Add `.gitignore` entries**

```
node_modules
dist
.env.local
```

- [x] **Step 4: Confirm the default template runs**

Run: `npm run dev`
Expected: dev server starts, default Vite+React page loads at the printed localhost URL with no console errors.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

## Task 2: Design tokens from branding.md

**Interfaces:**
- Produces: CSS custom properties on `:root`, consumed by every component in later phases. Use these exact names.

- [x] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  /* Brand */
  --petrol-ink: #0F2E2F;
  --petrol: #1A4D4A;
  --shallow: #3E7A73;
  --signal-amber: #F2A63B;
  --amber-wash: #FBE6C2;

  /* Neutrals */
  --paper: #FAF8F4;
  --sand: #EDE9E1;
  --silt: #C9C3B8;
  --stone: #7A756C;
  --graphite: #2A2825;

  /* Type */
  --font-display: 'Switzer', 'General Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace;

  /* Motion (see branding.md §6) */
  --ease-reflow: cubic-bezier(0.34, 1.56, 0.64, 1); /* gentle spring approximation for CSS; components using Framer Motion use a real spring config instead */
  --duration-reflow: 380ms;
  --duration-decide: 175ms;
}
```

Note: `Switzer`/`General Sans` are not bundled yet — Phase 10 (brand polish) sources and self-hosts the actual font files. Until then the `system-ui` fallback renders; don't block earlier phases on font licensing.

- [x] **Step 2: Create `src/styles/global.css`**

```css
@import './tokens.css';

* { box-sizing: border-box; }

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background: var(--paper);
  color: var(--graphite);
  font-family: var(--font-body);
}

button {
  font-family: inherit;
}
```

- [x] **Step 3: Import global styles**

In `src/main.tsx`, add `import './styles/global.css'` above the `App` import.

- [x] **Step 4: Test it yourself**

Run `npm run dev`, open the page, confirm the background is the warm paper color (`#FAF8F4`), not white.

- [x] **Step 5: Commit**

```bash
git add src/styles src/main.tsx
git commit -m "feat: add Reflow design tokens"
```

## Task 3: Supabase project and client

You need a real Supabase project for this step — create one at supabase.com (free tier) if you haven't. Note the Project URL and anon public key from Project Settings → API.

- [x] **Step 1: Create `.env.example`**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [x] **Step 2: Create `.env.local`** with your real project's URL and anon key (this file is gitignored — never commit it)

- [x] **Step 3: Create `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [x] **Step 4: Test it yourself**

Add a temporary line to `src/App.tsx` inside the component: `console.log('supabase client', supabase)`. Run `npm run dev`, open the browser console, confirm no thrown error and the client object logs. Remove the console.log afterward.

- [x] **Step 5: Commit**

```bash
git add src/lib/supabase.ts .env.example .gitignore
git commit -m "feat: connect Supabase client"
```

## Task 4: Enable email/password auth in Supabase

This is a dashboard task, not code.

- [x] In the Supabase dashboard: Authentication → Providers → confirm Email is enabled and Authentication → Settings → "Allow new users to sign up" is on (it's on by default). Sign-up happens through the app's own form (Task 5), not by hand in the dashboard — the product is meant to be open to anyone eventually, so build the real flow now rather than a single hand-created account.
- [x] In Authentication → Settings, disable "Confirm email" for now, so a new account is usable immediately after signing up, with no email round-trip to build a UI for.

`[OPEN DECISION]`: leaving "Confirm email" off means anyone can sign up with any email address, unconfirmed, starting now. That's an acceptable shortcut while you're still effectively the only real user, but it's a gap to close before wider public use (spam/throwaway signups, someone signing up with an email that isn't theirs). Tracked in `11-open-decisions.md` §4 — revisit before treating this as a real public launch.

## Task 5: Auth hook, landing page, and sign-in/up screen

**Interfaces:**
- Produces: `useAuth()` hook returning `{ session: Session | null, loading: boolean, signIn(email, password): Promise<{ error: string | null }>, signUp(email, password): Promise<{ error: string | null }>, signOut(): Promise<void> }`, consumed by `App.tsx` and every later phase's data hooks (they read `session.user.id` for `user_id` on inserts).

- [x] **Step 1: Create `src/hooks/useAuth.ts`**

```ts
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, loading, signIn, signUp, signOut };
}
```

With "Confirm email" off (Task 4), `signUp` returns an already-usable session — no separate "check your email" state to build.

- [x] **Step 2: Create `src/pages/Landing.tsx`**

The public entry point for anyone who isn't signed in — a short info page, not a form. This is what an unknown visitor sees first.

```tsx
interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 24 }}>
      <div style={{ maxWidth: 360 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--petrol)' }}>
          reflow
        </h1>
        <p style={{ color: 'var(--graphite)', fontFamily: 'var(--font-body)' }}>
          your day doesn't fall apart — it reflows.
        </p>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
          one ranked list for today. new things land where they belong, not at the bottom.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            marginTop: 16,
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--petrol)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          sign in
        </button>
      </div>
    </div>
  );
}
```

- [x] **Step 3: Create `src/pages/Auth.tsx`**

One form, two modes (sign in / sign up), toggled — not two separate screens, to keep this simple.

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthProps {
  onBack: () => void;
}

export function Auth({ onBack }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, width: 280 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          ← back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--petrol)' }}>
          reflow
        </h1>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
        />
        {error && <p style={{ color: 'var(--stone)' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? (mode === 'signin' ? 'signing in…' : 'creating account…') : mode === 'signin' ? 'sign in' : 'sign up'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
        </button>
      </form>
    </div>
  );
}
```

Both pages are intentionally unstyled beyond the tokens — Phase 10 gives every screen its full brand pass. The goal here is a working auth workflow, not finished visuals.

- [x] **Step 4: Wire it all into `src/App.tsx`**

```tsx
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';

function App() {
  const { session, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  if (!session) {
    return showAuth ? <Auth onBack={() => setShowAuth(false)} /> : <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <p>signed in as {session.user.email}</p>
      <button onClick={signOut}>sign out</button>
    </div>
  );
}

export default App;
```

This authenticated shell (and its temporary sign-out button) is a placeholder — Phase 3 replaces it with the real `Today` page, which carries the sign-out control forward into a proper header.

- [x] **Step 5: Test it yourself**

Run `npm run dev`. Confirm the full workflow:
1. You land on the **landing page** first (lowercase "reflow" heading, tagline, a "sign in" button) — not directly on a form.
2. Clicking "sign in" shows the auth form, defaulting to sign-in mode. "← back" returns you to the landing page.
3. Switch to sign-up mode ("don't have an account? sign up"), create a new account with a fresh email + password. You land directly on the authenticated shell (no email-confirmation step) showing "signed in as your@email" and a "sign out" button.
4. Click "sign out" — you're back on the landing page, not the auth form.
5. Sign in again (sign-in mode, same credentials) — back on the shell.
6. Signing in with a wrong password shows an error message (in neutral `--stone`, not amber — amber is reserved for the compare duel, per `branding.md`) and does not proceed.
7. Refresh the page while signed in — you stay signed in and land on the shell directly (not bounced back to the landing page).

- [x] **Step 6: Commit**

```bash
git add src/App.tsx src/hooks/useAuth.ts src/pages/Landing.tsx src/pages/Auth.tsx
git commit -m "feat: landing page, sign in/up, and sign out"
```

## Phase 1 done when

You can open the dev server, see the landing page as a signed-out visitor, sign up for a new account or sign in to an existing one, land on a bare authenticated shell, sign out back to the landing page, and staying signed in survives a refresh.
