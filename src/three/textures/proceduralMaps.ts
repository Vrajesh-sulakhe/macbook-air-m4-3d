import * as THREE from 'three';
import type { ScreenModeId } from '../../data/macbookSpecs';

const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 665;
const LOGIC_BOARD_SIZE = 1024;
const REDRAW_INTERVAL_SEC = 1 / 30;

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function createCanvasElement(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('Canvas creation requires a DOM environment');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getSafe2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHexColor(hex: string, fallback: RgbColor = { r: 163, g: 193, b: 218 }): RgbColor {
  const trimmed = hex.trim();
  const sixMatch = /^#?([0-9a-f]{6})$/i.exec(trimmed);
  if (sixMatch) {
    const value = Number.parseInt(sixMatch[1], 16);
    return {
      r: (value >> 16) & 0xff,
      g: (value >> 8) & 0xff,
      b: value & 0xff,
    };
  }

  const threeMatch = /^#?([0-9a-f]{3})$/i.exec(trimmed);
  if (threeMatch) {
    const [r, g, b] = threeMatch[1].split('').map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }

  return fallback;
}

function rgba(color: RgbColor, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function mixRgb(a: RgbColor, b: RgbColor, t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamped),
    g: Math.round(a.g + (b.g - a.g) * clamped),
    b: Math.round(a.b + (b.b - a.b) * clamped),
  };
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  traceRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  traceRoundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

/**
 * Generates a deterministic horizontal anisotropic brushed-aluminum roughness texture.
 */
export function createBrushedMetalRoughnessMap(size = 256): THREE.CanvasTexture {
  const safeSize = Math.max(1, Math.min(2048, Math.floor(size)));
  const canvas = createCanvasElement(safeSize, safeSize);
  const ctx = getSafe2DContext(canvas);

  if (ctx) {
    const rand = createMulberry32(0x4d344169);
    const imageData = ctx.createImageData(safeSize, safeSize);
    const data = imageData.data;

    for (let y = 0; y < safeSize; y++) {
      const rowBase = 170 + (rand() - 0.5) * 28;
      const harmonicPhaseA = rand() * Math.PI * 2;
      const harmonicPhaseB = rand() * Math.PI * 2;
      const freqA = 1 + Math.floor(rand() * 3);
      const freqB = 3 + Math.floor(rand() * 5);

      for (let x = 0; x < safeSize; x++) {
        const u = (x / safeSize) * Math.PI * 2;
        const anisotropicStreak =
          Math.sin(u * freqA + harmonicPhaseA) * 11 +
          Math.cos(u * freqB + harmonicPhaseB) * 6;
        const beadGrain = (rand() - 0.5) * 14;
        const value = Math.max(96, Math.min(242, Math.round(rowBase + anisotropicStreak + beadGrain)));

        const offset = (y * safeSize + x) * 4;
        data[offset] = value;
        data[offset + 1] = value;
        data[offset + 2] = value;
        data[offset + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawBatteryBays(ctx: CanvasRenderingContext2D): void {
  const batteryBays = [
    { x: 96, y: 635, w: 392, h: 300, label: 'CELL A · 26.9Wh' },
    { x: 536, y: 635, w: 392, h: 300, label: 'CELL B · 26.9Wh' },
  ];

  for (const bay of batteryBays) {
    const cellGrad = ctx.createLinearGradient(bay.x, bay.y, bay.x, bay.y + bay.h);
    cellGrad.addColorStop(0, '#161B25');
    cellGrad.addColorStop(1, '#0F131B');
    ctx.fillStyle = cellGrad;
    fillRoundedRect(ctx, bay.x, bay.y, bay.w, bay.h, 20);
    ctx.strokeStyle = 'rgba(165, 185, 215, 0.16)';
    ctx.lineWidth = 2;
    strokeRoundedRect(ctx, bay.x, bay.y, bay.w, bay.h, 20);

    ctx.fillStyle = 'rgba(195, 210, 230, 0.22)';
    ctx.font = '600 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bay.label, bay.x + bay.w * 0.5, bay.y + bay.h * 0.54);
  }
}

function drawSpreaderAndTraces(ctx: CanvasRenderingContext2D): void {
  const shieldGrad = ctx.createLinearGradient(110, 120, 914, 570);
  shieldGrad.addColorStop(0, '#1A202B');
  shieldGrad.addColorStop(0.5, '#252E3D');
  shieldGrad.addColorStop(1, '#171C26');
  ctx.fillStyle = shieldGrad;
  fillRoundedRect(ctx, 110, 118, 804, 444, 24);
  ctx.strokeStyle = 'rgba(208, 138, 86, 0.55)';
  ctx.lineWidth = 2.5;
  strokeRoundedRect(ctx, 110, 118, 804, 444, 24);

  ctx.strokeStyle = 'rgba(198, 126, 74, 0.42)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(156, 340);
  ctx.lineTo(868, 340);
  ctx.stroke();

  const centerX = 512;
  const centerY = 340;
  const traceDirections: Array<[number, number]> = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dx, dy] of traceDirections) {
    for (let lane = -3; lane <= 3; lane++) {
      const offset = lane * 11;
      const startX = centerX + dx * 96 + (dx === 0 ? offset : 0);
      const startY = centerY + dy * 96 + (dy === 0 ? offset : 0);
      const midX = centerX + dx * 185 + offset * 0.6;
      const midY = centerY + dy * 145 + offset * 0.6;
      const endX = startX + dx * 195;
      const endY = startY + dy * 145;

      ctx.strokeStyle =
        Math.abs(lane) % 2 === 0 ? 'rgba(215, 166, 98, 0.48)' : 'rgba(123, 179, 224, 0.28)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(232, 192, 124, 0.72)';
      ctx.beginPath();
      ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCapacitorsAndHeaders(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const capacitorBanks = [
    { startX: 175, startY: 168, cols: 8, rows: 3 },
    { startX: 705, startY: 168, cols: 8, rows: 3 },
    { startX: 175, startY: 468, cols: 8, rows: 3 },
    { startX: 705, startY: 468, cols: 8, rows: 3 },
  ];

  for (const bank of capacitorBanks) {
    for (let r = 0; r < bank.rows; r++) {
      for (let c = 0; c < bank.cols; c++) {
        const cx = bank.startX + c * 18;
        const cy = bank.startY + r * 14;
        ctx.fillStyle = '#C9D0DC';
        ctx.fillRect(cx, cy, 12, 7);
        ctx.fillStyle = rand() > 0.35 ? '#B88D56' : '#3C4659';
        ctx.fillRect(cx + 3, cy, 6, 7);
      }
    }
  }

  const headers = [
    { x: 130, y: 270, w: 22, h: 140, pins: 14, vertical: true },
    { x: 872, y: 270, w: 22, h: 140, pins: 14, vertical: true },
    { x: 432, y: 536, w: 160, h: 20, pins: 16, vertical: false },
  ];

  for (const header of headers) {
    ctx.fillStyle = '#141922';
    fillRoundedRect(ctx, header.x, header.y, header.w, header.h, 4);
    ctx.fillStyle = '#E0B86A';
    for (let p = 0; p < header.pins; p++) {
      if (header.vertical) {
        ctx.fillRect(header.x + 4, header.y + 8 + p * 9, header.w - 8, 4);
      } else {
        ctx.fillRect(header.x + 8 + p * 9, header.y + 4, 4, header.h - 8);
      }
    }
  }
}

function drawM4DieLithography(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#132024';
  fillRoundedRect(ctx, 412, 240, 200, 200, 14);
  ctx.strokeStyle = 'rgba(220, 185, 118, 0.8)';
  ctx.lineWidth = 2;
  strokeRoundedRect(ctx, 412, 240, 200, 200, 14);

  // Unified memory dies flanking the M4 silicon core
  ctx.fillStyle = '#181E29';
  fillRoundedRect(ctx, 428, 256, 48, 72, 5);
  fillRoundedRect(ctx, 428, 352, 48, 72, 5);

  const dieGrad = ctx.createLinearGradient(492, 266, 594, 414);
  dieGrad.addColorStop(0, '#3D4859');
  dieGrad.addColorStop(0.45, '#5D6B82');
  dieGrad.addColorStop(1, '#2B3342');
  ctx.fillStyle = dieGrad;
  fillRoundedRect(ctx, 492, 266, 102, 148, 8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  strokeRoundedRect(ctx, 492, 266, 102, 148, 8);

  ctx.fillStyle = '#F3F6FA';
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('APPLE', 543, 322);
  ctx.fillStyle = '#9EC5E8';
  ctx.font = '800 32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('M4', 543, 356);
  ctx.fillStyle = 'rgba(216, 228, 242, 0.65)';
  ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('3NM SILICON', 543, 386);
}

/**
 * Generates a detailed Apple MacBook Air (M4) fanless logic board & dual-battery PCB texture.
 */
export function createLogicBoardTexture(): THREE.CanvasTexture {
  const size = LOGIC_BOARD_SIZE;
  const canvas = createCanvasElement(size, size);
  const ctx = getSafe2DContext(canvas);

  if (ctx) {
    const rand = createMulberry32(0x4d345043);

    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#090C11');
    bgGrad.addColorStop(0.5, '#111620');
    bgGrad.addColorStop(1, '#080B10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(130, 160, 200, 0.04)';
    ctx.lineWidth = 1;
    for (let pos = 32; pos < size; pos += 32) {
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    drawBatteryBays(ctx);
    drawSpreaderAndTraces(ctx);
    drawCapacitorsAndHeaders(ctx, rand);
    drawM4DieLithography(ctx);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function drawMacOSChrome(ctx: CanvasRenderingContext2D, tint: RgbColor): void {
  // Top translucent menu bar
  ctx.fillStyle = 'rgba(10, 14, 22, 0.56)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, 28);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(0, 27, SCREEN_WIDTH, 1);

  ctx.fillStyle = 'rgba(245, 245, 247, 0.92)';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Finder   File   Edit   View   Go   Window   Help', 46, 14);

  // Minimalist emblem dot at top-left
  ctx.beginPath();
  ctx.arc(24, 14, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.font = '500 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('100%  ·  Thu 9:41 AM', SCREEN_WIDTH - 22, 14);

  // Bottom frosted glass Dock
  const dockWidth = 420;
  const dockHeight = 52;
  const dockX = (SCREEN_WIDTH - dockWidth) * 0.5;
  const dockY = SCREEN_HEIGHT - dockHeight - 16;

  ctx.fillStyle = 'rgba(22, 28, 40, 0.64)';
  fillRoundedRect(ctx, dockX, dockY, dockWidth, dockHeight, 18);
  ctx.strokeStyle = rgba(tint, 0.38);
  ctx.lineWidth = 1.2;
  strokeRoundedRect(ctx, dockX, dockY, dockWidth, dockHeight, 18);

  const iconPalette = ['#38BDF8', '#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F472B6', '#94A3B8'];
  for (let i = 0; i < iconPalette.length; i++) {
    const ix = dockX + 24 + i * 54;
    const iy = dockY + 9;
    ctx.fillStyle = iconPalette[i];
    fillRoundedRect(ctx, ix, iy, 34, 34, 9);
  }
}

function drawSequoiaMode(ctx: CanvasRenderingContext2D, time: number, tint: RgbColor): void {
  const skyDeep = mixRgb({ r: 10, g: 20, b: 36 }, tint, 0.28);
  const skyMid = mixRgb({ r: 22, g: 52, b: 86 }, tint, 0.45);
  const bg = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  bg.addColorStop(0, rgba(skyDeep, 1));
  bg.addColorStop(0.55, rgba(skyMid, 1));
  bg.addColorStop(1, '#08101C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Fluid animated Sequoia mist ribbons
  const ribbonColors = [
    rgba(mixRgb(tint, { r: 140, g: 215, b: 255 }, 0.5), 0.38),
    rgba(mixRgb(tint, { r: 165, g: 145, b: 255 }, 0.45), 0.28),
    rgba(mixRgb(tint, { r: 85, g: 195, b: 225 }, 0.55), 0.34),
  ];

  ribbonColors.forEach((fillColor, idx) => {
    const phase = time * (0.55 + idx * 0.18) + idx * 1.4;
    const baseY = 210 + idx * 110;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(0, SCREEN_HEIGHT);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= SCREEN_WIDTH; x += 64) {
      const waveY = baseY + Math.sin(x * 0.0055 + phase) * 52 + Math.cos(x * 0.003 - phase) * 26;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.closePath();
    ctx.fill();
  });

  // Floating translucent glass window cards
  const cards = [
    { x: 98, y: 126, w: 420, h: 320, title: 'Liquid Retina · P3 Wide Color', metric: '500 nits' },
    { x: 548, y: 186, w: 376, h: 278, title: 'MacBook Air · M4', metric: '18-Hr Battery' },
  ];
  for (const card of cards) {
    ctx.fillStyle = 'rgba(14, 20, 32, 0.58)';
    fillRoundedRect(ctx, card.x, card.y, card.w, card.h, 18);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = 1.5;
    strokeRoundedRect(ctx, card.x, card.y, card.w, card.h, 18);

    // Window traffic-light dots
    const lights = ['#FF5F57', '#FEBC2E', '#28C840'];
    lights.forEach((dotColor, i) => {
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(card.x + 22 + i * 16, card.y + 22, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(245, 245, 247, 0.9)';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.title, card.x + 24, card.y + 68);

    ctx.fillStyle = rgba(tint, 0.95);
    ctx.font = '700 34px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(card.metric, card.x + 24, card.y + 124);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    fillRoundedRect(ctx, card.x + 24, card.y + 162, card.w - 48, 14, 7);
    ctx.fillStyle = rgba(tint, 0.8);
    fillRoundedRect(ctx, card.x + 24, card.y + 162, (card.w - 48) * 0.72, 14, 7);
  }

  drawMacOSChrome(ctx, tint);
}

function drawIntelligenceMode(ctx: CanvasRenderingContext2D, time: number, tint: RgbColor): void {
  ctx.fillStyle = '#060711';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Flowing neural aura wave across backdrop
  const waveGrad = ctx.createLinearGradient(0, 140, SCREEN_WIDTH, 520);
  waveGrad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
  waveGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.42)');
  waveGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.38)');
  waveGrad.addColorStop(1, 'rgba(251, 146, 60, 0.32)');

  for (let band = 0; band < 3; band++) {
    const phase = time * (1.1 + band * 0.25) + band * 0.9;
    ctx.strokeStyle = waveGrad;
    ctx.lineWidth = 42 - band * 10;
    ctx.beginPath();
    for (let x = 0; x <= SCREEN_WIDTH; x += 32) {
      const y = 330 + Math.sin(x * 0.008 + phase) * (64 + band * 16);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // Animated neural aura wave & glowing Apple Intelligence perimeter
  drawMacOSChrome(ctx, tint);

  const glowGrad = ctx.createLinearGradient(
    Math.cos(time * 0.9) * 320 + 512,
    0,
    Math.sin(time * 0.9) * 320 + 512,
    SCREEN_HEIGHT,
  );
  glowGrad.addColorStop(0, '#38BDF8');
  glowGrad.addColorStop(0.35, '#A855F7');
  glowGrad.addColorStop(0.68, '#EC4899');
  glowGrad.addColorStop(1, '#FB923C');

  ctx.strokeStyle = glowGrad;
  ctx.lineWidth = 12;
  strokeRoundedRect(ctx, 8, 8, SCREEN_WIDTH - 16, SCREEN_HEIGHT - 16, 18);
  ctx.lineWidth = 3.5;
  strokeRoundedRect(ctx, 20, 20, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 40, 12);

  // Floating smart summary glass card
  const cardX = 212;
  const cardY = 148;
  const cardW = 600;
  const cardH = 328;
  ctx.fillStyle = 'rgba(13, 15, 28, 0.82)';
  fillRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.strokeStyle = glowGrad;
  ctx.lineWidth = 2.2;
  strokeRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);

  // Iridescent neural orb icon
  const orbGrad = ctx.createRadialGradient(cardX + 56, cardY + 60, 4, cardX + 56, cardY + 60, 26);
  orbGrad.addColorStop(0, '#FFFFFF');
  orbGrad.addColorStop(0.45, '#A855F7');
  orbGrad.addColorStop(1, '#38BDF8');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cardX + 56, cardY + 60, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F5F5F7';
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Apple Intelligence', cardX + 94, cardY + 54);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
  ctx.font = '500 14px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('16-Core Neural Engine · Smart Summary', cardX + 94, cardY + 80);

  // Animated prompt/summary shimmer bars
  const lineWidths = [490, 440, 360];
  lineWidths.forEach((lw, idx) => {
    const pulse = 0.78 + 0.22 * Math.sin(time * 2.4 + idx * 0.8);
    ctx.fillStyle = `rgba(241, 245, 249, ${(0.22 * pulse).toFixed(2)})`;
    fillRoundedRect(ctx, cardX + 46, cardY + 136 + idx * 36, lw, 16, 8);
  });

  ctx.fillStyle = 'rgba(168, 85, 247, 0.24)';
  fillRoundedRect(ctx, cardX + 46, cardY + 258, 220, 34, 17);
  ctx.fillStyle = '#E9D5FF';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Rewrite · Proofread · Summarize', cardX + 64, cardY + 276);
}

function drawRaytraceMode(ctx: CanvasRenderingContext2D, time: number, tint: RgbColor): void {
  ctx.fillStyle = '#07090F';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Perspective floor grid
  ctx.strokeStyle = 'rgba(123, 179, 224, 0.14)';
  ctx.lineWidth = 1;
  const horizonY = 390;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(SCREEN_WIDTH * 0.5 + i * 28, horizonY);
    ctx.lineTo(SCREEN_WIDTH * 0.5 + i * 115, SCREEN_HEIGHT);
    ctx.stroke();
  }
  for (let row = 0; row < 7; row++) {
    const y = horizonY + row * row * 8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_WIDTH, y);
    ctx.stroke();
  }

  // Studio specular reflection light bars
  const barOffset = Math.sin(time * 0.85) * 44;
  ctx.save();
  ctx.translate(SCREEN_WIDTH * 0.5 + barOffset, 180);
  ctx.rotate(-0.18);
  const barGrad = ctx.createLinearGradient(-220, 0, 220, 0);
  barGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  barGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.85)');
  barGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = barGrad;
  fillRoundedRect(ctx, -230, -14, 460, 28, 14);
  ctx.restore();

  // Floor caustic reflection
  const causticGrad = ctx.createRadialGradient(
    SCREEN_WIDTH * 0.5,
    470,
    12,
    SCREEN_WIDTH * 0.5,
    470,
    190,
  );
  causticGrad.addColorStop(0, rgba(tint, 0.55));
  causticGrad.addColorStop(1, 'rgba(7, 9, 15, 0)');
  ctx.fillStyle = causticGrad;
  ctx.beginPath();
  ctx.ellipse(SCREEN_WIDTH * 0.5, 470, 190, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glossy ray-traced refracting orb
  const orbX = SCREEN_WIDTH * 0.5;
  const orbY = 304 + Math.sin(time * 1.4) * 8;
  const orbR = 124;

  const orbGrad = ctx.createRadialGradient(orbX - 42, orbY - 46, 10, orbX, orbY, orbR);
  orbGrad.addColorStop(0, '#FFFFFF');
  orbGrad.addColorStop(0.22, rgba(mixRgb(tint, { r: 125, g: 211, b: 252 }, 0.6), 0.98));
  orbGrad.addColorStop(0.62, '#1E3A5F');
  orbGrad.addColorStop(0.9, '#0F172A');
  orbGrad.addColorStop(1, rgba(tint, 0.85));

  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crisp studio softbox highlight inside orb
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.beginPath();
  ctx.ellipse(orbX - 42, orbY - 46, 22, 12, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Hardware-Accelerated Ray Tracing & 10-Core GPU telemetry badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  fillRoundedRect(ctx, 44, 52, 340, 84, 16);
  ctx.strokeStyle = rgba(tint, 0.45);
  ctx.lineWidth = 1.4;
  strokeRoundedRect(ctx, 44, 52, 340, 84, 16);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('10-Core GPU · Ray Tracing', 66, 84);
  ctx.fillStyle = '#7DD3FC';
  ctx.font = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('Hardware BVH · Dynamic Caching', 66, 112);
}

function drawDual6kMode(ctx: CanvasRenderingContext2D, time: number, tint: RgbColor): void {
  ctx.fillStyle = '#0A0C12';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Header bar highlighting dual 6K display capability
  ctx.fillStyle = 'rgba(20, 26, 38, 0.88)';
  fillRoundedRect(ctx, 36, 38, SCREEN_WIDTH - 72, 64, 16);
  ctx.strokeStyle = rgba(tint, 0.4);
  ctx.lineWidth = 1.2;
  strokeRoundedRect(ctx, 36, 38, SCREEN_WIDTH - 72, 64, 16);

  ctx.fillStyle = '#F5F5F7';
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Up to 2× 6K Displays', 62, 71);
  ctx.fillStyle = 'rgba(186, 200, 220, 0.8)';
  ctx.font = '500 14px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('6016 × 3384 · ProRes 422 Grading', SCREEN_WIDTH - 62, 71);

  // Cinema color-grading viewport + 3 color wheels
  ctx.fillStyle = '#121621';
  fillRoundedRect(ctx, 36, 120, 610, 316, 16);
  const frameGrad = ctx.createLinearGradient(52, 136, 630, 420);
  frameGrad.addColorStop(0, '#102A43');
  frameGrad.addColorStop(0.5, rgba(tint, 0.65));
  frameGrad.addColorStop(1, '#241432');
  ctx.fillStyle = frameGrad;
  fillRoundedRect(ctx, 52, 136, 578, 284, 10);

  // Color wheels panel on right
  ctx.fillStyle = '#121621';
  fillRoundedRect(ctx, 666, 120, 322, 316, 16);
  const wheelLabels = ['LIFT', 'GAMMA', 'GAIN'];
  const wheelColors = ['#38BDF8', '#A855F7', '#F59E0B'];
  wheelLabels.forEach((label, idx) => {
    const wx = 720 + idx * 104;
    const wy = 240;
    ctx.strokeStyle = wheelColors[idx];
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(wx, wy, 36, 0, Math.PI * 2);
    ctx.stroke();

    // Animated color-wheel grading puck
    const puckAngle = time * (0.6 + idx * 0.2) + idx * 1.3;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(wx + Math.cos(puckAngle) * 14, wy + Math.sin(puckAngle) * 14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, wx, 298);
  });

  // Multi-track NLE timeline at bottom
  ctx.fillStyle = '#111520';
  fillRoundedRect(ctx, 36, 454, SCREEN_WIDTH - 72, 168, 16);
  const tracks = [
    { y: 478, color: '#38BDF8', x: 64, w: 320 },
    { y: 478, color: '#818CF8', x: 400, w: 460 },
    { y: 522, color: '#34D399', x: 96, w: 540 },
    { y: 566, color: '#F472B6', x: 140, w: 720 },
  ];
  for (const track of tracks) {
    ctx.fillStyle = track.color;
    fillRoundedRect(ctx, track.x, track.y, track.w, 30, 6);
  }

  // Animated playhead across timeline
  const timelineSpan = SCREEN_WIDTH - 180;
  const playheadOffset = (((time * 120) % timelineSpan) + timelineSpan) % timelineSpan;
  const playheadX = 80 + playheadOffset;
  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(playheadX, 464);
  ctx.lineTo(playheadX, 612);
  ctx.stroke();
}

type ModeDrawFn = (ctx: CanvasRenderingContext2D, time: number, tint: RgbColor) => void;

const MODE_RENDERERS: Record<ScreenModeId, ModeDrawFn> = {
  sequoia: drawSequoiaMode,
  intelligence: drawIntelligenceMode,
  raytrace: drawRaytraceMode,
  dual6k: drawDual6kMode,
};

/**
 * Manages a crisp 1024×665 offscreen 2D canvas texture for the MacBook Air Liquid Retina display.
 */
export class ScreenCanvasRenderer {
  public readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private lastDrawTime: number | null = null;
  private lastMode: ScreenModeId | null = null;
  private lastFinishTint: string | null = null;
  private disposed = false;

  constructor() {
    this.canvas = createCanvasElement(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx = getSafe2DContext(this.canvas);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.drawFrame(0, 'sequoia', '#A3C1DA');
    this.texture.needsUpdate = true;
  }

  private drawFrame(time: number, mode: ScreenModeId, finishTint: string): void {
    if (!this.ctx) {
      return;
    }

    const safeTime = Number.isFinite(time) ? time : 0;
    const tint = parseHexColor(finishTint);
    const drawFn = MODE_RENDERERS[mode];
    this.ctx.save();
    drawFn(this.ctx, safeTime, tint);
    this.ctx.restore();
  }

  /**
   * Redraws immediately on mode or finishTint changes and throttles continuous animation frames.
   */
  public update(time: number, mode: ScreenModeId, finishTint: string): void {
    if (this.disposed) {
      return;
    }

    const safeTime = Number.isFinite(time) ? time : 0;
    const modeOrTintChanged = mode !== this.lastMode || finishTint !== this.lastFinishTint;
    const elapsedEnough =
      this.lastDrawTime === null || Math.abs(safeTime - this.lastDrawTime) >= REDRAW_INTERVAL_SEC;

    if (!modeOrTintChanged && !elapsedEnough) {
      return;
    }

    this.drawFrame(safeTime, mode, finishTint);
    this.lastDrawTime = safeTime;
    this.lastMode = mode;
    this.lastFinishTint = finishTint;
    this.texture.needsUpdate = true;
  }

  /**
   * Disposes the underlying GPU CanvasTexture safely.
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.texture.dispose();
  }
}
