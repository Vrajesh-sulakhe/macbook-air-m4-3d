/**
 * Pure product specification catalog, PBR finish palettes, camera presets,
 * screen modes, deterministic pricing, and GPU/SSD coupling state machine
 * for the MacBook Air (M4) lineup.
 */

export type SizeId = '13' | '15';
export type FinishId = 'sky-blue' | 'midnight' | 'starlight' | 'silver';
export type GpuTierId = '8-core' | '10-core';
export type MemoryTierId = 16 | 24 | 32;
export type StorageTierId = 256 | 512 | 1024 | 2048;
export type CameraPresetId = 'hero' | 'profile' | 'ports' | 'keyboard' | 'xray';
export type ScreenModeId = 'sequoia' | 'intelligence' | 'raytrace' | 'dual6k';

export interface MacBookConfigState {
  size: SizeId;
  finish: FinishId;
  gpu: GpuTierId;
  memory: MemoryTierId;
  storage: StorageTierId;
}

export interface PriceBreakdown {
  basePrice: number;
  gpuDelta: number;
  memoryDelta: number;
  storageDelta: number;
  total: number;
}

export interface OptionAvailability {
  disabled: boolean;
  reason?: string;
  surcharge: number;
}

export interface SizeSpec {
  id: SizeId;
  label: string;
  displayInches: string;
  resolution: string;
  ppi: number;
  nits: number;
  thicknessIn: string;
  thicknessCm: string;
  weightLb: string;
  weightKg: string;
  basePrice: number;
  widthCm: number;
  depthCm: number;
  /** Width scale relative to the 13-inch base chassis (1.0). */
  widthRatio: number;
  /** Depth scale relative to the 13-inch base chassis (1.0). */
  depthRatio: number;
}

export interface FinishPalette {
  id: FinishId;
  name: string;
  hex: string;
  rimTint: string;
  roughness: number;
  metalness: number;
  swatchGradient: string;
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface ScreenMode {
  id: ScreenModeId;
  label: string;
  description: string;
}

export const SIZE_SPECS: Record<SizeId, SizeSpec> = {
  '13': {
    id: '13',
    label: '13-inch',
    displayInches: '13.6-inch',
    resolution: '2560 × 1664',
    ppi: 224,
    nits: 500,
    thicknessIn: '0.44 in',
    thicknessCm: '1.13 cm',
    weightLb: '2.7 lb',
    weightKg: '1.24 kg',
    basePrice: 999,
    widthCm: 30.41,
    depthCm: 21.5,
    widthRatio: 1,
    depthRatio: 1,
  },
  '15': {
    id: '15',
    label: '15-inch',
    displayInches: '15.3-inch',
    resolution: '2880 × 1864',
    ppi: 224,
    nits: 500,
    thicknessIn: '0.45 in',
    thicknessCm: '1.15 cm',
    weightLb: '3.3 lb',
    weightKg: '1.51 kg',
    basePrice: 1199,
    widthCm: 34.04,
    depthCm: 23.76,
    widthRatio: 34.04 / 30.41,
    depthRatio: 23.76 / 21.5,
  },
};

export const FINISH_PALETTES: Record<FinishId, FinishPalette> = {
  'sky-blue': {
    id: 'sky-blue',
    name: 'Sky Blue',
    hex: '#A3C1DA',
    rimTint: '#7BB3E0',
    roughness: 0.28,
    metalness: 0.86,
    swatchGradient: 'linear-gradient(135deg, #C7DFEE 0%, #A3C1DA 52%, #7AA2C4 100%)',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    hex: '#1E2532',
    rimTint: '#4A6B9C',
    roughness: 0.3,
    metalness: 0.88,
    swatchGradient: 'linear-gradient(135deg, #323E52 0%, #1E2532 55%, #121720 100%)',
  },
  starlight: {
    id: 'starlight',
    name: 'Starlight',
    hex: '#DDD5C7',
    rimTint: '#E8DFCE',
    roughness: 0.28,
    metalness: 0.86,
    swatchGradient: 'linear-gradient(135deg, #EFE9DE 0%, #DDD5C7 55%, #C1B7A6 100%)',
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    hex: '#D7DBE0',
    rimTint: '#DCE3EC',
    roughness: 0.26,
    metalness: 0.9,
    swatchGradient: 'linear-gradient(135deg, #ECEFF2 0%, #D7DBE0 55%, #B6BCC4 100%)',
  },
};

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  hero: {
    id: 'hero',
    label: 'Hero',
    description: 'Signature 3/4 keynote silhouette',
    position: [3.25, 2.02, 5.85],
    target: [0.05, 0.54, -0.05],
  },
  profile: {
    id: 'profile',
    label: 'Profile',
    description: 'Razor-thin 1.13 cm side profile',
    position: [4.55, 0.48, 0.3],
    target: [0, 0.25, 0],
  },
  ports: {
    id: 'ports',
    label: 'Ports',
    description: 'MagSafe 3 & Dual Thunderbolt 4',
    position: [-3.45, 0.62, 1.55],
    target: [-1.15, 0.08, -0.35],
  },
  keyboard: {
    id: 'keyboard',
    label: 'Keyboard',
    description: 'Backlit Magic Keyboard & Force Touch trackpad',
    position: [0, 3.25, 2.1],
    target: [0, 0.08, 0.18],
  },
  xray: {
    id: 'xray',
    label: 'M4 X-Ray',
    description: 'Fanless thermal spreader & M4 silicon die',
    position: [1.45, 2.95, 2.75],
    target: [0, 0.12, -0.18],
  },
};

export const SCREEN_MODES: Record<ScreenModeId, ScreenMode> = {
  sequoia: {
    id: 'sequoia',
    label: 'Sequoia Mist',
    description: 'P3 Wide Color Liquid Retina artwork',
  },
  intelligence: {
    id: 'intelligence',
    label: 'Apple Intelligence',
    description: '16-core Neural Engine edge halo',
  },
  raytrace: {
    id: 'raytrace',
    label: 'Ray Trace',
    description: 'Hardware-accelerated M4 GPU shading',
  },
  dual6k: {
    id: 'dual6k',
    label: 'Dual 6K',
    description: 'Up to two 6K displays with lid open',
  },
};

export const MEMORY_PRICE_DELTAS: Record<MemoryTierId, number> = {
  16: 0,
  24: 200,
  32: 400,
};

export const STORAGE_PRICE_DELTAS: Record<StorageTierId, number> = {
  256: 0,
  512: 200,
  1024: 400,
  2048: 800,
};

export const DEFAULT_CONFIG: MacBookConfigState = {
  size: '13',
  finish: 'sky-blue',
  gpu: '8-core',
  memory: 16,
  storage: 256,
};

/**
 * Returns deterministic GPU option availability and surcharge for a given size and SSD tier.
 */
export function getGpuOptionAvailability(
  size: SizeId,
  storage: StorageTierId,
): Record<GpuTierId, OptionAvailability> {
  if (size === '15') {
    return {
      '8-core': { disabled: true, reason: 'Standard on 15-inch', surcharge: 0 },
      '10-core': { disabled: false, surcharge: 0 },
    };
  }

  if (storage >= 512) {
    return {
      '8-core': { disabled: true, reason: 'Included with 512GB+ SSD', surcharge: 0 },
      '10-core': { disabled: false, surcharge: 0 },
    };
  }

  return {
    '8-core': { disabled: false, surcharge: 0 },
    '10-core': { disabled: false, surcharge: 100 },
  };
}

/**
 * Applies a partial configuration update and enforces M4 GPU/SSD/size coupling invariants.
 */
export function normalizeConfigSelection(
  prev: MacBookConfigState,
  patch: Partial<MacBookConfigState>,
): MacBookConfigState {
  const next: MacBookConfigState = { ...prev, ...patch };
  const gpuAvailability = getGpuOptionAvailability(next.size, next.storage);

  if (gpuAvailability[next.gpu].disabled) {
    next.gpu = '10-core';
  }

  return next;
}

/**
 * Computes itemized USD pricing breakdown for a MacBook Air (M4) configuration.
 */
export function calculateConfigPrice(config: MacBookConfigState): PriceBreakdown {
  const normalized = normalizeConfigSelection(config, {});
  const basePrice = SIZE_SPECS[normalized.size].basePrice;
  const gpuDelta = getGpuOptionAvailability(normalized.size, normalized.storage)[normalized.gpu].surcharge;
  const memoryDelta = MEMORY_PRICE_DELTAS[normalized.memory];
  const storageDelta = STORAGE_PRICE_DELTAS[normalized.storage];

  return {
    basePrice,
    gpuDelta,
    memoryDelta,
    storageDelta,
    total: basePrice + gpuDelta + memoryDelta + storageDelta,
  };
}

function formatStorageCapacity(storage: StorageTierId): string {
  return storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`;
}

/**
 * Formats a concise human-readable configuration summary including formatted MSRP total.
 */
export function formatConfigSummary(config: MacBookConfigState): string {
  const normalized = normalizeConfigSelection(config, {});
  const sizeLabel = SIZE_SPECS[normalized.size].label;
  const finishName = FINISH_PALETTES[normalized.finish].name;
  const { total } = calculateConfigPrice(normalized);
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(total);

  return `${sizeLabel} MacBook Air (M4) · ${finishName} · 10-core CPU / ${normalized.gpu} GPU · ${normalized.memory}GB Unified Memory · ${formatStorageCapacity(normalized.storage)} SSD — ${formattedTotal}`;
}
