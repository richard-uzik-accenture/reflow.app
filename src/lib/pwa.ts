const DISMISSED_KEY = 'reflow.pwa.dismissed';

/** True if the app is already running as an installed PWA (Android/desktop or iOS). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

/** iOS Safari has no `beforeinstallprompt` — it's the only platform that needs the instruction sheet. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** The install banner is a mobile "add to home screen" nudge — desktop Chrome also fires `beforeinstallprompt`, but the framing doesn't apply there. */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DISMISSED_KEY) === '1';
}

export function dismissInstallPrompt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DISMISSED_KEY, '1');
}

export interface ShouldOfferInstallOpts {
  hasCapturedPrompt: boolean;
}

/** Which install affordance to offer, or null if none applies. */
export function shouldOfferInstall(opts: ShouldOfferInstallOpts): 'android' | 'ios' | null {
  if (isStandalone() || isDismissed() || !isMobile()) return null;
  if (opts.hasCapturedPrompt) return 'android';
  if (isIOS()) return 'ios';
  return null;
}
