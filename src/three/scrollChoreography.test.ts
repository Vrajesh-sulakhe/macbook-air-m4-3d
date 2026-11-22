import { describe, expect, it } from 'vitest';
import { createInitialTimelineState, evaluateScrollTimeline } from './scrollChoreography';

describe('evaluateScrollTimeline', () => {
  it('starts closed in Act 1 and smoothly opens the lid monotonically as scroll advances', () => {
    const start = evaluateScrollTimeline(0);
    const heroMid = evaluateScrollTimeline(0.14);

    expect(start.activeActIndex).toBe(0);
    expect(start.lidDeg).toBeLessThan(15);
    expect(start.activeScreenMode).toBe('sequoia');
    expect(heroMid.activeActIndex).toBe(0);
    expect(heroMid.lidDeg).toBeGreaterThan(80);

    let prevLid = start.lidDeg;
    for (let step = 1; step <= 22; step++) {
      const state = evaluateScrollTimeline(step / 100);
      expect(state.lidDeg).toBeGreaterThanOrEqual(prevLid);
      prevLid = state.lidDeg;
    }
  });

  it('transitions to a low lateral profile camera in Act 2 showcasing thinness', () => {
    const act2 = evaluateScrollTimeline(0.31);
    expect(act2.activeActIndex).toBe(1);
    expect(act2.camPos[0]).toBeGreaterThan(3.0);
    expect(act2.camPos[1]).toBeLessThan(0.75);
    expect(act2.xrayAmount).toBe(0);
    expect(act2.activeScreenMode).toBe('sequoia');
  });

  it('activates M4 Silicon X-Ray peak in Act 3 and Dual 6K displays in Act 4', () => {
    const act3 = evaluateScrollTimeline(0.48);
    const act4 = evaluateScrollTimeline(0.68);

    expect(act3.activeActIndex).toBe(2);
    expect(act3.xrayAmount).toBeGreaterThan(0.7);
    expect(act3.activeScreenMode).toBe('raytrace');

    expect(act4.activeActIndex).toBe(3);
    expect(act4.dualDisplayProgress).toBeGreaterThan(0.7);
    expect(act4.xrayAmount).toBeLessThan(0.2);
    expect(['intelligence', 'dual6k']).toContain(act4.activeScreenMode);
  });

  it('animates MagSafe 3 plug snap in Act 5 and handles out-of-range clamped inputs safely', () => {
    const act5 = evaluateScrollTimeline(0.88);
    expect(act5.activeActIndex).toBe(4);
    expect(act5.camPos[0]).toBeLessThan(0);
    expect(act5.magsafeSnap).toBeGreaterThan(0.7);
    expect(act5.dualDisplayProgress).toBeLessThan(0.05);

    const clampedLow = evaluateScrollTimeline(-0.5, createInitialTimelineState());
    const clampedHigh = evaluateScrollTimeline(1.5, createInitialTimelineState());
    const clampedNaN = evaluateScrollTimeline(Number.NaN, createInitialTimelineState());
    expect(clampedLow.scrollProgress).toBe(0);
    expect(clampedHigh.scrollProgress).toBe(1);
    expect(clampedNaN.scrollProgress).toBe(0);
  });

  it('mutates the provided out TimelineState and tuple references in-place without allocating', () => {
    const out = createInitialTimelineState();
    const camPosRef = out.camPos;
    const camTargetRef = out.camTarget;
    const modelRotRef = out.modelRot;

    const returned = evaluateScrollTimeline(0.48, out);
    expect(returned).toBe(out);
    expect(returned.camPos).toBe(camPosRef);
    expect(returned.camTarget).toBe(camTargetRef);
    expect(returned.modelRot).toBe(modelRotRef);
    expect(returned.xrayAmount).toBeGreaterThan(0.7);

    evaluateScrollTimeline(0.88, out);
    expect(out.camPos).toBe(camPosRef);
    expect(out.magsafeSnap).toBeGreaterThan(0.7);
  });

  it('produces zero NaN or out-of-bounds values across the full 0..1 timeline', () => {
    const initial = createInitialTimelineState();
    expect(initial).toEqual(evaluateScrollTimeline(0));

    const scratch = createInitialTimelineState();
    for (let i = 0; i <= 100; i++) {
      const state = evaluateScrollTimeline(i / 100, scratch);
      expect(Number.isFinite(state.scrollProgress)).toBe(true);
      expect(state.lidDeg).toBeGreaterThanOrEqual(0);
      expect(state.lidDeg).toBeLessThanOrEqual(130);
      expect(state.xrayAmount).toBeGreaterThanOrEqual(0);
      expect(state.xrayAmount).toBeLessThanOrEqual(1);
      expect(state.dualDisplayProgress).toBeGreaterThanOrEqual(0);
      expect(state.dualDisplayProgress).toBeLessThanOrEqual(1);
      expect(state.magsafeSnap).toBeGreaterThanOrEqual(0);
      expect(state.magsafeSnap).toBeLessThanOrEqual(1);
      expect(state.backlight).toBeGreaterThanOrEqual(0);
      expect(state.backlight).toBeLessThanOrEqual(1);
      expect(state.activeActIndex).toBeGreaterThanOrEqual(0);
      expect(state.activeActIndex).toBeLessThanOrEqual(4);

      for (const component of [...state.camPos, ...state.camTarget, ...state.modelRot]) {
        expect(Number.isFinite(component)).toBe(true);
      }
    }
  });
});
