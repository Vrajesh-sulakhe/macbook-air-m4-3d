import type { ScreenModeId } from '../data/macbookSpecs';

/**
 * Continuous scroll choreography and hardware state snapshot mutated in-place
 * per frame by the scroll solver and consumed by the 3D scene and assembly.
 */
export interface TimelineState {
  scrollProgress: number;
  lidDeg: number;
  xrayAmount: number;
  dualDisplayProgress: number;
  magsafeSnap: number;
  backlight: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  modelRot: [number, number, number];
  activeScreenMode: ScreenModeId;
  activeActIndex: number;
}
