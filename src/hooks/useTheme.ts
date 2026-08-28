import { useEffect, useRef, useState } from 'react';
import { DEV_MODE } from '../lib/devMock';
import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/theme';

const CACHE_KEY = (userId: string) => `reflow-theme-${userId}`;
// Last-session key written without userId so the inline script in index.html
// can apply the theme before React mounts (no userId available that early).
const LAST_KEY = 'reflow-theme-last';
const DEV_STORAGE_KEY = 'reflow-theme-preference';

function readCache(userId: string): ThemePreference | null {
  try {
    return window.localStorage.getItem(CACHE_KEY(userId)) as ThemePreference | null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, theme: ThemePreference) {
  try {
    window.localStorage.setItem(CACHE_KEY(userId), theme);
    window.localStorage.setItem(LAST_KEY, theme);
  } catch { /* ignore */ }
}

/**
 * Resolves the active theme for a signed-in user: their stored preference
 * (synced via Supabase, falling back to localStorage in DEV_MODE where no
 * `profiles` row exists), applied as `data-theme` on <html> so tokens.css's
 * dark overrides can win over `prefers-color-scheme` in both directions.
 *
 * Cache strategy: on Supabase fetch we write to localStorage so the correct
 * theme is applied synchronously on the next reload, eliminating the flicker
 * between the OS default and the user's stored preference.
 *
 * Unauthenticated (userId null): always defaults to 'light' so the landing/
 * auth screens are never dark-themed on a fresh session.
 */
export function useTheme(userId: string | null) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (!userId) {
      // Keep whatever the inline script already set — don't override on logout
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark' || current === 'light') return current;
      return 'light';
    }
    // Apply cached value synchronously to avoid flash on reload
    return readCache(userId) ?? 'light';
  });
  const [systemIsDark, setSystemIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  // Skip the transition animation on the very first apply — the inline script
  // in index.html already set data-theme correctly, so we just need to confirm
  // it without triggering a visible cross-fade.
  const isFirstApply = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!userId) {
      // Don't reset theme on logout — preserve whatever is currently shown
      return;
    }
    let cancelled = false;

    if (DEV_MODE) {
      const stored = window.localStorage.getItem(DEV_STORAGE_KEY) as ThemePreference | null;
      if (stored) setPreference(stored);
      return;
    }

    // Apply cache immediately so the DOM is correct before the async fetch
    const cached = readCache(userId);
    if (cached) setPreference(cached);

    getThemePreference(userId)
      .then((pref) => {
        if (cancelled) return;
        setPreference(pref);
        writeCache(userId, pref);
      })
      .catch((err) => console.error('failed to load theme preference', err));

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const root = document.documentElement;
    const first = isFirstApply.current;
    isFirstApply.current = false;
    if (!first) root.classList.add('theme-transitioning');
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
    if (!first) {
      const t = setTimeout(() => root.classList.remove('theme-transitioning'), 350);
      return () => clearTimeout(t);
    }
  }, [preference]);

  async function updatePreference(theme: ThemePreference) {
    setPreference(theme);
    if (!userId) return;
    if (DEV_MODE) {
      window.localStorage.setItem(DEV_STORAGE_KEY, theme);
      return;
    }
    writeCache(userId, theme); // also writes LAST_KEY
    try {
      await setThemePreference(userId, theme);
    } catch (err) {
      console.error('failed to save theme preference', err);
    }
  }

  const isDark = preference === 'dark' || (preference === 'system' && systemIsDark);

  function toggle() {
    updatePreference(isDark ? 'light' : 'dark');
  }

  return { preference, isDark, setPreference: updatePreference, toggle };
}
