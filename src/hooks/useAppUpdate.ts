import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { DEV_MODE } from '../lib/devMock';

/** Checks for a new deployed version on registration and periodically thereafter —
 * iOS standalone PWAs rarely trigger the browser's own SW update check on their own,
 * since the app is opened from the home screen rather than navigated to fresh. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

type UpdateSW = (reloadPage?: boolean) => Promise<void>;

/** Reload the page — a waiting SW (if any) will activate on next load automatically. */
export function forceReloadApp() {
  window.location.reload();
}

export function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const updateSWRef = useRef<UpdateSW | null>(null);

  useEffect(() => {
    if (DEV_MODE) return;

    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true);
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        window.setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL_MS);
      },
    });
  }, []);

  function refresh() {
    if (updateSWRef.current) {
      updateSWRef.current(true);
    } else {
      window.location.reload();
    }
  }

  return { needsRefresh, refresh };
}
