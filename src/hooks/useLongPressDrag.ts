import { useEffect, useRef, useState } from 'react';
import { useDragControls } from 'framer-motion';

export const LONG_PRESS_MS = 350;
const MOVE_CANCEL_THRESHOLD_PX = 10;

export function useLongPressDrag() {
  const dragControls = useDragControls();
  const [charging, setCharging] = useState(false);
  const elRef = useRef<HTMLLIElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const pointerEventRef = useRef<PointerEvent | null>(null);

  function cancel() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
    pointerEventRef.current = null;
    draggingRef.current = false;
    setCharging(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    function handlePointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return;
      pointerEventRef.current = e;
    }

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      startPointRef.current = { x: touch.clientX, y: touch.clientY };
      draggingRef.current = false;
      setCharging(true);
      timerRef.current = window.setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        timerRef.current = null;
        draggingRef.current = true;
        setCharging(false);
        if (el) el.style.touchAction = 'none';
        if (pointerEventRef.current) dragControls.start(pointerEventRef.current);
      }, LONG_PRESS_MS);
    }

    function handleTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      if (draggingRef.current) {
        // Long-press already confirmed: this gesture is a drag, not a scroll.
        e.preventDefault();
        return;
      }
      if (!startPointRef.current || timerRef.current === null) return;
      const dx = touch.clientX - startPointRef.current.x;
      const dy = touch.clientY - startPointRef.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) cancel();
    }

    function handleTouchEnd() {
      if (el) el.style.touchAction = '';
      cancel();
    }

    el.addEventListener('pointerdown', handlePointerDown, { passive: true });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') {
      dragControls.start(e);
    }
  }

  return { dragControls, charging, ref: elRef, onPointerDown };
}
