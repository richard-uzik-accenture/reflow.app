import { useCallback, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

const SUCCESS_DURATION = 4375;
const ERROR_DURATION = 6250;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      // Keep at most 3 toasts; drop the oldest if over the limit
      const next = [...prev, { id, message, kind }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    const duration = kind === 'error' ? ERROR_DURATION : SUCCESS_DURATION;
    const timer = setTimeout(() => removeToast(id), duration);
    timers.current.set(id, timer);
  }, [removeToast]);

  return { toasts, showToast, removeToast };
}
