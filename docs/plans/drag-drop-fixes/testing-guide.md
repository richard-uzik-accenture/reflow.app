# Drag & Drop Fix — Testing Guide

Changes landed in commit `57403c5` on `dev`. Test in morning flow merge step.

## Setup

```bash
npm run dev
```

Use a real touch device **or** browser DevTools with touch emulation (F12 → device toolbar, pick a phone preset).

---

## Test Cases

### 1. Text selection during drag
**How:** Long-press a task and slowly drag it downward.  
**Expect:** No text highlights anywhere on screen during the press or drag.  
**Was:** Text would get selected while dragging down.

---

### 2. Shadow clears on drop
**How:** Long-press until the task lifts (scale up + shadow visible), then release.  
**Expect:** Shadow and scale snap away cleanly within ~150ms of releasing. Row looks flat immediately.  
**Was:** Elevated/shadowed state persisted after the finger lifted.

---

### 3. No focus ring after drag
**How:** On touch — long-press, drag, release. Don't tap anything else afterward.  
**Expect:** No blue/violet outline ring on any row after the drop.  
**Was:** The dragged row retained browser focus and showed an outline ring.

---

### 4. No duplicate entries after drop
**How:** Drag a task to a new position and drop it. Watch the list for ~1 second after dropping.  
**Expect:** List settles into the new order and stays stable. No row appears twice, no flicker of a row jumping back and re-inserting.  
**Was:** Occasionally a row would duplicate or snap back briefly after drop.

---

### 5. Mouse drag — desktop regression check
**How:** On desktop, click and drag a task with the mouse.  
**Expect:** Drag starts immediately (no 350ms delay), shadow appears, drop works, shadow clears on release.

---

### 6. Long-press cancel
**How:** Touch and hold a task, then move your finger more than ~10px before the 350ms timer fires.  
**Expect:** Drag is cancelled, nothing happens, the row returns to its normal (un-squished) state.

---

### 7. Reduced motion
**How:** Enable "Reduce motion" in OS/device accessibility settings, then test drag.  
**Expect:** Drag works normally; the error-shake animation on failed saves is suppressed (sanity check only).

---

## Automated

```bash
npm run test
```

All existing lib tests should pass — no logic in `ranking.ts`, `compare.ts`, or `realtimeMerge.ts` was changed.
