import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  ScreenCanvasRenderer,
  createBrushedMetalRoughnessMap,
  createLogicBoardTexture,
} from './proceduralMaps';
import {
  createDualDisplayHoloMaterial,
  createIntelligenceHaloMaterial,
  createM4CircuitShaderMaterial,
} from '../shaders/anodizedMaterials';

function createMock2DContext() {
  const gradientStub = {
    addColorStop: vi.fn(),
  };

  return {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    font: '12px sans-serif',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    shadowColor: 'transparent',
    shadowBlur: 0,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => gradientStub),
    createRadialGradient: vi.fn(() => gradientStub),
    createImageData: vi.fn((w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    })),
    putImageData: vi.fn(),
  };
}

describe('proceduralMaps and custom GLSL shaders', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds brushed roughness and logic board CanvasTextures cleanly even in headless jsdom', () => {
    const rough = createBrushedMetalRoughnessMap(64);
    const board = createLogicBoardTexture();

    expect(rough).toBeInstanceOf(THREE.CanvasTexture);
    expect(rough.wrapS).toBe(THREE.RepeatWrapping);
    expect(rough.wrapT).toBe(THREE.RepeatWrapping);
    expect(rough.colorSpace).toBe(THREE.NoColorSpace);
    expect((rough.image as HTMLCanvasElement).width).toBe(64);
    expect((rough.image as HTMLCanvasElement).height).toBe(64);

    expect(board).toBeInstanceOf(THREE.CanvasTexture);
    expect(board.colorSpace).toBe(THREE.SRGBColorSpace);
    expect((board.image as HTMLCanvasElement).width).toBe(1024);
    expect((board.image as HTMLCanvasElement).height).toBe(1024);

    rough.dispose();
    board.dispose();
  });

  it('renders deterministic brushed grain and Apple M4 lithography when 2D context is available', () => {
    const ctx = createMock2DContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ctx as unknown as CanvasRenderingContext2D,
    );

    const roughA = createBrushedMetalRoughnessMap(64);
    const firstPut = ctx.putImageData.mock.calls[0]?.[0] as ImageData;
    const roughB = createBrushedMetalRoughnessMap(64);
    const secondPut = ctx.putImageData.mock.calls[1]?.[0] as ImageData;

    expect(firstPut.data.slice(0, 64)).toEqual(secondPut.data.slice(0, 64));

    const board = createLogicBoardTexture();
    const drawnTexts = ctx.fillText.mock.calls.map((call) => String(call[0]));
    expect(drawnTexts.some((text) => text.includes('M4'))).toBe(true);

    roughA.dispose();
    roughB.dispose();
    board.dispose();
  });

  it('initializes ScreenCanvasRenderer and updates across all screen modes without throwing', () => {
    const renderer = new ScreenCanvasRenderer();
    expect(renderer.texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(renderer.texture.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(renderer.texture.minFilter).toBe(THREE.LinearFilter);
    expect(renderer.texture.magFilter).toBe(THREE.LinearFilter);
    expect((renderer.texture.image as HTMLCanvasElement).width).toBe(1024);
    expect((renderer.texture.image as HTMLCanvasElement).height).toBe(665);

    renderer.update(0.5, 'sequoia', '#A3C1DA');
    renderer.update(1.2, 'intelligence', '#A3C1DA');
    renderer.update(2.0, 'raytrace', '#1E2532');
    renderer.update(2.8, 'dual6k', '#DDD5C7');
    renderer.dispose();
    // Subsequent updates after dispose should remain safe no-ops
    renderer.update(3.2, 'sequoia', '#D7DBE0');
  });

  it('redraws ScreenCanvasRenderer immediately on mode or finishTint change and throttles sub-frame ticks', () => {
    const ctx = createMock2DContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ctx as unknown as CanvasRenderingContext2D,
    );

    const renderer = new ScreenCanvasRenderer();
    ctx.fillRect.mockClear();
    ctx.fillText.mockClear();

    // First explicit update always renders
    renderer.update(1.0, 'sequoia', '#A3C1DA');
    const countAfterFirst = ctx.fillRect.mock.calls.length;
    expect(countAfterFirst).toBeGreaterThan(0);

    // Rapid tick (< 1/30s) with identical mode and finishTint is throttled
    renderer.update(1.01, 'sequoia', '#A3C1DA');
    expect(ctx.fillRect.mock.calls.length).toBe(countAfterFirst);

    // Changing finishTint forces immediate redraw even with identical timestamp
    renderer.update(1.01, 'sequoia', '#1E2532');
    const countAfterTint = ctx.fillRect.mock.calls.length;
    expect(countAfterTint).toBeGreaterThan(countAfterFirst);

    // Changing mode forces immediate redraw even with identical timestamp
    renderer.update(1.01, 'raytrace', '#1E2532');
    const countAfterRaytrace = ctx.fillRect.mock.calls.length;
    expect(countAfterRaytrace).toBeGreaterThan(countAfterTint);
    expect(ctx.fillText.mock.calls.map((c) => String(c[0])).some((t) => t.includes('10-Core GPU'))).toBe(
      true,
    );

    // Dual 6K mode highlights Up to 2x 6K Displays
    renderer.update(1.01, 'dual6k', '#DDD5C7');
    expect(
      ctx.fillText.mock.calls.map((c) => String(c[0])).some((t) => /2×\s*6K|2x\s*6K/i.test(t)),
    ).toBe(true);

    // Intelligence mode renders Apple Intelligence summary card and perimeter glow
    renderer.update(1.02, 'intelligence', '#A3C1DA');
    expect(
      ctx.fillText.mock.calls.map((c) => String(c[0])).some((t) => t.includes('Apple Intelligence')),
    ).toBe(true);

    // Elapsed interval >= 34ms triggers animated redraw even in same mode
    const countBeforeElapsed = ctx.fillRect.mock.calls.length;
    renderer.update(1.06, 'dual6k', '#DDD5C7');
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(countBeforeElapsed);

    renderer.dispose();
  });

  it('handles explicit null 2D contexts gracefully without throwing', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const rough = createBrushedMetalRoughnessMap(32);
    const board = createLogicBoardTexture();
    const renderer = new ScreenCanvasRenderer();
    renderer.update(0.1, 'sequoia', '#A3C1DA');
    renderer.update(0.2, 'intelligence', '#1E2532');
    renderer.update(0.3, 'raytrace', '#DDD5C7');
    renderer.update(0.4, 'dual6k', '#D7DBE0');

    expect(rough).toBeInstanceOf(THREE.CanvasTexture);
    expect(board).toBeInstanceOf(THREE.CanvasTexture);
    expect(renderer.texture).toBeInstanceOf(THREE.CanvasTexture);

    rough.dispose();
    board.dispose();
    renderer.dispose();
  });

  it('constructs M4 circuit, Intelligence halo, and Dual 6K holo ShaderMaterials with required uniforms', () => {
    const m4 = createM4CircuitShaderMaterial();
    const halo = createIntelligenceHaloMaterial();
    const holo = createDualDisplayHoloMaterial();

    expect(m4).toBeInstanceOf(THREE.ShaderMaterial);
    expect(halo).toBeInstanceOf(THREE.ShaderMaterial);
    expect(holo).toBeInstanceOf(THREE.ShaderMaterial);

    expect(m4.uniforms.uTime.value).toBe(0);
    expect(m4.uniforms.uPulseIntensity.value).toBeTypeOf('number');
    expect(m4.uniforms.uAccentColor.value).toBeInstanceOf(THREE.Color);
    expect(m4.transparent).toBe(true);
    expect(m4.depthWrite).toBe(false);

    expect(halo.uniforms.uTime.value).toBe(0);
    expect(halo.uniforms.uOpacity.value).toBeTypeOf('number');
    expect(halo.transparent).toBe(true);
    expect(halo.depthWrite).toBe(false);

    expect(holo.uniforms.uTime.value).toBe(0);
    expect(holo.uniforms.uOpacity.value).toBeTypeOf('number');
    expect(holo.uniforms.uAccentColor.value).toBeInstanceOf(THREE.Color);
    expect(holo.transparent).toBe(true);
    expect(holo.depthWrite).toBe(false);

    // Uniform mutations behave cleanly
    m4.uniforms.uTime.value = 1.5;
    m4.uniforms.uPulseIntensity.value = 0.75;
    (m4.uniforms.uAccentColor.value as THREE.Color).set('#A3C1DA');
    halo.uniforms.uTime.value = 2.2;
    halo.uniforms.uOpacity.value = 0.9;
    holo.uniforms.uTime.value = 3.1;
    holo.uniforms.uOpacity.value = 0.65;
    (holo.uniforms.uAccentColor.value as THREE.Color).set('#4A6B9C');

    expect(m4.uniforms.uTime.value).toBe(1.5);
    expect(halo.uniforms.uOpacity.value).toBe(0.9);
    expect((holo.uniforms.uAccentColor.value as THREE.Color).getHexString()).toBe('4a6b9c');

    // Verify GLSL smoothstep(edge0, edge1, x) calls obey edge0 < edge1 across WebGL GPUs
    for (const mat of [m4, halo, holo]) {
      const matches = mat.fragmentShader.matchAll(/smoothstep\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,/g);
      for (const match of matches) {
        expect(Number(match[1])).toBeLessThan(Number(match[2]));
      }
    }

    m4.dispose();
    halo.dispose();
    holo.dispose();
  });
});
