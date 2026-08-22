import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useRef } from 'react';
import { decideSwipeDirection, planDuelFling } from '../lib/swipe';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Task } from '../lib/tasks';

interface LeftoverCardProps {
  task: Task;
  remaining: number;
  onResolve: (keep: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 100;

export function LeftoverCard({ task, remaining, onResolve }: LeftoverCardProps) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const committed = useRef(false);

  const rotate = useTransform(x, [-300, 0, 300], reducedMotion ? [0, 0, 0] : [-16, 0, 16], { clamp: true });
  const keepOpacity = useTransform(x, [40, 130], [0, 1], { clamp: true });
  const dropOpacity = useTransform(x, [-130, -40], [1, 0], { clamp: true });

  function commit(direction: 1 | -1, velocityX = 0, velocityY = 0) {
    if (committed.current) return;
    committed.current = true;

    const plan = planDuelFling(direction, velocityX, window.innerWidth, reducedMotion);
    if (plan.haptic) navigator.vibrate?.(10); // branding.md §6: light haptic on commit

    const ease: [number, number, number, number] = [0.32, 0.72, 0, 1];
    animate(y, y.get() + velocityY * 0.1, { duration: plan.duration, ease });
    animate(x, plan.direction * plan.distance, {
      duration: plan.duration,
      ease,
      onComplete: () => onResolve(plan.direction === 1),
    });
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const direction = decideSwipeDirection(info.offset.x, info.velocity.x, SWIPE_THRESHOLD_PX);
    if (direction !== null) {
      commit(direction, info.velocity.x, info.velocity.y);
      return;
    }
    const spring = { type: 'spring' as const, stiffness: 520, damping: 34 };
    animate(x, 0, { ...spring, velocity: info.velocity.x });
    animate(y, 0, { ...spring, velocity: info.velocity.y });
  }

  return (
    <div className="leftover-shell">
      <div>
        <p className="leftover-kicker">still open · {remaining} left</p>
        <motion.div
          className="leftover-card"
          drag
          dragMomentum={false}
          style={{ x, y, rotate }}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: 'grabbing' }}
        >
          <motion.span className="duel-stamp stays-ahead" style={{ opacity: keepOpacity }} aria-hidden>
            keep
          </motion.span>
          <motion.span className="duel-stamp loses-spot" style={{ opacity: dropOpacity }} aria-hidden>
            let go
          </motion.span>

          {task.title}
        </motion.div>
        <div className="leftover-actions">
          <button className="leftover-hint drop" onClick={() => commit(-1)}>← let it go</button>
          <button className="leftover-hint keep" onClick={() => commit(1)}>keep →</button>
        </div>
      </div>
    </div>
  );
}
