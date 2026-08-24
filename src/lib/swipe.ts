const SWIPE_VELOCITY_PX_S = 500;
const DISTANCE_MARGIN_PX = 240;
const MIN_FLING_DURATION_S = 0.16;
const MAX_FLING_DURATION_S = 0.3;
const FLING_DURATION_BASE_S = 0.32;
const REDUCED_MOTION_DURATION_S = 0.1;
const DURATION_VELOCITY_DIVISOR = 6000;

export interface DuelPlan {
  direction: 1 | -1;
  /** Fling animation duration in seconds, scaled by release velocity. */
  duration: number;
  /** How far the card travels off-screen, in px. */
  distance: number;
  /** Whether a haptic pulse should fire on commit (branding.md §6: light haptic). */
  haptic: boolean;
}

/**
 * Decide which way a drag release commits, or null if it's under threshold and
 * should snap back instead. In the duel, +1 (right) means the new task outranks
 * the compared one; -1 (left) means it ranks below.
 */
export function decideSwipeDirection(offsetX: number, velocityX: number, thresholdPx: number): 1 | -1 | null {
  if (offsetX > thresholdPx || (velocityX > SWIPE_VELOCITY_PX_S && offsetX > 0)) return 1;
  if (offsetX < -thresholdPx || (velocityX < -SWIPE_VELOCITY_PX_S && offsetX < 0)) return -1;
  return null;
}

/**
 * Plan the commit fling for a given direction: distance, velocity-scaled duration,
 * and whether to fire a haptic. Used for both drag-release commits and button-press
 * commits (which have no drag offset/velocity).
 */
export function planDuelFling(direction: 1 | -1, velocityX: number, viewportWidth: number, reducedMotion: boolean): DuelPlan {
  const distance = viewportWidth + DISTANCE_MARGIN_PX;
  // Fling duration tracks how hard it was thrown, so a flick leaves fast and a
  // slow push-past-threshold still reads as deliberate.
  const speed = Math.abs(velocityX);
  const duration = reducedMotion
    ? REDUCED_MOTION_DURATION_S
    : Math.min(MAX_FLING_DURATION_S, Math.max(MIN_FLING_DURATION_S, FLING_DURATION_BASE_S - speed / DURATION_VELOCITY_DIVISOR));

  return { direction, duration, distance, haptic: true };
}
