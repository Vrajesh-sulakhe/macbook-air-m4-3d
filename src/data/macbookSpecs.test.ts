import { describe, expect, it } from 'vitest';
import {
  CAMERA_PRESETS,
  DEFAULT_CONFIG,
  FINISH_PALETTES,
  SCREEN_MODES,
  SIZE_SPECS,
  calculateConfigPrice,
  formatConfigSummary,
  getGpuOptionAvailability,
  normalizeConfigSelection,
} from './macbookSpecs';

describe('macbookSpecs pricing and constraints', () => {
  it('computes base 13-inch M4 configuration at $999', () => {
    const price = calculateConfigPrice(DEFAULT_CONFIG);
    expect(price.basePrice).toBe(999);
    expect(price.gpuDelta).toBe(0);
    expect(price.memoryDelta).toBe(0);
    expect(price.storageDelta).toBe(0);
    expect(price.total).toBe(999);
  });

  it('adds $100 for 10-core GPU on 13-inch 256GB, then waives GPU surcharge when upgraded to 512GB', () => {
    const withGpu = normalizeConfigSelection(DEFAULT_CONFIG, { gpu: '10-core' });
    expect(calculateConfigPrice(withGpu).gpuDelta).toBe(100);
    expect(calculateConfigPrice(withGpu).total).toBe(1099);

    const upgraded512 = normalizeConfigSelection(withGpu, { storage: 512 });
    expect(upgraded512.gpu).toBe('10-core');
    expect(calculateConfigPrice(upgraded512).gpuDelta).toBe(0);
    expect(calculateConfigPrice(upgraded512).total).toBe(1199);
  });

  it('auto-upgrades 13-inch base to 10-core GPU on 512GB+, enforces 10-core on 15-inch, and cleanly unlocks 8-core GPU when returning to 13-inch 256GB', () => {
    const step1 = normalizeConfigSelection(DEFAULT_CONFIG, { storage: 512 });
    expect(step1.gpu).toBe('10-core');
    expect(getGpuOptionAvailability('13', 512)['8-core'].disabled).toBe(true);
    expect(getGpuOptionAvailability('13', 512)['8-core'].reason).toMatch(/512GB\+/i);

    const step2 = normalizeConfigSelection(step1, { size: '15' });
    expect(step2.gpu).toBe('10-core');
    expect(calculateConfigPrice(step2).total).toBe(1399);
    expect(getGpuOptionAvailability('15', 256)['8-core'].disabled).toBe(true);
    expect(getGpuOptionAvailability('15', 256)['8-core'].reason).toMatch(/15-inch/i);

    const step3 = normalizeConfigSelection(step2, { size: '13', storage: 256 });
    expect(getGpuOptionAvailability('13', 256)['8-core'].disabled).toBe(false);

    const step4 = normalizeConfigSelection(step3, { gpu: '8-core' });
    expect(calculateConfigPrice(step4).total).toBe(999);
  });

  it('computes max spec 15-inch (32GB, 2TB) cleanly and formats human-readable summary', () => {
    const maxed = normalizeConfigSelection(DEFAULT_CONFIG, {
      size: '15',
      finish: 'midnight',
      memory: 32,
      storage: 2048,
    });
    expect(calculateConfigPrice(maxed).total).toBe(1199 + 400 + 800);
    const summary = formatConfigSummary(maxed);
    expect(summary).toContain('15-inch MacBook Air (M4)');
    expect(summary).toContain('Midnight');
    expect(summary).toContain('$2,399');
  });

  it('prevents forcing 8-core GPU when constrained by 15-inch or 1TB/2TB SSD on 13-inch', () => {
    const forced15 = normalizeConfigSelection(DEFAULT_CONFIG, { size: '15', gpu: '8-core' });
    expect(forced15.gpu).toBe('10-core');

    const forced1TB = normalizeConfigSelection(DEFAULT_CONFIG, { storage: 1024, gpu: '8-core' });
    expect(forced1TB.gpu).toBe('10-core');
    expect(calculateConfigPrice(forced1TB).gpuDelta).toBe(0);
    expect(calculateConfigPrice(forced1TB).total).toBe(999 + 400);

    const forced2TB = normalizeConfigSelection(DEFAULT_CONFIG, { storage: 2048, gpu: '8-core' });
    expect(forced2TB.gpu).toBe('10-core');
    expect(calculateConfigPrice(forced2TB).total).toBe(999 + 800);
  });

  it('exposes complete Apple specs, finishes, camera presets, and screen modes', () => {
    expect(SIZE_SPECS['13'].widthCm).toBe(30.41);
    expect(SIZE_SPECS['15'].depthCm).toBe(23.76);
    expect(SIZE_SPECS['13'].widthRatio).toBe(1);
    expect(SIZE_SPECS['15'].widthRatio).toBeCloseTo(34.04 / 30.41, 4);

    expect(Object.keys(FINISH_PALETTES)).toEqual(['sky-blue', 'midnight', 'starlight', 'silver']);
    expect(FINISH_PALETTES['sky-blue'].hex).toBe('#A3C1DA');
    expect(FINISH_PALETTES['midnight'].rimTint).toBe('#4A6B9C');
    expect(FINISH_PALETTES['silver'].metalness).toBe(0.9);

    expect(Object.keys(CAMERA_PRESETS)).toEqual(['hero', 'profile', 'ports', 'keyboard', 'xray']);
    expect(Object.keys(SCREEN_MODES)).toEqual(['sequoia', 'intelligence', 'raytrace', 'dual6k']);
  });
});
