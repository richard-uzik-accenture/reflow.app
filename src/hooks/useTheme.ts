import { useEffect, useState } from 'react';
import { DEV_MODE } from '../lib/devMock';
import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/theme';

const DEV_STORAGE_KEY = 'reflow-theme-preference';

/**
 * Resolves the active theme for a signed-in user: their stored preference
 * (synced via Supabase, falling back to localStorage in DEV_MODE where no
 * `profiles` row exists), applied as `data-theme` on <html> so tokens.css's
 * dark overrides can win over `prefers-color-scheme` in both directions.
 */
export function useTheme(userId: string | null) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemIsDark, setSystemIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    if (DEV_MODE) {
      const stored = window.localStorage.getItem(DEV_STORAGE_KEY) as ThemePreference | null;
      if (stored) setPreference(stored);
      return;
    }

    getThemePreference(userId)
      .then((pref) => { if (!cancelled) setPreference(pref); })
      .catch((err) => console.error('failed to load theme preference', err));

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
    const t = setTimeout(() => root.classList.remove('theme-transitioning'), 350);
    return () => clearTimeout(t);
  }, [preference]);

  async function updatePreference(theme: ThemePreference) {
    setPreference(theme);
    if (!userId) return;
    if (DEV_MODE) {
      window.localStorage.setItem(DEV_STORAGE_KEY, theme);
      return;
    }
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
