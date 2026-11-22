# MacBook Air M4 — 3D Landing Page & Interactive Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a flagship 3D landing page for the Apple MacBook Air (M4) combining a 5-act keynote scroll showcase with an interactive 360° 3D hardware studio and spec configurator.

**Architecture:** A single continuous React Three Fiber `<Canvas>` pinned behind an alternating dark/light editorial page. Lenis smooth scroll drives a GSAP ScrollTrigger timeline mutating a shared `sceneTimelineRef` (`useFrame` reads refs with zero per-frame React re-renders) across Acts 1–5, then smoothly hands off camera control to an interactive Studio configurator in Act 6 with `<OrbitControls enableZoom={false}>`, procedural anodized PBR materials, custom GLSL shaders, and accessible DOM controls.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Three.js (`0.187.x`), `@react-three/fiber` (`9.x`), `@react-three/drei` (`10.x`), `@react-three/postprocessing` (`3.x`), `gsap`, `lenis`, `lucide-react`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/jetbrains-mono`, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-22-macbook-air-m4-3d-landing-design.md`

---

## Global Constraints

- Grounded real-world specs only: `13-inch` (`$999` base, `0.44 in` / `1.13 cm`, `2.7 lb` / `1.24 kg`, `2560 × 1664`, `224 ppi`, `500 nits`, `10-core CPU / 8-core GPU` base) and `15-inch` (`$1,199` base, `0.45 in` / `1.15 cm`, `3.3 lb` / `1.51 kg`, `2880 × 1864`, `224 ppi`, `500 nits`, `10-core CPU / 10-core GPU` standard).
- Finishes: `Sky Blue` (`#A3C1DA`), `Midnight` (`#1E2532`), `Starlight` (`#DDD5C7`), `Silver` (`#D7DBE0`).
- Deterministic 13-inch GPU/SSD coupling: `10-core GPU` is `+$100` with `256GB` SSD; choosing `512GB`, `1TB`, or `2TB` SSD automatically upgrades to `10-core GPU` at `$0` extra GPU surcharge (`13-inch · 10-core GPU · 16GB · 512GB` = `$1,199`) and disables `8-core GPU` with `"Included with 512GB+ SSD"`; `15-inch` locks `10-core GPU` as `"Standard on 15-inch"`.
- Memory tiers: `16GB` (`+$0`), `24GB` (`+$200`), `32GB` (`+$400`). Storage tiers: `256GB` (`+$0`), `512GB` (`+$200`), `1TB` (`+$400`), `2TB` (`+$800`).
- Zero external `.glb`, HDRI, or font CDN fetches that can 404; all 3D geometry, procedural maps, `<Lightformer>` studio reflections, and `@fontsource-variable` fonts live in the bundle.
- `<OrbitControls enableZoom={false}>` so page wheel scrolling is never trapped; dedicated `+`/`-`/`Reset` buttons adjust camera zoom inside Studio mode.
- DPR capped (`[1, 1.75]` desktop, `[1, 1.25]` compact/mobile); repeated keycaps rendered in a single `THREE.InstancedMesh`; GPU resources disposed on unmount; `prefers-reduced-motion` honored; WebGL ErrorBoundary + DOM fallback keeps the configurator usable without WebGL.
- All interactive controls live in semantic accessible DOM (`button`, `aria-pressed`, `role="radiogroup"`, visible focus rings, `>= 44px` mobile tap targets), never WebGL-only hitboxes.

## Review Focus

1. **13-inch GPU/SSD downgrade after cross-size switches:** Switching `13"` + `512GB` -> `15"` -> `13"` -> `256GB` must unlock `8-core GPU` cleanly and drop price back without stale `+$100` surcharge. *(Pinned in Task 2 tests)*
2. **OrbitControls wheel trap & scroll/studio handoff:** Scrolling over the Studio canvas must continue scrolling the document (`enableZoom={false}`), and clicking `"Studio 3D"` / `"Overview"` must smoothly toggle `isStudioInteractive` without fighting GSAP scroll progress. *(Pinned in Task 6 & Task 9 tests)*
3. **WebGL unavailability or runtime canvas crash:** Missing WebGL context or thrown error inside `<Canvas>` must render the static fallback showcase cleanly with working finish/size/spec configurator controls. *(Pinned in Task 3 & Task 8 tests)*
4. **`prefers-reduced-motion` safety:** When reduced motion is active, ambient breathing oscillation, Lenis inertia, and heavy post-processing remain disabled while discrete preset/finish transitions still complete. *(Pinned in Task 3, Task 6 & Task 9 tests)*
5. **Mobile (`375px`) overflow & Modal keyboard/`Escape` behavior:** Zero horizontal overflow across `375px`, `768px`, and `1440px`; `"Review Configuration"` modal closes via `Escape` or close button and restores focus. *(Pinned in Task 8 & Task 9 tests)*

---

### Task 1: Project Scaffold, Dependencies, Fonts & Test Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`

**Interfaces:**
- Produces: Build (`npm run build`), Typecheck (`npx tsc --noEmit`), and Unit Test (`npx vitest run`) pipelines; Tailwind v4 `@theme` font tokens (`--font-sans: 'Plus Jakarta Sans Variable', system-ui, sans-serif;`, `--font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;`).

- [ ] **Step 1: Initialize git repository and scaffold project files (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`)**

Create `package.json` pinning compatible dependencies (`react@^19.3.1`, `react-dom@^19.3.1`, `three@^0.187.0`, `@react-three/fiber@^9.8.2`, `@react-three/drei@^10.7.9`, `@react-three/postprocessing@^3.2.2`, `postprocessing@^6.36.0`, `gsap@^3.15.1`, `lenis@^1.3.27`, `lucide-react@^1.77.0`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/jetbrains-mono`; devDeps `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/three`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`). Configure `vite.config.ts` with `react()`, `tailwindcss()`, and Vitest `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`.

- [ ] **Step 2: Install dependencies and verify lockfile**

Run: `git init && npm install`
Expected: Exit code 0, `node_modules/` and `package-lock.json` created with zero peer-dependency resolution errors.

- [ ] **Step 3: Create `src/index.css`, `src/test/setup.ts`, minimal `src/main.tsx`, and placeholder `src/App.tsx`**

Import `@fontsource-variable/plus-jakarta-sans` and `@fontsource-variable/jetbrains-mono` in `src/main.tsx`. Define Tailwind v4 `@import "tailwindcss";`, `@theme`, tabular numeral utility `.tabular-nums`, accessible `:focus-visible` outlines, and smooth `prefers-reduced-motion` CSS rules in `src/index.css`. Register `@testing-library/jest-dom/vitest` and a `window.matchMedia` default stub in `src/test/setup.ts`.

- [ ] **Step 4: Write a smoke test in `src/App.test.tsx` and run typecheck, build, and tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App scaffold', () => {
  it('renders the MacBook Air M4 landmark heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /MacBook Air/i })).toBeInTheDocument();
  });
});
```

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: `tsc` exits 0, Vitest passes 1 test, Vite outputs `dist/`.

- [ ] **Step 5: Commit scaffold**

```bash
git add .
git commit -m "chore: scaffold Vite React Three Fiber TypeScript project"
```

---

### Task 2: Product Spec Catalog, Pricing Matrix & Constraint State Machine

**Files:**
- Create: `src/data/macbookSpecs.ts`
- Test: `src/data/macbookSpecs.test.ts`

**Interfaces:**
- Produces:
  - Types: `SizeId = '13' | '15'`, `FinishId = 'sky-blue' | 'midnight' | 'starlight' | 'silver'`, `GpuTierId = '8-core' | '10-core'`, `MemoryTierId = 16 | 24 | 32`, `StorageTierId = 256 | 512 | 1024 | 2048`, `CameraPresetId = 'hero' | 'profile' | 'ports' | 'keyboard' | 'xray'`, `ScreenModeId = 'sequoia' | 'intelligence' | 'raytrace' | 'dual6k'`, `MacBookConfigState`, `PriceBreakdown`, `OptionAvailability`
  - Constants: `SIZE_SPECS`, `FINISH_PALETTES`, `CAMERA_PRESETS`, `SCREEN_MODES`, `DEFAULT_CONFIG`
  - Functions:
    - `normalizeConfigSelection(prev: MacBookConfigState, patch: Partial<MacBookConfigState>): MacBookConfigState`
    - `getGpuOptionAvailability(size: SizeId, storage: StorageTierId): Record<GpuTierId, { disabled: boolean; reason?: string; surcharge: number }>`
    - `calculateConfigPrice(config: MacBookConfigState): PriceBreakdown`
    - `formatConfigSummary(config: MacBookConfigState): string`

- [ ] **Step 1: Write failing tests covering MSRP pricing, GPU/SSD coupling, cross-size downgrades, and spec summary formatting**

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  calculateConfigPrice,
  formatConfigSummary,
  getGpuOptionAvailability,
  normalizeConfigSelection,
} from './macbookSpecs';

describe('macbookSpecs pricing and constraints', () => {
  it('computes base 13-inch M4 configuration at $999', () => {
    const price = calculateConfigPrice(DEFAULT_CONFIG);
    expect(price.total).toBe(999);
    expect(price.gpuDelta).toBe(0);
  });

  it('adds $100 for 10-core GPU on 13-inch 256GB, then waives GPU surcharge when upgraded to 512GB', () => {
    const withGpu = normalizeConfigSelection(DEFAULT_CONFIG, { gpu: '10-core' });
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/macbookSpecs.test.ts`
Expected: FAIL with module not found `./macbookSpecs`.

- [ ] **Step 3: Implement `src/data/macbookSpecs.ts`**

Encode exact Apple specs (`SIZE_SPECS` with `widthRatio`, `depthRatio`, `thicknessCm`, `weightLb`, `displayInches`, `resolution`, `ppi`, `nits`; `FINISH_PALETTES` with aluminum hex, roughness, metalness, rimTint, swatch CSS gradient; `CAMERA_PRESETS` and `SCREEN_MODES`; deterministic `normalizeConfigSelection`, `getGpuOptionAvailability`, `calculateConfigPrice`, `formatConfigSummary`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/macbookSpecs.test.ts`
Expected: PASS (4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/data/macbookSpecs.ts src/data/macbookSpecs.test.ts
git commit -m "feat: add MacBook Air M4 specs catalog and pricing constraint state machine"
```

---

### Task 3: WebGL Support Detection, Reduced Motion, DPR Budget & Fallback Boundary

**Files:**
- Create: `src/utils/webglSupport.ts`, `src/three/WebGLErrorBoundary.tsx`
- Test: `src/three/WebGLErrorBoundary.test.tsx`

**Interfaces:**
- Produces:
  - `detectWebGLSupport(): boolean`
  - `computeAdaptiveDpr(viewportWidth: number, reducedMotion: boolean): [number, number]`
  - `usePrefersReducedMotion(): boolean`
  - `<WebGLErrorBoundary fallback={...} children={...} />`
  - `<StaticMacBookFallback finish={FinishId} size={SizeId} />` (rendered when WebGL is unsupported or throws, showing crisp SVG/CSS anodized hardware preview + spec badge)

- [ ] **Step 1: Write failing tests for WebGL capability detection, DPR capping, reduced-motion hook, and ErrorBoundary fallback**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { computeAdaptiveDpr, detectWebGLSupport } from '../utils/webglSupport';
import { StaticMacBookFallback, WebGLErrorBoundary } from './WebGLErrorBoundary';

function ThrowingCanvas(): never {
  throw new Error('WebGL context lost');
}

describe('WebGL fallback & performance budget', () => {
  it('caps DPR conservatively for mobile, desktop, and reduced motion', () => {
    expect(computeAdaptiveDpr(375, false)).toEqual([1, 1.25]);
    expect(computeAdaptiveDpr(1440, false)).toEqual([1, 1.75]);
    expect(computeAdaptiveDpr(1440, true)).toEqual([1, 1.25]);
  });

  it('returns false safely when canvas getContext throws or returns null', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(detectWebGLSupport()).toBe(false);
    spy.mockRestore();
  });

  it('catches WebGL child errors and renders StaticMacBookFallback cleanly', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WebGLErrorBoundary fallback={<StaticMacBookFallback finish="sky-blue" size="13" />}>
        <ThrowingCanvas />
      </WebGLErrorBoundary>,
    );
    expect(screen.getByTestId('static-macbook-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Sky Blue/i)).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/three/WebGLErrorBoundary.test.tsx`
Expected: FAIL because `webglSupport.ts` and `WebGLErrorBoundary.tsx` do not exist.

- [ ] **Step 3: Implement `src/utils/webglSupport.ts` and `src/three/WebGLErrorBoundary.tsx`**

Implement `detectWebGLSupport` checking `webgl2` then `webgl` safely in `try/catch`; implement `computeAdaptiveDpr`; implement `usePrefersReducedMotion` subscribing cleanly to `window.matchMedia('(prefers-reduced-motion: reduce)')`; implement class `WebGLErrorBoundary` and styled `StaticMacBookFallback` SVG/CSS representation colored to the active finish & size.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/three/WebGLErrorBoundary.test.tsx`
Expected: PASS (3 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/utils/webglSupport.ts src/three/WebGLErrorBoundary.tsx src/three/WebGLErrorBoundary.test.tsx
git commit -m "feat: add WebGL detection, DPR caps, reduced-motion hook, and fallback boundary"
```

---

### Task 4: Procedural PBR Textures & Custom GLSL Shaders

**Files:**
- Create: `src/three/textures/proceduralMaps.ts`, `src/three/shaders/anodizedMaterials.ts`
- Test: `src/three/textures/proceduralMaps.test.ts`

**Interfaces:**
- Produces:
  - `createBrushedMetalRoughnessMap(size?: number): THREE.CanvasTexture`
  - `createLogicBoardTexture(): THREE.CanvasTexture`
  - `ScreenCanvasRenderer` class: `{ texture: THREE.CanvasTexture; update(time: number, mode: ScreenModeId, finishTint: string): void; dispose(): void }`
  - `createM4CircuitShaderMaterial(): THREE.ShaderMaterial` (uniforms: `uTime`, `uPulseIntensity`, `uAccentColor`)
  - `createIntelligenceHaloMaterial(): THREE.ShaderMaterial` (uniforms: `uTime`, `uOpacity`)
  - `createDualDisplayHoloMaterial(): THREE.ShaderMaterial` (uniforms: `uTime`, `uOpacity`, `uAccentColor`)

- [ ] **Step 1: Write failing unit tests for procedural texture creation, shader uniform creation, and safe GPU disposal**

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ScreenCanvasRenderer, createBrushedMetalRoughnessMap, createLogicBoardTexture } from './proceduralMaps';
import {
  createDualDisplayHoloMaterial,
  createIntelligenceHaloMaterial,
  createM4CircuitShaderMaterial,
} from '../shaders/anodizedMaterials';

describe('proceduralMaps and custom GLSL shaders', () => {
  it('builds brushed roughness and logic board CanvasTextures cleanly even in headless jsdom', () => {
    const rough = createBrushedMetalRoughnessMap(64);
    const board = createLogicBoardTexture();
    expect(rough).toBeInstanceOf(THREE.CanvasTexture);
    expect(board).toBeInstanceOf(THREE.CanvasTexture);
    rough.dispose();
    board.dispose();
  });

  it('initializes ScreenCanvasRenderer and updates across all screen modes without throwing', () => {
    const renderer = new ScreenCanvasRenderer();
    expect(renderer.texture).toBeInstanceOf(THREE.CanvasTexture);
    renderer.update(0.5, 'sequoia', '#A3C1DA');
    renderer.update(1.2, 'intelligence', '#A3C1DA');
    renderer.update(2.0, 'raytrace', '#1E2532');
    renderer.update(2.8, 'dual6k', '#DDD5C7');
    renderer.dispose();
  });

  it('constructs M4 circuit, Intelligence halo, and Dual 6K holo ShaderMaterials with required uniforms', () => {
    const m4 = createM4CircuitShaderMaterial();
    const halo = createIntelligenceHaloMaterial();
    const holo = createDualDisplayHoloMaterial();
    expect(m4.uniforms.uTime.value).toBe(0);
    expect(m4.uniforms.uPulseIntensity.value).toBeTypeOf('number');
    expect(halo.uniforms.uOpacity.value).toBeTypeOf('number');
    expect(holo.uniforms.uOpacity.value).toBeTypeOf('number');
    m4.dispose();
    halo.dispose();
    holo.dispose();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/three/textures/proceduralMaps.test.ts`
Expected: FAIL with missing modules.

- [ ] **Step 3: Implement `src/three/textures/proceduralMaps.ts` and `src/three/shaders/anodizedMaterials.ts`**

Handle nullable `canvas.getContext('2d')` gracefully in jsdom while generating rich crisp artwork in real browsers: anodized micro-brush strokes for metal roughness; dark-slate PCB traces, capacitor islands, and `M4` die copper lithography for `createLogicBoardTexture`; 4 crisp animated desktop canvases (`sequoia` fluid waves + floating translucent macOS glass cards, `intelligence` Siri/Apple Intelligence palette wave, `raytrace` real-time glossy sphere + reflection light bars, `dual6k` studio timeline + render viewport) for `ScreenCanvasRenderer`. Write GLSL shaders with `transparent: true`, `depthWrite: false` on overlays so X-ray and edge-halo layers blend cleanly without Z-fighting.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/three/textures/proceduralMaps.test.ts`
Expected: PASS (3 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/three/textures/proceduralMaps.ts src/three/textures/proceduralMaps.test.ts src/three/shaders/anodizedMaterials.ts
git commit -m "feat: add procedural canvas textures and custom GLSL shaders"
```

---

### Task 5: Procedural 3D MacBook Air M4 Hardware Sub-Assemblies

**Files:**
- Create: `src/three/models/dimensions.ts`, `src/three/models/KeyboardDeck.tsx`, `src/three/models/M4InternalBay.tsx`, `src/three/models/PortsAndMagSafe.tsx`, `src/three/models/MacBookAirAssembly.tsx`
- Test: `src/three/models/dimensions.test.ts`

**Interfaces:**
- Consumes: `SizeId`, `FinishId`, `ScreenModeId`, `FINISH_PALETTES`, `SIZE_SPECS` (`src/data/macbookSpecs.ts`), procedural maps & shaders (`Task 4`).
- Produces:
  - `getChassisMetrics(size: SizeId): { width: number; depth: number; baseThickness: number; lidThickness: number; cornerRadius: number; scaleFactor: [number, number, number] }`
  - `generateKeycapLayout(): KeycapTransform[]` (used by `THREE.InstancedMesh` in `KeyboardDeck`)
  - `<MacBookAirAssembly timelineRef={React.MutableRefObject<TimelineState>} finish={FinishId} size={SizeId} screenMode={ScreenModeId} manualLidAngleDeg={number | null} manualXray={boolean | null} manualBacklight={boolean | null} reducedMotion={boolean} isStudioInteractive={boolean} />`

- [ ] **Step 1: Write failing tests for real-proportion chassis metrics (`13"` vs `15"`) and Magic Keyboard instanced keycap layout**

```ts
import { describe, expect, it } from 'vitest';
import { generateKeycapLayout, getChassisMetrics } from './dimensions';

describe('MacBook Air procedural dimensions and keycap grid', () => {
  it('computes accurate relative proportions between 13-inch and 15-inch models', () => {
    const m13 = getChassisMetrics('13');
    const m15 = getChassisMetrics('15');
    expect(m15.width).toBeGreaterThan(m13.width);
    expect(m15.depth).toBeGreaterThan(m13.depth);
    expect(m13.baseThickness).toBeLessThan(0.15);
  });

  it('generates a complete 6-row laptop keyboard keycap instance list (including wide spacebar/modifiers and Touch ID)', () => {
    const keys = generateKeycapLayout();
    expect(keys.length).toBeGreaterThanOrEqual(72);
    const spacebar = keys.find((k) => k.isSpacebar);
    const touchId = keys.find((k) => k.isTouchId);
    expect(spacebar).toBeDefined();
    expect(spacebar!.width).toBeGreaterThan(0.25);
    expect(touchId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/three/models/dimensions.test.ts`
Expected: FAIL because `dimensions.ts` does not exist.

- [ ] **Step 3: Implement `dimensions.ts`, `KeyboardDeck.tsx`, `M4InternalBay.tsx`, `PortsAndMagSafe.tsx`, and `MacBookAirAssembly.tsx`**

Build clean modular geometry:
- Rounded-rectangle `THREE.Shape` + `ExtrudeGeometry` with smooth CNC edge bevels for base unibody and lid shell, disposed cleanly in `useEffect`.
- `KeyboardDeck`: single `THREE.InstancedMesh` rendering all ~78 sculpted dark-slate keycaps + crisp Touch ID capacitive ring + subtle emissive under-key backlight glow plane + glass Force Touch trackpad recess.
- `M4InternalBay`: logic board, dark-graphite fanless spreader shield, dual battery pack blocks, raised brushed-metallic `M4` die + glowing GLSL circuit trace plane that fades in smoothly with `xrayAmount`.
- `PortsAndMagSafe`: MagSafe 3 recessed port + magnetic snap-in plug with animated amber→emerald LED pulse (`magsafeSnap` `0..1`), two Thunderbolt 4 recessed ovals with interior pins, and 3.5mm audio jack on the right flank.
- `MacBookAirAssembly`: hinges lid smoothly (`0° → 130°`), smoothly lerps anodized aluminum color & studio scale (`13"` ↔ `15"`) in `useFrame`, renders camera notch + 12MP Center Stage lens + dynamic Liquid Retina screen + Apple Intelligence edge halo shader + flanking holographic Dual-6K display panels (`dualDisplayProgress`).

- [ ] **Step 4: Run test and TypeScript check**

Run: `npx vitest run src/three/models/dimensions.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests passing) and `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/three/models/
git commit -m "feat: add procedural 3D MacBook Air M4 hardware assembly and subparts"
```

---

### Task 6: Scroll Choreography Solver, Continuous 3D Stage & Studio Camera Rig

**Files:**
- Create: `src/three/scrollChoreography.ts`, `src/three/MacBookScene.tsx`
- Test: `src/three/scrollChoreography.test.ts`

**Interfaces:**
- Consumes: `CameraPresetId`, `CAMERA_PRESETS`, `FinishId`, `SizeId`, `ScreenModeId`, `FINISH_PALETTES` (`Task 2`), `computeAdaptiveDpr` (`Task 3`), `<MacBookAirAssembly>` (`Task 5`).
- Produces:
  - `TimelineState` interface: `{ scrollProgress: number; lidDeg: number; xrayAmount: number; dualDisplayProgress: number; magsafeSnap: number; backlight: number; camPos: [number, number, number]; camTarget: [number, number, number]; modelRot: [number, number, number]; activeScreenMode: ScreenModeId; activeActIndex: number }`
  - `createInitialTimelineState(): TimelineState`
  - `evaluateScrollTimeline(progress: number, out?: TimelineState): TimelineState`
  - `<MacBookScene timelineRef={...} isStudioInteractive={boolean} studioPreset={CameraPresetId} zoomStep={number} finish={FinishId} size={SizeId} screenMode={ScreenModeId} manualLidAngleDeg={number | null} manualXray={boolean | null} manualBacklight={boolean | null} reducedMotion={boolean} viewportWidth={number} />`

- [ ] **Step 1: Write failing tests for scroll-act choreography interpolation across Acts 1–5**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialTimelineState, evaluateScrollTimeline } from './scrollChoreography';

describe('evaluateScrollTimeline', () => {
  it('starts closed in Act 1 and smoothly opens the lid as scroll advances', () => {
    const start = evaluateScrollTimeline(0);
    const heroMid = evaluateScrollTimeline(0.14);
    expect(start.activeActIndex).toBe(0);
    expect(start.lidDeg).toBeLessThan(15);
    expect(heroMid.lidDeg).toBeGreaterThan(80);
  });

  it('activates M4 Silicon X-Ray peak in Act 3 and Dual 6K displays in Act 4', () => {
    const act3 = evaluateScrollTimeline(0.48);
    const act4 = evaluateScrollTimeline(0.68);
    expect(act3.activeActIndex).toBe(2);
    expect(act3.xrayAmount).toBeGreaterThan(0.7);
    expect(act4.activeActIndex).toBe(3);
    expect(act4.dualDisplayProgress).toBeGreaterThan(0.7);
    expect(act4.xrayAmount).toBeLessThan(0.2);
  });

  it('animates MagSafe 3 plug snap in Act 5 and handles out-of-range clamped inputs safely', () => {
    const act5 = evaluateScrollTimeline(0.88);
    expect(act5.activeActIndex).toBe(4);
    expect(act5.magsafeSnap).toBeGreaterThan(0.7);

    const clampedLow = evaluateScrollTimeline(-0.5, createInitialTimelineState());
    const clampedHigh = evaluateScrollTimeline(1.5, createInitialTimelineState());
    expect(clampedLow.scrollProgress).toBe(0);
    expect(clampedHigh.scrollProgress).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/three/scrollChoreography.test.ts`
Expected: FAIL because `scrollChoreography.ts` does not exist.

- [ ] **Step 3: Implement `src/three/scrollChoreography.ts` and `src/three/MacBookScene.tsx`**

Implement smooth piecewise cubic/smoothstep keyframes across `progress ∈ [0, 1]` for Acts 1–5 (Hero Closed → Open → Profile Sky Blue → M4 X-Ray Cutaway → Dual 6K & Display → MagSafe 3 & Ports) mutating `out` in-place so `useFrame` allocates zero GC objects.
Implement `MacBookScene.tsx`:
- `<Canvas dpr={computeAdaptiveDpr(viewportWidth, reducedMotion)} camera={{ fov: 36, near: 0.1, far: 50, position: [0, 1.4, 5.2] }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}>`
- Procedural `<Environment resolution={256}>` built strictly with `<Lightformer>` softboxes and rim strips colored dynamically from `FINISH_PALETTES[finish].rimTint`.
- Subtle ground `<ContactShadows>` skipped on narrow mobile (`viewportWidth < 768`) in favor of a zero-cost radial gradient shadow plane.
- Smooth camera rig in `useFrame`: blends toward `timelineRef.current` during Acts 1–5; when `isStudioInteractive` is true, hands off smoothly to `<OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.2} maxPolarAngle={Math.PI * 0.54} />` while easing camera distance cleanly according to `studioPreset` and `zoomStep`.
- Lightweight `<EffectComposer multisampling={0}>` with selective high-threshold `<Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.45} />` and `<Vignette darkness={0.42} offset={0.28} />`, bypassed cleanly when `reducedMotion` is true.

- [ ] **Step 4: Run test and TypeScript check**

Run: `npx vitest run src/three/scrollChoreography.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests passing) and `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/three/scrollChoreography.ts src/three/scrollChoreography.test.ts src/three/MacBookScene.tsx
git commit -m "feat: add scroll choreography interpolator and R3F studio canvas scene"
```

---

### Task 7: Floating Glass Navbar, Editorial Scroll Acts 1–5 & GSAP/Lenis Sync

**Files:**
- Create: `src/hooks/useScrollTimeline.ts`, `src/components/Navbar.tsx`, `src/components/ScrollActs.tsx`
- Test: `src/components/ScrollActs.test.tsx`

**Interfaces:**
- Consumes: `FinishId`, `FINISH_PALETTES` (`Task 2`), `TimelineState`, `evaluateScrollTimeline` (`Task 6`).
- Produces:
  - `useScrollTimeline(options: { containerRef: React.RefObject<HTMLElement | null>; studioRef: React.RefObject<HTMLElement | null>; timelineRef: React.MutableRefObject<TimelineState>; reducedMotion: boolean; onStudioEnterChange: (entered: boolean) => void; onActiveActChange: (actIndex: number) => void }): { scrollToSection: (id: string) => void }`
  - `<Navbar activeActIndex={number} finish={FinishId} onNavigate={(sectionId: string) => void} />`
  - `<ScrollActs finish={FinishId} onFinishPreview={(finish: FinishId) => void} onJumpToStudio={() => void} />`

- [ ] **Step 1: Write failing tests for Navbar and ScrollActs verified specs, chapter navigation, and mid-scroll finish preview**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';
import { ScrollActs } from './ScrollActs';

describe('Navbar and ScrollActs editorial sections', () => {
  it('renders persistent navigation anchors and primary Configure CTA', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Navbar activeActIndex={0} finish="sky-blue" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Configure/i }));
    expect(onNavigate).toHaveBeenCalledWith('studio');
  });

  it('displays accurate M4 specs across Acts 1-5 and triggers preview callbacks cleanly', async () => {
    const user = userEvent.setup();
    const onFinishPreview = vi.fn();
    const onJumpToStudio = vi.fn();
    render(
      <ScrollActs
        finish="sky-blue"
        onFinishPreview={onFinishPreview}
        onJumpToStudio={onJumpToStudio}
      />,
    );

    expect(screen.getByText(/1\.13 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/16-Core Neural Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Dual 6K/i)).toBeInTheDocument();
    expect(screen.getByText(/18 hrs/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Midnight/i }));
    expect(onFinishPreview).toHaveBeenCalledWith('midnight');

    await user.click(screen.getByRole('button', { name: /Explore in 3D/i }));
    expect(onJumpToStudio).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ScrollActs.test.tsx`
Expected: FAIL because `Navbar.tsx` and `ScrollActs.tsx` do not exist.

- [ ] **Step 3: Implement `useScrollTimeline.ts`, `Navbar.tsx`, and `ScrollActs.tsx`**

- `useScrollTimeline`: initializes Lenis (skipped when `reducedMotion` is true, falling back to native instant/standard scroll) synchronized with `gsap.registerPlugin(ScrollTrigger)`. Scrubs `timelineRef.current` smoothly over the `#scroll-story` container using `evaluateScrollTimeline`, fires `onStudioEnterChange(true)` when `#studio` enters viewport, and cleans up all triggers & Lenis RAF on unmount.
- `Navbar`: frosted dark/adaptive glass bar with brand wordmark, desktop chapter pills (`Overview`, `Design`, `M4 Silicon`, `Display`, `Studio 3D`), active finish dot, and `"Configure · $999"` button.
- `ScrollActs`: 5 editorial bands matching the alternating dark obsidian / light porcelain / deep slate / deep charcoal / silver mist design, with `pointer-events-none` wrappers and `pointer-events-auto` on interactive text/buttons so drag/scroll remains uninterrupted.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ScrollActs.test.tsx`
Expected: PASS (2 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScrollTimeline.ts src/components/Navbar.tsx src/components/ScrollActs.tsx src/components/ScrollActs.test.tsx
git commit -m "feat: add floating navbar, editorial scroll acts, and GSAP/Lenis timeline sync"
```

---

### Task 8: Interactive 3D Studio Configurator, Summary Modal & Full App Integration

**Files:**
- Create: `src/components/StudioConfigurator.tsx`, `src/components/SummaryModal.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/components/StudioConfigurator.test.tsx`

**Interfaces:**
- Consumes: `MacBookConfigState`, `CameraPresetId`, `ScreenModeId`, `SIZE_SPECS`, `FINISH_PALETTES`, `CAMERA_PRESETS`, `SCREEN_MODES`, `normalizeConfigSelection`, `getGpuOptionAvailability`, `calculateConfigPrice`, `formatConfigSummary` (`Task 2`); `<MacBookScene>` (`Task 6`); `<WebGLErrorBoundary>` & `detectWebGLSupport` (`Task 3`); `<Navbar>`, `<ScrollActs>`, `useScrollTimeline` (`Task 7`).
- Produces:
  - `<StudioConfigurator ... />`
  - `<SummaryModal isOpen={boolean} config={MacBookConfigState} onClose={() => void} />`
  - Complete `<App />` composing the pinned continuous 3D `<Canvas>` background (smoothly morphing into the interactive Studio stage in Act 6), preloader/ready fade-in, fallback path when WebGL is off, `<ScrollActs>`, `<StudioConfigurator>`, and `<SummaryModal>`.

- [ ] **Step 1: Write failing tests for StudioConfigurator controls, GPU/SSD locking UI, zoom/preset controls, and SummaryModal Escape/focus handling**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../data/macbookSpecs';
import { StudioConfigurator } from './StudioConfigurator';
import { SummaryModal } from './SummaryModal';

describe('StudioConfigurator and SummaryModal', () => {
  it('updates price live, enforces 13-inch 512GB GPU lock, and exposes camera/hardware controls', async () => {
    const user = userEvent.setup();
    const onConfigChange = vi.fn();
    const onPresetChange = vi.fn();
    const onReviewClick = vi.fn();

    render(
      <StudioConfigurator
        config={DEFAULT_CONFIG}
        studioPreset="hero"
        lidAngleDeg={108}
        xrayEnabled={false}
        backlightEnabled={true}
        screenMode="sequoia"
        zoomStep={0}
        onConfigChange={onConfigChange}
        onPresetChange={onPresetChange}
        onLidAngleChange={vi.fn()}
        onXrayToggle={vi.fn()}
        onBacklightToggle={vi.fn()}
        onScreenModeChange={vi.fn()}
        onZoomChange={vi.fn()}
        onResetView={vi.fn()}
        onReviewClick={onReviewClick}
        onBackToStory={vi.fn()}
      />,
    );

    expect(screen.getByText('$999')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /512GB/i }));
    expect(onConfigChange).toHaveBeenCalledWith({ storage: 512 });

    await user.click(screen.getByRole('button', { name: /M4 X-Ray/i }));
    expect(onPresetChange).toHaveBeenCalledWith('xray');

    await user.click(screen.getByRole('button', { name: /Review Configuration/i }));
    expect(onReviewClick).toHaveBeenCalled();
  });

  it('closes SummaryModal on Escape key and copies formatted specs', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<SummaryModal isOpen={true} config={DEFAULT_CONFIG} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Copy Specs/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('$999'));

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StudioConfigurator.test.tsx`
Expected: FAIL because `StudioConfigurator.tsx` and `SummaryModal.tsx` do not exist.

- [ ] **Step 3: Implement `StudioConfigurator.tsx`, `SummaryModal.tsx`, and wire complete `src/App.tsx` + `src/App.test.tsx`**

- `StudioConfigurator.tsx`: Interactive studio toolbar (Camera presets `Hero`, `Profile`, `Ports`, `Keyboard`, `M4 X-Ray`; `+`/`−`/`Reset` zoom controls; Lid Angle slider; X-Ray toggle; Keyboard Backlight toggle; Screen Mode pills; `"Back to Story"` jump) + Hardware Configurator panel (`13-inch` / `15-inch` Size selector; `Sky Blue` / `Midnight` / `Starlight` / `Silver` anodized swatches; `8-core` / `10-core` GPU selector honoring `getGpuOptionAvailability` disabled state + helper reason; `16GB` / `24GB` / `32GB` Unified Memory; `256GB`–`2TB` SSD Storage; tabular total & optional monthly readout; `"Review Configuration"` CTA). Ensure `min-h-[44px]` touch targets on mobile.
- `SummaryModal.tsx`: Accessible `role="dialog"` `aria-modal="true"`, backdrop click + `Escape` close, full selected hardware table, `"Copy Specs"` clipboard action with `"Copied"` feedback.
- `App.tsx`: Pins the continuous 3D stage (`fixed inset-0` during Acts 1–5, positioning into the Studio stage box or full-bleed Studio view during Act 6 so user drag-to-orbit works naturally on the 3D stage without overlapping the right/bottom Configurator controls!). Uses `WebGLErrorBoundary` + `detectWebGLSupport()` so WebGL-disabled environments seamlessly show `StaticMacBookFallback`. Update `src/App.test.tsx` to verify end-to-end state transitions (switching finish, upgrading to 15-inch, opening & closing SummaryModal) inside `<App />` when WebGL is mocked off (`StaticMacBookFallback`) and when active.

- [ ] **Step 4: Run full unit test suite, typecheck, and production build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: `tsc` exits 0, all Vitest suites pass, Vite production build succeeds cleanly.

- [ ] **Step 5: Commit**

```bash
git add src/components/StudioConfigurator.tsx src/components/SummaryModal.tsx src/components/StudioConfigurator.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: integrate interactive 3D Studio configurator, summary modal, and full landing app"
```

---

### Task 9: Headless Browser E2E, Responsive & Accessibility Verification

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes: Built/previewed Vite app (`npm run preview -- --port 4173`).
- Produces: Automated verification covering desktop (`1440×900`), tablet (`768×1024`), mobile (`375×812`), reduced-motion emulation, keyboard focus + Escape modal flow, scroll act progression, Studio finish/size/GPU/SSD state mutations, and zero console/page errors.

- [ ] **Step 1: Install `@playwright/test` and inspect available Chromium/browser binary**

Install `@playwright/test` as a devDependency (`npm install -D @playwright/test`) and run `npx playwright install chromium` (if Chromium isn't cached yet) or verify Playwright browser launch.

- [ ] **Step 2: Write `playwright.config.ts` and `tests/e2e/landing.spec.ts`**

Cover:
1. Page loads at `1440×900` with zero `console.error` or `pageerror`, renders hero heading and WebGL `<canvas>` (or graceful fallback if software WebGL unavailable—verify non-zero bounding box of the visual stage).
2. Scrolling down through `#scroll-story` updates active chapter indicator and progresses into `#studio` without vertical scroll locking when wheel events occur over `#studio`.
3. Interactive Studio workflow: select `15-inch`, pick `Midnight`, upgrade to `24GB` + `512GB`, confirm live price reads `$1,599`, toggle `X-Ray Mode`, open `"Review Configuration"` dialog, and close with `Escape`.
4. Responsive layout checks at `768×1024` and `375×812`: confirm `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow) and keyboard `Tab` reaches navigation and configurator controls cleanly.
5. `emulateMedia({ reducedMotion: 'reduce' })`: verify page loads cleanly, Studio controls remain interactive, and summary modal opens/closes normally.

- [ ] **Step 3: Run the Playwright suite against `npm run preview`**

Run: `npx playwright test`
Expected: All E2E specs PASS with zero console/page errors and zero overflow regressions.

- [ ] **Step 4: Fix any layout, contrast, or runtime issues surfaced in browser checks, re-run full verification gate (`tsc`, `vitest`, `build`, `playwright`), and commit**

```bash
git add playwright.config.ts tests/e2e/landing.spec.ts package.json package-lock.json
git commit -m "test: add Playwright E2E, responsive, keyboard, and reduced-motion checks"
```

---

## Self-Review Checklist (Plan Quality Verification)

1. **Spec Coverage Check:**
   - Section 2 (real M4 specs, $999/$1,199, 4 finishes, dual 6K, 12MP Center Stage, MagSafe 3, 2× TB4, 18 hrs, >50% recycled) → Tasks 2, 5, 7, 8.
   - Section 3 (instant first-3s reveal, procedural 3D, scroll + interactive handoff, responsive 375/768/1440, reduced motion, WebGL fallback, no wheel trap) → Tasks 3, 4, 5, 6, 7, 8, 9.
   - Section 5 (Visual direction, Plus Jakarta Sans + JetBrains Mono, alternating dark/light Acts 1–5, Studio Act 6 + Configurator GPU/SSD coupling + Summary Modal) → Tasks 1, 2, 7, 8.
   - Section 6 (Procedural subparts, instanced keycaps, GLSL shaders, Lightformer env, ContactShadows, Bloom/Vignette, Vitest + Playwright verification) → Tasks 4, 5, 6, 8, 9.
2. **Type Consistency Check:**
   - Verified `SizeId`, `FinishId`, `GpuTierId`, `MemoryTierId`, `StorageTierId`, `CameraPresetId`, `ScreenModeId`, `MacBookConfigState`, `TimelineState`, `evaluateScrollTimeline`, `normalizeConfigSelection`, `calculateConfigPrice`, `getGpuOptionAvailability`, `formatConfigSummary`, `detectWebGLSupport`, `computeAdaptiveDpr`, `usePrefersReducedMotion` match identically across every `Interfaces` block and test snippet.
3. **Review Focus Coverage Check:**
   - All 5 Review Focus conditions explicitly pinned to owning tasks (Task 2, Task 3, Task 6, Task 8, Task 9).
