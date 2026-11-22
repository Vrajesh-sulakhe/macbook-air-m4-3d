import type { ScreenModeId } from '../data/macbookSpecs';
import type { TimelineState } from './types';

export type { TimelineState } from './types';

interface ChoreographyKeyframe {
  progress: number;
  lidDeg: number;
  xrayAmount: number;
  dualDisplayProgress: number;
  magsafeSnap: number;
  backlight: number;
  camPos: readonly [number, number, number];
  camTarget: readonly [number, number, number];
  modelRot: readonly [number, number, number];
}

const CHOREOGRAPHY_KEYFRAMES: readonly ChoreographyKeyframe[] = [
  // Act 1 (0.00..0.22): Hero Reveal — starts sleek slightly ajar, smoothly opens lid & wakes display
  {
    progress: 0.0,
    lidDeg: 14,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.25,
    camPos: [2.55, 1.55, 4.15],
    camTarget: [-0.28, 0.25, -0.05],
    modelRot: [0.08, -0.38, 0],
  },
  {
    progress: 0.06,
    lidDeg: 34,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.45,
    camPos: [2.48, 1.5, 4.08],
    camTarget: [0, 0.34, -0.12],
    modelRot: [0.03, -0.26, 0],
  },
  {
    progress: 0.14,
    lidDeg: 98,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.85,
    camPos: [2.25, 1.46, 3.72],
    camTarget: [0, 0.44, -0.12],
    modelRot: [0.01, -0.18, 0],
  },
  // Act 2 (0.22..0.40): Anodized Unibody & Sky Blue Craft — low sweeping 1.13 cm profile
  {
    progress: 0.22,
    lidDeg: 108,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.78,
    camPos: [3.25, 0.92, 2.35],
    camTarget: [0, 0.34, -0.12],
    modelRot: [0, -0.06, 0],
  },
  {
    progress: 0.31,
    lidDeg: 105,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.62,
    camPos: [4.15, 0.34, 0.22],
    camTarget: [0, 0.22, -0.12],
    modelRot: [0, 0.14, 0],
  },
  // Act 3 (0.40..0.58): M4 Silicon X-Ray Cutaway — elevated top-down 3/4 view
  {
    progress: 0.4,
    lidDeg: 108,
    xrayAmount: 0.12,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.7,
    camPos: [2.65, 1.72, 1.95],
    camTarget: [0, 0.14, -0.2],
    modelRot: [0, 0.1, 0],
  },
  {
    progress: 0.48,
    lidDeg: 114,
    xrayAmount: 0.98,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.92,
    camPos: [1.38, 2.86, 2.28],
    camTarget: [0, 0.08, -0.26],
    modelRot: [0, 0.02, 0],
  },
  {
    progress: 0.54,
    lidDeg: 114,
    xrayAmount: 0.85,
    dualDisplayProgress: 0,
    magsafeSnap: 0,
    backlight: 0.88,
    camPos: [0.95, 2.58, 2.95],
    camTarget: [0, 0.22, -0.28],
    modelRot: [0, 0, 0],
  },
  // Act 4 (0.58..0.78): Liquid Retina, 12MP & Dual 6K Displays
  {
    progress: 0.58,
    lidDeg: 110,
    xrayAmount: 0.14,
    dualDisplayProgress: 0.14,
    magsafeSnap: 0,
    backlight: 0.82,
    camPos: [0.35, 1.82, 4.65],
    camTarget: [0, 0.58, -0.45],
    modelRot: [0, 0, 0],
  },
  {
    progress: 0.62,
    lidDeg: 107,
    xrayAmount: 0,
    dualDisplayProgress: 0.72,
    magsafeSnap: 0,
    backlight: 0.84,
    camPos: [0.08, 1.46, 6.1],
    camTarget: [0, 0.78, -0.5],
    modelRot: [0, 0, 0],
  },
  {
    progress: 0.68,
    lidDeg: 106,
    xrayAmount: 0,
    dualDisplayProgress: 0.98,
    magsafeSnap: 0,
    backlight: 0.85,
    camPos: [0, 1.36, 6.65],
    camTarget: [0, 0.86, -0.52],
    modelRot: [0, 0, 0],
  },
  {
    progress: 0.74,
    lidDeg: 106,
    xrayAmount: 0,
    dualDisplayProgress: 0.85,
    magsafeSnap: 0,
    backlight: 0.82,
    camPos: [-0.65, 1.24, 5.95],
    camTarget: [-0.25, 0.76, -0.46],
    modelRot: [0, 0.05, 0],
  },
  // Act 5 (0.78..1.00): MagSafe 3 Snap, Thunderbolt 4 & 18-Hour Endurance
  {
    progress: 0.78,
    lidDeg: 105,
    xrayAmount: 0,
    dualDisplayProgress: 0.16,
    magsafeSnap: 0.08,
    backlight: 0.78,
    camPos: [-2.15, 0.88, 3.25],
    camTarget: [-0.88, 0.3, -0.35],
    modelRot: [0, 0.14, 0],
  },
  {
    progress: 0.81,
    lidDeg: 104,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0.35,
    backlight: 0.76,
    camPos: [-2.75, 0.64, 2.05],
    camTarget: [-1.14, 0.16, -0.36],
    modelRot: [0, 0.17, 0],
  },
  {
    progress: 0.88,
    lidDeg: 104,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 0.94,
    backlight: 0.74,
    camPos: [-3.12, 0.48, 1.18],
    camTarget: [-1.28, 0.08, -0.36],
    modelRot: [0, 0.18, 0],
  },
  {
    progress: 1.0,
    lidDeg: 104,
    xrayAmount: 0,
    dualDisplayProgress: 0,
    magsafeSnap: 1.0,
    backlight: 0.72,
    camPos: [-2.95, 0.56, 1.48],
    camTarget: [-1.18, 0.12, -0.32],
    modelRot: [0, 0.12, 0],
  },
];

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

function smoothstep01(t: number): number {
  const clamped = clamp01(t);
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpTuple3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
  out: [number, number, number],
): void {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
}

function resolveActIndex(progress: number): number {
  if (progress < 0.22) {
    return 0;
  }
  if (progress < 0.4) {
    return 1;
  }
  if (progress < 0.58) {
    return 2;
  }
  if (progress < 0.78) {
    return 3;
  }
  return 4;
}

function resolveScreenMode(progress: number): ScreenModeId {
  if (progress < 0.4) {
    return 'sequoia';
  }
  if (progress < 0.58) {
    return 'raytrace';
  }
  if (progress < 0.63) {
    return 'intelligence';
  }
  if (progress < 0.78) {
    return 'dual6k';
  }
  return 'sequoia';
}

/**
 * Creates a fresh initial TimelineState anchored at scrollProgress = 0 (Act 1 closed hero).
 */
export function createInitialTimelineState(): TimelineState {
  const first = CHOREOGRAPHY_KEYFRAMES[0];
  return {
    scrollProgress: 0,
    lidDeg: first.lidDeg,
    xrayAmount: first.xrayAmount,
    dualDisplayProgress: first.dualDisplayProgress,
    magsafeSnap: first.magsafeSnap,
    backlight: first.backlight,
    camPos: [first.camPos[0], first.camPos[1], first.camPos[2]],
    camTarget: [first.camTarget[0], first.camTarget[1], first.camTarget[2]],
    modelRot: [first.modelRot[0], first.modelRot[1], first.modelRot[2]],
    activeScreenMode: 'sequoia',
    activeActIndex: 0,
  };
}

/**
 * Evaluates the 5-act scroll choreography at normalized progress ∈ [0, 1].
 * Mutates `out` and its tuple buffers in-place for zero per-frame allocations inside R3F `useFrame`.
 */
export function evaluateScrollTimeline(progress: number, out?: TimelineState): TimelineState {
  const target = out ?? createInitialTimelineState();
  const p = clamp01(progress);

  let kfA = CHOREOGRAPHY_KEYFRAMES[0];
  let kfB = CHOREOGRAPHY_KEYFRAMES[CHOREOGRAPHY_KEYFRAMES.length - 1];

  for (let i = 0; i < CHOREOGRAPHY_KEYFRAMES.length - 1; i++) {
    const current = CHOREOGRAPHY_KEYFRAMES[i];
    const next = CHOREOGRAPHY_KEYFRAMES[i + 1];
    if (p >= current.progress && p <= next.progress) {
      kfA = current;
      kfB = next;
      break;
    }
  }

  const span = kfB.progress - kfA.progress;
  const easedT = span > 1e-6 ? smoothstep01((p - kfA.progress) / span) : 0;

  target.scrollProgress = p;
  target.lidDeg = lerp(kfA.lidDeg, kfB.lidDeg, easedT);
  target.xrayAmount = lerp(kfA.xrayAmount, kfB.xrayAmount, easedT);
  target.dualDisplayProgress = lerp(kfA.dualDisplayProgress, kfB.dualDisplayProgress, easedT);
  target.magsafeSnap = lerp(kfA.magsafeSnap, kfB.magsafeSnap, easedT);
  target.backlight = lerp(kfA.backlight, kfB.backlight, easedT);

  lerpTuple3(kfA.camPos, kfB.camPos, easedT, target.camPos);
  lerpTuple3(kfA.camTarget, kfB.camTarget, easedT, target.camTarget);
  lerpTuple3(kfA.modelRot, kfB.modelRot, easedT, target.modelRot);

  target.activeActIndex = resolveActIndex(p);
  target.activeScreenMode = resolveScreenMode(p);

  return target;
}
