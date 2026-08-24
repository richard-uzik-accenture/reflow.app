import { describe, expect, it } from 'vitest';
import { decideSwipeDirection, planDuelFling } from './swipe';

describe('decideSwipeDirection', () => {
  it('returns null when under threshold and velocity', () => {
    expect(decideSwipeDirection(30, 100, 80)).toBeNull();
  });

  it('returns 1 when offset clears the positive threshold', () => {
    expect(decideSwipeDirection(90, 0, 80)).toBe(1);
  });

  it('returns -1 when offset clears the negative threshold', () => {
    expect(decideSwipeDirection(-90, 0, 80)).toBe(-1);
  });

  it('returns 1 on a fast rightward flick even under the offset threshold', () => {
    expect(decideSwipeDirection(20, 600, 80)).toBe(1);
  });

  it('returns -1 on a fast leftward flick even under the offset threshold', () => {
    expect(decideSwipeDirection(-20, -600, 80)).toBe(-1);
  });

  it('ignores a fast flick in the opposite direction of a small offset', () => {
    expect(decideSwipeDirection(-5, 600, 80)).toBeNull();
  });

  it('is exclusive at exactly the threshold', () => {
    expect(decideSwipeDirection(80, 0, 80)).toBeNull();
  });
});

describe('planDuelFling', () => {
  it('always fires a haptic', () => {
    expect(planDuelFling(1, 0, 1000, false).haptic).toBe(true);
  });

  it('carries the requested direction through', () => {
    expect(planDuelFling(1, 0, 1000, false).direction).toBe(1);
    expect(planDuelFling(-1, 0, 1000, false).direction).toBe(-1);
  });

  it('adds a fixed margin to viewport width for travel distance', () => {
    expect(planDuelFling(1, 0, 1000, false).distance).toBe(1240);
  });

  it('uses a fixed short duration under reduced motion regardless of velocity', () => {
    expect(planDuelFling(1, 800, 1000, true).duration).toBe(0.1);
  });

  it('uses the max duration for a slow release', () => {
    expect(planDuelFling(1, 0, 1000, false).duration).toBe(0.3);
  });

  it('scales duration down as release velocity increases', () => {
    const slow = planDuelFling(1, 200, 1000, false).duration;
    const fast = planDuelFling(1, 1200, 1000, false).duration;
    expect(fast).toBeLessThan(slow);
  });

  it('clamps duration at the minimum for very high velocity', () => {
    expect(planDuelFling(1, 5000, 1000, false).duration).toBe(0.16);
  });
});
