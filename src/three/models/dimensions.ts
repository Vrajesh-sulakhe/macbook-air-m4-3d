import * as THREE from 'three';
import { SIZE_SPECS, type SizeId } from '../../data/macbookSpecs';

export interface ChassisMetrics {
  width: number;
  depth: number;
  baseThickness: number;
  lidThickness: number;
  cornerRadius: number;
  scaleFactor: [number, number, number];
}

export interface KeycapTransform {
  id: string;
  row: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  isSpacebar?: boolean;
  isTouchId?: boolean;
  isHalfHeight?: boolean;
}

const REFERENCE_TOTAL_THICKNESS = 0.113;
const FIFTEEN_TOTAL_THICKNESS = 0.115;

/**
 * Shared 13-inch reference well and trackpad bounds used by KeyboardDeck and MacBookAirAssembly.
 */
export const KEYBOARD_WELL_METRICS = {
  width: 2.764,
  depth: 1.076,
  centerZ: -0.3345,
  cornerRadius: 0.032,
} as const;

export const TRACKPAD_METRICS = {
  width: 1.28,
  depth: 0.78,
  centerZ: 0.615,
  cornerRadius: 0.04,
} as const;

/**
 * Computes proportional 3D chassis metrics (1 unit = 10 cm) and scale relative to the 13-inch reference chassis.
 */
export function getChassisMetrics(size: SizeId): ChassisMetrics {
  const spec = SIZE_SPECS[size];
  const width = spec.widthCm / 10;
  const depth = spec.depthCm / 10;

  if (size === '15') {
    const baseThickness = 0.076;
    const lidThickness = 0.039;
    return {
      width,
      depth,
      baseThickness,
      lidThickness,
      cornerRadius: 0.12,
      scaleFactor: [
        spec.widthRatio,
        FIFTEEN_TOTAL_THICKNESS / REFERENCE_TOTAL_THICKNESS,
        spec.depthRatio,
      ],
    };
  }

  return {
    width,
    depth,
    baseThickness: 0.075,
    lidThickness: 0.038,
    cornerRadius: 0.11,
    scaleFactor: [1, 1, 1],
  };
}

interface RowKeyDef {
  id: string;
  units: number;
  isSpacebar?: boolean;
  isTouchId?: boolean;
}

const KEY_UNIT = 0.188;
const KEY_GAP = 0.015;
const ROW_PITCH = 0.175;
const ROW_0_Z = -0.772;
const KEY_HEIGHT = 0.0045;
const TOTAL_UNITS = 14.5;

function uniformKeys(prefix: string, count: number): RowKeyDef[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `${prefix}-${idx}`,
    units: 1,
  }));
}

/**
 * Generates an accurate 78-key 6-row US-ANSI MacBook Air Magic Keyboard layout in 13-inch chassis coordinates.
 */
export function generateKeycapLayout(): KeycapTransform[] {
  const keys: KeycapTransform[] = [];
  const rowWidth = TOTAL_UNITS * KEY_UNIT;
  const startX = -rowWidth * 0.5;
  const fullDepth = ROW_PITCH - KEY_GAP;

  const standardRows: RowKeyDef[][] = [
    // Row 0: Esc + F1..F12 + Touch ID (14 keys = 14.5u)
    [
      { id: 'esc', units: 1.5 },
      ...uniformKeys('fn', 12),
      { id: 'touch-id', units: 1, isTouchId: true },
    ],
    // Row 1: Number row + Delete (14 keys = 14.5u)
    [...uniformKeys('num', 13), { id: 'delete', units: 1.5 }],
    // Row 2: Tab + QWERTY + Backslash (14 keys = 14.5u)
    [{ id: 'tab', units: 1.5 }, ...uniformKeys('qwerty', 13)],
    // Row 3: Caps Lock + Home row + Return (13 keys = 14.5u)
    [
      { id: 'caps', units: 1.75 },
      ...uniformKeys('home', 11),
      { id: 'return', units: 1.75 },
    ],
    // Row 4: Left Shift + Bottom alpha + Right Shift (12 keys = 14.5u)
    [
      { id: 'lshift', units: 2.25 },
      ...uniformKeys('bottom', 10),
      { id: 'rshift', units: 2.25 },
    ],
    // Row 5 (main left/space section = 11.5u; inverted-T arrows fill remaining 3.0u)
    [
      { id: 'globe', units: 1 },
      { id: 'lctrl', units: 1 },
      { id: 'lopt', units: 1 },
      { id: 'lcmd', units: 1.25 },
      { id: 'space', units: 5, isSpacebar: true },
      { id: 'rcmd', units: 1.25 },
      { id: 'ropt', units: 1 },
    ],
  ];

  standardRows.forEach((rowDefs, rowIdx) => {
    const rowZ = ROW_0_Z + rowIdx * ROW_PITCH;
    let cursorX = startX;

    for (const def of rowDefs) {
      const span = def.units * KEY_UNIT;
      keys.push({
        id: def.id,
        row: rowIdx,
        x: cursorX + span * 0.5,
        z: rowZ,
        width: span - KEY_GAP,
        depth: fullDepth,
        height: KEY_HEIGHT,
        isSpacebar: def.isSpacebar,
        isTouchId: def.isTouchId,
      });
      cursorX += span;
    }
  });

  // Inverted-T half-height arrow cluster (remaining 3.0u on Row 5)
  const row5Z = ROW_0_Z + 5 * ROW_PITCH;
  const arrowBaseX = startX + 11.5 * KEY_UNIT;
  const arrowGap = 0.011;
  const halfDepth = (fullDepth - arrowGap) * 0.5;
  const halfOffsetZ = (halfDepth + arrowGap) * 0.5;
  const arrowWidth = KEY_UNIT - KEY_GAP;

  const arrowKeys: Array<{ id: string; col: number; zOffset: number }> = [
    { id: 'arrow-left', col: 0, zOffset: halfOffsetZ },
    { id: 'arrow-up', col: 1, zOffset: -halfOffsetZ },
    { id: 'arrow-down', col: 1, zOffset: halfOffsetZ },
    { id: 'arrow-right', col: 2, zOffset: halfOffsetZ },
  ];

  for (const arrow of arrowKeys) {
    keys.push({
      id: arrow.id,
      row: 5,
      x: arrowBaseX + (arrow.col + 0.5) * KEY_UNIT,
      z: row5Z + arrow.zOffset,
      width: arrowWidth,
      depth: halfDepth,
      height: KEY_HEIGHT,
      isHalfHeight: true,
    });
  }

  return keys;
}

/**
 * Creates a centered 2D rounded rectangle THREE.Shape in the XY plane.
 */
export function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const r = Math.max(0.001, Math.min(radius, halfW * 0.95, halfH * 0.95));

  const shape = new THREE.Shape();
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
  return shape;
}

/**
 * Builds a horizontal CNC-beveled rounded-rectangle plate resting flush on Y = 0 up to Y = thickness.
 */
export function createBeveledPlateGeometry(
  width: number,
  depth: number,
  thickness: number,
  cornerRadius: number,
  bevel = 0.008,
): THREE.ExtrudeGeometry {
  const safeBevel = Math.min(bevel, thickness * 0.35, width * 0.1, depth * 0.1);
  const innerW = Math.max(0.01, width - safeBevel * 2);
  const innerD = Math.max(0.01, depth - safeBevel * 2);
  const innerR = Math.max(0.002, cornerRadius - safeBevel);
  const extrudeDepth = Math.max(0.002, thickness - safeBevel * 2);

  const shape = createRoundedRectShape(innerW, innerD, innerR);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: safeBevel,
    bevelSize: safeBevel,
    bevelSegments: 4,
    curveSegments: 16,
  });

  geo.rotateX(-Math.PI / 2);
  geo.translate(0, safeBevel, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Computes the hinge pivot X-rotation (radians) for a closed-flat lid extending along +Z
 * with its inner display normal pointing -Y when closed:
 * - 0° -> 0 rad (lid rests flush along +Z over base)
 * - 130° -> -degToRad(130) (swings +Z upward into +Y and aims inner display normal toward +Z)
 */
export function computeHingeRotationX(lidDeg: number): number {
  const clamped = THREE.MathUtils.clamp(lidDeg, 0, 130);
  return -THREE.MathUtils.degToRad(clamped);
}

/**
 * Computes the left-flank X coordinate of the MagSafe 3 plug as snap progresses 0 -> 1,
 * sliding inward from detached (-width/2 - 0.55) to magnetically seated (-width/2 - 0.04).
 */
export function computeMagSafePlugOffsetX(chassisWidth: number, magsafeSnap: number): number {
  const clamped = THREE.MathUtils.clamp(magsafeSnap, 0, 1);
  const eased = THREE.MathUtils.smoothstep(clamped, 0, 1);
  const leftFlankX = -chassisWidth * 0.5;
  return THREE.MathUtils.lerp(leftFlankX - 0.55, leftFlankX - 0.04, eased);
}

/**
 * Computes amber -> emerald LED charge transition factor (0 while approaching, 1 when snapped).
 */
export function computeMagSafeChargeBlend(magsafeSnap: number): number {
  const clamped = THREE.MathUtils.clamp(magsafeSnap, 0, 1);
  return THREE.MathUtils.smoothstep(clamped, 0.82, 0.96);
}
