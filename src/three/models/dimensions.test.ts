import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createBeveledPlateGeometry,
  generateKeycapLayout,
  getChassisMetrics,
} from './dimensions';

describe('MacBook Air procedural dimensions and keycap grid', () => {
  it('computes accurate relative proportions between 13-inch and 15-inch models', () => {
    const m13 = getChassisMetrics('13');
    const m15 = getChassisMetrics('15');

    expect(m13.width).toBeCloseTo(3.041, 3);
    expect(m13.depth).toBeCloseTo(2.15, 3);
    expect(m13.baseThickness).toBeLessThan(0.15);
    expect(m13.baseThickness + m13.lidThickness).toBeCloseTo(0.113, 3);
    expect(m13.scaleFactor).toEqual([1, 1, 1]);

    expect(m15.width).toBeGreaterThan(m13.width);
    expect(m15.depth).toBeGreaterThan(m13.depth);
    expect(m15.width).toBeCloseTo(3.404, 3);
    expect(m15.depth).toBeCloseTo(2.376, 3);
    expect(m15.baseThickness + m15.lidThickness).toBeCloseTo(0.115, 3);
    expect(m15.scaleFactor[0]).toBeCloseTo(34.04 / 30.41, 4);
    expect(m15.scaleFactor[2]).toBeCloseTo(23.76 / 21.5, 4);
  });

  it('generates a complete 6-row laptop keyboard keycap instance list (including wide spacebar/modifiers and Touch ID)', () => {
    const keys = generateKeycapLayout();
    expect(keys.length).toBeGreaterThanOrEqual(72);
    expect(keys.length).toBe(78);

    const spacebar = keys.find((k) => k.isSpacebar);
    const touchId = keys.find((k) => k.isTouchId);
    const halfHeightArrows = keys.filter((k) => k.isHalfHeight);

    expect(spacebar).toBeDefined();
    expect(spacebar!.width).toBeGreaterThan(0.25);
    expect(touchId).toBeDefined();
    expect(touchId!.row).toBe(0);
    expect(halfHeightArrows.length).toBe(4);

    // Every keycap must remain within the 13-inch chassis bounds and not overlap neighbors
    const m13 = getChassisMetrics('13');
    for (const key of keys) {
      expect(Math.abs(key.x) + key.width * 0.5).toBeLessThan(m13.width * 0.5);
      expect(Math.abs(key.z) + key.depth * 0.5).toBeLessThan(m13.depth * 0.5);
      expect(key.width).toBeGreaterThan(0);
      expect(key.depth).toBeGreaterThan(0);
      expect(key.height).toBeGreaterThan(0);
    }

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = keys[i];
        const b = keys[j];
        const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) * 0.5;
        const overlapZ = Math.abs(a.z - b.z) < (a.depth + b.depth) * 0.5;
        expect(overlapX && overlapZ).toBe(false);
      }
    }

    // All 6 rows (0..5) must be populated
    const rows = new Set(keys.map((k) => k.row));
    expect(rows.size).toBe(6);
  });

  it('constructs beveled unibody plate geometry with exact outer dimensions resting flush on Y = 0', () => {
    const m13 = getChassisMetrics('13');
    const plate = createBeveledPlateGeometry(
      m13.width,
      m13.depth,
      m13.baseThickness,
      m13.cornerRadius,
      0.0085,
    );
    plate.computeBoundingBox();
    const box = plate.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    expect(box.min.y).toBeCloseTo(0, 3);
    expect(box.max.y).toBeCloseTo(m13.baseThickness, 3);
    expect(size.x).toBeCloseTo(m13.width, 2);
    expect(size.z).toBeCloseTo(m13.depth, 2);

    plate.dispose();
  });
});
