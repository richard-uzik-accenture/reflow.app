import { animate, motion, motionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion';
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { decideSwipeDirection, planDuelFling } from '../lib/swipe';
import { reflowSpring } from '../lib/transitions';
import { CARD_TITLE_SCALE_RANGES, HEADLINE_SCALE_RANGES, scaleTitleStyle } from '../lib/textScale';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  progress: { done: number; total: number };
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;
/** How many remaining comparisons are drawn as peeking cards behind the live one. */
const MAX_GHOSTS = 2;

type CommitFn = (direction: 1 | -1, velocityX?: number, velocityY?: number) => void;

export function CompareDuel({ candidate, newTaskTitle, progress, onDecide }: CompareDuelProps) {
  const reducedMotion = useReducedMotion();
  // The action buttons live outside the card, so the live card publishes its
  // commit function here — pressing a button plays the same fling as a swipe.
  const commitRef = useRef<CommitFn | null>(null);

  // Lifted out of DuelCard so the ghost stack behind it can derive a live
  // reveal from the same drag position, including mid-drag before any commit.
  // Recreated fresh per step (memoized on the same key as DuelCard's own key)
  // so a just-completed fling's final offset can never leak into the next
  // card/ghost — no reset-in-an-effect race to get right.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const x = useMemo(() => motionValue(0), [candidate.id, progress.done]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const y = useMemo(() => motionValue(0), [candidate.id, progress.done]);

  const dragProgress = useTransform(x, (latest) => Math.min(Math.abs(latest) / SWIPE_THRESHOLD_PX, 1));
  const topGhostScale = useTransform(dragProgress, [0, 1], [1 - 0.04, 1]);
  const topGhostY = useTransform(dragProgress, [0, 1], [10, 0]);
  const shimmerOpacity = useTransform(dragProgress, [0, 0.15, 1], [0, 1, 1]);

  const ghosts = Math.min(Math.max(progress.total - progress.done - 1, 0), MAX_GHOSTS);
  const headlineStyle = scaleTitleStyle(newTaskTitle, HEADLINE_SCALE_RANGES);

  return (
    <motion.div
      className="duel-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: reflowSpring }}
      exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
    >
      <div className="duel-headline">
        <p className="duel-caption">where does this rank?</p>
        <h2 className="duel-question" style={headlineStyle}>{newTaskTitle}</h2>
      </div>

      <div className="duel-stage">
        <div className="duel-stack">
          {Array.from({ length: ghosts }, (_, i) => (
            <GhostCard
              key={`ghost-${i}`}
              index={i}
              reducedMotion={reducedMotion}
              scale={i === 0 ? topGhostScale : undefined}
              y={i === 0 ? topGhostY : undefined}
              shimmerOpacity={i === 0 ? shimmerOpacity : undefined}
            />
          ))}

          {/* Keyed per comparison: every card is a fresh instance owning its own
              drag position, so a committed card can never leave a stale offset
              behind for the next one. */}
          <DuelCard
            key={`${candidate.id}:${progress.done}`}
            title={candidate.title}
            reducedMotion={reducedMotion}
            commitRef={commitRef}
            onResolved={onDecide}
            x={x}
            y={y}
          />
        </div>
      </div>

      <div className="duel-actions">
        <button className="duel-action loses-spot" onClick={() => commitRef.current?.(-1)}>← loses spot</button>
        <button className="duel-action stays-ahead" onClick={() => commitRef.current?.(1)}>stays ahead →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </motion.div>
  );
}

interface GhostCardProps {
  index: number;
  reducedMotion: boolean;
  scale?: MotionValue<number>;
  y?: MotionValue<number>;
  shimmerOpacity?: MotionValue<number>;
}

function GhostCard({ index, reducedMotion, scale, y, shimmerOpacity }: GhostCardProps) {
  // Only the topmost ghost (the next card in line) gets a live, drag-derived
  // reveal; deeper ghosts keep the static step-mount animation.
  if (scale && y) {
    return (
      <motion.div className="duel-ghost" style={{ scale, y }}>
        {!reducedMotion && shimmerOpacity && (
          <motion.div className="duel-ghost-shimmer" style={{ opacity: shimmerOpacity }} aria-hidden />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="duel-ghost"
      animate={{ scale: 1 - 0.04 * (index + 1), y: 10 * (index + 1) }}
      transition={reducedMotion ? { duration: 0 } : reflowSpring}
    />
  );
}

interface DuelCardProps {
  title: string;
  reducedMotion: boolean;
  commitRef: RefObject<CommitFn | null>;
  onResolved: (newTaskWon: boolean) => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
}

function DuelCard({ title, reducedMotion, commitRef, onResolved, x, y }: DuelCardProps) {
  const committed = useRef(false);
  const titleStyle = scaleTitleStyle(title, CARD_TITLE_SCALE_RANGES);

  const rotate = useTransform(x, [-300, 0, 300], reducedMotion ? [0, 0, 0] : [-16, 0, 16], { clamp: true });
  const staysAheadOpacity = useTransform(x, [40, 130], [0, 1], { clamp: true });
  const losesSpotOpacity = useTransform(x, [-130, -40], [1, 0], { clamp: true });

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
      // Right = the card's reference task stays more urgent (new task loses);
      // left = the new task overtakes it. See compare.ts for newTaskWon semantics.
      onComplete: () => onResolved(plan.direction === -1),
    });
  }

  useLayoutEffect(() => {
    commitRef.current = commit;
  });

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const direction = decideSwipeDirection(info.offset.x, info.velocity.x, SWIPE_THRESHOLD_PX);
    if (direction !== null) {
      commit(direction, info.velocity.x, info.velocity.y);
      return;
    }
    // Under threshold: hand the release velocity to the spring so the snap-back
    // continues the gesture instead of restarting from a dead stop.
    const spring = { type: 'spring' as const, stiffness: 520, damping: 34 };
    animate(x, 0, { ...spring, velocity: info.velocity.x });
    animate(y, 0, { ...spring, velocity: info.velocity.y });
  }

  return (
    <motion.div
      className="duel-card"
      drag
      dragMomentum={false}
      style={{ x, y, rotate }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
      whileDrag={{ scale: 1.03 }}
    >
      <motion.span className="duel-stamp stays-ahead" style={{ opacity: staysAheadOpacity }} aria-hidden>
        stays ahead
      </motion.span>
      <motion.span className="duel-stamp loses-spot" style={{ opacity: losesSpotOpacity }} aria-hidden>
        loses spot
      </motion.span>

      <div className="duel-card-title" style={titleStyle}>{title}</div>
      <div className="duel-card-meta">already on your list</div>
    </motion.div>
  );
}
