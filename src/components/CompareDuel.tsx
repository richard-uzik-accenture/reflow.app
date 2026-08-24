import { animate, motion, motionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
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
/** How far the new-task chip travels above/below the card at full drag, in px. */
const CHIP_TRAVEL_PX = 26;

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

  // The new task is the subject of every decision, so it gets its own chip that
  // physically overtakes or falls behind the compared card as you drag: right
  // lifts it above (it outranks this task), left drops it below.
  const chipY = useTransform(x, [-SWIPE_THRESHOLD_PX, 0, SWIPE_THRESHOLD_PX], [CHIP_TRAVEL_PX, 0, -CHIP_TRAVEL_PX], {
    clamp: true,
  });
  const chipAbove = useTransform(x, (latest): number => (latest > 0 ? 1 : 0));
  const chipBelow = useTransform(x, (latest): number => (latest < 0 ? 1 : 0));

  // Only the very first comparison gets a hint — after that the gesture is known.
  // The nudge is a one-shot on mount, not an idle loop (branding.md §6: nothing
  // animates at rest), and is cancelled the moment the user touches the card.
  const [hintActive, setHintActive] = useState(progress.done === 0);
  useEffect(() => {
    if (progress.done > 0) setHintActive(false);
  }, [progress.done]);

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
        <p className="duel-eyebrow">new task</p>
        <h2 className="duel-question" style={headlineStyle}>{newTaskTitle}</h2>
        <p className="duel-caption">swipe to rank it against the task below</p>
      </div>

      <div className="duel-stage">
        <div className="duel-stack">
          {/* The new task, shown above and below the card. Only the side the
              drag is heading toward is visible, so the chip reads as the task
              itself moving into that slot rather than as two static labels. */}
          <NewTaskChip
            title={newTaskTitle}
            side="above"
            y={chipY}
            opacity={chipAbove}
            strength={dragProgress}
          />

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
            hintActive={hintActive && !reducedMotion}
            onHintDismissed={() => setHintActive(false)}
          />

          <NewTaskChip
            title={newTaskTitle}
            side="below"
            y={chipY}
            opacity={chipBelow}
            strength={dragProgress}
          />
        </div>
      </div>

      <div className="duel-actions">
        <button className="duel-action ranks-lower" onClick={() => commitRef.current?.(-1)}>← do it later</button>
        <button className="duel-action ranks-higher" onClick={() => commitRef.current?.(1)}>do it first →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </motion.div>
  );
}

interface NewTaskChipProps {
  title: string;
  side: 'above' | 'below';
  y: MotionValue<number>;
  /** 1 while the drag heads toward this side, 0 otherwise. */
  opacity: MotionValue<number>;
  /** 0→1 drag progress, used to fade the chip in as the threshold approaches. */
  strength: MotionValue<number>;
}

function NewTaskChip({ title, side, y, opacity, strength }: NewTaskChipProps) {
  // Visible only when heading this way AND far enough along to mean it.
  const fade = useTransform([opacity, strength] as const, ([side_, s]: number[]) => side_ * (0.25 + 0.75 * s));

  return (
    <motion.div className={`duel-chip ${side}`} style={{ y, opacity: fade }} aria-hidden>
      <span className="duel-chip-arrow">{side === 'above' ? '↑' : '↓'}</span>
      <span className="duel-chip-title">{title}</span>
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
  hintActive: boolean;
  onHintDismissed: () => void;
}

function DuelCard({ title, reducedMotion, commitRef, onResolved, x, y, hintActive, onHintDismissed }: DuelCardProps) {
  const committed = useRef(false);
  const titleStyle = scaleTitleStyle(title, CARD_TITLE_SCALE_RANGES);

  const rotate = useTransform(x, [-300, 0, 300], reducedMotion ? [0, 0, 0] : [-16, 0, 16], { clamp: true });

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
      // Right = the new task outranks this card's task (it goes higher); left =
      // the new task ranks below it. See compare.ts for newTaskWon semantics.
      onComplete: () => onResolved(plan.direction === 1),
    });
  }

  useLayoutEffect(() => {
    commitRef.current = commit;
  });

  // One-shot "this is draggable" nudge on the first comparison. Runs after a
  // beat so it reads as a hint rather than as part of the mount animation.
  useEffect(() => {
    if (!hintActive) return;
    const timer = window.setTimeout(() => {
      if (committed.current) return;
      animate(x, [0, 14, -14, 0], { duration: 1.1, ease: 'easeInOut', times: [0, 0.32, 0.72, 1] });
    }, 520);
    return () => window.clearTimeout(timer);
  }, [hintActive, x]);

  function stopHint() {
    if (!hintActive) return;
    x.stop();
    x.set(0);
    onHintDismissed();
  }

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
      onPointerDown={stopHint}
      onDragStart={stopHint}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
      whileDrag={{ scale: 1.03 }}
    >
      <div className="duel-card-label">on your list</div>
      <div className="duel-card-title" style={titleStyle}>{title}</div>
    </motion.div>
  );
}
